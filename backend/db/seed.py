"""Load demo data from JSON files into the database."""

import json
from datetime import datetime
from pathlib import Path
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .models import (
    ConversationMessage,
    ConversationSession,
    MessageSource,
    Note,
    Project,
    Todo,
    TodoStatus,
)

DEMO_DATA_DIR = Path(__file__).parent.parent / "demo_data"


def _parse_datetime(value: str | None) -> datetime | None:
    """Parse ISO datetime string, returning a naive datetime (no timezone)."""
    if value is None:
        return None
    dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
    # Convert to naive datetime (strip timezone) for PostgreSQL TIMESTAMP WITHOUT TIME ZONE
    return dt.replace(tzinfo=None)


async def seed_demo_data(session: AsyncSession) -> None:
    """Load demo data into the database if not already present."""
    # Check if data already exists
    result = await session.execute(select(Project).limit(1))
    if result.scalar_one_or_none() is not None:
        print("Database already contains data, skipping seed.")
        return

    print("Seeding demo data...")

    # Load and insert projects
    projects_file = DEMO_DATA_DIR / "projects.json"
    if projects_file.exists():
        projects_data = json.loads(projects_file.read_text())
        for p in projects_data:
            project = Project(
                id=UUID(p["id"]),
                name=p["name"],
                description=p.get("description"),
            )
            session.add(project)
        print(f"  Added {len(projects_data)} projects")

    # Load and insert notes
    notes_file = DEMO_DATA_DIR / "notes.json"
    if notes_file.exists():
        notes_data = json.loads(notes_file.read_text())
        for n in notes_data:
            note = Note(
                id=UUID(n["id"]),
                project_id=UUID(n["project_id"]),
                title=n["title"],
                content=n["content"],
            )
            session.add(note)
        print(f"  Added {len(notes_data)} notes")

    # Load and insert todos
    todos_file = DEMO_DATA_DIR / "todos.json"
    if todos_file.exists():
        todos_data = json.loads(todos_file.read_text())
        for t in todos_data:
            todo = Todo(
                id=UUID(t["id"]),
                project_id=UUID(t["project_id"]),
                content=t["content"],
                status=TodoStatus(t["status"]),
            )
            session.add(todo)
        print(f"  Added {len(todos_data)} todos")

    # Load and insert sessions
    sessions_file = DEMO_DATA_DIR / "sessions.json"
    if sessions_file.exists():
        sessions_data = json.loads(sessions_file.read_text())
        for s in sessions_data:
            conv_session = ConversationSession(
                id=UUID(s["id"]),
                project_id=UUID(s["project_id"]),
                agent_id=s["agent_id"],
                started_at=_parse_datetime(s["started_at"]),
                ended_at=_parse_datetime(s.get("ended_at")),
            )
            session.add(conv_session)
        print(f"  Added {len(sessions_data)} conversation sessions")

    # Load and insert messages
    messages_file = DEMO_DATA_DIR / "messages.json"
    if messages_file.exists():
        messages_data = json.loads(messages_file.read_text())
        for m in messages_data:
            message = ConversationMessage(
                id=UUID(m["id"]),
                session_id=UUID(m["session_id"]),
                content=m["content"],
                source=MessageSource(m["source"]),
                timestamp=_parse_datetime(m["timestamp"]),
            )
            session.add(message)
        print(f"  Added {len(messages_data)} messages")

    await session.commit()
    print("Demo data seeded successfully!")
