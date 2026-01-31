# CLAUDE.md

This file provides guidance to Claude Code when working with this project.

## Project Overview

**Labasi** - A voice-first AI assistant for laboratory environments. Users work with gloves and hands full, so voice is the primary interaction method. The assistant helps with previous experiments, next steps, and chemical parameters.

## Project Structure

```
├── backend/              # FastMCP server (Python)
│   ├── main.py           # MCP server entry point
│   ├── create_agent.py   # Script to create ElevenLabs agent
│   └── pyproject.toml
├── frontend/
│   ├── agent/            # Next.js app (Labasi UI)
│   │   ├── app/          # Next.js app router
│   │   ├── components/
│   │   │   ├── ui/       # ElevenLabs UI components
│   │   │   └── labasi/   # Custom Labasi components
│   │   └── types/        # TypeScript types
│   └── package.json
```

## Backend (FastMCP Server)

**Tech Stack:** Python 3.12+, FastMCP 3.0.0b1, ElevenLabs SDK, uv, ruff

```bash
cd backend && uv sync --prerelease=allow
uv run python main.py        # Runs at http://0.0.0.0:8000/mcp
uv run ruff check . && uv run ruff format .
```

### Environment Variables

Create `backend/.env` (see `env.example`):
```
ELEVENLABS_API_KEY=your-api-key-here
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
