import type { Note } from "@/types/note"

const API_BASE = "/api/notes"

export async function getNotes(projectId: string): Promise<Note[]> {
  const response = await fetch(`${API_BASE}?projectId=${projectId}`)

  if (!response.ok) {
    throw new Error("Failed to fetch notes")
  }

  const data = await response.json()

  return data.map(
    (note: {
      id: string
      projectId: string
      title: string
      content: string
      createdAt: string
      modified?: Array<string | { modifiedAt: string }>
    }) => ({
      id: note.id,
      projectId: note.projectId,
      title: note.title,
      content: note.content,
      createdAt: new Date(note.createdAt),
      modified: (note.modified || [])
        .map((d) => {
          // Handle both string dates and { modifiedAt: string } objects
          const dateStr = typeof d === "string" ? d : d?.modifiedAt
          return dateStr ? new Date(dateStr) : null
        })
        .filter((d): d is Date => d !== null && !isNaN(d.getTime())),
    })
  )
}

export async function createNote(
  projectId: string,
  title: string,
  content: string
): Promise<Note> {
  const response = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projectId, title, content }),
  })

  if (!response.ok) {
    throw new Error("Failed to create note")
  }

  const data = await response.json()

  return {
    id: data.id,
    projectId: data.projectId,
    title: data.title,
    content: data.content,
    createdAt: new Date(data.createdAt),
    modified: (data.modified || [])
      .map((d: string | { modifiedAt: string }) => {
        const dateStr = typeof d === "string" ? d : d?.modifiedAt
        return dateStr ? new Date(dateStr) : null
      })
      .filter((d: Date | null): d is Date => d !== null && !isNaN(d.getTime())),
  }
}

export async function updateNote(
  id: string,
  updates: { title?: string; content?: string }
): Promise<Note> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  })

  if (!response.ok) {
    throw new Error("Failed to update note")
  }

  const data = await response.json()

  return {
    id: data.id,
    projectId: data.projectId,
    title: data.title,
    content: data.content,
    createdAt: new Date(data.createdAt),
    modified: (data.modified || [])
      .map((d: string | { modifiedAt: string }) => {
        const dateStr = typeof d === "string" ? d : d?.modifiedAt
        return dateStr ? new Date(dateStr) : null
      })
      .filter((d: Date | null): d is Date => d !== null && !isNaN(d.getTime())),
  }
}

export async function deleteNote(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: "DELETE",
  })

  if (!response.ok) {
    throw new Error("Failed to delete note")
  }
}
