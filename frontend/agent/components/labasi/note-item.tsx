"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Note } from "@/types/note"

interface NoteItemProps {
  note: Note
  onDelete: (id: string) => void
}

export function NoteItem({ note, onDelete }: NoteItemProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const getPreview = () => {
    const preview = note.content.slice(0, 80)
    return preview.length < note.content.length ? `${preview}...` : preview
  }

  return (
    <div className="border border-border rounded-lg bg-card overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 py-2 flex items-center justify-between hover:bg-secondary/30 transition-colors text-left"
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {note.title}
          </p>
          {!isExpanded && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {getPreview()}
            </p>
          )}
        </div>
        <div className="ml-2 flex-shrink-0">
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-border">
          <div className="p-3">
            <p className="text-sm text-foreground whitespace-pre-wrap">
              {note.content}
            </p>
          </div>
          <div className="border-t border-border px-3 py-2 flex justify-end">
            <Button
              variant="ghost"
              size="xs"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(note.id)
              }}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Delete
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
