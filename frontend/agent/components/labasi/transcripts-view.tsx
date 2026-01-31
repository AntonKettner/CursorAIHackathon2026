"use client"

import { useState, useEffect } from "react"
import { LabasiHeader } from "./labasi-header"
import { TranscriptCard } from "./transcript-card"
import { getAllSessions, deleteSession } from "@/lib/conversation-api"
import { getProject } from "@/lib/project-api"
import type { ConversationSession } from "@/types/conversation"
import type { Project } from "@/types/project"

interface TranscriptsViewProps {
  projectId: string
}

export function TranscriptsView({ projectId }: TranscriptsViewProps) {
  const [sessions, setSessions] = useState<ConversationSession[]>([])
  const [project, setProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [projectId])

  const loadData = async () => {
    try {
      const [allSessions, projectData] = await Promise.all([
        getAllSessions(projectId),
        getProject(projectId),
      ])
      setSessions(allSessions)
      if (projectData) setProject(projectData)
    } catch (error) {
      console.error("Failed to load data:", error)
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
      <LabasiHeader projectId={projectId} projectName={project?.name} />

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
