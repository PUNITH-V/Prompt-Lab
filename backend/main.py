from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from schemas import GenerateRequest, GenerateResponse
from templates import zero_shot, few_shot, chain_of_thought
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage
from database import SessionLocal, PromptHistory
from dotenv import load_dotenv
import os
import json

load_dotenv()

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

technique_map = {
    "zero_shot": zero_shot,
    "few_shot": few_shot,
    "cot": chain_of_thought
}

@app.post("/generate", response_model=GenerateResponse)
async def generate(req: GenerateRequest):
    llm = ChatGroq(
        api_key=os.getenv("GROQ_API_KEY"),
        model="llama-3.3-70b-versatile",
        temperature=req.temperature,
        max_tokens=req.max_tokens
    )
    builder = technique_map.get(req.technique, zero_shot)
    transformed = builder(req.prompt)
    response = llm.invoke([HumanMessage(content=transformed)])

    db = SessionLocal()
    db.add(PromptHistory(
        prompt=req.prompt,
        technique=req.technique,
        output=response.content,
        temperature=req.temperature
    ))
    db.commit()
    db.close()

    return GenerateResponse(
        technique=req.technique,
        transformed_prompt=transformed,
        output=response.content
    )

@app.post("/stream")
async def stream(req: GenerateRequest):
    llm = ChatGroq(
        api_key=os.getenv("GROQ_API_KEY"),
        model="llama-3.3-70b-versatile",
        temperature=req.temperature,
        max_tokens=req.max_tokens
    )
    builder = technique_map.get(req.technique, zero_shot)
    transformed = builder(req.prompt)

    async def token_stream():
        full = ""
        yield json.dumps({ "type": "prompt", "transformed_prompt": transformed, "technique": req.technique }) + "\n"
        async for chunk in llm.astream([HumanMessage(content=transformed)]):
            token = chunk.content
            full += token
            yield json.dumps({ "type": "token", "token": token }) + "\n"

        db = SessionLocal()
        db.add(PromptHistory(
            prompt=req.prompt,
            technique=req.technique,
            output=full,
            temperature=req.temperature
        ))
        db.commit()
        db.close()
        yield json.dumps({ "type": "done" }) + "\n"

    return StreamingResponse(token_stream(), media_type="text/plain")

@app.get("/history")
def get_history():
    db = SessionLocal()
    rows = db.query(PromptHistory).order_by(PromptHistory.created_at.desc()).limit(20).all()
    db.close()
    return [
        {
            "id": r.id,
            "prompt": r.prompt,
            "technique": r.technique,
            "output": r.output,
            "temperature": r.temperature,
            "created_at": str(r.created_at)
        }
        for r in rows
    ]

@app.post("/score")
async def score(req: dict):
    llm = ChatGroq(
        api_key=os.getenv("GROQ_API_KEY"),
        model="llama-3.3-70b-versatile",
        temperature=0.1,
        max_tokens=200
    )
    prompt = f"""Rate this AI response on 3 dimensions. Reply ONLY with valid JSON, nothing else.

Response to rate:
{req["output"]}

Return exactly this format:
{{"clarity": 8, "completeness": 7, "reasoning": 9}}"""

    result = llm.invoke([HumanMessage(content=prompt)])
    return json.loads(result.content)