"use client"

import { useState } from "react"
import { Plus, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardAction,
  CardContent,
} from "@/components/ui/card"
import { NoteItem } from "./note-item"
import { createNote, deleteNote } from "@/lib/notes-api"
import type { Note } from "@/types/note"

interface NotesPanelProps {
  projectId: string
  notes: Note[]
  onNotesChange: (notes: Note[]) => void
  isLoading?: boolean
}

export function NotesPanel({
  projectId,
  notes,
  onNotesChange,
  isLoading,
}: NotesPanelProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [newContent, setNewContent] = useState("")

  const handleAdd = async () => {
    if (!newTitle.trim()) return

    try {
      const note = await createNote(projectId, newTitle.trim(), newContent.trim())
      onNotesChange([note, ...notes])
      setNewTitle("")
      setNewContent("")
      setIsAdding(false)
    } catch (error) {
      console.error("Failed to create note:", error)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteNote(id)
      onNotesChange(notes.filter((n) => n.id !== id))
    } catch (error) {
      console.error("Failed to delete note:", error)
    }
  }

  const handleCancel = () => {
    setNewTitle("")
    setNewContent("")
    setIsAdding(false)
  }

  return (
    <Card className="py-4 gap-3">
      <CardHeader className="px-4 py-0">
        <CardTitle className="text-sm flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Notes
        </CardTitle>
        <CardAction>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setIsAdding(true)}
            disabled={isAdding}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent className="px-3 py-0">
        {isAdding && (
          <div className="mb-3 p-3 border border-border rounded-lg bg-secondary/20">
            <input
              type="text"
              placeholder="Note title..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full bg-transparent text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none mb-2"
              autoFocus
            />
            <textarea
              placeholder="Note content..."
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              rows={3}
              className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none resize-none"
            />
            <div className="flex justify-end gap-2 mt-2">
              <Button variant="ghost" size="xs" onClick={handleCancel}>
                Cancel
              </Button>
              <Button
                size="xs"
                onClick={handleAdd}
                disabled={!newTitle.trim()}
              >
                Add
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {isLoading ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              Loading notes...
            </p>
          ) : notes.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              No notes yet. Click + to add one.
            </p>
          ) : (
            notes.map((note) => (
              <NoteItem key={note.id} note={note} onDelete={handleDelete} />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
