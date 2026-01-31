"use client"

import { useState, useEffect } from "react"
import { LabasiHeader } from "./labasi-header"
import { TranscriptCard } from "./transcript-card"
import { getAllSessions, deleteSession } from "@/lib/conversation-db"
import type { ConversationSession } from "@/types/conversation"

export function TranscriptsView() {
  const [sessions, setSessions] = useState<ConversationSession[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadSessions()
  }, [])

  const loadSessions = async () => {
    try {
      const allSessions = await getAllSessions()
      setSessions(allSessions)
    } catch (error) {
      console.error("Failed to load sessions:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteSession(id)
      setSessions((prev) => prev.filter((s) => s.id !== id))
    } catch (error) {
      console.error("Failed to delete session:", error)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <LabasiHeader />

      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Past Conversations
          </h2>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-muted-foreground">Loading...</div>
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No conversations yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Start a voice conversation to see transcripts here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <TranscriptCard
                  key={session.id}
                  session={session}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
