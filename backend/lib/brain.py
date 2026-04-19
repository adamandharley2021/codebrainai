# backend/lib/brain.py

import json
from datetime import datetime, timezone

# =========================
# FORMAT BRAIN FOR PROMPT
# =========================
def format_brain_for_prompt(brain: dict) -> str:
    if not brain:
        return "Core brain is empty - no deep knowledge yet."

    sections = []

    if brain.get("technical_skills"):
        sections.append(f"Technical Skills: {', '.join(brain['technical_skills'][:20])}")

    if brain.get("current_projects"):
        sections.append(f"Active Projects: {', '.join(brain['current_projects'][:10])}")

    if brain.get("coding_preferences"):
        sections.append(f"Coding Preferences: {json.dumps(brain['coding_preferences'])}")

    if brain.get("architecture_patterns"):
        sections.append(f"Architecture Patterns: {', '.join(brain['architecture_patterns'][:10])}")

    if brain.get("known_issues"):
        sections.append(f"Known Issues: {', '.join(brain['known_issues'][:10])}")

    if brain.get("learning_goals"):
        sections.append(f"Learning Goals: {', '.join(brain['learning_goals'][:10])}")

    if brain.get("tool_stack"):
        sections.append(f"Tool Stack: {', '.join(brain['tool_stack'][:15])}")

    if brain.get("key_decisions"):
        sections.append(f"Key Decisions: {', '.join(brain['key_decisions'][:10])}")

    if brain.get("relationships"):
        sections.append(f"Relationships: {', '.join(brain['relationships'][:10])}")

    if brain.get("recent_topics"):
        sections.append(f"Recent Topics: {', '.join(brain['recent_topics'][:10])}")

    return "\n".join(sections)


# =========================
# MERGE BRAIN DATA SAFELY
# =========================
def merge_brain_data(existing: dict, new_data: dict) -> dict:
    merged = {}

    list_fields = [
        "technical_skills",
        "current_projects",
        "architecture_patterns",
        "known_issues",
        "recent_topics",
        "key_decisions",
        "learning_goals",
        "tool_stack",
        "relationships",
    ]

    for key in list_fields:
        existing_items = existing.get(key, []) if existing else []
        new_items = new_data.get(key, []) if new_data else []

        if not isinstance(existing_items, list):
            existing_items = []
        if not isinstance(new_items, list):
            new_items = []

        combined = list(dict.fromkeys(existing_items + new_items))
        merged[key] = combined[-100:]

    dict_fields = ["coding_preferences"]

    for key in dict_fields:
        existing_dict = existing.get(key, {}) if existing else {}
        new_dict = new_data.get(key, {}) if new_data else {}

        if not isinstance(existing_dict, dict):
            existing_dict = {}
        if not isinstance(new_dict, dict):
            new_dict = {}

        merged[key] = {**existing_dict, **new_dict}

    return merged