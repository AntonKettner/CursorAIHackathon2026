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

- Node.js 18+ (or Docker)
- Python 3.12+ (or Docker)
- [uv](https://docs.astral.sh/uv/) (Python package manager)
- [pnpm](https://pnpm.io/) (`npm install -g pnpm`)
- ElevenLabs API key
- (Optional) [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/) - only needed if exposing to ElevenLabs from local machine

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
cp env.local.example .env.local

# Replace your-agent-id-here with the agent_id from step 1
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

**Terminal 3 - Expose Backend (optional, for ElevenLabs from local):**
```bash
# Only needed if running locally and ElevenLabs needs external access
cloudflared tunnel --url http://localhost:8000
# Copy the generated URL
```

### 4. Configure ElevenLabs MCP

1. Go to your agent in the [ElevenLabs dashboard](https://elevenlabs.io/conversational-ai)
2. Add your MCP server endpoint:
   - Local with tunnel: Use the cloudflared URL
   - Remote deployment: Use your server's public URL (e.g., `https://your-domain:8000`)
3. The agent can now use your backend tools

## Docker

Run the application with Docker Compose:

```bash
# Copy environment template and fill in your values
cp .env.example .env
# Edit .env with your ELEVENLABS_API_KEY and NEXT_PUBLIC_ELEVENLABS_AGENT_ID

# Build and run (local deployment - MCP directly exposed)
docker compose up --build

# Or with FRP tunnel for remote deployment
docker compose --profile tunnel up --build
```

### Local Deployment

For local development/testing, the MCP server is directly exposed:
- Frontend: `http://localhost:3000`
- Backend/MCP: `http://localhost:8000`

Configure ElevenLabs to use `http://localhost:8000` as the MCP endpoint (or use a tunnel like ngrok/cloudflared if ElevenLabs needs external access).

### Remote Deployment (with FRP tunnel)

For remote deployment, use the `tunnel` profile to enable FRP:
```bash
docker compose --profile tunnel up --build
```

This exposes the services via the FRP server configured in `frpc/frpc.toml`.

### Running Services Individually

```bash
# Backend
docker build -t labasi-backend ./backend
docker run -p 8000:8000 -e ELEVENLABS_API_KEY=your-key labasi-backend

# Frontend
docker build -t labasi-frontend \
  --build-arg NEXT_PUBLIC_ELEVENLABS_AGENT_ID=your-agent-id \
  ./frontend/agent
docker run -p 3000:3000 labasi-frontend
```

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

## Disclaimer

The deployment infrastructure (OVH virtual private server and domain) used for this hackathon project was provided with permission from our employer for demonstration purposes. This has no effect on the code, licensing, or contributions to this project.
