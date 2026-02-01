"use client"

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ui/conversation"
import { Message, MessageAvatar, MessageContent } from "@/components/ui/message"
import type { ConversationMessage } from "@/types/conversation"

interface ConversationPanelProps {
  messages: ConversationMessage[]
}

export function ConversationPanel({ messages }: ConversationPanelProps) {
  return (
    <Conversation className="flex-1 bg-card rounded-lg border border-border overflow-visible lg:overflow-y-auto">
      <ConversationContent className="p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <span className="text-2xl">🧪</span>
            </div>
            <h3 className="text-lg font-medium text-foreground mb-1">
              Ready to assist
            </h3>
            <p className="text-sm text-muted-foreground">
              Press the phone icon to start a conversation
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <Message key={msg.id} from={msg.source === "assistant" ? "assistant" : "user"}>
              <MessageAvatar
                src={msg.source === "user" ? "" : ""}
                name={msg.source === "user" ? "You" : "Labasi"}
              />
              <MessageContent
                variant={msg.source === "assistant" ? "flat" : "contained"}
              >
                {msg.content}
              </MessageContent>
            </Message>
          ))
        )}
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  )
}
