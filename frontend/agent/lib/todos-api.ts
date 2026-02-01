import type { Todo } from "@/types/note"

const API_BASE = "/api/todos"

export async function getTodos(projectId: string): Promise<Todo[]> {
  const response = await fetch(`${API_BASE}?projectId=${projectId}`)

  if (!response.ok) {
    throw new Error("Failed to fetch todos")
  }

  const data = await response.json()

  return data.map(
    (todo: {
      id: string
      projectId: string
      content: string
      createdAt: string
      status: "open" | "done"
      modified?: Array<string | { modifiedAt: string }>
    }) => ({
      id: todo.id,
      projectId: todo.projectId,
      content: todo.content,
      createdAt: new Date(todo.createdAt),
      status: todo.status,
      modified: (todo.modified || [])
        .map((d) => {
          const dateStr = typeof d === "string" ? d : d?.modifiedAt
          return dateStr ? new Date(dateStr) : null
        })
        .filter((d: Date | null): d is Date => d !== null && !isNaN(d.getTime())),
    })
  )
}

export async function createTodo(
  projectId: string,
  content: string
): Promise<Todo> {
  const response = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projectId, content }),
  })

  if (!response.ok) {
    throw new Error("Failed to create todo")
  }

  const data = await response.json()

  return {
    id: data.id,
    projectId: data.projectId,
    content: data.content,
    createdAt: new Date(data.createdAt),
    status: data.status,
    modified: (data.modified || [])
      .map((d: string | { modifiedAt: string }) => {
        const dateStr = typeof d === "string" ? d : d?.modifiedAt
        return dateStr ? new Date(dateStr) : null
      })
      .filter((d: Date | null): d is Date => d !== null && !isNaN(d.getTime())),
  }
}

export async function updateTodo(
  id: string,
  updates: { content?: string; status?: "open" | "done" }
): Promise<Todo> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  })

  if (!response.ok) {
    throw new Error("Failed to update todo")
  }

  const data = await response.json()

  return {
    id: data.id,
    projectId: data.projectId,
    content: data.content,
    createdAt: new Date(data.createdAt),
    status: data.status,
    modified: (data.modified || [])
      .map((d: string | { modifiedAt: string }) => {
        const dateStr = typeof d === "string" ? d : d?.modifiedAt
        return dateStr ? new Date(dateStr) : null
      })
      .filter((d: Date | null): d is Date => d !== null && !isNaN(d.getTime())),
  }
}

export async function deleteTodo(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: "DELETE",
  })

  if (!response.ok) {
    throw new Error("Failed to delete todo")
  }
}
