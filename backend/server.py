from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Request
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client
import os
import uuid
import json
from datetime import datetime, timezone
from pydantic import BaseModel
from typing import Optional
import openai

# =========================
# ENV
# =========================
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    raise Exception("Missing Supabase env vars")

# =========================
# CLIENTS
# =========================
def get_supabase():
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

def get_openai():
    return openai.AsyncOpenAI(api_key=OPENAI_API_KEY)

# =========================
# APP
# =========================
app = FastAPI(title="CodeBrain AI")
api = APIRouter(prefix="/api")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================
# MODELS
# =========================
class ChatRequest(BaseModel):
    project_id: str
    message: str

class MemoryCreate(BaseModel):
    title: str
    content: str
    category: str = "general"

class MemoryUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    category: Optional[str] = None
    is_active: Optional[bool] = None

# =========================
# AUTH HELPERS
# =========================
def get_user(request: Request):
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(401, "Missing token")

    token = auth.replace("Bearer ", "")
    supabase = get_supabase()

    user = supabase.auth.get_user(token)

    if not user or not user.user:
        raise HTTPException(401, "Invalid token")

    return user.user

# =========================
# AUTH ROUTES (FIXED - WAS MISSING)
# =========================
@api.post("/auth/login")
def login(data: dict):
    supabase = get_supabase()

    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        raise HTTPException(400, "Missing email or password")

    res = supabase.auth.sign_in_with_password({
        "email": email,
        "password": password
    })

    return {
        "access_token": res.session.access_token,
        "user": res.user
    }


@api.post("/auth/register")
def register(data: dict):
    supabase = get_supabase()

    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        raise HTTPException(400, "Missing email or password")

    res = supabase.auth.sign_up({
        "email": email,
        "password": password
    })

    return {
        "message": "User created",
        "user": res.user
    }

# =========================
# MEMORY HELPERS
# =========================
def get_active_memories(user_id):
    supabase = get_supabase()
    return supabase.table("core_memories") \
        .select("*") \
        .eq("user_id", user_id) \
        .eq("is_active", True) \
        .execute().data or []

def get_brain(user_id):
    supabase = get_supabase()
    res = supabase.table("core_brain") \
        .select("*") \
        .eq("user_id", user_id) \
        .execute().data

    return res[0]["brain_data"] if res else {}

# =========================
# PROJECTS
# =========================
@api.post("/projects")
def create_project(data: dict, request: Request):
    user = get_user(request)
    supabase = get_supabase()

    project = {
        "id": str(uuid.uuid4()),
        "user_id": user.id,
        "name": data.get("name"),
        "description": data.get("description", ""),
        "file_count": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }

    return supabase.table("projects").insert(project).execute().data


@api.get("/projects")
def get_projects(request: Request):
    user = get_user(request)
    supabase = get_supabase()

    return supabase.table("projects") \
        .select("*") \
        .eq("user_id", user.id) \
        .execute().data


@api.get("/projects/{project_id}")
def get_project(project_id: str, request: Request):
    user = get_user(request)
    supabase = get_supabase()

    res = supabase.table("projects") \
        .select("*") \
        .eq("id", project_id) \
        .eq("user_id", user.id) \
        .execute()

    return res.data[0] if res.data else {}

# =========================
# FILES
# =========================
@api.post("/projects/{project_id}/files")
async def upload_file(project_id: str, file: UploadFile = File(...), request: Request = None):
    user = get_user(request)
    supabase = get_supabase()

    content = await file.read()

    data = {
        "id": str(uuid.uuid4()),
        "user_id": user.id,
        "project_name": project_id,
        "file_path": file.filename,
        "content": content.decode("utf-8", errors="ignore"),
        "summary": "",
        "language": file.filename.split(".")[-1],
        "file_size": len(content),
        "created_at": datetime.now(timezone.utc).isoformat()
    }

    return supabase.table("project_files").insert(data).execute().data


@api.get("/projects/{project_id}/files")
def get_files(project_id: str, request: Request):
    user = get_user(request)
    supabase = get_supabase()

    return supabase.table("project_files") \
        .select("*") \
        .eq("project_name", project_id) \
        .eq("user_id", user.id) \
        .execute().data


@api.delete("/projects/{project_id}/files/{file_id}")
def delete_file(project_id: str, file_id: str, request: Request):
    user = get_user(request)
    supabase = get_supabase()

    supabase.table("project_files") \
        .delete() \
        .eq("id", file_id) \
        .eq("user_id", user.id) \
        .execute()

    return {"success": True}

# =========================
# CHAT STREAM
# =========================
SYSTEM_PROMPT = "You are CodeBrain, an elite AI coding assistant."

@api.post("/projects/{project_id}/chat/stream")
async def chat_stream(project_id: str, data: ChatRequest, request: Request):
    user = get_user(request)

    supabase = get_supabase()
    client = get_openai()

    files = supabase.table("project_files") \
        .select("*") \
        .eq("project_name", project_id) \
        .execute().data

    memories = get_active_memories(user.id)
    brain = get_brain(user.id)

    context = f"""
CORE BRAIN:
{json.dumps(brain)}

MEMORIES:
{json.dumps([m['content'] for m in memories])}

FILES:
{json.dumps([f['content'][:1500] for f in files])}
"""

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT + "\n\n" + context},
        {"role": "user", "content": data.message}
    ]

    async def stream():
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            stream=True
        )

        async for chunk in response:
            if chunk.choices[0].delta.content:
                yield f"data: {json.dumps({'content': chunk.choices[0].delta.content})}\n\n"

        yield f"data: {json.dumps({'done': True})}\n\n"

    return StreamingResponse(stream(), media_type="text/event-stream")

# =========================
# MEMORIES
# =========================
@api.get("/core-memories")
def get_memories_route(request: Request):
    user = get_user(request)
    supabase = get_supabase()

    return supabase.table("core_memories") \
        .select("*") \
        .eq("user_id", user.id) \
        .execute().data


@api.post("/core-memories")
def create_memory(data: MemoryCreate, request: Request):
    user = get_user(request)
    supabase = get_supabase()

    memory = {
        "id": str(uuid.uuid4()),
        "user_id": user.id,
        "title": data.title,
        "content": data.content,
        "category": data.category,
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }

    return supabase.table("core_memories").insert(memory).execute().data[0]


@api.put("/core-memories/{memory_id}")
def update_memory(memory_id: str, data: MemoryUpdate, request: Request):
    user = get_user(request)
    supabase = get_supabase()

    update_data = {k: v for k, v in data.dict().items() if v is not None}

    return supabase.table("core_memories") \
        .update(update_data) \
        .eq("id", memory_id) \
        .eq("user_id", user.id) \
        .execute().data


@api.delete("/core-memories/{memory_id}")
def delete_memory(memory_id: str, request: Request):
    user = get_user(request)
    supabase = get_supabase()

    supabase.table("core_memories") \
        .delete() \
        .eq("id", memory_id) \
        .eq("user_id", user.id) \
        .execute()

    return {"success": True}

# =========================
# ROOT
# =========================
@api.get("/")
def root():
    return {"status": "CodeBrain AI running"}

app.include_router(api)