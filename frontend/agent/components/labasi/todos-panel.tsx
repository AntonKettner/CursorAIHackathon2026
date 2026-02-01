"use client"

import { useState } from "react"
import { Plus, ListTodo } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardAction,
  CardContent,
} from "@/components/ui/card"
import { TodoItem } from "./todo-item"
import { createTodo, updateTodo, deleteTodo } from "@/lib/todos-api"
import type { Todo } from "@/types/note"

interface TodosPanelProps {
  projectId: string
  todos: Todo[]
  onTodosChange: (todos: Todo[]) => void
  isLoading?: boolean
}

export function TodosPanel({
  projectId,
  todos,
  onTodosChange,
  isLoading,
}: TodosPanelProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [newContent, setNewContent] = useState("")

  const openTodos = todos.filter((t) => t.status === "open")
  const doneTodos = todos.filter((t) => t.status === "done")

  const handleAdd = async () => {
    if (!newContent.trim()) return

    try {
      const todo = await createTodo(projectId, newContent.trim())
      onTodosChange([todo, ...todos])
      setNewContent("")
      setIsAdding(false)
    } catch (error) {
      console.error("Failed to create todo:", error)
    }
  }

  const handleToggle = async (id: string, newStatus: "open" | "done") => {
    try {
      const updated = await updateTodo(id, { status: newStatus })
      onTodosChange(todos.map((t) => (t.id === id ? updated : t)))
    } catch (error) {
      console.error("Failed to update todo:", error)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteTodo(id)
      onTodosChange(todos.filter((t) => t.id !== id))
    } catch (error) {
      console.error("Failed to delete todo:", error)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleAdd()
    } else if (e.key === "Escape") {
      setNewContent("")
      setIsAdding(false)
    }
  }

  return (
    <Card className="py-4 gap-3">
      <CardHeader className="px-4 py-0">
        <CardTitle className="text-sm flex items-center gap-2">
          <ListTodo className="w-4 h-4" />
          Tasks
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

      <CardContent className="px-1 py-0">
        {isAdding && (
          <div className="mx-2 mb-2">
            <input
              type="text"
              placeholder="Add a task..."
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full bg-secondary/20 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none px-3 py-2 rounded-lg border border-border"
              autoFocus
            />
          </div>
        )}

        <div className="max-h-64 overflow-y-auto">
          {isLoading ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              Loading tasks...
            </p>
          ) : todos.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              No tasks yet. Click + to add one.
            </p>
          ) : (
            <>
              {openTodos.map((todo) => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                />
              ))}
              {doneTodos.length > 0 && openTodos.length > 0 && (
                <div className="mx-3 my-2 border-t border-border" />
              )}
              {doneTodos.map((todo) => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                />
              ))}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
