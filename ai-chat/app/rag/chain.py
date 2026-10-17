from langchain_groq import ChatGroq
from langchain_core.documents import Document
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
from app.rag.ingest import get_store
from app.config import settings

_llm = None
_retriever = None
_prompt = None
_chain = None

SYSTEM_PROMPT = """You are TravelTribe's hostel assistant. Answer questions \
about hostels using ONLY the context below. If the answer is not in the context, \
say so honestly and suggest the user contact support.

Context:
{context}"""

def get_prompt()->list:
    global _prompt
    if _prompt is None:
        _prompt = ChatPromptTemplate.from_messages([
            ("system", SYSTEM_PROMPT),
            ("human",  "{question}")
        ])

    return _prompt

def get_llm():
    global _llm
    if _llm is None:
        _llm = ChatGroq(
            model= settings.groq_model,
            api_key=settings.groq_api_key,
            temperature=0
        )
    return _llm

def _format_docs(docs)->str:
    return "\n\n---\n\n".join(d.page_content for d in docs)


def get_retriever():
    global _retriever
    if _retriever is None:
        _retriever = get_store().as_retriever(search_kwargs={"k": 4})
    return _retriever

def get_chain():
    global _chain
    if _chain is None:
        _chain = (
            {
                "context": get_retriever() | _format_docs,
                "question": RunnablePassthrough()
            } | get_prompt() | get_llm() | StrOutputParser()
        )

    return _chain
def get_answer(question: str):
    ans = get_chain().invoke(question)
    return ans

if __name__ == "__main__":
    questions = [
        "Tell me about Zostel Bangalore",
        "Which hostels are near NMIMS?",
        "What's the cheapest hostel with food included?",
        "Does Hoshtel99 allow couples?",
    ]
    for q in questions:
        print(f"Q: {q}")
        print(f"A: {get_answer(q)}\n")
    # prompt = get_prompt()
    # messages = prompt.invoke({
    #     "context": "Hostel: Crescenzo\nFacilities: wifi, ac",
    #     "question": "Does Crescenzo have wifi?",
    # })
    # for m in messages.to_messages():
    #     print(f"[{m.type}]")
    #     print(m.content)
    #     print()


    # llm = get_llm()
    # res = llm.invoke("Say Hello only")
    # print(f"LLM RES: {res.content}")
    # docs = [
    #     Document("Hello, this is krishna"),
    #     Document("I'm buillding AI RAG pipeline")
            
    #         ]
    # print(_format_docs(docs))

    # question= "Does Crescenzo have wifi? Whats room price?"
    # retriver = get_retriever()
    # docs = retriver.invoke(question)
    # print(f"Got {len(docs)} docs")
    # for i, d in enumerate(docs):
    #     print(f"Chunk {i}: Content {d.page_content}")
    




