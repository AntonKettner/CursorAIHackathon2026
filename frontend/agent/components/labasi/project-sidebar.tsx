"use client"

import { useState, useEffect } from "react"
import { LogbookPanel } from "./logbook-panel"
import { NoteDetailPanel } from "./note-detail-panel"
import { getNotes, deleteNote } from "@/lib/notes-api"
import { getTodos } from "@/lib/todos-api"
import type { Note, Todo } from "@/types/note"

interface ProjectSidebarProps {
  projectId: string
  refreshKey?: number
}

export function ProjectSidebar({ projectId, refreshKey }: ProjectSidebarProps) {
  const [notes, setNotes] = useState<Note[]>([])
  const [todos, setTodos] = useState<Todo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const [notesData, todosData] = await Promise.all([
          getNotes(projectId),
          getTodos(projectId),
        ])
        setNotes(notesData)
        setTodos(todosData)

        // Update selected note if it was refreshed
        if (selectedNote) {
          const updated = notesData.find((n) => n.id === selectedNote.id)
          if (updated) {
            setSelectedNote(updated)
          } else {
            setSelectedNote(null)
          }
        }
      } catch (error) {
        console.error("Failed to fetch sidebar data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [projectId, refreshKey])

  const handleNoteSelect = (note: Note) => {
    setSelectedNote(note)
  }

  const handleNoteClose = () => {
    setSelectedNote(null)
  }

  const handleNoteDelete = async (id: string) => {
    try {
      await deleteNote(id)
      setNotes(notes.filter((n) => n.id !== id))
      if (selectedNote?.id === id) {
        setSelectedNote(null)
      }
    } catch (error) {
      console.error("Failed to delete note:", error)
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full overflow-hidden">
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <LogbookPanel
          projectId={projectId}
          notes={notes}
          todos={todos}
          onNotesChange={setNotes}
          onTodosChange={setTodos}
          onNoteSelect={handleNoteSelect}
          selectedNoteId={selectedNote?.id}
          isLoading={isLoading}
        />
      </div>
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <NoteDetailPanel
          note={selectedNote}
          onClose={handleNoteClose}
          onDelete={handleNoteDelete}
        />
      </div>
    </div>
  )
}
