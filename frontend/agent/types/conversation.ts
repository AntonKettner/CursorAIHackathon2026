export interface ConversationMessage {
  id: string
  content: string
  source: "user" | "assistant"
  timestamp: Date
}

export type AgentState = null | "thinking" | "listening" | "talking"
