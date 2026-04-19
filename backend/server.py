from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, APIRouter, HTTPException, Request, UploadFile, File
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client
import os
import uuid
import json
from datetime import datetime, timezone
from pydantic import BaseModel
import openai

import zipfile
from io import BytesIO
import io
import base64

from lib.brain import format_brain_for_prompt, merge_brain_data

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

# =========================
# AUTH
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
# AUTH ROUTES
# =========================
@api.post("/auth/login")
def login(data: dict):
    supabase = get_supabase()

    res = supabase.auth.sign_in_with_password({
        "email": data["email"],
        "password": data["password"]
    })

    if not res.session:
        raise HTTPException(401, "Invalid login")

    return {
        "user": res.user,
        "access_token": res.session.access_token
    }


@api.post("/auth/register")
def register(data: dict):
    supabase = get_supabase()

    res = supabase.auth.sign_up({
        "email": data["email"],
        "password": data["password"]
    })

    return {
        "user": res.user,
        "access_token": res.session.access_token if res.session else None
    }


@api.get("/auth/me")
def me(request: Request):
    return get_user(request)


# =========================
# PROJECTS (CLEANED - NO DUPLICATES)
# =========================
@api.get("/projects")
def get_projects(request: Request):
    user = get_user(request)
    supabase = get_supabase()

    res = supabase.table("projects").select("*").eq("user_id", user.id).execute()
    return res.data or []


@api.post("/projects")
def create_project(request: Request, data: dict):
    user = get_user(request)
    supabase = get_supabase()

    project_id = str(uuid.uuid4())

    supabase.table("projects").insert({
        "id": project_id,
        "user_id": user.id,
        "name": data.get("name", "Untitled Project"),
        "created_at": datetime.now(timezone.utc).isoformat()
    }).execute()

    return {"id": project_id, "name": data.get("name")}


@api.get("/projects/{project_id}")
def get_project(project_id: str, request: Request):
    user = get_user(request)
    supabase = get_supabase()

    res = supabase.table("projects") \
        .select("*") \
        .eq("id", project_id) \
        .eq("user_id", user.id) \
        .single() \
        .execute()

    return res.data


@api.delete("/projects/{project_id}")
def delete_project(project_id: str, request: Request):
    user = get_user(request)
    supabase = get_supabase()

    supabase.table("projects") \
        .delete() \
        .eq("id", project_id) \
        .eq("user_id", user.id) \
        .execute()

    return {"success": True}


@api.get("/projects/{project_id}/files")
def get_files(project_id: str, request: Request):
    get_user(request)
    supabase = get_supabase()

    res = supabase.table("project_files").select("*").eq("project_name", project_id).execute()
    return res.data or []


@api.post("/projects/{project_id}/files")
async def upload_file(project_id: str, file: UploadFile = File(...), request: Request = None):
    user = get_user(request)
    supabase = get_supabase()

    raw = await file.read()
    filename = file.filename.lower()

    # =========================
    # ZIP HANDLING (REAL FIX)
    # =========================
    if filename.endswith(".zip"):
        zip_buffer = BytesIO(raw)

        with zipfile.ZipFile(zip_buffer, "r") as zip_ref:
            for name in zip_ref.namelist():
                if name.endswith("/"):
                    continue

                try:
                    content = zip_ref.read(name).decode("utf-8")
                except:
                    content = base64.b64encode(zip_ref.read(name)).decode("utf-8")

                supabase.table("project_files").insert({
                    "id": str(uuid.uuid4()),
                    "user_id": user.id,
                    "project_name": project_id,
                    "file_path": name,
                    "content": content,
                    "language": "auto",
                }).execute()

        return {"success": True, "message": "ZIP extracted and indexed"}

    # =========================
    # NORMAL FILES
    # =========================
    try:
        content = raw.decode("utf-8")
    except UnicodeDecodeError:
        content = base64.b64encode(raw).decode("utf-8")

    res = supabase.table("project_files").insert({
        "id": str(uuid.uuid4()),
        "user_id": user.id,
        "project_name": project_id,
        "file_path": file.filename,
        "content": content,
        "language": "text"
    }).execute()

    return res.data[0]


@api.delete("/projects/{project_id}/files/{file_id}")
def delete_file(project_id: str, file_id: str, request: Request):
    get_user(request)
    supabase = get_supabase()

    supabase.table("project_files").delete().eq("id", file_id).execute()
    return {"success": True}


@api.get("/projects/{project_id}/files/{file_id}")
def get_file(project_id: str, file_id: str, request: Request):
    get_user(request)
    supabase = get_supabase()

    res = supabase.table("project_files").select("*").eq("id", file_id).single().execute()
    return res.data

# =========================
# STATS
# =========================
@api.get("/stats")
def get_stats(request: Request):
    user = get_user(request)
    supabase = get_supabase()

    projects = supabase.table("projects").select("*").eq("user_id", user.id).execute().data or []
    memories = supabase.table("core_memories").select("*").eq("user_id", user.id).execute().data or []

    return {
        "projects": len(projects),
        "memories": len(memories)
    }

# =========================
# MEMORY SYSTEM (FIXED - NO TITLE BUG)
# =========================
@api.get("/core-memories")
def get_memories(request: Request):
    user = get_user(request)
    supabase = get_supabase()

    res = supabase.table("core_memories").select("*").eq("user_id", user.id).execute()
    return res.data or []


@api.post("/core-memories")
def create_memory(data: dict, request: Request):
    user = get_user(request)
    supabase = get_supabase()

    # FIX: removed "title" (NOT IN YOUR DB)
    res = supabase.table("core_memories").insert({
        "id": str(uuid.uuid4()),
        "user_id": user.id,
        "content": data["content"],
        "category": data.get("category", "general"),
        "importance": data.get("importance", 1),
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }).execute()

    return res.data[0]


@api.put("/core-memories/{memory_id}")
def update_memory(memory_id: str, data: dict, request: Request):
    user = get_user(request)
    supabase = get_supabase()

    res = supabase.table("core_memories") \
        .update(data) \
        .eq("id", memory_id) \
        .eq("user_id", user.id) \
        .execute()

    return res.data


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
# CHAT STREAM (UNCHANGED)
# =========================
@api.post("/projects/{project_id}/chat/stream")
async def chat_stream(project_id: str, data: ChatRequest, request: Request):
    user = get_user(request)
    supabase = get_supabase()
    client = get_openai()

    files = supabase.table("project_files").select("*").eq("project_name", project_id).execute().data or []

    system_prompt = f"""
You are CodeBrain AI.

PROJECT FILES:
{chr(10).join([f"{f.get('filename','')}\n{f.get('content','')[:1000]}" for f in files])}
"""

    async def stream():
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": data.message}
            ],
            stream=True
        )

        full = ""

        async for chunk in response:
            if chunk.choices[0].delta.content:
                token = chunk.choices[0].delta.content
                full += token
                yield f"data: {json.dumps({'content': token})}\n\n"

        yield f"data: {json.dumps({'done': True})}\n\n"

    return StreamingResponse(stream(), media_type="text/event-stream")


# =========================
# ROOT
# =========================
@api.get("/")
def root():
    return {"status": "CodeBrain AI running"}

app.include_router(api)