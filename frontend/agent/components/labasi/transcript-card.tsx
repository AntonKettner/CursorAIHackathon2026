"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, Trash2, MessageSquare, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { ConversationSession } from "@/types/conversation"

interface TranscriptCardProps {
  session: ConversationSession
  onDelete: (id: string) => void
}

export function TranscriptCard({ session, onDelete }: TranscriptCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(date)
  }

  const formatDuration = (start: Date, end?: Date) => {
    if (!end) return "In progress"
    const diffMs = end.getTime() - start.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1) return "< 1 min"
    if (diffMins === 1) return "1 min"
    return `${diffMins} mins`
  }

  const getPreview = () => {
    const firstMessage = session.messages[0]
    if (!firstMessage) return "No messages"
    const preview = firstMessage.content.slice(0, 100)
    return preview.length < firstMessage.content.length ? `${preview}...` : preview
  }

  return (
    <div className="border border-border rounded-lg bg-card overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-secondary/30 transition-colors"
      >
        <div className="flex items-center gap-4 text-left">
          <div>
            <p className="text-sm font-medium text-foreground">
              {formatDate(session.startedAt)}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{getPreview()}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />
              {session.messages.length}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDuration(session.startedAt, session.endedAt)}
            </span>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-border">
          <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
            {session.messages.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No messages in this session
              </p>
            ) : (
              session.messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex",
                    message.source === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[80%] px-3 py-2 rounded-lg text-sm",
                      message.source === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-foreground"
                    )}
                  >
                    {message.content}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="border-t border-border px-4 py-2 flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(session.id)
              }}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
