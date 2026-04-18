# CodeBrain AI - Matrix Code Debugger

A full-stack AI-powered code debugging platform with persistent memory, Matrix theme, and streaming chat.

## Features

- **AI Chat with Streaming**: Real-time responses powered by GPT-4o-mini
- **Project-Specific Chats**: Organize conversations by project
- **Core Brain Memory**: Persistent knowledge that the AI never forgets
- **File Upload**: Upload project files for context-aware assistance
- **Matrix Theme**: Stunning dark cyberpunk aesthetic

## Tech Stack

- **Frontend**: React, Tailwind CSS, Shadcn UI
- **Backend**: FastAPI, Python
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **AI**: OpenAI GPT-4o-mini
- **Auth**: Supabase Auth (Email/Password)

## Prerequisites

- Node.js 18+
- Python 3.11+
- Supabase Account
- OpenAI API Key

## Supabase Setup

1. Create a new Supabase project at https://supabase.com

2. Go to **SQL Editor** and run the following to create required tables:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Projects table
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project files table
CREATE TABLE project_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    content TEXT,
    content_type TEXT DEFAULT 'text/plain',
    size INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat messages table
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Core memories table
CREATE TABLE core_memories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_memories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for projects
CREATE POLICY "Users can view own projects" ON projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own projects" ON projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own projects" ON projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own projects" ON projects FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for project_files (via service role from backend)
CREATE POLICY "Service role full access files" ON project_files FOR ALL USING (true);

-- RLS Policies for chat_messages (via service role from backend)
CREATE POLICY "Service role full access messages" ON chat_messages FOR ALL USING (true);

-- RLS Policies for core_memories
CREATE POLICY "Users can view own memories" ON core_memories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own memories" ON core_memories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own memories" ON core_memories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own memories" ON core_memories FOR DELETE USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_project_files_project_id ON project_files(project_id);
CREATE INDEX idx_chat_messages_project_id ON chat_messages(project_id);
CREATE INDEX idx_core_memories_user_id ON core_memories(user_id);
```

3. Create a storage bucket:
   - Go to **Storage** in Supabase dashboard
   - Click **New Bucket**
   - Name: `project-files`
   - Set it to **Private**

4. Get your credentials from **Settings > API**:
   - `SUPABASE_URL`: Project URL
   - `SUPABASE_ANON_KEY`: anon public key
   - `SUPABASE_SERVICE_KEY`: service_role key (keep this secret!)

## Local Installation

### 1. Clone and Setup Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env with your credentials
```

**Backend .env file:**
```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_role_key
OPENAI_API_KEY=your_openai_api_key
CORS_ORIGINS=http://localhost:3000
```

### 2. Setup Frontend

```bash
cd frontend

# Install dependencies
yarn install

# Create .env file
echo "REACT_APP_BACKEND_URL=http://localhost:8001" > .env
```

### 3. Run the Application

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

**Terminal 2 - Frontend:**
```bash
cd frontend
yarn start
```

Visit http://localhost:3000

## Usage

1. **Register**: Create an account with email/password
2. **Create Project**: Add a new project from the dashboard
3. **Upload Files**: Upload your code files to the project
4. **Chat**: Ask CodeBrain to analyze, debug, or improve your code
5. **Core Memories**: Add persistent knowledge that the AI will remember across all chats

## API Endpoints

### Auth
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Projects
- `GET /api/projects` - List user's projects
- `POST /api/projects` - Create project
- `GET /api/projects/{id}` - Get project
- `DELETE /api/projects/{id}` - Delete project

### Files
- `POST /api/projects/{id}/files` - Upload file
- `GET /api/projects/{id}/files` - List files
- `GET /api/projects/{id}/files/{file_id}` - Get file content
- `DELETE /api/projects/{id}/files/{file_id}` - Delete file

### Chat
- `GET /api/projects/{id}/chat` - Get chat history
- `POST /api/projects/{id}/chat/stream` - Send message (SSE streaming)
- `DELETE /api/projects/{id}/chat` - Clear chat history

### Core Memories
- `GET /api/core-memories` - List memories
- `POST /api/core-memories` - Create memory
- `PUT /api/core-memories/{id}` - Update memory
- `DELETE /api/core-memories/{id}` - Delete memory

## License

MIT
