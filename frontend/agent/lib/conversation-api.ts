import type { ConversationMessage, ConversationSession } from "@/types/conversation"

const API_BASE = "/api/conversations"

export async function createSession(
  agentId: string,
  projectId: string
): Promise<ConversationSession> {
  const response = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ agentId, projectId }),
  })

  if (!response.ok) {
    throw new Error("Failed to create session")
  }

  const data = await response.json()

  return {
    id: data.id,
    projectId: data.projectId,
    agentId: data.agentId,
    startedAt: new Date(data.startedAt),
    messages: [],
  }
}

export async function getAllSessions(projectId?: string): Promise<ConversationSession[]> {
  const url = projectId ? `${API_BASE}?projectId=${projectId}` : API_BASE
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error("Failed to fetch sessions")
  }

  const data = await response.json()

  return data.map(
    (session: {
      id: string
      projectId: string
      agentId: string
      startedAt: string
      endedAt?: string
      messages: Array<{
        id: string
        content: string
        source: "user" | "assistant"
        timestamp: string
      }>
    }) => ({
      id: session.id,
      projectId: session.projectId,
      agentId: session.agentId,
      startedAt: new Date(session.startedAt),
      endedAt: session.endedAt ? new Date(session.endedAt) : undefined,
      messages: session.messages.map((m) => ({
        id: m.id,
        content: m.content,
        source: m.source,
        timestamp: new Date(m.timestamp),
      })),
    })
  )
}

export async function getSession(id: string): Promise<ConversationSession | undefined> {
  const response = await fetch(`${API_BASE}/${id}`)

  if (response.status === 404) {
    return undefined
  }

  if (!response.ok) {
    throw new Error("Failed to fetch session")
  }

  const data = await response.json()

  return {
    id: data.id,
    projectId: data.projectId,
    agentId: data.agentId,
    startedAt: new Date(data.startedAt),
    endedAt: data.endedAt ? new Date(data.endedAt) : undefined,
    messages: data.messages.map(
      (m: { id: string; content: string; source: "user" | "assistant"; timestamp: string }) => ({
        id: m.id,
        content: m.content,
        source: m.source,
        timestamp: new Date(m.timestamp),
      })
    ),
  }
}

export async function deleteSession(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: "DELETE",
  })

  if (!response.ok) {
    throw new Error("Failed to delete session")
  }
}

export async function addMessage(
  sessionId: string,
  message: Omit<ConversationMessage, "id" | "timestamp">
): Promise<{ id: string; timestamp: Date }> {
  const response = await fetch(`${API_BASE}/${sessionId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content: message.content,
      source: message.source,
    }),
  })

  if (!response.ok) {
    throw new Error("Failed to add message")
  }

  const data = await response.json()

  return {
    id: data.id,
    timestamp: new Date(data.timestamp),
  }
}

export async function endSession(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/${id}/end`, {
    method: "POST",
  })

  if (!response.ok) {
    throw new Error("Failed to end session")
  }
}
