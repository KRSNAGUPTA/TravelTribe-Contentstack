import contentstack
from contentstack.stack import ContentstackRegion
from app.config import settings

_REGION_MAP = {
    "us": ContentstackRegion.US,
    "eu": ContentstackRegion.EU,
    "au": ContentstackRegion.AU,
    "azure-na": ContentstackRegion.AZURE_NA,
    "azure-eu": ContentstackRegion.AZURE_EU,
    "gcp-na": ContentstackRegion.GCP_NA,
    "gcp-eu": ContentstackRegion.GCP_EU,
}

def get_stack():
    return contentstack.Stack(
        api_key=settings.cs_api_key,
        delivery_token=settings.cs_delivery_token,
        environment=settings.cs_environment,
        region=_REGION_MAP.get(settings.cs_region, ContentstackRegion.EU),
        branch=getattr(settings, "cs_branch", "main"),
    )

def fetch_all_hostels() -> list[dict]:
    """Fetch all published hostel entries with pagination."""
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