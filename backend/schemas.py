from pydantic import BaseModel
from typing import Optional

class GenerateRequest(BaseModel):
    prompt: str
    temperature: float = 0.7
    max_tokens: int = 512
    technique: str = "zero_shot"  # zero_shot | few_shot | cot

class GenerateResponse(BaseModel):
    technique: str
    transformed_prompt: str
    output: str