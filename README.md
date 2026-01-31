# Labasi

**Voice-first AI assistant for laboratory environments**

Lab workers often have their hands full—literally. Labasi provides a hands-free, voice-driven interface to assist with experiments, chemical parameters, and lab workflows. Built with ElevenLabs Conversational AI and a FastMCP backend.

## Features

- **Voice-First Interaction** - Natural voice conversations powered by ElevenLabs
- **Real-Time Responses** - WebRTC-based low-latency audio streaming
- **Conversation History** - Browse and search past lab conversations
- **Extensible Tools** - Add custom MCP tools for lab-specific functionality
- **Visual Feedback** - Animated orb shows listening/talking states

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ LabasiOrb   │  │ Conversation│  │ ConversationBar         │  │
│  │ (3D Visual) │  │ Panel       │  │ (Voice/Text Input)      │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└──────────────────────────┬──────────────────────────────────────┘
                           │ WebRTC
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ElevenLabs Conversational AI                 │
│                 (Voice Recognition + TTS + Agent)               │
└──────────────────────────┬──────────────────────────────────────┘
                           │ MCP Protocol
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Backend (FastMCP Server)                     │
│                    Custom Tools & Integrations                  │
└─────────────────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer    | Technology                                      |
| -------- | ----------------------------------------------- |
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4 |
| Voice AI | ElevenLabs Conversational AI, WebRTC            |
| Backend  | Python 3.12+, FastMCP 3.0, uv                   |

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.12+
- [uv](https://docs.astral.sh/uv/) (Python package manager)
- [pnpm](https://pnpm.io/) (`npm install -g pnpm`)
- [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/) (`brew install cloudflared`)
- ElevenLabs API key

### 1. Backend Setup

```bash
cd backend

# Create environment file
cp env.example .env
# Edit .env and add your ELEVENLABS_API_KEY

# Install dependencies
uv sync --prerelease=allow

# Create your ElevenLabs agent
uv run python create_agent.py
# Note the agent_id from the output
```

### 2. Frontend Setup

```bash
cd frontend/agent

# Install dependencies
pnpm install

# Create environment file
echo "NEXT_PUBLIC_ELEVENLABS_AGENT_ID=your-agent-id-here" > .env.local
# Replace with the agent_id from step 1
```

### 3. Run the Application

**Terminal 1 - Frontend:**
```bash
cd frontend/agent
pnpm dev
# Opens at http://localhost:3000
```

**Terminal 2 - Backend MCP Server:**
```bash
cd backend
uv run python mcp_server.py
# Runs at http://localhost:8000
```

**Terminal 3 - Expose Backend (for ElevenLabs):**
```bash
cloudflared tunnel --url http://localhost:8000
# Copy the generated URL
```

### 4. Configure ElevenLabs MCP

1. Go to your agent in the [ElevenLabs dashboard](https://elevenlabs.io/conversational-ai)
2. Add the cloudflared tunnel URL as an MCP server endpoint
3. The agent can now use your backend tools

## Project Structure

```
├── backend/
│   ├── mcp_server.py      # FastMCP server with tool definitions
│   ├── create_agent.py    # Script to create ElevenLabs agent
│   ├── pyproject.toml     # Python dependencies
│   └── .env               # API keys (not committed)
│
├── frontend/agent/
│   ├── app/               # Next.js app router
│   │   ├── page.tsx       # Main assistant page
│   │   └── transcripts/   # Conversation history page
│   ├── components/
│   │   ├── labasi/        # Labasi-specific components
│   │   │   ├── labasi-assistant.tsx
│   │   │   ├── labasi-orb.tsx
│   │   │   └── conversation-panel.tsx
│   │   └── ui/            # Reusable UI components
│   ├── lib/               # Utilities and hooks
│   └── .env.local         # Agent ID (not committed)
```

## Adding Custom Tools

Extend the backend with lab-specific tools in `backend/mcp_server.py`:

```python
from fastmcp import FastMCP

mcp = FastMCP("Labasi Server")

@mcp.tool
def get_chemical_info(compound: str) -> str:
    """Get safety and handling information for a chemical compound."""
    # Your implementation here
    return f"Information about {compound}..."

@mcp.tool
def log_experiment(title: str, notes: str) -> str:
    """Log a new experiment entry."""
    # Your implementation here
    return "Experiment logged successfully"
```

## Development

```bash
# Backend - lint and format
cd backend
uv run ruff check . && uv run ruff format .

# Frontend - build for production
cd frontend/agent
pnpm build
```

## License

MIT
