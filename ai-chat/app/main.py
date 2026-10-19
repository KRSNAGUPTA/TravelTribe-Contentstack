from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from app.config import settings
from app.rag.agent import get_agent
from app.mcp.server import mcp
from langgraph.checkpoint.redis.aio import AsyncRedisSaver

# Mount MCP
mcp_app = mcp.http_app(path="/", stateless_http=True)
app = FastAPI(title="Travel Tribe Chat", lifespan=mcp_app.lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.cors_origin],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

app.mount("/mcp", mcp_app)

class ChatRequest(BaseModel):
    message: str
    session_id: str

class ChatResponse(BaseModel):
    reply: str

@app.get("/")
def health():
    return {"status": "ok"}

@app.post("/api/chat", response_model=ChatResponse)
async def chat(req: ChatRequest, authorization: str = Header(None)):
    # 1. Safely extract token (allows guests)
    token = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
    
    # 2. Open Redis connection for this request
    async with AsyncRedisSaver.from_conn_string(settings.redis_url) as checkpointer:
        # 3. Build agent with checkpointer
        agent = await get_agent(token, checkpointer)
        
        # 4. Invoke agent
        result = await agent.ainvoke(
            {"messages": [("user", req.message)]},
            config={"configurable": {"thread_id": req.session_id}}
        )
        
        return ChatResponse(reply=result["messages"][-1].content)