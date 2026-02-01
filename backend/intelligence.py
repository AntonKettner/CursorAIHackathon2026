"""
Proactive Intelligence Module - Analyzes conversations and extracts notes/todos.

Uses Claude to analyze lab conversations and automatically extract:
- Notes: Observations, results, issues, troubleshooting discoveries, parameter values
- Todos: Follow-up actions, verifications, things to order, tests to run
"""

import os
from uuid import UUID

from anthropic import AsyncAnthropic
from pydantic import BaseModel, Field
from sqlmodel import select

from db import ConversationMessage, ConversationSession, Note, Todo, get_session


class ExtractedNote(BaseModel):
    """A note extracted from a conversation."""

    title: str = Field(description="Short descriptive title for the note")
    content: str = Field(description="Content as bullet points")


class ExtractedTodo(BaseModel):
    """A todo extracted from a conversation."""

    content: str = Field(description="Description of the task to be done")
    priority: str = Field(
        default="normal",
        description="Priority: 'high' for safety-critical, else 'normal'",
    )


class ExtractionResult(BaseModel):
    """Result of analyzing a conversation."""

    notes: list[ExtractedNote] = Field(default_factory=list)
    todos: list[ExtractedTodo] = Field(default_factory=list)


# Initialize Anthropic client (uses ANTHROPIC_API_KEY env var)
_client: AsyncAnthropic | None = None


def get_anthropic_client() -> AsyncAnthropic:
    """Get or create the Anthropic async client."""
    global _client
    if _client is None:
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY environment variable is not set")
        _client = AsyncAnthropic(api_key=api_key)
    return _client


EXTRACTION_PROMPT = """You are analyzing a laboratory voice conversation to extract actionable items.

## Your Task
Extract notes and todos that would be genuinely useful to the researcher.

## Guidelines
- NOTES: Observations, results, issues, troubleshooting discoveries, parameter values, experimental findings
- TODOS: Follow-up actions, verifications, things to order, tests to run, safety checks
- Be selective - only extract truly useful items, not every minor detail
- Safety-critical items should be high priority todos
- Expired reagents, concentration issues, equipment problems = high priority todos
- Combine related observations into single notes with bullet points
- Use clear, professional language

## Existing Items (avoid duplicates)
{existing_context}

## Conversation
Project: {project_name}

{formatted_messages}

## Response Format
Return a JSON object with this exact structure (no markdown, just JSON):
{{"notes": [{{"title": "string", "content": "string with bullet points"}}], "todos": [{{"content": "string", "priority": "normal or high"}}]}}

Only include items that are genuinely useful. If nothing notable was discussed, return empty arrays."""


async def analyze_conversation(
    session_id: str,
    project_id: str,
    project_name: str = "Unknown Project",
) -> ExtractionResult:
    """
    Analyze a conversation session and extract notes/todos.

    Args:
        session_id: The UUID of the conversation session to analyze
        project_id: The UUID of the project
        project_name: Name of the project for context

    Returns:
        ExtractionResult containing extracted notes and todos
    """
    import json

    session_uuid = UUID(session_id)
    project_uuid = UUID(project_id)

    async with get_session() as db_session:
        # Fetch conversation messages
        stmt = (
            select(ConversationMessage)
            .join(ConversationSession)
            .where(ConversationSession.id == session_uuid)
            .order_by(ConversationMessage.timestamp)
        )
        result = await db_session.execute(stmt)
        messages = result.scalars().all()

        if not messages:
            return ExtractionResult()

        # Format messages for the prompt
        formatted_messages = "\n".join(
            f"[{msg.source.value.upper()}]: {msg.content}" for msg in messages
        )

        # Fetch existing notes for context
        notes_stmt = (
            select(Note)
            .where(Note.project_id == project_uuid)
            .order_by(Note.created_at.desc())
            .limit(10)
        )
        notes_result = await db_session.execute(notes_stmt)
        existing_notes = notes_result.scalars().all()

        # Fetch existing todos for context
        todos_stmt = (
            select(Todo)
            .where(Todo.project_id == project_uuid)
            .order_by(Todo.created_at.desc())
            .limit(10)
        )
        todos_result = await db_session.execute(todos_stmt)
        existing_todos = todos_result.scalars().all()

        # Build existing context string
        if existing_notes or existing_todos:
            notes_context = (
                "Notes: " + ", ".join(n.title for n in existing_notes)
                if existing_notes
                else ""
            )
            todos_context = (
                "Todos: " + ", ".join(t.content[:50] for t in existing_todos)
                if existing_todos
                else ""
            )
            existing_context = f"{notes_context}\n{todos_context}".strip()
        else:
            existing_context = "None yet."

    # Build the prompt
    prompt = EXTRACTION_PROMPT.format(
        existing_context=existing_context,
        project_name=project_name,
        formatted_messages=formatted_messages,
    )

    # Call Claude for analysis
    client = get_anthropic_client()
    response = await client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}],
    )

    # Parse the response
    response_text = response.content[0].text.strip()

    # Handle potential markdown code block wrapping
    if response_text.startswith("```"):
        # Remove markdown code block
        lines = response_text.split("\n")
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        response_text = "\n".join(lines)

    try:
        data = json.loads(response_text)
        return ExtractionResult(
            notes=[ExtractedNote(**n) for n in data.get("notes", [])],
            todos=[ExtractedTodo(**t) for t in data.get("todos", [])],
        )
    except json.JSONDecodeError:
        # If parsing fails, return empty result
        return ExtractionResult()
