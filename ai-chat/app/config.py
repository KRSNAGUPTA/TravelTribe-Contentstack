from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    cs_api_key: str
    cs_delivery_token: str
    cs_environment: str
    cs_branch: str
    cs_region: str = "eu"

    pinecone_api_key: str
    pinecone_index_name: str = "travel-tribe"
    pinecone_cloud: str = "aws"
    pinecone_region: str = "us-east-1"

    groq_api_key: str
    groq_model: str = "llama-3.1-8b-instant"

    nvidia_api_key: str
    express_api_url: str

    app_env: str = "dev"

settings = Settings()