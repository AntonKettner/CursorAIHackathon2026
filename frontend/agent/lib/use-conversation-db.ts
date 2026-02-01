"use client"

import { useRef, useCallback } from "react"
import {
  createSession,
  getAllSessions,
  addMessage,
  endSession as endSessionApi,
} from "./conversation-api"
import type { ConversationMessage, ConversationSession } from "@/types/conversation"

export function useConversationDB() {
  const currentSessionIdRef = useRef<string | null>(null)

  const startSession = useCallback((agentId: string, projectId: string): string => {
    // Generate a temporary ID for immediate return
    const tempId = crypto.randomUUID()
    currentSessionIdRef.current = tempId

    // Create session in database asynchronously, update ref with real ID
    createSession(agentId, projectId)
      .then((session) => {
        currentSessionIdRef.current = session.id
      })
      .catch((error) => {
        console.error("Failed to create session:", error)
      })

    return tempId
  }, [])

  const saveMessage = useCallback((message: ConversationMessage): void => {
    const sessionId = currentSessionIdRef.current
    if (!sessionId) {
      console.warn("No active session to save message to")
      return
    }

    addMessage(sessionId, {
      content: message.content,
      source: message.source,
    }).catch((error) => {
      console.error("Failed to save message:", error)
    })
  }, [])

  const endSession = useCallback((projectId?: string, onAnalysisComplete?: () => void): void => {
    const sessionId = currentSessionIdRef.current
    if (!sessionId) return

    endSessionApi(sessionId)
      .then(() => {
        // Fire-and-forget analysis after session ends
        if (projectId) {
          fetch("/api/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId, projectId }),
          })
            .then((response) => response.json())
            .then((data) => {
              if (data.success && onAnalysisComplete) {
                onAnalysisComplete()
              }
            })
            .catch((error) => {
              console.error("Failed to trigger analysis:", error)
            })
        }
      })
      .catch((error) => {
        console.error("Failed to end session:", error)
      })
      .finally(() => {
        currentSessionIdRef.current = null
      })
  }, [])

  const loadSessions = useCallback((projectId?: string): Promise<ConversationSession[]> => {
    return getAllSessions(projectId)
  }, [])

  return {
    startSession,
    saveMessage,
    endSession,
    loadSessions,
  }
}
