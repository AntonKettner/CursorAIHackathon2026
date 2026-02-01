"use client"

import { useState, useCallback, useEffect } from "react"
import { LabasiHeader } from "./labasi-header"
import { LabasiOrb } from "./labasi-orb"
import { ConversationPanel } from "./conversation-panel"
import { ConversationBar } from "@/components/ui/conversation-bar"
import { useConversationDB } from "@/lib/use-conversation-db"
import { getProject } from "@/lib/project-api"
import type { ConversationMessage, AgentState } from "@/types/conversation"
import type { Project } from "@/types/project"

interface LabasiAssistantProps {
  agentId: string
  projectId: string
}

export function LabasiAssistant({ agentId, projectId }: LabasiAssistantProps) {
  const [messages, setMessages] = useState<ConversationMessage[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [status, setStatus] = useState("disconnected")
  const [agentState, setAgentState] = useState<AgentState>(null)
  const [project, setProject] = useState<Project | null>(null)

  const { startSession, saveMessage, endSession } = useConversationDB()

  useEffect(() => {
    getProject(projectId).then((p) => {
      if (p) setProject(p)
    })
  }, [projectId])

  const handleConnect = useCallback(() => {
    setIsConnected(true)
    setStatus("connected")
    setAgentState("listening")
    startSession(agentId, projectId)
  }, [agentId, projectId, startSession])

  const handleDisconnect = useCallback(() => {
    setIsConnected(false)
    setStatus("disconnected")
    setAgentState(null)
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

      // Update agent state based on who is speaking
      if (message.source === "ai") {
        setAgentState("talking")
        // Reset to listening after a short delay
        setTimeout(() => setAgentState("listening"), 500)
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
      <main className="flex-1 flex flex-col lg:flex-row gap-6 p-6 overflow-hidden">
        {/* Conversation panel */}
        <div className="flex-1 lg:max-w-xl overflow-hidden flex flex-col order-2 lg:order-1">
          <ConversationPanel messages={messages} />
        </div>

        {/* Orb section */}
        <div className="flex items-center justify-center lg:w-64 order-1 lg:order-2">
          <LabasiOrb
            agentState={agentState}
            className="w-40 h-40 lg:w-56 lg:h-56"
          />
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
