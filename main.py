from dotenv import load_dotenv
from backend.logger import logger
from backend.server import app

load_dotenv()

if __name__ == "__main__":
    import uvicorn
    
    logger.info("Starting server...")
    uvicorn.run(app, host="0.0.0.0", port=8000)