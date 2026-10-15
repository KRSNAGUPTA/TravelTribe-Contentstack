# TravelTribe AI Chatbot — Build Plan

- **Stack:** FastAPI + uv + LangChain 1.x + Groq + NVIDIA Embeddings + Pinecone
- **Backend integration:** Express API (existing) via MCP-style tools
- **Frontend integration:** React (existing) via SSE streaming

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Phase 1 — RAG Foundation](#phase-1--rag-foundation)
3. [Phase 2 — Sync (cron + manual button)](#phase-2--sync-cron--manual-button)
4. [Phase 3 — MCP Tools + Agent](#phase-3--mcp-tools--agent)
5. [Phase 4 — Streaming + React Widget + Eval](#phase-4--streaming--react-widget--eval)
6. [Interview Talking Points](#interview-talking-points)

---

## Architecture Overview

```
React Client (existing)
    │
    │  POST /chat  (JWT forwarded)
    ▼
FastAPI Chat Service  ────►  Pinecone (2048-dim, cosine)
    │                              ▲
    │                              │ embeddings
    │                        NVIDIA nemotron-3-embed-1b
    │
    ├──► RAG Chain (LCEL)  ──► Hostel docs (Contentstack)
    │
    └──► LangGraph ReAct Agent
              │
              ├─ hostel_faq tool ──► RAG chain
              ├─ get_my_bookings ──► Express /api/booking/my-bookings
              ├─ get_profile ──────► Express /api/user/profile
              └─ search_hostels ───► Express /api/hostel
```

**Two-layer design principle:**

| Layer | Handles | Technique |
|-------|---------|-----------|
| **RAG** | Static content: FAQs, amenities, policies, descriptions | Vector retrieval + LLM synthesis |
| **MCP Tools** | User-specific data: bookings, profile, live availability | Function calling with JWT forwarding |

**Rule of thumb:** AI logic → FastAPI. Business logic → Express. FastAPI calls Express, never the reverse.

---

## Phase 1 — RAG Foundation

**Goal:** Working `/chat` endpoint that answers static hostel questions using Contentstack content.

### 1.1 Project Setup

```bash
mkdir ai-chat && cd ai-chat
uv init --bare
uv add "fastapi[standard]" python-dotenv httpx contentstack \
  langchain-core langchain-community langchain-groq \
  langchain-nvidia-ai-endpoints langchain-pinecone \
  langchain-text-splitters pinecone apscheduler \
  pydantic pydantic-settings
```

### 1.2 Directory Structure

```
ai-chat/
├── pyproject.toml
├── uv.lock
├── .env
├── .gitignore
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── config.py
│   ├── contentstack_client.py
│   ├── rag/
│   │   ├── __init__.py
│   │   ├── ingest.py
│   │   ├── chain.py
│   │   └── sync.py
│   └── api/
│       ├── __init__.py
│       └── chat.py
└── scripts/
    └── create_index.py
```

### 1.3 `.env`

```env
# Contentstack
CS_API_KEY=your_api_key
CS_DELIVERY_TOKEN=your_delivery_token
CS_ENVIRONMENT=production
CS_REGION=eu

# Pinecone
PINECONE_API_KEY=your_pinecone_key
PINECONE_INDEX_NAME=traveltribe
PINECONE_CLOUD=aws
PINECONE_REGION=us-east-1

# Groq
GROQ_API_KEY=your_groq_key
GROQ_MODEL=llama-3.1-8b-instant

# NVIDIA
NVIDIA_API_KEY=your_nvidia_key

# Express backend (Phase 3)
EXPRESS_API_URL=https://traveltribe-contentstack.onrender.com

APP_ENV=development
```

**Where to get keys:**
- Contentstack → Settings → Tokens → Delivery Tokens
- Pinecone → [app.pinecone.io](https://app.pinecone.io) → API Keys
- Groq → [console.groq.com/keys](https://console.groq.com/keys)
- NVIDIA → [build.nvidia.com](https://build.nvidia.com) → API Keys

Ensure `.env` is in `.gitignore`.

### 1.4 `app/config.py`

```python
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    cs_api_key: str
    cs_delivery_token: str
    cs_environment: str = "production"
    cs_region: str = "eu"

    pinecone_api_key: str
    pinecone_index_name: str = "traveltribe"
    pinecone_cloud: str = "aws"
    pinecone_region: str = "us-east-1"

    groq_api_key: str
    groq_model: str = "llama-3.1-8b-instant"

    nvidia_api_key: str

    express_api_url: str

    app_env: str = "development"

settings = Settings()
```

**Verify:**
```bash
uv run python -c "from app.config import settings; print(settings.pinecone_index_name)"
```

### 1.5 `app/contentstack_client.py`

```python
import contentstack
from app.config import settings

_REGION_MAP = {
    "us": contentstack.Region.US,
    "eu": contentstack.Region.EU,
    "au": contentstack.Region.AU,
    "azure-na": contentstack.Region.AZURE_NA,
    "azure-eu": contentstack.Region.AZURE_EU,
    "gcp-na": contentstack.Region.GCP_NA,
    "gcp-eu": contentstack.Region.GCP_EU,
}

def get_stack():
    return contentstack.Stack(
        api_key=settings.cs_api_key,
        delivery_token=settings.cs_delivery_token,
        environment=settings.cs_environment,
        region=_REGION_MAP.get(settings.cs_region, contentstack.Region.EU),
    )

def fetch_all_hostels() -> list[dict]:
    stack = get_stack()
    content_type = stack.content_type("hostel")
    all_entries = []
    skip, limit = 0, 100

    while True:
        result = content_type.query().skip(skip).limit(limit).find()
        entries = result.get("entries", [])
        if not entries:
            break
        all_entries.extend(entries)
        skip += limit

    return all_entries
```

**Milestone test:**
```bash
uv run python -c "
from app.contentstack_client import fetch_all_hostels
import json
h = fetch_all_hostels()
print(f'Total: {len(h)}')
print(json.dumps(h[0], indent=2, default=str) if h else 'EMPTY')
"
```

**Save this output** — the field names inside the entry determine how `ingest.py` chunks it.

**Common failures:**

| Error | Cause | Fix |
|-------|-------|-----|
| 401/403 | Bad API key or token | Regenerate Delivery Token |
| 412 | Region mismatch | Fix `CS_REGION` in `.env` |
| Empty | Wrong content type UID | Check UID in Contentstack (not display name) |

### 1.6 Pinecone Index Creation (One-Time)

`scripts/create_index.py`:

```python
from pinecone import Pinecone, ServerlessSpec
from app.config import settings

pc = Pinecone(api_key=settings.pinecone_api_key)

if settings.pinecone_index_name in pc.list_indexes().names():
    print(f"Index '{settings.pinecone_index_name}' already exists")
    idx = pc.describe_index(settings.pinecone_index_name)
    print(f"  dimension: {idx.dimension}, metric: {idx.metric}")
else:
    pc.create_index(
        name=settings.pinecone_index_name,
        dimension=2048,                    # nemotron-3-embed-1b
        metric="cosine",
        spec=ServerlessSpec(
            cloud=settings.pinecone_cloud,
            region=settings.pinecone_region,
        ),
    )
    print(f"Created index '{settings.pinecone_index_name}'")
```

```bash
uv run python scripts/create_index.py
```

**Verify dimension is 2048.** If wrong, delete the index in the Pinecone dashboard and recreate.

### 1.7 Embedding Sanity Test

```bash
uv run python -c "
from langchain_nvidia_ai_endpoints import NVIDIAEmbeddings
from app.config import settings
emb = NVIDIAEmbeddings(model='nvidia/nemotron-3-embed-1b', api_key=settings.nvidia_api_key)
v = emb.embed_query('hello world')
print(f'Dimension: {len(v)}')
"
```

Expected: `Dimension: 2048`.

### 1.8 `app/rag/ingest.py`

Adjust field names based on the Contentstack output from step 1.5.

```python
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_nvidia_ai_endpoints import NVIDIAEmbeddings
from langchain_pinecone import PineconeVectorStore
from langchain_core.documents import Document
from app.config import settings

_embedder = None
_store = None

def get_embedder():
    global _embedder
    if _embedder is None:
        _embedder = NVIDIAEmbeddings(
            model="nvidia/nemotron-3-embed-1b",
            api_key=settings.nvidia_api_key,
        )
    return _embedder

def get_store():
    global _store
    if _store is None:
        _store = PineconeVectorStore(
            index_name=settings.pinecone_index_name,
            embedding=get_embedder(),
        )
    return _store

def _hostel_to_docs(entry: dict) -> list[Document]:
    uid = entry.get("uid")
    name = entry.get("title") or entry.get("name") or "Unnamed Hostel"

    parts = [f"Hostel: {name}"]
    for field in ["description", "address", "college", "location",
                  "amenities", "rules", "policies", "price"]:
        val = entry.get(field)
        if val:
            if isinstance(val, list):
                val = ", ".join(str(v) for v in val)
            parts.append(f"{field.title()}: {val}")

    text = "\n".join(parts)

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=500, chunk_overlap=80,
        separators=["\n\n", "\n", ". ", " ", ""],
    )

    return [
        Document(
            page_content=chunk,
            metadata={
                "hostel_uid": uid,
                "hostel_name": name,
                "college": entry.get("college") or "",
                "chunk_index": i,
            },
        )
        for i, chunk in enumerate(splitter.split_text(text))
    ]

def upsert_hostel(entry: dict) -> int:
    """Idempotent: delete old chunks by hostel_uid, then add new."""
    store = get_store()
    uid = entry["uid"]
    try:
        store.delete(filter={"hostel_uid": uid})
    except Exception as e:
        print(f"Delete warning {uid}: {e}")
    docs = _hostel_to_docs(entry)
    if docs:
        store.add_documents(docs)
    return len(docs)

def full_reindex(entries: list[dict]) -> int:
    return sum(upsert_hostel(e) for e in entries)
```

**First index:**
```bash
uv run python -c "
from app.contentstack_client import fetch_all_hostels
from app.rag.ingest import full_reindex
h = fetch_all_hostels()
n = full_reindex(h)
print(f'Indexed {n} chunks from {len(h)} hostels')
"
```

Check Pinecone dashboard — vectors should be visible.

### 1.9 `app/rag/chain.py`

```python
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
from app.config import settings
from app.rag.ingest import get_store

_llm = None
_chain = None

SYSTEM_PROMPT = """You are TravelTribe's hostel assistant. Answer questions \
about hostels using ONLY the context below. If the answer isn't in the context, \
say so honestly and suggest the user contact support.

Context:
{context}"""

def get_llm():
    global _llm
    if _llm is None:
        _llm = ChatGroq(model=settings.groq_model, api_key=settings.groq_api_key, temperature=0)
    return _llm

def _format_docs(docs):
    return "\n\n---\n\n".join(d.page_content for d in docs)

def get_chain():
    global _chain
    if _chain is None:
        retriever = get_store().as_retriever(search_kwargs={"k": 4})
        prompt = ChatPromptTemplate.from_messages([
            ("system", SYSTEM_PROMPT),
            ("human", "{question}"),
        ])
        _chain = (
            {"context": retriever | _format_docs, "question": RunnablePassthrough()}
            | prompt
            | get_llm()
            | StrOutputParser()
        )
    return _chain

def answer(question: str) -> str:
    return get_chain().invoke(question)
```

**Milestone test:**
```bash
uv run python -c "
from app.rag.chain import answer
print(answer('What hostels do you have near Mumbai colleges?'))
"
```

Should return a grounded answer citing real hostel names.

### 1.10 FastAPI Wrapper

`app/api/chat.py`:

```python
from fastapi import APIRouter
from pydantic import BaseModel
from app.rag.chain import answer

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    session_id: str | None = None

class ChatResponse(BaseModel):
    reply: str

@router.post("/", response_model=ChatResponse)
async def chat(req: ChatRequest):
    return ChatResponse(reply=answer(req.message))
```

`app/main.py`:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.chat import router as chat_router

app = FastAPI(title="TravelTribe Chat")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://travel-tribe-cs.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(chat_router, prefix="/api/chat", tags=["chat"])

@app.get("/health")
def health():
    return {"status": "ok"}
```

**Run:**
```bash
uv run fastapi dev
```

**Test:**
```bash
curl -X POST http://localhost:8000/api/chat/ \
  -H "Content-Type: application/json" \
  -d '{"message":"Tell me about hostels near Dadar"}'
```

**Phase 1 done** when this returns a grounded answer.

---

## Phase 2 — Sync (cron + manual button)

**Goal:** Contentstack edits reach Pinecone automatically (hourly) and on demand (button).

### 2.1 `app/rag/sync.py`

```python
import json, os
from app.contentstack_client import fetch_all_hostels
from app.rag.ingest import upsert_hostel, get_store

UID_REGISTRY = "indexed_uids.json"

def _load_uids() -> set[str]:
    if os.path.exists(UID_REGISTRY):
        return set(json.load(open(UID_REGISTRY)))
    return set()

def _save_uids(uids: set[str]) -> None:
    json.dump(sorted(uids), open(UID_REGISTRY, "w"))

def sync_all() -> dict:
    hostels = fetch_all_hostels()
    cs_uids = {h["uid"] for h in hostels}
    indexed = _load_uids()

    added = cs_uids - indexed
    deleted = indexed - cs_uids
    chunks = 0

    for h in hostels:
        chunks += upsert_hostel(h)

    store = get_store()
    for uid in deleted:
        store.delete(filter={"hostel_uid": uid})

    _save_uids(cs_uids)

    return {
        "total_hostels": len(hostels),
        "added": len(added),
        "removed": len(deleted),
        "chunks_upserted": chunks,
    }
```

### 2.2 Sync Endpoint

Add to `app/api/chat.py`:

```python
from app.rag.sync import sync_all

@router.post("/sync")
async def sync_now():
    return sync_all()
```

### 2.3 Cron Scheduler

Add to `app/main.py`:

```python
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app.rag.sync import sync_all

scheduler = AsyncIOScheduler()

@app.on_event("startup")
async def start_scheduler():
    scheduler.add_job(sync_all, "interval", hours=1, id="hostel_sync")
    scheduler.start()

@app.on_event("shutdown")
async def stop_scheduler():
    scheduler.shutdown()
```

**Test:**
```bash
curl -X POST http://localhost:8000/api/chat/sync
```

Add a hostel in Contentstack → hit sync → query the chatbot about it.

---

## Phase 3 — MCP Tools + Agent

**Goal:** Chatbot answers user-specific questions (bookings, profile) and routes between RAG and tools.

### 3.1 Why MCP Lives in FastAPI

| Concern | Location |
|---------|----------|
| RAG chain, agent, memory, embeddings | **FastAPI** (AI logic) |
| Booking CRUD, user auth, JWT issuance | Express (business logic) |

FastAPI calls Express with a **forwarded JWT**. Never the reverse.

### 3.2 Capture JWT From Day One

Even if Phase 1 didn't need it, design the endpoint signature to accept `Authorization` now. Retrofitting is painful.

```python
@router.post("/")
async def chat(req: ChatRequest, authorization: str = Header(...)):
    # Phase 3: pass `authorization` into tool calls
    return ChatResponse(reply=answer(req.message))
```

### 3.3 Tool Definitions (`app/agent/tools.py`)

```python
import httpx
from langchain_core.tools import tool
from app.config import settings
from app.rag.chain import answer as rag_answer

# Populated per-request from the FastAPI endpoint (see 3.5)
_auth_ctx = {"token": ""}

def set_auth_token(token: str):
    _auth_ctx["token"] = token

def _headers():
    return {"Authorization": _auth_ctx["token"]}

@tool
def hostel_faq(question: str) -> str:
    """Answer general hostel FAQs: amenities, policies, location, rules."""
    return rag_answer(question)

@tool
async def get_my_bookings() -> str:
    """Fetch the current user's booking history."""
    async with httpx.AsyncClient() as c:
        r = await c.get(f"{settings.express_api_url}/api/booking/my-bookings",
                        headers=_headers())
    return r.text

@tool
async def get_profile() -> str:
    """Get the current user's name, email, phone."""
    async with httpx.AsyncClient() as c:
        r = await c.get(f"{settings.express_api_url}/api/user/profile",
                        headers=_headers())
    return r.text

@tool
async def search_hostels(query: str = "", college: str = "", max_price: int = 0) -> str:
    """Search hostels by free text, college, or maximum price."""
    params = {"q": query, "college": college}
    if max_price:
        params["price"] = max_price
    async with httpx.AsyncClient() as c:
        r = await c.get(f"{settings.express_api_url}/api/hostel",
                        headers=_headers(), params=params)
    return r.text

ALL_TOOLS = [hostel_faq, get_my_bookings, get_profile, search_hostels]
```

### 3.4 Agent with LangGraph (`app/agent/agent.py`)

> **Important:** Your `langchain-core` is 1.x — `AgentExecutor` is deprecated. Use `langgraph` instead.

```bash
uv add langgraph
```

```python
from langgraph.prebuilt import create_react_agent
from langchain_groq import ChatGroq
from app.config import settings
from app.agent.tools import ALL_TOOLS

SYSTEM = """You are TravelTribe's assistant. Route each user query:
- Static hostel info (amenities, policies) → use hostel_faq
- User's own bookings → use get_my_bookings
- User's profile info → use get_profile
- Searching hostels → use search_hostels
Be concise. Never invent user-specific data."""

def build_agent():
    llm = ChatGroq(model=settings.groq_model, api_key=settings.groq_api_key, temperature=0)
    return create_react_agent(llm, ALL_TOOLS, prompt=SYSTEM)
```

### 3.5 Wire Agent Into Endpoint

`app/api/chat.py`:

```python
from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel
from app.agent.agent import build_agent
from app.agent.tools import set_auth_token

router = APIRouter()
agent = build_agent()

class ChatRequest(BaseModel):
    message: str
    session_id: str | None = None

class ChatResponse(BaseModel):
    reply: str

@router.post("/", response_model=ChatResponse)
async def chat(req: ChatRequest, authorization: str = Header(...)):
    if not authorization.startswith("Bearer "):
        raise HTTPException(401, "Missing bearer token")
    set_auth_token(authorization)
    result = await agent.ainvoke({"messages": [("user", req.message)]})
    final = result["messages"][-1].content
    return ChatResponse(reply=final)
```

**Milestone tests:**

| Query | Expected tool |
|-------|---------------|
| "Do hostels have Wi-Fi?" | `hostel_faq` |
| "Show my bookings" | `get_my_bookings` |
| "What's my name?" | `get_profile` |
| "Hostels near Dadar under 8000" | `search_hostels` |

---

## Phase 4 — Streaming + React Widget + Eval

**Goal:** Production-quality UX and measurable retrieval quality.

### 4.1 SSE Streaming Endpoint

```bash
uv add sse-starlette
```

```python
from sse_starlette.sse import EventSourceResponse

@router.post("/stream")
async def stream(req: ChatRequest, authorization: str = Header(...)):
    set_auth_token(authorization)

    async def gen():
        async for event in agent.astream(
            {"messages": [("user", req.message)]},
            stream_mode="messages",
        ):
            msg, meta = event
            if hasattr(msg, "content") and msg.content:
                yield {"event": "token", "data": msg.content}
        yield {"event": "done", "data": ""}

    return EventSourceResponse(gen())
```

### 4.2 React Widget

`client/src/components/ChatBot.jsx`:

```jsx
import { useState } from "react";
import api from "../api";   // reuse existing axios instance for auto token refresh

export default function ChatBot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);

  const send = async () => {
    const userMsg = { role: "user", content: input };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setStreaming(true);

    const token = localStorage.getItem("accessToken");
    const res = await fetch(`${import.meta.env.VITE_CHAT_API_URL}/api/chat/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ message: userMsg.content }),
    });

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let assistant = "";
    setMessages((m) => [...m, { role: "assistant", content: "" }]);

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      for (const line of chunk.split("\n")) {
        if (line.startsWith("data:")) {
          assistant += line.slice(5).trim();
          setMessages((m) => [
            ...m.slice(0, -1),
            { role: "assistant", content: assistant },
          ]);
        }
      }
    }
    setStreaming(false);
  };

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-white shadow-xl rounded-lg">
      <div className="p-4 h-96 overflow-y-auto">
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "text-right" : ""}>
            <p className="inline-block p-2 rounded bg-gray-100">{m.content}</p>
          </div>
        ))}
      </div>
      <div className="p-2 border-t flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !streaming && send()}
          className="flex-1 border rounded px-2"
        />
        <button onClick={send} disabled={streaming}>Send</button>
      </div>
    </div>
  );
}
```

**Critical:** the fetch must send the current access token. Since your existing `client/src/api.js` silently refreshes expired tokens, route the chat call through the same axios interceptor — otherwise chat breaks every 15 minutes.

### 4.3 Evaluation Script (`scripts/eval.py`)

```python
import json, asyncio
from app.agent.agent import build_agent
from app.rag.chain import answer

TEST_CASES = [
    {"q": "Do hostels have Wi-Fi?", "type": "rag"},
    {"q": "Cancellation policy?", "type": "rag"},
    {"q": "Hostels near Dadar under 8000", "type": "rag"},
    # add 27 more covering amenities, location, pricing, policies
]

async def run():
    agent = build_agent()
    hits = 0
    for case in TEST_CASES:
        try:
            if case["type"] == "rag":
                r = answer(case["q"])
                ok = r and "don't know" not in r.lower()
            else:
                r = await agent.ainvoke({"messages": [("user", case["q"])]})
                ok = bool(r["messages"][-1].content)
            hits += ok
            print(f"[{'OK' if ok else 'FAIL'}] {case['q']}")
        except Exception as e:
            print(f"[ERR] {case['q']}: {e}")
    print(f"\nRetrieval hit rate: {hits}/{len(TEST_CASES)} = {hits/len(TEST_CASES):.2%}")

asyncio.run(run())
```

Target: **>80% hit rate**. This is your interview "metrics" story.

---

## Interview Talking Points

### On architecture

> "I built it in three layers. First RAG over Contentstack — chunk, embed with NVIDIA, store in Pinecone. Then a sync layer with cron + manual button for freshness. Then MCP-style tool calling for user-specific data like bookings and profile, which the agent routes to based on query intent. FastAPI handles AI logic; Express stays a pure business API. The FastAPI service forwards the user's JWT to Express on each tool call."

### On RAG

> "I used LCEL to chain the pipeline — retriever, prompt, Groq LLM, parser. Each stage is a Runnable, so I get invoke, stream, and batch for free. Chunks are 500 tokens with 80 overlap via RecursiveCharacterTextSplitter. The embedding model is nvidia/nemotron-3-embed-1b at 2048 dimensions."

### On sync

> "Rather than webhooks, I chose cron + manual button because my use case is FAQ retrieval — hourly freshness is plenty. The sync is idempotent: I delete by hostel_uid metadata first, then re-upsert. A UID registry file tracks what's indexed so I can diff against Contentstack. This handles account migration cleanly too — I just re-run the export."

### On MCP + agent

> "I used LangGraph's ReAct agent, not AgentExecutor, since my LangChain is 1.x. Four tools: one wraps the RAG chain, three call my Express API with the forwarded JWT. The LLM decides per turn: static question → RAG tool; personal question → MCP tool. This separation keeps hallucination risk low for user-specific answers — you never want to RAG over changing data."

### On evaluation

> "I built a 30-question eval set covering amenities, location, pricing, policies. The script measures retrieval hit rate — currently above 80%. That number is what I'd watch when tuning chunk size, k, or swapping the embedding model."

### Buzzwords, mapped to real work

| Buzzword | Where you actually used it |
|----------|----------------------------|
| RAG | Contentstack → Pinecone → Groq retrieval chain |
| LCEL | `retriever \| prompt \| llm \| parser` in `chain.py` |
| Runnable | Every LCEL stage; supports invoke/stream/batch |
| Vector DB | Pinecone serverless, 2048-dim cosine |
| Embeddings | `nvidia/nemotron-3-embed-1b` via LangChain integration |
| MCP | Tool schemas in FastAPI calling Express endpoints |
| ReAct | LangGraph `create_react_agent` |
| Function calling | Tool selection per user query |
| Streaming | SSE via `sse-starlette` |
| Idempotent sync | Delete-by-uid then re-upsert |
| Retrieval eval | `scripts/eval.py` hit-rate measurement |
| Agentic RAG | RAG wrapped as a tool inside the agent |

---

## Milestone Checklist

### Phase 1
- [ ] `config.py` loads `.env` without error
- [ ] `fetch_all_hostels()` returns non-empty
- [ ] Pinecone index exists at 2048 dimensions
- [ ] NVIDIA embedding returns 2048-length vector
- [ ] `full_reindex()` populates Pinecone
- [ ] `POST /api/chat/` returns grounded answer

### Phase 2
- [ ] `POST /api/chat/sync` returns counts
- [ ] Cron job runs hourly (check logs)
- [ ] New hostel in Contentstack → sync → chatbot knows it

### Phase 3
- [ ] `Authorization` header required on `/api/chat/`
- [ ] "Show my bookings" calls Express with JWT
- [ ] "Do hostels have Wi-Fi?" uses RAG tool
- [ ] All 4 tools reachable and returning data

### Phase 4
- [ ] SSE `/stream` endpoint emits tokens
- [ ] React widget renders streaming response
- [ ] Chat calls use the refresh-aware axios instance
- [ ] `scripts/eval.py` reports >80% hit rate
</parameter>