from typing import Any, Dict
from pydantic import BaseModel

class ArticleCreate(BaseModel):
    topic: str

class ArticleResponse(BaseModel):
           
    raw_content: str
    processed_content: str
    references: Dict[str, Any]
