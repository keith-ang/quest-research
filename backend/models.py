from typing import Any, Dict
from pydantic import BaseModel

class ArticleCreate(BaseModel):
    topic: str
    report_id: str  # Add this to identify the report for WebSocket updates


class ArticleResponse(BaseModel):
           
    raw_content: str
    processed_content: str
    references: Dict[str, Any] = {}
