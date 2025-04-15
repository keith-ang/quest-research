import asyncio
import json
import os
import sys
import traceback

from fastapi import BackgroundTasks, FastAPI, HTTPException, Request, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from .websocket_manager import ConnectionManager
from .models import ArticleCreate, ArticleResponse
from .logger import logger
from .server_utils import (
    initialize_storm_runner,
    generate_article_in_background,
    sanitize_topic,
    STORAGE_PATH
)

sys.path.append('../../')

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

# Initialize STORM runner
runner = initialize_storm_runner()

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

@app.post("/api/articles")
async def create_article(article_create: ArticleCreate, background_tasks: BackgroundTasks):
    try:
        logger.info(f"Received article creation request for topic: {article_create.topic}")
        report_id = article_create.report_id
        
        # Add a small delay to allow WebSocket connection to be established
        await asyncio.sleep(1)
        
        # Send initial processing status
        await manager.send_update(report_id, {
            "event": "processing_started",
            "report_id": report_id,
            "message": "Starting report generation"
        })
        
        # Handle topic sanitization
        safe_topic = sanitize_topic(article_create.topic)
        logger.info(f"The safe topic is: {safe_topic}")
        
        # Schedule the background task
        background_tasks.add_task(
            generate_article_in_background,
            report_id=report_id,
            safe_topic=safe_topic,
            original_topic=article_create.topic,
            runner=runner,
            manager=manager
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
    logger.info(f"Received WebSocket connection request for report {report_id}")
    connection_id = await manager.connect(websocket, report_id)
    logger.info(f"WebSocket connected for report {report_id} with connection_id {connection_id}")

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