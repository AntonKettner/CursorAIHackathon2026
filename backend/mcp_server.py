from contextlib import asynccontextmanager
from datetime import datetime
from typing import Annotated, Literal
from urllib.parse import quote
from uuid import UUID

import httpx
from fastmcp import FastMCP
from fastmcp.server.dependencies import get_http_headers
from pydantic import BaseModel, Field
from sqlmodel import select

from db import Note, Todo, TodoStatus, get_session, init_db


@asynccontextmanager
async def lifespan(app):
    """Initialize the database on server startup."""
    await init_db()
    yield


mcp = FastMCP("Labasi Server", lifespan=lifespan)


# =============================================================================
# Project Context via HTTP Headers
# =============================================================================
# The project_id is passed via custom HTTP header from ElevenLabs.
# In the ElevenLabs dashboard, configure the MCP server with:
#   Header: X-Project-ID
#   Value: {{project_id}}
#
# Tools can then call get_project_id() to retrieve it.
# =============================================================================

PROJECT_ID_HEADER = "x-project-id"


def get_project_id() -> str | None:
    """Get the project ID from the HTTP request headers."""
    headers = get_http_headers()
    return headers.get(PROJECT_ID_HEADER)


PUBCHEM_BASE_URL = "https://pubchem.ncbi.nlm.nih.gov/rest/pug"

# Available PubChem compound properties
PubchemCompoundProperty = Literal[
    "MolecularFormula",
    "MolecularWeight",
    "InChI",
    "InChIKey",
    "IUPACName",
    "Title",
    "XLogP",
    "ExactMass",
    "MonoisotopicMass",
    "TPSA",
    "Complexity",
    "Charge",
    "HBondDonorCount",
    "HBondAcceptorCount",
    "RotatableBondCount",
    "HeavyAtomCount",
    "CovalentUnitCount",
]


class PubchemSearchResult(BaseModel):
    """Result of a PubChem compound search."""

    cids: list[int] = Field(
        description="A list of matching PubChem Compound IDs (CIDs). "
        "This is often a single result but can be multiple for ambiguous names."
    )


class CompoundProperties(BaseModel):
    """Properties of a single PubChem compound."""

    CID: int = Field(description="The PubChem Compound ID.")
    MolecularFormula: str | None = None
    MolecularWeight: float | None = None
    InChI: str | None = None
    InChIKey: str | None = None
    IUPACName: str | None = None
    Title: str | None = None
    XLogP: float | None = None
    ExactMass: float | None = None
    MonoisotopicMass: float | None = None
    TPSA: float | None = None
    Complexity: float | None = None
    Charge: int | None = None
    HBondDonorCount: int | None = None
    HBondAcceptorCount: int | None = None
    RotatableBondCount: int | None = None
    HeavyAtomCount: int | None = None
    CovalentUnitCount: int | None = None


class PubchemCompoundPropertiesResult(BaseModel):
    """Result of fetching compound properties from PubChem."""

    results: list[CompoundProperties] = Field(
        description="A list of property results, with one object for each successfully retrieved CID."
    )


@mcp.tool
async def pubchem_search_compound_by_identifier(
    identifier_type: Annotated[
        Literal["name", "smiles", "inchikey"],
        Field(description="The type of chemical identifier being provided."),
    ],
    identifier: Annotated[
        str,
        Field(
            min_length=1,
            description="The identifier string. Examples: 'aspirin' for name, "
            "'CC(=O)Oc1ccccc1C(=O)O' for SMILES, or a valid InChIKey.",
        ),
    ],
) -> PubchemSearchResult:
    """
    Searches for PubChem Compound IDs (CIDs) using a common chemical identifier
    like a name (e.g., 'aspirin'), SMILES string, or InChIKey.

    This is the first step for most compound-related workflows.
    """
    path = f"/compound/{identifier_type}/{quote(identifier, safe='')}/cids/JSON"
    url = f"{PUBCHEM_BASE_URL}{path}"

    async with httpx.AsyncClient() as client:
        response = await client.get(url, timeout=30.0)

        if response.status_code == 404:
            # No compound found - return empty list
            return PubchemSearchResult(cids=[])

        response.raise_for_status()
        data = response.json()

    # Check for PubChem API fault
    if "Fault" in data:
        fault = data["Fault"]
        raise ValueError(f"PubChem API Fault: {fault.get('Message', 'Unknown error')}")

    # Extract CIDs from response
    identifier_list = data.get("IdentifierList", {})
    cids = identifier_list.get("CID", [])

    if not isinstance(cids, list):
        return PubchemSearchResult(cids=[])

    return PubchemSearchResult(cids=cids)


@mcp.tool
async def pubchem_fetch_compound_properties(
    cids: Annotated[
        list[int],
        Field(
            min_length=1,
            description="An array of one or more PubChem Compound IDs (CIDs) to fetch properties for. Must be positive integers.",
        ),
    ],
    properties: Annotated[
        list[PubchemCompoundProperty],
        Field(
            min_length=1,
            description="A list of physicochemical properties to retrieve for each CID.",
        ),
    ],
) -> PubchemCompoundPropertiesResult:
    """
    Fetches a list of specified physicochemical properties (e.g., MolecularWeight, XLogP)
    for one or more PubChem Compound IDs (CIDs). Essential for retrieving detailed
    chemical data in bulk.
    """
    cids_string = ",".join(str(cid) for cid in cids)
    properties_string = ",".join(properties)

    path = f"/compound/cid/{cids_string}/property/{properties_string}/JSON"
    url = f"{PUBCHEM_BASE_URL}{path}"

    async with httpx.AsyncClient() as client:
        response = await client.get(url, timeout=30.0)

        if response.status_code == 404:
            # No compounds found - return empty results
            return PubchemCompoundPropertiesResult(results=[])

        response.raise_for_status()
        data = response.json()

    # Check for PubChem API fault
    if "Fault" in data:
        fault = data["Fault"]
        raise ValueError(f"PubChem API Fault: {fault.get('Message', 'Unknown error')}")

    # Extract properties from response
    property_table = data.get("PropertyTable", {})
    compound_properties = property_table.get("Properties", [])

    if not compound_properties:
        raise ValueError(
            "Received an unexpected response format from PubChem API. Ensure CIDs are valid."
        )

    results = [CompoundProperties(**props) for props in compound_properties]
    return PubchemCompoundPropertiesResult(results=results)


# =============================================================================
# Note and Todo Tools
# =============================================================================

NoteOperation = Literal["add", "edit", "show"]
TodoOperation = Literal["add", "edit", "show"]


class NoteResult(BaseModel):
    """Result of a note operation."""

    id: str = Field(description="The UUID of the note.")
    operation: NoteOperation = Field(description="The operation that was performed.")
    title: str | None = Field(default=None, description="The title of the note.")
    content: str | None = Field(default=None, description="The content of the note.")


class NotesListResult(BaseModel):
    """Result of listing notes."""

    notes: list[NoteResult] = Field(description="List of notes.")
    operation: Literal["show"] = Field(
        default="show", description="The operation performed."
    )


class TodoResult(BaseModel):
    """Result of a todo operation."""

    id: str = Field(description="The UUID of the todo.")
    operation: TodoOperation = Field(description="The operation that was performed.")
    content: str | None = Field(default=None, description="The content of the todo.")
    status: str | None = Field(
        default=None, description="The status of the todo (open or done)."
    )


class TodosListResult(BaseModel):
    """Result of listing todos."""

    todos: list[TodoResult] = Field(description="List of todos.")
    operation: Literal["show"] = Field(
        default="show", description="The operation performed."
    )


@mcp.tool
async def note(
    operation: Annotated[
        NoteOperation,
        Field(
            description="The operation to perform: 'add' to create a new note, 'edit' to modify an existing note, 'show' to list notes."
        ),
    ],
    title: Annotated[
        str | None,
        Field(
            default=None,
            description="The title for the note. Required for 'add', optional for 'edit'.",
        ),
    ] = None,
    content: Annotated[
        str | None,
        Field(
            default=None,
            description="The content of the note as bullet points. Required for 'add', optional for 'edit'.",
        ),
    ] = None,
    note_id: Annotated[
        str | None,
        Field(
            default=None,
            description="The UUID of the note to edit. Required for 'edit' operation.",
        ),
    ] = None,
) -> NoteResult | NotesListResult:
    """
    Manage notes for a project. Use this to add, edit, or show notes.
    Compress user information into sensible bullet points with a clear title.

    The project_id is automatically retrieved from the HTTP headers (X-Project-ID).
    """
    project_id_str = get_project_id()
    if not project_id_str:
        raise ValueError(
            "Project ID not found in request headers. Ensure X-Project-ID header is set."
        )

    try:
        project_id = UUID(project_id_str)
    except ValueError:
        raise ValueError(f"Invalid project ID format: {project_id_str}") from None

    async with get_session() as session:
        if operation == "add":
            if not title:
                raise ValueError("Title is required for 'add' operation.")
            if not content:
                raise ValueError("Content is required for 'add' operation.")

            new_note = Note(
                project_id=project_id,
                title=title,
                content=content,
                modified=[],
            )
            session.add(new_note)
            await session.flush()
            await session.refresh(new_note)

            return NoteResult(
                id=str(new_note.id),
                operation="add",
                title=new_note.title,
                content=new_note.content,
            )

        elif operation == "edit":
            if not note_id:
                raise ValueError("note_id is required for 'edit' operation.")

            try:
                note_uuid = UUID(note_id)
            except ValueError:
                raise ValueError(f"Invalid note ID format: {note_id}") from None

            statement = select(Note).where(
                Note.id == note_uuid, Note.project_id == project_id
            )
            result = await session.execute(statement)
            existing_note = result.scalar_one_or_none()

            if not existing_note:
                raise ValueError(f"Note with ID {note_id} not found in this project.")

            # Add current state to modification history
            modified_history = existing_note.modified or []
            modified_history.append(
                {
                    "title": existing_note.title,
                    "content": existing_note.content,
                    "modifiedAt": datetime.utcnow().isoformat() + "Z",
                }
            )

            if title:
                existing_note.title = title
            if content:
                existing_note.content = content
            existing_note.modified = modified_history

            await session.flush()
            await session.refresh(existing_note)

            return NoteResult(
                id=str(existing_note.id),
                operation="edit",
                title=existing_note.title,
                content=existing_note.content,
            )

        elif operation == "show":
            statement = (
                select(Note)
                .where(Note.project_id == project_id)
                .order_by(Note.created_at.desc())
            )
            result = await session.execute(statement)
            notes = result.scalars().all()

            return NotesListResult(
                notes=[
                    NoteResult(
                        id=str(n.id),
                        operation="show",
                        title=n.title,
                        content=n.content,
                    )
                    for n in notes
                ]
            )

        raise ValueError(f"Invalid operation: {operation}")


@mcp.tool
async def todo(
    operation: Annotated[
        TodoOperation,
        Field(
            description="The operation to perform: 'add' to create a new todo, 'edit' to modify an existing todo (content or status), 'show' to list todos."
        ),
    ],
    content: Annotated[
        str | None,
        Field(
            default=None,
            description="The content of the todo. Required for 'add', optional for 'edit'.",
        ),
    ] = None,
    status: Annotated[
        Literal["open", "done"] | None,
        Field(
            default=None,
            description="The status of the todo. Use 'done' to mark as complete, 'open' to reopen. Optional for 'edit'.",
        ),
    ] = None,
    todo_id: Annotated[
        str | None,
        Field(
            default=None,
            description="The UUID of the todo to edit. Required for 'edit' operation.",
        ),
    ] = None,
    filter_status: Annotated[
        Literal["open", "done", "all"] | None,
        Field(
            default=None,
            description="Filter todos by status when using 'show'. Default shows all.",
        ),
    ] = None,
) -> TodoResult | TodosListResult:
    """
    Manage todos for a project. Use this to add, edit, or show todos.
    You can mark todos as done/open or edit their content.

    The project_id is automatically retrieved from the HTTP headers (X-Project-ID).
    """
    project_id_str = get_project_id()
    if not project_id_str:
        raise ValueError(
            "Project ID not found in request headers. Ensure X-Project-ID header is set."
        )

    try:
        project_id = UUID(project_id_str)
    except ValueError:
        raise ValueError(f"Invalid project ID format: {project_id_str}") from None

    async with get_session() as session:
        if operation == "add":
            if not content:
                raise ValueError("Content is required for 'add' operation.")

            new_todo = Todo(
                project_id=project_id,
                content=content,
                status=TodoStatus(status) if status else TodoStatus.open,
                modified=[],
            )
            session.add(new_todo)
            await session.flush()
            await session.refresh(new_todo)

            return TodoResult(
                id=str(new_todo.id),
                operation="add",
                content=new_todo.content,
                status=new_todo.status.value,
            )

        elif operation == "edit":
            if not todo_id:
                raise ValueError("todo_id is required for 'edit' operation.")

            try:
                todo_uuid = UUID(todo_id)
            except ValueError:
                raise ValueError(f"Invalid todo ID format: {todo_id}") from None

            statement = select(Todo).where(
                Todo.id == todo_uuid, Todo.project_id == project_id
            )
            result = await session.execute(statement)
            existing_todo = result.scalar_one_or_none()

            if not existing_todo:
                raise ValueError(f"Todo with ID {todo_id} not found in this project.")

            # Add current state to modification history
            modified_history = existing_todo.modified or []
            modified_history.append(
                {
                    "content": existing_todo.content,
                    "status": existing_todo.status.value,
                    "modifiedAt": datetime.utcnow().isoformat() + "Z",
                }
            )

            if content:
                existing_todo.content = content
            if status:
                existing_todo.status = TodoStatus(status)
            existing_todo.modified = modified_history

            await session.flush()
            await session.refresh(existing_todo)

            return TodoResult(
                id=str(existing_todo.id),
                operation="edit",
                content=existing_todo.content,
                status=existing_todo.status.value,
            )

        elif operation == "show":
            statement = select(Todo).where(Todo.project_id == project_id)

            if filter_status and filter_status != "all":
                statement = statement.where(Todo.status == TodoStatus(filter_status))

            statement = statement.order_by(Todo.created_at.desc())
            result = await session.execute(statement)
            todos = result.scalars().all()

            return TodosListResult(
                todos=[
                    TodoResult(
                        id=str(t.id),
                        operation="show",
                        content=t.content,
                        status=t.status.value,
                    )
                    for t in todos
                ]
            )

        raise ValueError(f"Invalid operation: {operation}")


if __name__ == "__main__":
    mcp.run(transport="http", host="0.0.0.0", port=8000)
