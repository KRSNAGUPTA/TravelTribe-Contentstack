from fastapi import FastAPI
from pydantic import BaseModel
from app.rag.chain import get_answer

app = FastAPI(title="Travel Tribe Chat")

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