<p align="center">
  <img src="logo.svg" alt="labasi" width="300">
</p>

<p align="center">
  <i>Voice-first AI assistant for laboratory environments — hands-free help when your hands are full</i>
</p>

<p align="center">
  <a href="https://labasi.dev.justadd.ai/"><b>Live Demo</b></a>
</p>

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS 4
- **Backend**: Python 3.12+, FastMCP 3.0, uv
- **Database**: PostgreSQL 16
- **AI/ML**: ElevenLabs Conversational AI (Voice Recognition + TTS + Agent)
- **Hosting**: Docker Compose, OVH VPS

## How to Run

```bash
# Clone and setup
git clone https://github.com/AntonKettner/CursorAIHackathon2026.git
cd CursorAIHackathon2026

# Create ElevenLabs agent (one-time setup)
cd backend
cp env.example .env              # Add your ELEVENLABS_API_KEY
uv sync --prerelease=allow
uv run python create_agent.py    # Note the agent_id
```

The `create_agent.py` script creates and pushes the agent configuration (system prompt, voice settings) to ElevenLabs. This keeps the agent definition version-controlled in git.

**Manual step:** After creating the agent, add your MCP server URL in the [ElevenLabs dashboard](https://elevenlabs.io/app/conversational-ai) under the agent's settings (no CLI option available).

```bash
# Run with Docker
cd ..
cp .env.example .env             # Add ELEVENLABS_API_KEY and agent_id
docker compose up --build        # Opens at http://localhost:3000
```

## Details

### The Problem

Lab workers often have their hands full—wearing gloves, handling chemicals, or managing equipment. They need to track notes, manage todos, and access information about chemical parameters, but can't easily use a keyboard or touchscreen.

### Our Solution

Labasi provides a **voice-driven interface** that lets researchers:
- Create and manage notes and todos hands-free
- Get chemical safety and handling information
- Track project progress through conversation
- Review past conversations and action items

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                       │
│     ┌───────────────────┐  ┌─────────────────────────────┐      │
│     │ Conversation Panel│  │ ConversationBar             │      │
│     │ (Chat History)    │  │ (Voice/Text Input)          │      │
│     └───────────────────┘  └─────────────────────────────┘      │
└────────────────┬─────────────────────────┬──────────────────────┘
                 │ WebRTC                  │ Direct DB Access
                 ▼                         │
┌────────────────────────────────────┐     │
│   ElevenLabs Conversational AI     │     │
│  (Voice Recognition + TTS + Agent) │     │
└────────────────┬───────────────────┘     │
                 │ MCP Protocol            │
                 ▼                         │
┌────────────────────────────────────┐     │
│     Backend (FastMCP Server)       │     │
│     Custom Tools & Integrations    │     │
└────────────────┬───────────────────┘     │
                 │                         │
                 ▼                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                         PostgreSQL                              │
│              (Conversations, Notes, Todos, Projects)            │
└─────────────────────────────────────────────────────────────────┘
```

### Key Features

- **Voice-First Interaction** - Natural voice conversations powered by ElevenLabs
- **Real-Time Responses** - WebRTC-based low-latency audio streaming
- **Notes & Todos** - Create, read, and manage notes and tasks via voice
- **Conversation History** - Browse and search past lab conversations
- **Extensible Tools** - Add custom MCP tools for lab-specific functionality

### Disclaimer

Deployment server provided with permission from our employer for demo purposes.
