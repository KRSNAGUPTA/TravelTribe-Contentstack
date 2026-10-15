from pinecone import Pinecone, ServerlessSpec
from app.config import settings

pc = Pinecone(api_key= settings.pinecone_api_key)

existing = pc.list_indexes().names()

if settings.pinecone_index_name in existing:
    print(f"Index {settings.pinecone_index_name} already exist")
    idx = pc.describe_index(settings.pinecone_index_name)

    print(f"Dimension: {idx.dimension}")
    print(f"Metric {idx.metric}")
    print(f"host: {idx.host}")
else:
    pc.create_index(
        name=settings.pinecone_index_name,
        dimension=2048,
        metric="cosine",
        spec=ServerlessSpec(
            cloud=settings.pinecone_cloud,
            region=settings.pinecone_region
        )
    )
    print(f"Created index {settings.pinecone_index_name}")
    idx = pc.describe_index(settings.pinecone_index_name)
    print(f"Dimension: {idx.dimension}")
    print(f"Metric {idx.metric}")
    print(f"host: {idx.host}")
    print(f"Region {idx.region}")

