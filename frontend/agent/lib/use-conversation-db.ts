"use client"

import { useRef, useCallback } from "react"
import {
  saveSession,
  getSession,
  getAllSessions,
  addMessageToSession,
} from "./conversation-db"
import type { ConversationMessage, ConversationSession } from "@/types/conversation"

export function useConversationDB() {
  const currentSessionIdRef = useRef<string | null>(null)

  const startSession = useCallback((agentId: string): string => {
    const sessionId = crypto.randomUUID()
    currentSessionIdRef.current = sessionId

    const session: ConversationSession = {
      id: sessionId,
      agentId,
      startedAt: new Date(),
      messages: [],
    }

    // Save initial session asynchronously
    saveSession(session).catch((error) => {
      console.error("Failed to save session:", error)
    })

    return sessionId
  }, [])

  const saveMessage = useCallback((message: ConversationMessage): void => {
    const sessionId = currentSessionIdRef.current
    if (!sessionId) {
      console.warn("No active session to save message to")
      return
    }

    addMessageToSession(sessionId, message).catch((error) => {
      console.error("Failed to save message:", error)
    })
  }, [])

  const endSession = useCallback((): void => {
    const sessionId = currentSessionIdRef.current
    if (!sessionId) return

    getSession(sessionId)
      .then((session) => {
        if (session) {
          session.endedAt = new Date()
          return saveSession(session)
        }
      })
      .catch((error) => {
        console.error("Failed to end session:", error)
      })
      .finally(() => {
        currentSessionIdRef.current = null
      })
  }, [])

  const loadSessions = useCallback((): Promise<ConversationSession[]> => {
    return getAllSessions()
  }, [])

  return {
    startSession,
    saveMessage,
    endSession,
    loadSessions,
  }
}
