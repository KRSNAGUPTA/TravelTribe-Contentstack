from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional

from app.config import settings
from app.rag.chain import get_answer

app = FastAPI(title="Travel Tribe Chat")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.cors_origin],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str
    session_id: str 

class ChatResponse(BaseModel):
    reply: str

@app.get("/")
def health():
    return {
        "status": "ok",
        "message": "Server Running!"
    }

@app.post("/api/chat", response_model=ChatResponse)
def chat(req: ChatRequest):
    ans = get_answer(req.message, req.session_id)
    return ChatResponse(reply=ans)