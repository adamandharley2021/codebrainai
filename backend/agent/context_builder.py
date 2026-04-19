import json


# =============================
# FILE TREE BUILDER
# =============================
def build_file_tree(files):
    tree = {}

    for f in files:
        path = f.get("file_path", "")
        parts = path.split("/")

        current = tree
        for part in parts[:-1]:
            current = current.setdefault(part, {})

        if parts[-1]:
            current[parts[-1]] = True

    return tree


# =============================
# FILE FORMATTER (SMART TRIM)
# =============================
def format_files(files, max_chars=6000):
    formatted = []
    total_chars = 0

    for f in files:
        path = f.get("file_path", "unknown")
        content = f.get("content", "")

        # hard limit per file
        if len(content) > 4000:
            content = content[:4000] + "\n... (truncated)"

        block = f"FILE: {path}\n{content}"
        block_len = len(block)

        # stop if exceeding total context budget
        if total_chars + block_len > max_chars:
            break

        formatted.append(block)
        total_chars += block_len

    return "\n\n".join(formatted)


# =============================
# MEMORY FORMATTER
# =============================
def format_memories(memories, max_items=10):
    if not memories:
        return "None"

    # prioritize important + active
    sorted_memories = sorted(
        memories,
        key=lambda m: (m.get("importance", 1), m.get("created_at", "")),
        reverse=True
    )

    selected = sorted_memories[:max_items]

    return "\n".join([
        f"- {m.get('content','')}"
        for m in selected
    ])


# =============================
# MAIN CONTEXT BUILDER
# =============================
def build_context(project, files, memories):
    file_tree = build_file_tree(files)
    formatted_files = format_files(files)
    formatted_memories = format_memories(memories)

    context = f"""
PROJECT NAME:
{project.get('name', 'Unnamed Project')}

========================
FILE TREE
========================
{json.dumps(file_tree, indent=2)}

========================
FILES
========================
{formatted_files}

========================
MEMORIES
========================
{formatted_memories}

========================
INSTRUCTIONS
========================
- You are working inside a real codebase
- Understand the structure before making changes
- Always reference exact file paths
- Prefer editing existing files over creating duplicates
"""

    return context