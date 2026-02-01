"use client"

import { useState, useCallback, useEffect } from "react"
import { LabasiHeader } from "./labasi-header"
import { ProjectSidebar } from "./project-sidebar"
import { ConversationPanel } from "./conversation-panel"
import { ConversationBar } from "@/components/ui/conversation-bar"
import { useConversationDB } from "@/lib/use-conversation-db"
import { getProject } from "@/lib/project-api"
import type { ConversationMessage } from "@/types/conversation"
import type { Project } from "@/types/project"

interface LabasiAssistantProps {
  agentId: string
  projectId: string
}

export function LabasiAssistant({ agentId, projectId }: LabasiAssistantProps) {
  const [messages, setMessages] = useState<ConversationMessage[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [status, setStatus] = useState("disconnected")
  const [project, setProject] = useState<Project | null>(null)
  const [sidebarRefreshKey, setSidebarRefreshKey] = useState(0)

  const { startSession, saveMessage, endSession } = useConversationDB()

  useEffect(() => {
    getProject(projectId).then((p) => {
      if (p) setProject(p)
    })
  }, [projectId])

  const handleConnect = useCallback(() => {
    setIsConnected(true)
    setStatus("connected")
    startSession(agentId, projectId)
  }, [agentId, projectId, startSession])

  const handleDisconnect = useCallback(() => {
    setIsConnected(false)
    setStatus("disconnected")
    endSession()
  }, [endSession])

  const handleMessage = useCallback(
    (message: { source: "user" | "ai"; message: string }) => {
      const newMessage: ConversationMessage = {
        id: crypto.randomUUID(),
        content: message.message,
        source: message.source === "ai" ? "assistant" : "user",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, newMessage])
      saveMessage(newMessage)

      // Refresh sidebar after agent messages (agent may have modified notes/todos)
      if (message.source === "ai") {
        setSidebarRefreshKey((prev) => prev + 1)
      }
    },
    [saveMessage]
  )

  const handleError = useCallback((error: Error) => {
    console.error("Conversation error:", error)
    setStatus("error")
  }, [])

  return (
    <div className="flex flex-col h-screen bg-background">
      <LabasiHeader
        projectId={projectId}
        projectName={project?.name}
      />

      {/* Main content area */}
      <main className="flex-1 flex flex-col lg:flex-row gap-6 p-6 overflow-auto lg:overflow-hidden">
        {/* Conversation panel */}
        <div className="min-h-[300px] lg:min-h-0 lg:w-96 lg:overflow-hidden flex flex-col order-2 lg:order-1">
          <ConversationPanel messages={messages} />
        </div>

        {/* Sidebar with logbook and note detail */}
        <div className="min-h-[400px] lg:min-h-0 flex-1 order-1 lg:order-2 lg:overflow-hidden">
          <ProjectSidebar projectId={projectId} refreshKey={sidebarRefreshKey} />
        </div>
      </main>

      {/* Fixed conversation bar at bottom */}
      <div className="border-t border-border bg-background">
        <ConversationBar
          agentId={agentId}
          projectId={projectId}
          projectName={project?.name}
          onConnect={handleConnect}
          onDisconnect={handleDisconnect}
          onMessage={handleMessage}
          onError={handleError}
          className="max-w-4xl mx-auto"
        />
      </div>
    </div>
  )
}
