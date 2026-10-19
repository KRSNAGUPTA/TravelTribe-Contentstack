from langchain.agents import create_agent
from langchain.mcp import MCPAdapter
from langchain_core.tools import tool
from app.rag.chain import get_retriever, _format_docs, get_llm
from app.config import settings

@tool
def search_hostels(query: str) -> str:
    """Search for hostel information (prices, facilities, locations, rules) in the database."""
    retriever = get_retriever()
    docs = retriever.invoke(query)
    return _format_docs(docs)

async def get_agent(token: str | None, checkpointer):
    # 1. Start with the RAG tool
    tools = [search_hostels]
    
    # 2. If logged in, fetch and add the MCP tools
    if token:
        base_url = settings.ai_backend_url
        
        adapter = MCPAdapter({
            "traveltribe": {
                "url": f"{base_url}/mcp",
                "headers": {"Authorization": f"Bearer {token}"}
            }
        })
        
        mcp_tools = await adapter.list_tools()
        tools.extend(mcp_tools)

    # 3. Dynamic rules based on login status
    auth_rule = (
        "- If the user asks about their bookings or profile, use the corresponding MCP tool."
        if token else
        "- If the user asks about their bookings or profile, politely tell them they need to log in to access that information."
    )

    AGENT_PROMPT = f"""You are TravelTribe's AI assistant. 
    You have access to tools for searching hostels and looking up user data.

    Guidelines:
    - If the user asks about hostel prices, amenities, or locations, use the `search_hostels` tool.
    {auth_rule}
    - If the user asks for a hostel link, output it as a Markdown link.
    """

    # 4. Build the agent
    llm = get_llm()
    agent = create_agent(
        model=llm,
        tools=tools,
        system_prompt=AGENT_PROMPT,
        checkpointer=checkpointer,
    )
    
    return agent