"use client"

import { useState, useMemo } from "react"
import { FileText, CheckCircle2, Circle, Trash2, BookOpen, ChevronRight, Plus, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardAction,
  CardContent,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { createNote } from "@/lib/notes-api"
import { createTodo, updateTodo, deleteTodo } from "@/lib/todos-api"
import type { Note, Todo } from "@/types/note"

type LogEvent =
  | { type: "note-created"; data: Note; timestamp: Date }
  | { type: "note-modified"; data: Note; timestamp: Date }
  | { type: "todo-created"; data: Todo; timestamp: Date }
  | { type: "todo-modified"; data: Todo; timestamp: Date }

interface LogbookPanelProps {
  projectId: string
  notes: Note[]
  todos: Todo[]
  onNotesChange: (notes: Note[]) => void
  onTodosChange: (todos: Todo[]) => void
  onNoteSelect: (note: Note) => void
  selectedNoteId?: string | null
  isLoading?: boolean
}

export function LogbookPanel({
  projectId,
  notes,
  todos,
  onNotesChange,
  onTodosChange,
  onNoteSelect,
  selectedNoteId,
  isLoading,
}: LogbookPanelProps) {
  const [addingType, setAddingType] = useState<"note" | "todo" | null>(null)
  const [newNoteTitle, setNewNoteTitle] = useState("")
  const [newNoteContent, setNewNoteContent] = useState("")
  const [newTodoContent, setNewTodoContent] = useState("")

  // Generate all log events from notes and todos
  const events = useMemo<LogEvent[]>(() => {
    const allEvents: LogEvent[] = []

    // Add note events
    for (const note of notes) {
      allEvents.push({
        type: "note-created",
        data: note,
        timestamp: note.createdAt,
      })
      for (const modifiedAt of note.modified) {
        allEvents.push({
          type: "note-modified",
          data: note,
          timestamp: modifiedAt,
        })
      }
    }

    // Add todo events
    for (const todo of todos) {
      allEvents.push({
        type: "todo-created",
        data: todo,
        timestamp: todo.createdAt,
      })
      for (const modifiedAt of todo.modified) {
        allEvents.push({
          type: "todo-modified",
          data: todo,
          timestamp: modifiedAt,
        })
      }
    }

    // Sort by timestamp (newest first)
    return allEvents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }, [notes, todos])

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(date)
  }

  const handleAddNote = async () => {
    if (!newNoteTitle.trim()) return
    try {
      const note = await createNote(projectId, newNoteTitle.trim(), newNoteContent.trim())
      onNotesChange([note, ...notes])
      setNewNoteTitle("")
      setNewNoteContent("")
      setAddingType(null)
      onNoteSelect(note)
    } catch (error) {
      console.error("Failed to create note:", error)
    }
  }

  const handleAddTodo = async () => {
    if (!newTodoContent.trim()) return
    try {
      const todo = await createTodo(projectId, newTodoContent.trim())
      onTodosChange([todo, ...todos])
      setNewTodoContent("")
      setAddingType(null)
    } catch (error) {
      console.error("Failed to create todo:", error)
    }
  }

  const handleToggleTodo = async (id: string, newStatus: "open" | "done") => {
    try {
      const updated = await updateTodo(id, { status: newStatus })
      onTodosChange(todos.map((t) => (t.id === id ? updated : t)))
    } catch (error) {
      console.error("Failed to update todo:", error)
    }
  }

  const handleDeleteTodo = async (id: string) => {
    try {
      await deleteTodo(id)
      onTodosChange(todos.filter((t) => t.id !== id))
    } catch (error) {
      console.error("Failed to delete todo:", error)
    }
  }

  const handleTodoKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleAddTodo()
    } else if (e.key === "Escape") {
      setNewTodoContent("")
      setAddingType(null)
    }
  }

  const handleCancelAdd = () => {
    setNewNoteTitle("")
    setNewNoteContent("")
    setNewTodoContent("")
    setAddingType(null)
  }

  return (
    <Card className="py-4 gap-3 flex-1 flex flex-col overflow-hidden max-h-[50vh] lg:max-h-none">
      <CardHeader className="px-4 py-0">
        <CardTitle className="text-sm flex items-center gap-2">
          <BookOpen className="w-4 h-4" />
          Logbook
        </CardTitle>
        <CardAction className="flex gap-1">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setAddingType("todo")}
            disabled={addingType !== null}
            title="Add task"
          >
            <CheckCircle2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setAddingType("note")}
            disabled={addingType !== null}
            title="Add note"
          >
            <FileText className="w-4 h-4" />
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent className="px-4 py-0 flex-1 overflow-hidden flex flex-col">
        {/* Add forms */}
        {addingType === "note" && (
          <div className="mb-4 p-3 border border-border rounded-lg bg-secondary/20">
            <input
              type="text"
              placeholder="Note title..."
              value={newNoteTitle}
              onChange={(e) => setNewNoteTitle(e.target.value)}
              className="w-full bg-transparent text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none mb-2"
              autoFocus
            />
            <textarea
              placeholder="Note content..."
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              rows={3}
              className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none resize-none"
            />
            <div className="flex justify-end gap-2 mt-2">
              <Button variant="ghost" size="xs" onClick={handleCancelAdd}>
                Cancel
              </Button>
              <Button size="xs" onClick={handleAddNote} disabled={!newNoteTitle.trim()}>
                Add Note
              </Button>
            </div>
          </div>
        )}

        {addingType === "todo" && (
          <div className="mb-4">
            <input
              type="text"
              placeholder="Add a task..."
              value={newTodoContent}
              onChange={(e) => setNewTodoContent(e.target.value)}
              onKeyDown={handleTodoKeyDown}
              className="w-full bg-secondary/20 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none px-3 py-2 rounded-lg border border-border"
              autoFocus
            />
            <p className="text-xs text-muted-foreground mt-1 px-1">
              Press Enter to add, Escape to cancel
            </p>
          </div>
        )}

        {/* Timeline */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <p className="text-xs text-muted-foreground text-center py-8">
              Loading logbook...
            </p>
          ) : events.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground mb-1">
                Your logbook is empty
              </p>
              <p className="text-xs text-muted-foreground">
                Add notes or tasks to start tracking
              </p>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />

              {/* Events */}
              <div className="space-y-1">
                {events.map((event, index) => (
                  <div key={`${event.data.id}-${event.type}-${index}`} className="relative pl-6">
                    {/* Timeline dot */}
                    <TimelineDot event={event} />

                    {/* Content */}
                    {event.type === "note-created" || event.type === "note-modified" ? (
                      <NoteEventEntry
                        event={event}
                        isSelected={selectedNoteId === event.data.id}
                        onSelect={() => onNoteSelect(event.data as Note)}
                        formatTime={formatTime}
                      />
                    ) : (
                      <TodoEventEntry
                        event={event}
                        onToggle={handleToggleTodo}
                        onDelete={handleDeleteTodo}
                        formatTime={formatTime}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function TimelineDot({ event }: { event: LogEvent }) {
  const isCreated = event.type === "note-created" || event.type === "todo-created"
  const isNote = event.type === "note-created" || event.type === "note-modified"
  const isTodoDone = (event.type === "todo-created" || event.type === "todo-modified") &&
    (event.data as Todo).status === "done"

  return (
    <div
      className={cn(
        "absolute left-0 top-2 w-[15px] h-[15px] rounded-full border-2 flex items-center justify-center",
        isNote
          ? "border-blue-500 bg-background"
          : isTodoDone
          ? "border-green-500 bg-green-500"
          : "border-amber-500 bg-background"
      )}
    >
      {isCreated ? (
        <Plus className={cn(
          "w-2 h-2",
          isNote ? "text-blue-500" : isTodoDone ? "text-white" : "text-amber-500"
        )} />
      ) : (
        <Pencil className={cn(
          "w-2 h-2",
          isNote ? "text-blue-500" : isTodoDone ? "text-white" : "text-amber-500"
        )} />
      )}
    </div>
  )
}

function NoteEventEntry({
  event,
  isSelected,
  onSelect,
  formatTime,
}: {
  event: LogEvent & { type: "note-created" | "note-modified" }
  isSelected: boolean
  onSelect: () => void
  formatTime: (date: Date) => string
}) {
  const note = event.data as Note
  const isCreated = event.type === "note-created"

  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full text-left rounded-lg p-2 -ml-1 transition-colors",
        isSelected
          ? "bg-blue-500/10 border border-blue-500/30"
          : "hover:bg-secondary/30"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <FileText className="w-3 h-3 text-blue-500 flex-shrink-0" />
            <span className="text-xs text-muted-foreground">
              {isCreated ? "Created" : "Modified"}
            </span>
            <span className="text-sm font-medium text-foreground truncate">
              {note.title}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <span className="text-xs text-muted-foreground">
            {formatTime(event.timestamp)}
          </span>
          <ChevronRight className="w-3 h-3 text-muted-foreground" />
        </div>
      </div>
    </button>
  )
}

function TodoEventEntry({
  event,
  onToggle,
  onDelete,
  formatTime,
}: {
  event: LogEvent & { type: "todo-created" | "todo-modified" }
  onToggle: (id: string, status: "open" | "done") => void
  onDelete: (id: string) => void
  formatTime: (date: Date) => string
}) {
  const todo = event.data as Todo
  const isDone = todo.status === "done"
  const isCreated = event.type === "todo-created"

  return (
    <div className="group flex items-start gap-2 hover:bg-secondary/30 rounded-lg p-2 -ml-1 transition-colors">
      <button
        onClick={() => onToggle(todo.id, isDone ? "open" : "done")}
        className="mt-0.5 flex-shrink-0"
      >
        {isDone ? (
          <CheckCircle2 className="w-4 h-4 text-green-500" />
        ) : (
          <Circle className="w-4 h-4 text-amber-500" />
        )}
      </button>
      <div className="flex-1 min-w-0">
        <span className="text-xs text-muted-foreground mr-2">
          {isCreated ? "Created" : "Updated"}
        </span>
        <span
          className={cn(
            "text-sm",
            isDone && "line-through text-muted-foreground"
          )}
        >
          {todo.content}
        </span>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <span className="text-xs text-muted-foreground">
          {formatTime(event.timestamp)}
        </span>
        {isCreated && (
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => onDelete(todo.id)}
            className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive hover:bg-destructive/10 transition-opacity"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        )}
      </div>
    </div>
  )
}
