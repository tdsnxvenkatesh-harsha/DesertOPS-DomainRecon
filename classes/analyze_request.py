from pydantic import BaseModel


class AnalyzeRequest(BaseModel):
    url: str
    api_key: str
