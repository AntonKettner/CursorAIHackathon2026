export interface ConversationMessage {
  id: string
  content: string
  source: "user" | "assistant"
  timestamp: Date
}

export interface ConversationSession {
  id: string
  projectId: string
  agentId: string
  startedAt: Date
  endedAt?: Date
  messages: ConversationMessage[]
}

export type AgentState = null | "thinking" | "listening" | "talking"
