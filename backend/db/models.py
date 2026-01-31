from datetime import datetime
from enum import Enum
from uuid import UUID, uuid4

from sqlmodel import Field, Relationship, SQLModel


class MessageSource(str, Enum):
    """Source of a conversation message."""

    user = "user"
    assistant = "assistant"


class Project(SQLModel, table=True):
    """A project containing multiple conversation sessions."""

    __tablename__ = "projects"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    name: str = Field(max_length=255)
    description: str | None = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    sessions: list["ConversationSession"] = Relationship(
        back_populates="project",
        sa_relationship_kwargs={"cascade": "all, delete-orphan", "lazy": "selectin"},
    )


class ConversationMessage(SQLModel, table=True):
    """Individual message within a conversation session."""

    __tablename__ = "conversation_messages"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    session_id: UUID = Field(foreign_key="conversation_sessions.id", index=True)
    content: str
    source: MessageSource
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    session: "ConversationSession" = Relationship(back_populates="messages")


class ConversationSession(SQLModel, table=True):
    """A conversation session containing multiple messages."""

    __tablename__ = "conversation_sessions"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    project_id: UUID = Field(foreign_key="projects.id", index=True)
    agent_id: str = Field(index=True)
    started_at: datetime = Field(default_factory=datetime.utcnow)
    ended_at: datetime | None = None

    project: Project = Relationship(back_populates="sessions")
    messages: list[ConversationMessage] = Relationship(
        back_populates="session",
        sa_relationship_kwargs={"cascade": "all, delete-orphan", "lazy": "selectin"},
    )
