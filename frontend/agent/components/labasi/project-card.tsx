"use client"

import Link from "next/link"
import { MessageSquare, Calendar } from "lucide-react"
import type { Project } from "@/types/project"

interface ProjectCardProps {
  project: Project
}

export function ProjectCard({ project }: ProjectCardProps) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date)
  }

  return (
    <Link href={`/projects/${project.id}`}>
      <div className="border border-border rounded-lg bg-card p-5 hover:bg-secondary/30 transition-colors cursor-pointer h-full flex flex-col">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-foreground mb-2 line-clamp-1">
            {project.name}
          </h3>
          {project.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
              {project.description}
            </p>
          )}
          {!project.description && (
            <p className="text-sm text-muted-foreground/50 italic mb-4">
              No description
            </p>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto pt-3 border-t border-border">
          <span className="flex items-center gap-1">
            <MessageSquare className="w-3 h-3" />
            {project.sessionCount ?? 0} session{(project.sessionCount ?? 0) !== 1 ? "s" : ""}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatDate(project.createdAt)}
          </span>
        </div>
      </div>
    </Link>
  )
}
