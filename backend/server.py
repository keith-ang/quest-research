import asyncio
from fastapi import BackgroundTasks, FastAPI, HTTPException, Request, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

import os
import json
import re
import sys
import traceback

from .websocket_manager import ConnectionManager
from .models import ArticleCreate, ArticleResponse
from .logger import logger

# Add this near the top with other imports
from openai import APITimeoutError, RateLimitError, APIError

sys.path.append('../../')

from knowledge_storm import (
    STORMWikiRunnerArguments,
    STORMWikiRunner,
    STORMWikiLMConfigs,
)
from knowledge_storm.lm import AzureOpenAIModel
from knowledge_storm.rm import SerperRM

# Initialize connection manager for WebSockets
manager = ConnectionManager()

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("NEXT_PUBLIC_APP_URL", "http://localhost:3000")], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add global exception handlers to ensure all errors return JSON
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global exception: {str(exc)}")
    logger.error(traceback.format_exc())
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {str(exc)}"}
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.error(f"Validation error: {str(exc)}")
    return JSONResponse(
        status_code=422,
        content={"detail": f"Validation error: {str(exc)}"}
    )

# Data storage path
STORAGE_PATH = "articles"
os.makedirs(STORAGE_PATH, exist_ok=True)

# Configure STORM runner
llm_configs = STORMWikiLMConfigs()

azure_kwargs = {
    "model":"gpt-4o",
    "api_key": os.getenv("AZURE_API_KEY"),
    "azure_endpoint": os.getenv("AZURE_API_BASE"),
    "api_version": os.getenv("AZURE_API_VERSION"),
    "temperature": 1.0,
    "top_p": 0.9,
}
ModelClass = AzureOpenAIModel
# configure STORM runner
llm_configs = STORMWikiLMConfigs()

# Use 4o model, with max_token as parameter
conv_simulator_lm = ModelClass(max_tokens=500, **azure_kwargs)
question_asker_lm = ModelClass(max_tokens=500, **azure_kwargs)
outline_gen_lm = ModelClass(max_tokens=400, **azure_kwargs)
article_gen_lm = ModelClass(max_tokens=700, **azure_kwargs)
article_polish_lm = ModelClass(max_tokens=4000, **azure_kwargs)

llm_configs.set_conv_simulator_lm(conv_simulator_lm)
llm_configs.set_question_asker_lm(question_asker_lm)
llm_configs.set_outline_gen_lm(outline_gen_lm)
llm_configs.set_article_gen_lm(article_gen_lm)
llm_configs.set_article_polish_lm(article_polish_lm)

engine_args = STORMWikiRunnerArguments(
    output_dir=STORAGE_PATH,
    max_conv_turn=3,
    max_perspective=3,
    search_top_k=3,
    retrieve_top_k=5,
)

# Global variable to track if runner is initialized
runner = None

try:
    rm = SerperRM(
        serper_search_api_key=os.getenv("SERPER_API_KEY"),
        query_params={"autocorrect": True, "num": 10, "page": 1},
    )
    runner = STORMWikiRunner(engine_args, llm_configs, rm)
    logger.info("Successfully initialized STORM Wiki Runner")
except Exception as e:
    logger.error(f"Error initializing STORM Wiki Runner: {str(e)}")
    logger.error(traceback.format_exc())
    # We'll continue and let the app start, but endpoints will fail if runner isn't initialized
    
def process_references(content: str, topic_dir: str) -> str:
    """Process and insert references into the article content."""
    try:
        with open(os.path.join(topic_dir, "url_to_info.json"), 'r') as f:
            references = json.load(f)
            
        # Replace citation markers with proper references
        for url, info in references['url_to_info'].items():
            ref_num = references['url_to_unified_index'][url]
            content = content.replace(f"[{ref_num}]", f"[[{ref_num}]]({url})")
            
        return content
    except FileNotFoundError:
        logger.warning(f"References file not found in {topic_dir}")
        return content
    except Exception as e:
        logger.error(f"Error processing references: {str(e)}")
        return content

async def run_storm_with_retry(runner, topic, report_id):
    """Run STORM with limited retries for API calls"""
    if runner is None:
        raise ValueError("STORM Runner is not initialized")
        
    try:
        # We can't directly modify OpenAI's retry mechanism from here,
        # but we can wrap the run function in our own error handling
        
        # maybe this function is not necessary but we can just replace with the runner.run() in `generate_article_in_background`
        
        # Run STORM normally (it will do its own retries via the OpenAI client)
        runner.run(
            topic=topic,
            do_research=True,
            do_generate_outline=True,
            do_generate_article=True,
            do_polish_article=True,
            remove_duplicate=False,
        )
        
        return True
    except (APITimeoutError, RateLimitError, APIError) as e:
        logger.error(f"OpenAI API error: {str(e)}")
        await manager.send_update(report_id, {
            "event": "error",
            "report_id": report_id,
            "message": f"OpenAI API error: {str(e)}. Please try again later.",
            "should_delete": True
        })
        raise e
    except Exception as e:
        # Catch any other exceptions from the STORM runner
        logger.error(f"Unexpected error in STORM runner: {str(e)}")
        logger.error(traceback.format_exc())
        
        await manager.send_update(report_id, {
            "event": "error",
            "report_id": report_id,
            "message": f"Unexpected error: {str(e)}. Please try again.",
            "should_delete": True
        })
        raise e

async def generate_article_in_background(report_id: str, safe_topic: str, original_topic: str):
    try:
        # Update client that research is starting
        await manager.send_update(report_id, {
            "event": "research_started",
            "report_id": report_id,
            "message": "Starting research phase"
        })
        
        logger.info(f"Starting STORM runner for topic: {original_topic}")
        
        # Set a timeout for the STORM process
        try:
            # Run the STORM process with a timeout
            runner_task = asyncio.create_task(
                run_storm_with_retry(
                    runner=runner,
                    topic=safe_topic.replace("_", " "),
                    report_id=report_id
                )
            )
            
            # Wait for the runner to complete or timeout
            await asyncio.wait_for(runner_task, timeout=600)  # 10 minute timeout
            
        except asyncio.TimeoutError:
            error_msg = f"STORM process timed out after 10 minutes for topic: {original_topic}"
            logger.error(error_msg)
            
            await manager.send_update(report_id, {
                "event": "error",
                "report_id": report_id,
                "message": error_msg,
                "should_delete": True  # Signal to delete the placeholder
            })
            
            # Clean up connections
            await asyncio.sleep(5)
            await manager.cleanup_connections_for_report(report_id)
            return
        
        except Exception as e:
            error_msg = f"API error during STORM processing: {str(e)}"
            logger.error(error_msg)
            logger.error(traceback.format_exc())
            
            await manager.send_update(report_id, {
                "event": "error",
                "report_id": report_id,
                "message": error_msg,
                "should_delete": True  # Signal to delete the placeholder
            })
            
            # Clean up connections
            await asyncio.sleep(5)
            await manager.cleanup_connections_for_report(report_id)
            return
        
        # Continue with the rest of the original function after successful STORM run
        logger.info(f"STORM runner completed for topic: {original_topic}")
        
        # Get the generated content
        topic_dir = os.path.join(STORAGE_PATH, safe_topic)
        content_file = os.path.join(topic_dir, "storm_gen_article_polished.txt")
        
        if not os.path.exists(content_file):
            error_msg = f"Content file not found at {content_file}"
            logger.error(error_msg)
            
            await manager.send_update(report_id, {
                "event": "error",
                "report_id": report_id,
                "message": error_msg,
                "should_delete": True
            })
            
            # Clean up connections
            await asyncio.sleep(5)
            await manager.cleanup_connections_for_report(report_id)
            return
        
        # Read and process the generated content
        raw_content = None
        encodings_to_try = ['utf-8', 'latin-1', 'windows-1252', 'cp1252']
        
        for encoding in encodings_to_try:
            try:
                with open(content_file, 'r', encoding=encoding) as f:
                    raw_content = f.read()
                logger.info(f"Successfully read file using {encoding} encoding")
                break
            except UnicodeDecodeError:
                logger.warning(f"Failed to decode with {encoding}, trying next encoding")
                continue
        
        if raw_content is None:
            with open(content_file, 'r', encoding='utf-8', errors='replace') as f:
                raw_content = f.read()
            logger.warning("Using replacement characters for undecodable bytes")
        
        # Process references
        processed_content = process_references(raw_content, topic_dir)
        
        references_file = os.path.join(topic_dir, "url_to_info.json")
        references = {}
        try:
            with open(references_file, "r", encoding='utf-8') as f:
                references = json.load(f)
        except Exception as e:
            logger.warning(f"Could not load references: {str(e)}")
        
        logger.info(f"Successfully processed article for topic: {original_topic}")
        
        # Notify of completion via WebSocket
        try:
            await manager.send_update(report_id, {
                "event": "completed",
                "report_id": report_id,
                "message": "Report generation completed",
                "data": {
                    "raw_content": raw_content,
                    "processed_content": processed_content,
                    "references": references
                }
            })
            logger.info(f"WebSocket completion message sent for report {report_id}")
            
            # Add a delay before cleanup to ensure the message is received
            await asyncio.sleep(5)
            
            # Clean up all connections for this report
            await manager.cleanup_connections_for_report(report_id)
            logger.info(f"All connections cleaned up for report {report_id}")
            
        except Exception as e:
            logger.error(f"Failed to send WebSocket completion message: {str(e)}")
            logger.error(traceback.format_exc())
            
            await manager.send_update(report_id, {
                "event": "error",
                "report_id": report_id,
                "message": f"Error sending completion: {str(e)}",
                "should_delete": True
            })
            
            await asyncio.sleep(5)
            await manager.cleanup_connections_for_report(report_id)
        
    except Exception as e:
        logger.error(f"Error in background article generation: {str(e)}")
        logger.error(traceback.format_exc())
        
        await manager.send_update(report_id, {
            "event": "error",
            "report_id": report_id,
            "message": f"Error creating article: {str(e)}",
            "should_delete": True  # Signal to delete the placeholder
        })
        
        # Clean up connections on error after a delay
        await asyncio.sleep(5)
        await manager.cleanup_connections_for_report(report_id)
    

@app.post("/api/articles")
async def create_article(article_create: ArticleCreate, background_tasks: BackgroundTasks):
    try:
        logger.info(f"Received article creation request for topic: {article_create.topic}")
        report_id = article_create.report_id
        
        # Send initial processing status
        await manager.send_update(report_id, {
            "event": "processing_started",
            "report_id": report_id,
            "message": "Starting report generation"
        })
        
        # Handle topic sanitization
        safe_topic = re.sub(r'[^a-zA-Z0-9]', '_', article_create.topic)
        safe_topic = re.sub(r'_+', '_', safe_topic)
        safe_topic = safe_topic.strip('_')
        if not safe_topic:
            safe_topic = "placeholder_topic"
            
        logger.info(f"The safe topic is: {safe_topic}")
        
        # Schedule the background task
        background_tasks.add_task(
            generate_article_in_background,
            report_id=report_id,
            safe_topic=safe_topic,
            original_topic=article_create.topic
        )
        
        # Return immediately
        return JSONResponse(
            status_code=202,  # Accepted
            content={"detail": "Report generation started in background"}
        )
            
    except Exception as e:
        logger.error(f"Error initiating article creation: {str(e)}")
        logger.error(traceback.format_exc())
        
        if 'report_id' in locals():
            await manager.send_update(report_id, {
                "event": "error",
                "report_id": report_id,
                "message": f"Error initiating article creation: {str(e)}"
            })
            
        return JSONResponse(
            status_code=500,
            content={"detail": f"Error initiating article creation: {str(e)}"}
        )


@app.websocket("/ws/reports/{report_id}")
async def websocket_endpoint(websocket: WebSocket, report_id: str):
    connection_id = await manager.connect(websocket, report_id)
    try:
        # Send initial connection confirmation
        await websocket.send_json({
            "event": "connected",
            "report_id": report_id,
            "message": "WebSocket connected successfully"
        })
        
        # Keep connection alive until client disconnects
        while True:
            # Wait for any messages from client (ping/pong or commands)
            data = await websocket.receive_text()
            msg = json.loads(data)
            
            # Handle ping with pong to keep connection alive
            if msg.get("type") == "ping":
                await websocket.send_json({"type": "pong", "timestamp": msg.get("timestamp")})
                
    except WebSocketDisconnect:
        await manager.disconnect(websocket, connection_id)
    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}")
        await manager.disconnect(websocket, connection_id)
        
@app.websocket("/ws/test")
async def websocket_test(websocket: WebSocket):
    await websocket.accept()
    try:
        logger.info("Test WebSocket connection established")
        await websocket.send_text("Connected to test endpoint")
        
        while True:
            data = await websocket.receive_text()
            logger.info(f"Test WebSocket received: {data}")
            await websocket.send_text(f"Echo: {data}")
    except WebSocketDisconnect:
        logger.info("Test WebSocket disconnected")
    except Exception as e:
        logger.error(f"Error in test WebSocket: {str(e)}")
        
        
# Add a simple health check endpoint for testing
@app.get("/health")
async def health_check():
    return {
        "status": "ok", 
        "message": "FastAPI server is running",
        "storm_runner_initialized": runner is not None
    }