"use client"

import { FileText, X, Trash2, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardAction,
  CardContent,
} from "@/components/ui/card"
import type { Note } from "@/types/note"

interface NoteDetailPanelProps {
  note: Note | null
  onClose: () => void
  onDelete: (id: string) => void
}

export function NoteDetailPanel({ note, onClose, onDelete }: NoteDetailPanelProps) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(date)
  }

  if (!note) {
    return (
      <Card className="py-4 gap-3 flex-1 flex flex-col overflow-hidden max-h-[40vh] lg:max-h-none">
        <CardHeader className="px-4 py-0">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Note
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 py-0 flex-1 flex items-center justify-center">
          <p className="text-sm text-muted-foreground text-center">
            Select a note from the logbook to view it here
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="py-4 gap-3 flex-1 flex flex-col overflow-hidden max-h-[40vh] lg:max-h-none">
      <CardHeader className="px-4 py-0">
        <CardTitle className="text-sm flex items-center gap-2 truncate">
          <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
          <span className="truncate">{note.title}</span>
        </CardTitle>
        <CardAction className="flex gap-1">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => onDelete(note.id)}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            title="Delete note"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onClose}
            title="Close"
          >
            <X className="w-4 h-4" />
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent className="px-4 py-0 flex-1 overflow-hidden flex flex-col">
        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
          <Calendar className="w-3 h-3" />
          {formatDate(note.createdAt)}
        </div>

        <div className="flex-1 overflow-y-auto">
          <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
            {note.content}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
