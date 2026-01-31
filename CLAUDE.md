# CLAUDE.md

This file provides guidance to Claude Code when working with this project.

## Project Overview

**Labasi** - A voice-first AI assistant for laboratory environments. Users work with gloves and hands full, so voice is the primary interaction method. The assistant helps with previous experiments, next steps, and chemical parameters.

## Project Structure

```
├── backend/              # FastMCP server (Python)
│   ├── main.py           # MCP server entry point
│   ├── create_agent.py   # Script to create ElevenLabs agent
│   ├── db/               # Database layer (SQLModel)
│   │   ├── __init__.py
│   │   ├── models.py     # ConversationSession, ConversationMessage
│   │   └── engine.py     # Async engine, session factory
│   └── pyproject.toml
├── frontend/
│   ├── agent/            # Next.js app (Labasi UI)
│   │   ├── app/
│   │   │   ├── api/conversations/  # REST API routes
│   │   │   └── ...
│   │   ├── components/
│   │   │   ├── ui/       # ElevenLabs UI components
│   │   │   └── labasi/   # Custom Labasi components
│   │   ├── lib/
│   │   │   ├── db.ts             # PostgreSQL connection pool
│   │   │   ├── conversation-api.ts  # API client for conversations
│   │   │   └── use-conversation-db.ts  # React hook for conversations
│   │   └── types/
│   └── package.json
├── docker-compose.yaml   # PostgreSQL, backend, frontend services
```

## Database (PostgreSQL)

**Tech Stack:** PostgreSQL 16, SQLModel, asyncpg (backend), pg (frontend)

### Architecture

```
Frontend React ──► Next.js API Routes ──► PostgreSQL
                   /api/conversations      ▲
                                           │
Backend MCP ──► SQLModel + asyncpg ────────┘
```

### Schema

**conversation_sessions**
| Column     | Type      | Description              |
|------------|-----------|--------------------------|
| id         | UUID (PK) | Session identifier       |
| agent_id   | string    | ElevenLabs agent ID      |
| started_at | timestamp | Session start time       |
| ended_at   | timestamp | Session end time (nullable) |

**conversation_messages**
| Column     | Type      | Description              |
|------------|-----------|--------------------------|
| id         | UUID (PK) | Message identifier       |
| session_id | UUID (FK) | References session       |
| content    | string    | Message text             |
| source     | enum      | "user" or "assistant"    |
| timestamp  | timestamp | Message time             |

### Running PostgreSQL

```bash
docker compose up postgres -d
```

### Frontend API Routes

| Method | Endpoint                          | Description         |
|--------|-----------------------------------|---------------------|
| GET    | /api/conversations                | List all sessions   |
| POST   | /api/conversations                | Create new session  |
| GET    | /api/conversations/[id]           | Get single session  |
| DELETE | /api/conversations/[id]           | Delete session      |
| POST   | /api/conversations/[id]/messages  | Add message         |
| POST   | /api/conversations/[id]/end       | End session         |

## Backend (FastMCP Server)

**Tech Stack:** Python 3.12+, FastMCP 3.0.0b1, ElevenLabs SDK, SQLModel, asyncpg, uv, ruff

```bash
cd backend && uv sync --prerelease=allow
uv run python main.py        # Runs at http://0.0.0.0:8000/mcp
uv run ruff check . && uv run ruff format .
```

### Environment Variables

Create `backend/.env` (see `env.example`):
```
ELEVENLABS_API_KEY=your-api-key-here
DATABASE_URL=postgresql+asyncpg://labasi:labasi@localhost:5432/labasi
```

### Creating an ElevenLabs Agent

```bash
cd backend && uv run python create_agent.py
```

This will create a new agent and print the agent ID. Use this ID in the frontend configuration.

## Frontend (Labasi UI)

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, ElevenLabs UI

```bash
cd frontend/agent && pnpm install
pnpm dev                     # Development server at http://localhost:3000
pnpm build && pnpm start     # Production build
```

### Environment Variables

Create `frontend/agent/.env.local`:
```
NEXT_PUBLIC_ELEVENLABS_AGENT_ID=your-agent-id
DATABASE_URL=postgresql://labasi:labasi@localhost:5432/labasi
```

### Key Components

- **LabasiAssistant** - Main orchestrator component
- **LabasiOrb** - 3D animated visualization (cyan/blue lab theme)
- **ConversationBar** - Voice/text input with waveform
- **ConversationPanel** - Chat history display

### ElevenLabs Integration

- Agent configured via ElevenLabs dashboard or `backend/create_agent.py`
- UI components from `@elevenlabs/react` and ElevenLabs UI registry
- Real-time voice conversation via WebRTC

## Adding MCP Tools

Use the `@mcp.tool` decorator in `backend/main.py`:

```python
@mcp.tool
def my_tool(param: str) -> str:
    """Tool description shown to clients."""
    return "result"
```

## Docker

Run all services:
```bash
docker compose up -d
```

Services:
- **postgres**: PostgreSQL 16 on port 5432
- **backend**: FastMCP server on port 8000
- **frontend**: Next.js app on port 3000

Check logs:
```bash
docker compose logs -f frontend
docker compose logs -f backend
```

Access PostgreSQL directly:
```bash
docker exec -it cursoraihackathon2026-postgres-1 psql -U labasi -d labasi
```
