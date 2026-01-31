FROM python:3.12-slim

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

WORKDIR /app

# Copy dependency files first (for layer caching)
COPY pyproject.toml uv.lock ./

# Install dependencies
RUN uv sync --prerelease=allow --frozen

# Copy source code
COPY mcp_server.py ./

EXPOSE 8000

CMD ["uv", "run", "python", "mcp_server.py"]
