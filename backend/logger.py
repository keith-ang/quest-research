# backend/logger.py
import logging
from pathlib import Path

# Create logs directory if it doesn't exist
logs_dir = Path("logs")
logs_dir.mkdir(exist_ok=True)

def setup_logging():
    """Configure logging for the entire application."""
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            # File handler for general application logs
            logging.FileHandler(logs_dir / 'api.log'),
            # Stream handler for console output
            logging.StreamHandler()
        ]
    )

    # Suppress verbose fontTools logging
    logging.getLogger('fontTools').setLevel(logging.WARNING)
    logging.getLogger('fontTools.subset').setLevel(logging.WARNING)
    logging.getLogger('fontTools.ttLib').setLevel(logging.WARNING)

    return logging.getLogger("knowledge_storm")

# Create and configure the shared logger
logger = setup_logging()