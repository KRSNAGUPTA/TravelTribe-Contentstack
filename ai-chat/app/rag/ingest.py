from app.contentstack_client import fetch_all_hostels
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_pinecone import PineconeVectorStore
from langchain_nvidia_ai_endpoints import NVIDIAEmbeddings
from app.config import settings


_store = None
_embedder = None

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
        _store = PineconeVectorStore(index_name=settings.pinecone_index_name,embedding=get_embedder(), pinecone_api_key=settings.pinecone_api_key)
    return _store


def _hostel_to_text(entry: dict) -> str:
    """Flatten ONE hostel entry into readable prose."""
    lines = [f"Hostel: {entry.get('title', 'Unnamed')}"]

    if entry.get("type"):
        lines.append(f"Type: {entry['type']}")
    if entry.get("address"):
        lines.append(f"Address: {entry['address']}")

    colleges = entry.get("nearby_college") or []
    if colleges:
        lines.append(f"Nearby colleges: {', '.join(colleges)}")

    facilities = entry.get("facilities") or []
    if facilities:
        lines.append(f"Facilities: {', '.join(facilities)}")

    rules = entry.get("house_rules") or []
    if rules:
        lines.append(f"House rules: {', '.join(rules)}")

    food = entry.get("food_info") or {}
    if food.get("available"):
        meals = ", ".join(food.get("meals") or [])
        ftype = ", ".join(food.get("food_type") or [])
        cost = food.get("extra_cost", 0)
        line = f"Food: {ftype} {meals}"
        if cost:
            line += f" (extra ₹{cost} per month)"
        lines.append(line)

    for room in entry.get("room_types") or []:
        lines.append(
            f"Room: {room.get('room_name', 'Room')} — "
            f"₹{room.get('base_price', '?')}/night, "
            f"{room.get('total_beds', '?')} beds. "
            f"{room.get('description', '')}".strip()
        )

    tags = entry.get("tags") or []
    if tags:
        lines.append(f"Tags: {', '.join(tags)}")

    taxonomies = entry.get("taxonomies") or []
    gender_terms = [
        t.get("term_uid") for t in taxonomies
        if t.get("taxonomy_uid") == "gender"
    ]
    if gender_terms:
        lines.append(f"Gender: {', '.join(gender_terms)}")

    return "\n".join(lines)


def _hostel_to_docs(entry: dict)->list[Document]:
    text = _hostel_to_text(entry)
    splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=80)
    chunks = splitter.split_text(text)

    return [
        Document(
            page_content=f"Hostel Name: {entry.get("title")}\n\n {chunk}",
            metadata = {"hostel_uid": entry.get("uid"), "hostel_name": entry.get("title"), "chunk_index": i, "hostel_type": entry.get("type", "")}
        )
        for i, chunk in enumerate(chunks)
    ]


def upsert_hostel(entry: dict)->int:
    store = get_store()
    uid = entry.get("uid")

    if not uid: return 0

    try:
        store.delete(filter={"hostel_uid": uid})
    except Exception as e:
        print(f"[Delete warn] {uid}: {e}")
    docs = _hostel_to_docs(entry)

    if docs:
        store.add_documents(docs)
    return len(docs)


def full_reindex(entries: list[dict])->int:
    total = 0
    for entry in entries:
        n = upsert_hostel(entry)
        print(f"{entry.get('title')}: {n} chunks" )
        total += n

    return total


if __name__ == "__main__":
    entries = fetch_all_hostels()
    print(f"Total Hostels: {len(entries)}")
    total_chunk = full_reindex(entries)
    print(f"Total {total_chunk} chunk indexed")
    