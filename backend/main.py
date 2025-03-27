from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from pydantic import BaseModel
import os
import json
import re
import sys
import traceback
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("api.log")
    ]
)
logger = logging.getLogger(__name__)

sys.path.append('../../')

from knowledge_storm import (
    STORMWikiRunnerArguments,
    STORMWikiRunner,
    STORMWikiLMConfigs,
)
from knowledge_storm.lm import AzureOpenAIModel
from knowledge_storm.rm import SerperRM


app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
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

#Use 4o model, with max_token as parameter
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

class ArticleCreate(BaseModel):
    topic: str

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

@app.post("/api/articles")
async def create_article(article_create: ArticleCreate):
    try:
        logger.info(f"Received article creation request for topic: {article_create.topic}")
        # article_id = str(uuid.uuid4())       

        # Replace all non-alphanumeric characters with underscores
        safe_topic = re.sub(r'[^a-zA-Z0-9]', '_', article_create.topic)

        # Replace multiple consecutive underscores with a single one
        safe_topic = re.sub(r'_+', '_', safe_topic)

        # Optional: Remove leading/trailing underscores
        safe_topic = safe_topic.strip('_')

        # Make sure the directory name isn't empty
        if not safe_topic:
            safe_topic = "placeholder_topic"
            
        logger.info(f"The safe topic is: {safe_topic}")
        
        # Generate article content using STORM
        logger.info(f"Starting STORM runner for topic: {article_create.topic}")
        runner.run(
            topic=safe_topic,
            do_research=True,
            do_generate_outline=True,
            do_generate_article=True,
            do_polish_article=True,
            remove_duplicate=False,
        )
        logger.info(f"STORM runner completed for topic: {article_create.topic}")
        
        # Get the generated content from the output directory
        topic_dir = os.path.join(STORAGE_PATH, safe_topic)
        content_file = os.path.join(topic_dir, "storm_gen_article_polished.txt")
        
        if not os.path.exists(content_file):
            logger.error(f"Content file not found at {content_file}")
            return JSONResponse(
                status_code=500,
                content={"detail": f"Failed to generate article content. Output file not found."}
            )
        
        # Try multiple encodings when reading the file
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
        
        # If all encodings fail, use replacement mode
        if raw_content is None:
            with open(content_file, 'r', encoding='utf-8', errors='replace') as f:
                raw_content = f.read()
            logger.warning("Using replacement characters for undecodable bytes")
        
        # Process references and extract them separately
        processed_content = process_references(raw_content, topic_dir)
        
        references_file = os.path.join(topic_dir, "url_to_info.json")
        references = {}
        try:
            with open(references_file, "r", encoding='utf-8') as f:
                references = json.load(f)
        except Exception as e:
            logger.warning(f"Could not load references: {str(e)}")
        
        logger.info(f"Successfully processed article for topic: {article_create.topic}")
        
        # Return custom response format
        return {
            "raw_content": raw_content,
            "processed_content": processed_content,
            "references": references
        }
    except Exception as e:
        logger.error(f"Error creating article: {str(e)}")
        logger.error(traceback.format_exc())
        return JSONResponse(
            status_code=500,
            content={"detail": f"Error creating article: {str(e)}"}
        )

# Add a simple health check endpoint for testing
@app.get("/health")
async def health_check():
    return {"status": "ok", "message": "FastAPI server is running"}