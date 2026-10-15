from app.contentstack_client import fetch_all_hostels


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


if __name__ == "__main__":
    hostels = fetch_all_hostels()
    print(f"Fetched {len(hostels)} hostels\n")
    print(_hostel_to_text(hostels[0]))