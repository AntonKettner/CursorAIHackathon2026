# CLAUDE.md

This file provides guidance to Claude Code when working with this project.

## Project Overview

This is an MCP (Model Context Protocol) server built with FastMCP v3 (beta). It exposes tools that can be consumed by MCP-compatible clients like Claude Desktop or other AI assistants.

## Tech Stack

- **Python 3.12+**
- **FastMCP 3.0.0b1** - MCP server framework
- **uv** - Package manager
- **ruff** - Linter and formatter

## Key Commands

```bash
# Install dependencies
uv sync --prerelease=allow

# Run the server
uv run python main.py

# Lint code
uv run ruff check .

# Format code
uv run ruff format .
```

## Project Structure

- `main.py` - MCP server entry point with tool definitions
- `pyproject.toml` - Project dependencies and configuration
- `uv.lock` - Locked dependency versions

## Adding New Tools

To add a new MCP tool, use the `@mcp.tool` decorator in `main.py`:

```python
@mcp.tool
def my_tool(param: str) -> str:
    """Tool description shown to clients."""
    return "result"
```

## Server Configuration

The server runs on HTTP transport at `http://0.0.0.0:8000/mcp` by default. This can be modified in the `mcp.run()` call in `main.py`.
