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


class CompoundMatch(BaseModel):
    """A single compound match with its properties and the search term that found it."""

    search_term: str = Field(description="The search term that found this compound.")
    cid: int = Field(description="The PubChem Compound ID.")
    title: str | None = Field(default=None, description="Common name of the compound.")
    iupac_name: str | None = Field(default=None, description="IUPAC systematic name.")
    molecular_formula: str | None = Field(
        default=None, description="Molecular formula."
    )
    molecular_weight: float | None = Field(
        default=None, description="Molecular weight in g/mol."
    )
    inchi_key: str | None = Field(default=None, description="InChIKey identifier.")


class CompoundLookupResult(BaseModel):
    """Result of a compound lookup with all matches from multiple search terms."""

    query: str = Field(description="The original query provided by the user.")
    search_terms_tried: list[str] = Field(
        description="All search term variations that were tried."
    )
    matches: list[CompoundMatch] = Field(
        description="All unique compounds found across all search terms. "
        "The LLM should examine these and pick the most relevant one based on context."
    )
    recommendation: str = Field(
        description="A note about which match is likely the intended compound, if determinable."
    )


def _generate_search_variations(query: str) -> list[str]:
    """Generate multiple search term variations for a compound query.

    Creates variations by:
    - Case changes (lower, title, upper)
    - Removing/adding common suffixes (dye, reagent, solution, etc.)
    - Hyphenation variants (spaces <-> hyphens)
    - Individual word extraction for multi-word queries
    - Stereochemistry prefix removal (D-, L-, etc.)
    - Common chemical synonyms
    """
    variations = []
    seen = set()

    def add_variation(v: str) -> None:
        v = v.strip()
        if v and v.lower() not in seen:
            variations.append(v)
            seen.add(v.lower())

    # Original query
    add_variation(query)

    # Case variations
    add_variation(query.lower())
    add_variation(query.upper())
    add_variation(query.title())

    # Hyphenation variants: "CY5 dye" <-> "CY5-dye"
    lower_query = query.lower()
    if " " in query:
        add_variation(query.replace(" ", "-"))
        add_variation(query.replace(" ", ""))
    if "-" in query:
        add_variation(query.replace("-", " "))
        add_variation(query.replace("-", ""))

    # Extract individual words for multi-word queries
    words = query.replace("-", " ").split()
    if len(words) >= 2:
        # Add each significant word (skip very short ones)
        for word in words:
            if len(word) >= 2:
                add_variation(word)
                add_variation(word.upper())
                add_variation(word.title())

    # Stereochemistry prefix removal
    for prefix in ["dl-", "d-", "l-", "(+)-", "(-)-", "(±)-", "r-", "s-"]:
        if lower_query.startswith(prefix):
            without_prefix = query[len(prefix) :]
            add_variation(without_prefix)

    return variations


async def _get_autocomplete_suggestions(
    client: httpx.AsyncClient, term: str
) -> list[str]:
    """Use PubChem's autocomplete API to get fuzzy-matched compound name suggestions."""
    url = f"https://pubchem.ncbi.nlm.nih.gov/rest/autocomplete/compound/{quote(term, safe='')}/json?limit=5"

    try:
        response = await client.get(url, timeout=10.0)
        if response.status_code != 200:
            return []
        data = response.json()

        # Autocomplete returns {"dictionary_terms": {"compound": ["name1", "name2", ...]}}
        dictionary_terms = data.get("dictionary_terms", {})
        suggestions = dictionary_terms.get("compound", [])
        return suggestions if isinstance(suggestions, list) else []
    except Exception:
        return []


async def _search_single_term(client: httpx.AsyncClient, term: str) -> list[int]:
    """Search PubChem for a single term and return CIDs."""
    path = f"/compound/name/{quote(term, safe='')}/cids/JSON"
    url = f"{PUBCHEM_BASE_URL}{path}"

    try:
        response = await client.get(url, timeout=15.0)
        if response.status_code == 404:
            return []
        response.raise_for_status()
        data = response.json()

        if "Fault" in data:
            return []

        identifier_list = data.get("IdentifierList", {})
        cids = identifier_list.get("CID", [])
        return cids if isinstance(cids, list) else []
    except Exception:
        return []


async def _fetch_properties_for_cids(
    client: httpx.AsyncClient, cids: list[int]
) -> dict[int, dict]:
    """Fetch properties for a list of CIDs."""
    if not cids:
        return {}

    cids_string = ",".join(str(cid) for cid in cids[:10])  # Limit to 10 CIDs
    properties = "Title,IUPACName,MolecularFormula,MolecularWeight,InChIKey"
    path = f"/compound/cid/{cids_string}/property/{properties}/JSON"
    url = f"{PUBCHEM_BASE_URL}{path}"

    try:
        response = await client.get(url, timeout=15.0)
        if response.status_code == 404:
            return {}
        response.raise_for_status()
        data = response.json()

        if "Fault" in data:
            return {}

        property_table = data.get("PropertyTable", {})
        compound_properties = property_table.get("Properties", [])

        return {props["CID"]: props for props in compound_properties}
    except Exception:
        return {}


@mcp.tool
async def search_compound(
    names: Annotated[
        list[str],
        Field(
            min_length=1,
            max_length=4,
            description="List of 1-4 possible compound names to search. Include variations like: "
            "common name, abbreviation, chemical name, trade name. "
            "Example: ['Cy5', 'cyanine 5', 'Cy5 dye'] or ['aspirin', 'acetylsalicylic acid']",
        ),
    ],
) -> CompoundLookupResult:
    """
    Search for chemical compounds in PubChem using multiple name variations.

    Provide 1-4 possible names for the compound (common name, abbreviation, chemical name, etc.).
    Each name is processed with fuzzy matching to find the best results.

    Returns all matching compounds with their properties (name, formula, molecular weight, etc.)
    so you can pick the most relevant one based on context.
    """
    import asyncio

    async with httpx.AsyncClient() as client:
        # Step 1: Generate search variations from ALL provided names
        all_variations = []
        seen_variations = set()
        for name in names:
            for variation in _generate_search_variations(name):
                if variation.lower() not in seen_variations:
                    all_variations.append(variation)
                    seen_variations.add(variation.lower())

        # Step 2: Run autocomplete on the original names for fuzzy matching
        autocomplete_tasks = [
            _get_autocomplete_suggestions(client, name) for name in names
        ]
        autocomplete_results = await asyncio.gather(*autocomplete_tasks)

        # Step 3: Combine all search terms
        all_search_terms = []
        seen = set()

        def add_term(term: str) -> None:
            lower = term.lower().strip()
            if lower and lower not in seen:
                all_search_terms.append(term.strip())
                seen.add(lower)

        # Add autocomplete suggestions first (best fuzzy matches)
        for suggestions in autocomplete_results:
            for suggestion in suggestions[:3]:  # Top 3 from each autocomplete
                add_term(suggestion)

        # Add all variations
        for term in all_variations:
            add_term(term)

        # Limit to reasonable number of searches
        search_terms = all_search_terms[:12]

        # Step 4: Search all terms in parallel
        search_tasks = [_search_single_term(client, term) for term in search_terms]
        search_results = await asyncio.gather(*search_tasks)

        # Collect all unique CIDs with the search term that found them
        cid_to_terms: dict[int, list[str]] = {}
        for term, cids in zip(search_terms, search_results, strict=True):
            for cid in cids[:3]:  # Limit results per term
                if cid not in cid_to_terms:
                    cid_to_terms[cid] = []
                cid_to_terms[cid].append(term)

        all_cids = list(cid_to_terms.keys())
        original_query = ", ".join(names)

        if not all_cids:
            # Collect all autocomplete suggestions for the error message
            all_suggestions = []
            for suggestions in autocomplete_results:
                all_suggestions.extend(suggestions[:2])

            suggestion_note = ""
            if all_suggestions:
                unique_suggestions = list(dict.fromkeys(all_suggestions))[:5]
                suggestion_note = f" PubChem suggested: {', '.join(unique_suggestions)}"

            return CompoundLookupResult(
                query=original_query,
                search_terms_tried=search_terms,
                matches=[],
                recommendation=f"No compounds found for '{original_query}'.{suggestion_note} "
                "Try different names or check the spelling.",
            )

        # Fetch properties for all found CIDs (limit to 15)
        properties = await _fetch_properties_for_cids(client, all_cids[:15])

        # Build matches
        matches = []
        for cid in all_cids[:15]:
            props = properties.get(cid, {})
            # Use the first search term that found this CID
            search_term = cid_to_terms[cid][0]
            matches.append(
                CompoundMatch(
                    search_term=search_term,
                    cid=cid,
                    title=props.get("Title"),
                    iupac_name=props.get("IUPACName"),
                    molecular_formula=props.get("MolecularFormula"),
                    molecular_weight=props.get("MolecularWeight"),
                    inchi_key=props.get("InChIKey"),
                )
            )

        # Generate recommendation
        if len(matches) == 1:
            recommendation = f"Found exactly one match: {matches[0].title or matches[0].iupac_name} (CID: {matches[0].cid})"
        elif len(matches) <= 3:
            recommendation = "Found multiple matches. Choose based on molecular weight and formula that fits your context."
        else:
            recommendation = f"Found {len(matches)} matches. The first few are most likely relevant. Choose based on your experimental context."

        return CompoundLookupResult(
            query=original_query,
            search_terms_tried=search_terms,
            matches=matches,
            recommendation=recommendation,
        )


# =============================================================================
# Note and Todo Tools
# =============================================================================

NoteOperation = Literal["add", "edit", "show"]
TodoOperation = Literal["add", "edit", "show"]


class NoteResult(BaseModel):
    """Result of a note operation - designed for LLM consumption."""

    status: str = Field(description="Short confirmation of the action taken.")
    instruction: str = Field(
        description="Instruction for LLM: respond with forward-thinking advice and a helpful comment."
    )


class NotesListResult(BaseModel):
    """Result of listing notes - designed for LLM consumption."""

    status: str = Field(description="Short confirmation of the action taken.")
    notes_summary: str = Field(description="Brief summary of notes for context.")
    instruction: str = Field(
        description="Instruction for LLM: respond with forward-thinking advice and a helpful comment."
    )


class TodoResult(BaseModel):
    """Result of a todo operation - designed for LLM consumption."""

    status: str = Field(description="Short confirmation of the action taken.")
    instruction: str = Field(
        description="Instruction for LLM: respond with forward-thinking advice and a helpful comment."
    )


class TodosListResult(BaseModel):
    """Result of listing todos - designed for LLM consumption."""

    status: str = Field(description="Short confirmation of the action taken.")
    todos_summary: str = Field(description="Brief summary of todos for context.")
    instruction: str = Field(
        description="Instruction for LLM: respond with forward-thinking advice and a helpful comment."
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
                status=f"✓ Noted: '{new_note.title}'",
                instruction="Respond with forward-thinking advice about next steps and a helpful comment related to this note.",
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
                status=f"✓ Updated: '{existing_note.title}'",
                instruction="Respond with forward-thinking advice about next steps and a helpful comment related to this update.",
            )

        elif operation == "show":
            statement = (
                select(Note)
                .where(Note.project_id == project_id)
                .order_by(Note.created_at.desc())
            )
            result = await session.execute(statement)
            notes = result.scalars().all()

            if not notes:
                notes_summary = "No notes found for this project."
            else:
                notes_summary = "\n".join(
                    f"• {n.title}: {n.content[:100]}{'...' if len(n.content) > 100 else ''}"
                    for n in notes
                )
            return NotesListResult(
                status=f"✓ Found {len(notes)} note(s)",
                notes_summary=notes_summary,
                instruction="Respond with forward-thinking advice based on these notes and a helpful comment.",
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
                status=f"✓ Added todo: '{new_todo.content[:50]}{'...' if len(new_todo.content) > 50 else ''}'",
                instruction="Respond with forward-thinking advice about prioritizing this task and a helpful comment.",
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

            status_msg = (
                "marked done" if existing_todo.status == TodoStatus.done else "updated"
            )
            return TodoResult(
                status=f"✓ Todo {status_msg}: '{existing_todo.content[:50]}{'...' if len(existing_todo.content) > 50 else ''}'",
                instruction="Respond with forward-thinking advice about next steps and a helpful comment.",
            )

        elif operation == "show":
            statement = select(Todo).where(Todo.project_id == project_id)

            if filter_status and filter_status != "all":
                statement = statement.where(Todo.status == TodoStatus(filter_status))

            statement = statement.order_by(Todo.created_at.desc())
            result = await session.execute(statement)
            todos = result.scalars().all()

            if not todos:
                todos_summary = "No todos found for this project."
            else:
                todos_summary = "\n".join(
                    f"{'✓' if t.status == TodoStatus.done else '○'} {t.content[:80]}{'...' if len(t.content) > 80 else ''}"
                    for t in todos
                )
            open_count = sum(1 for t in todos if t.status == TodoStatus.open)
            done_count = sum(1 for t in todos if t.status == TodoStatus.done)
            return TodosListResult(
                status=f"✓ Found {len(todos)} todo(s) ({open_count} open, {done_count} done)",
                todos_summary=todos_summary,
                instruction="Respond with forward-thinking advice about prioritizing these tasks and a helpful comment.",
            )

        raise ValueError(f"Invalid operation: {operation}")


if __name__ == "__main__":
    mcp.run(transport="http", host="0.0.0.0", port=8000)
