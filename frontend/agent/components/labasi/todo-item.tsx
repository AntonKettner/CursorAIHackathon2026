"use client"

import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Todo } from "@/types/note"

interface TodoItemProps {
  todo: Todo
  onToggle: (id: string, status: "open" | "done") => void
  onDelete: (id: string) => void
}

export function TodoItem({ todo, onToggle, onDelete }: TodoItemProps) {
  const isDone = todo.status === "done"

  return (
    <div className="group flex items-start gap-2 px-3 py-2 hover:bg-secondary/30 rounded-lg transition-colors">
      <input
        type="checkbox"
        checked={isDone}
        onChange={() => onToggle(todo.id, isDone ? "open" : "done")}
        className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
      />
      <span
        className={cn(
          "flex-1 text-sm",
          isDone && "line-through text-muted-foreground"
        )}
      >
        {todo.content}
      </span>
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={() => onDelete(todo.id)}
        className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive hover:bg-destructive/10 transition-opacity"
      >
        <Trash2 className="w-3 h-3" />
      </Button>
    </div>
  )
}
