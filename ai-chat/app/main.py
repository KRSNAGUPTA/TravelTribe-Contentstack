from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from pydantic import BaseModel
from app.rag.chain import get_answer

app = FastAPI(title="Travel Tribe Chat")

CORS = settings.cors_origin

app.add_middleware(
    CORSMiddleware,
    allow_origins=[CORS],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str
class ChatResponse(BaseModel):
    reply: str


@app.get("/")
def health():
    return {
        "status":"ok",
        "message": "Server Running!"
    }


@app.post("/api/chat")
def chat(req: ChatRequest):
    question = req.message
    ans = get_answer(question)

    return ChatResponse(reply=ans)