# CLAUDE.md

This file provides guidance to Claude Code when working with this project.

## Project Overview

A full-stack application with a Python MCP server backend and a Next.js frontend.

## Project Structure

```
├── backend/          # FastMCP server (Python)
│   ├── main.py       # MCP server entry point
│   └── pyproject.toml
├── frontend/
│   ├── agent/        # Next.js app
│   └── createAgent.mts
```

## Backend (FastMCP Server)

**Tech Stack:** Python 3.12+, FastMCP 3.0.0b1, uv, ruff

```bash
# Install dependencies
cd backend && uv sync --prerelease=allow

# Run the server
uv run python main.py

# Lint/format
uv run ruff check .
uv run ruff format .
```

Server runs at `http://0.0.0.0:8000/mcp`

## Frontend (Next.js)

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, pnpm

```bash
# Install dependencies
cd frontend/agent && pnpm install

# Development server
pnpm dev

# Build for production
pnpm build

# Run production build
pnpm start

# Lint
pnpm lint
```

## Adding MCP Tools

Use the `@mcp.tool` decorator in `backend/main.py`:

```python
@mcp.tool
def my_tool(param: str) -> str:
    """Tool description shown to clients."""
    return "result"
```
