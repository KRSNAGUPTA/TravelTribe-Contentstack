from fastmcp import FastMCP
from fastmcp.server.dependencies import get_http_headers
import httpx
from app.config import settings

mcp = FastMCP(
    "Travel Tribe MCP Server",
    instructions="MCP Server for Travel Tribe agent for handling user queries beyond classic RAG"
)

@mcp.tool()
async def fetch_user_profile() -> str:
    """Fetch info about logged in user"""
    
    headers = get_http_headers(include={"authorization"})
    
    auth_header = headers.get("authorization") 
    
    if not auth_header:
        return "Error: No auth token. Please log in."

    url = f"{settings.express_api_url}/api/user/profile"

    async with httpx.AsyncClient() as client:
        res = await client.get(url, headers={"Authorization": auth_header})

        if res.status_code != 200:
            return f"Error {res.status_code}: Could not fetch profile. {res.text}"
        return res.text