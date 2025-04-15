import asyncio
import json
import os
import re
import traceback
from datetime import datetime

from .logger import logger

# Add this near the top with other imports
from openai import APITimeoutError, RateLimitError, APIError

from .knowledge_storm import (
    STORMWikiRunnerArguments,
    STORMWikiRunner,
    STORMWikiLMConfigs,
)
from .knowledge_storm.lm import AzureOpenAIModel
from .knowledge_storm.rm import SerperRM

# Data storage path
STORAGE_PATH = "articles"
os.makedirs(STORAGE_PATH, exist_ok=True)

# Initialize STORM runner
def initialize_storm_runner():
    """Initialize the STORM Wiki Runner with appropriate configurations"""
    try:
        # Configure STORM runner
        llm_configs = STORMWikiLMConfigs()

        azure_kwargs = {
            "model": "gpt-4o",
            "api_key": os.getenv("AZURE_API_KEY"),
            "azure_endpoint": os.getenv("AZURE_API_BASE"),
            "api_version": os.getenv("AZURE_API_VERSION"),
            "temperature": 1.0,
            "top_p": 0.9,
        }
        ModelClass = AzureOpenAIModel

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
            report_language="English"
        )

        rm = SerperRM(
            serper_search_api_key=os.getenv("SERPER_API_KEY"),
            query_params={"autocorrect": True, "num": 10, "page": 1},
        )
        runner = STORMWikiRunner(engine_args, llm_configs, rm)
        logger.info("Successfully initialized STORM Wiki Runner")
        return runner
    except Exception as e:
        logger.error(f"Error initializing STORM Wiki Runner: {str(e)}")
        logger.error(traceback.format_exc())
        return None

def process_references(content: str, article_dir: str) -> str:
    """Process and insert references into the article content."""
    try:
        with open(os.path.join(article_dir, "url_to_info.json"), 'r') as f:
            references = json.load(f)
            
        # Replace citation markers with proper references
        for url, info in references['url_to_info'].items():
            ref_num = references['url_to_unified_index'][url]
            content = content.replace(f"[{ref_num}]", f"[[{ref_num}]]({url})")
            
        return content
    except FileNotFoundError:
        logger.warning(f"References file not found in {article_dir}")
        return content
    except Exception as e:
        logger.error(f"Error processing references: {str(e)}")
        return content

async def run_storm_with_retry(runner, topic, report_id, article_dir, report_language, manager):
    """Run STORM with limited retries for API calls"""
    if runner is None:
        raise ValueError("STORM Runner is not initialized")
        
    try:
        # Update the runner's language setting
        if report_language != "English":
            # The args attribute contains the STORMWikiRunnerArguments object
            runner.args.report_language = report_language
            logger.info(f"Successfully updated STORM runner to use language: {report_language}")
        
        # Run STORM normally (it will do its own retries via the OpenAI client)
        runner.run(
            topic=topic,
            article_dir=article_dir,
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

async def generate_article_in_background(report_id: str, topic: str, report_language: str, runner, manager):
    try:
        # Update client that research is starting
        await manager.send_update(report_id, {
            "event": "research_started",
            "report_id": report_id,
            "message": "Starting research phase"
        })
        
        logger.info(f"Starting STORM runner for topic: {topic} in language: {report_language}")
        
        # Set a timeout for the STORM process
        try:
            current_datetime = datetime.now().strftime("%Y%m%d_%H%M%S")
            article_dir = os.path.join(STORAGE_PATH, f"{current_datetime}_{report_id}")
            
            # Run the STORM process with a timeout
            runner_task = asyncio.create_task(
                run_storm_with_retry(
                    runner=runner,
                    topic=topic,
                    report_id=report_id,
                    article_dir=article_dir,
                    report_language=report_language, 
                    manager=manager
                )
            )
            
            # Wait for the runner to complete or timeout
            await asyncio.wait_for(runner_task, timeout=600)  # 10 minute timeout
            
        except asyncio.TimeoutError:
            error_msg = f"STORM process timed out after 10 minutes for topic: {topic}"
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
        logger.info(f"STORM runner completed for topic: {topic}")
        
        # Get the generated content

        content_file = os.path.join(article_dir, "storm_gen_article_polished.txt")
        
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
        processed_content = process_references(raw_content, article_dir)
        
        references_file = os.path.join(article_dir, "url_to_info.json")
        references = {}
        try:
            with open(references_file, "r", encoding='utf-8') as f:
                references = json.load(f)
        except Exception as e:
            logger.warning(f"Could not load references: {str(e)}")
        
        logger.info(f"Successfully processed article for topic: {topic}")
        
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