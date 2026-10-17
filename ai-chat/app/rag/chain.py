from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
from langchain_core.chat_history import BaseChatMessageHistory
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain_community.chat_message_histories import RedisChatMessageHistory

from operator import itemgetter
from app.rag.ingest import get_store
from app.config import settings

_llm = None
_retriever = None
_prompt = None
_chain_with_history = None

def get_session_history(session_id: str) -> BaseChatMessageHistory:
    return RedisChatMessageHistory(
        session_id=session_id,
        url=settings.redis_url,
        ttl=15*60  
    )

SYSTEM_PROMPT = """You are TravelTribe's hostel assistant.

Guidelines:
1. If the user just says hello or makes casual conversation, reply politely and ask how you can help them find a hostel. Do NOT list specific hostels unless asked.
2. If the user asks a question about hostels (prices, facilities, rules, locations), answer using ONLY the context below.
3. If the user asks for a link or the hostel's page, provide the link from the context formatted as a Markdown link.
   For example: [View Hostel Page](/hostel/bltfbcfd1b95e7c827a)
4. If the answer is not in the context, say so honestly and suggest they contact support.

Context:
{context}"""

def get_prompt():
    global _prompt
    if _prompt is None:
        _prompt = ChatPromptTemplate.from_messages([
            ("system", SYSTEM_PROMPT),
            MessagesPlaceholder(variable_name="history"), 
            ("human", "{question}")
        ])
    return _prompt

def get_llm():
    global _llm
    if _llm is None:
        _llm = ChatGroq(
            model=settings.groq_model,
            api_key=settings.groq_api_key,
            temperature=0.2
        )
    return _llm

def _format_docs(docs) -> str:
    return "\n\n---\n\n".join(d.page_content for d in docs)

def get_retriever():
    global _retriever
    if _retriever is None:
        _retriever = get_store().as_retriever(search_kwargs={"k": 4})
    return _retriever

def _extract_question(x):
    if isinstance(x, dict):
        return x.get("question", "")
    return x

def get_chain():
    global _chain_with_history
    if _chain_with_history is None:
        core_chain = (
            {
                "context": _extract_question | get_retriever() | _format_docs,
                "question": RunnablePassthrough(),
                "history": itemgetter("history")
            } 
            | get_prompt() 
            | get_llm() 
            | StrOutputParser()
        )
        
        _chain_with_history = RunnableWithMessageHistory(
            core_chain,
            get_session_history,
            input_messages_key="question",
            history_messages_key="history",
        )
    return _chain_with_history

def get_answer(question: str, session_id: str = "default_session") -> str:
    return get_chain().invoke(
        {"question": question},
        config={"configurable": {"session_id": session_id}}
    )