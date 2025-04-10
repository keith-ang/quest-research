import os
import json
import traceback
import asyncio
from openai import APITimeoutError, RateLimitError, APIError
from knowledge_storm import STORMWikiRunnerArguments, STORMWikiRunner, STORMWikiLMConfigs
from knowledge_storm.lm import AzureOpenAIModel
from knowledge_storm.rm import SerperRM
from .logger import logger

async def run_storm_with_retry(runner, topic, report_id, max_retries=3):
    retries = 0
    while retries < max_retries:
        try:
            await runner.run(topic)
            logger.info(f"STORM processing completed successfully for {topic}")
            return
        except (APITimeoutError, RateLimitError, APIError) as api_error:
            logger.warning(f"STORM API error encountered (attempt {retries + 1}/{max_retries}): {api_error}")
            retries += 1
            await asyncio.sleep(2**retries)  # Exponential backoff
        except Exception as e:
            logger.error(f"Unexpected error while running STORM for {topic}: {e}")
            logger.error(traceback.format_exc())
            break

    logger.error(f"STORM processing failed after {max_retries} attempts for {topic}")

def initialize_storm_runner():
    try:
        llm_configs = STORMWikiLMConfigs()
        azure_kwargs = {
            "model": "gpt-4o",
            "api_key": os.getenv("AZURE_API_KEY"),
            "azure_endpoint": os.getenv("AZURE_API_BASE"),
            "api_version": os.getenv("AZURE_API_VERSION"),
            "temperature": 1.0,
            "top_p": 0.9,
        }

        model_class = AzureOpenAIModel
        conv_simulator_lm = model_class(max_tokens=500, **azure_kwargs)
        question_asker_lm = model_class(max_tokens=500, **azure_kwargs)
        outline_gen_lm = model_class(max_tokens=400, **azure_kwargs)
        article_gen_lm = model_class(max_tokens=700, **azure_kwargs)
        article_polish_lm = model_class(max_tokens=4000, **azure_kwargs)

        llm_configs.set_conv_simulator_lm(conv_simulator_lm)
        llm_configs.set_question_asker_lm(question_asker_lm)
        llm_configs.set_outline_gen_lm(outline_gen_lm)
        llm_configs.set_article_gen_lm(article_gen_lm)
        llm_configs.set_article_polish_lm(article_polish_lm)

        engine_args = STORMWikiRunnerArguments(
            output_dir="articles",
            max_conv_turn=3,
            max_perspective=3,
            search_top_k=3,
            retrieve_top_k=5,
        )

        rm = SerperRM(serper_search_api_key=os.getenv("SERPER_API_KEY"), query_params={"autocorrect": True, "num": 10, "page": 1})
        runner = STORMWikiRunner(engine_args, llm_configs, rm)
        logger.info("Successfully initialized STORM Wiki Runner")
        return runner
    except Exception as e:
        logger.error(f"Error initializing STORM Wiki Runner: {str(e)}")
        logger.error(traceback.format_exc())
        return None

def process_references(content: str, topic_dir: str) -> str:
    try:
        with open(os.path.join(topic_dir, "url_to_info.json"), 'r') as f:
            references = json.load(f)
        for url, info in references['url_to_info'].items():
            ref_num = references['url_to_unified_index'][url]
            content = content.replace(f"[{ref_num}]", f"[[{ref_num}]]({url})")
        return content
    except Exception as e:
        logger.error(f"Error processing references: {str(e)}")
        return content

async def generate_article_in_background(runner, manager, report_id, safe_topic, original_topic):
    try:
        await manager.send_update(report_id, {"event": "research_started", "report_id": report_id, "message": "Starting research phase"})
        logger.info(f"Starting STORM runner for topic: {original_topic}")
        try:
            await asyncio.wait_for(run_storm_with_retry(runner, safe_topic.replace("_", " "), report_id), timeout=300)
        except asyncio.TimeoutError:
            logger.error(f"STORM process timed out for {original_topic}")
        logger.info(f"STORM runner completed for topic: {original_topic}")
    except Exception as e:
        logger.error(f"Error in background article generation: {str(e)}")
