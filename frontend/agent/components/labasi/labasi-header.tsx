"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { LabasiLogo } from "./labasi-logo"

interface LabasiHeaderProps {
  projectId?: string
  projectName?: string
}

export function LabasiHeader({
  projectId,
  projectName,
}: LabasiHeaderProps) {
  const pathname = usePathname()

  const isOnVoiceAgent = projectId && pathname === `/projects/${projectId}`
  const isOnTranscripts = projectId && pathname === `/projects/${projectId}/transcripts`

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-border">
      <div className="flex items-center gap-3">
        {projectId ? (
          <Link
            href="/"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
        ) : null}
        <LabasiLogo size="md" />
        {projectName && (
          <div className="ml-2 pl-4 border-l border-border">
            <h1 className="text-lg font-semibold text-foreground">
              {projectName}
            </h1>
            <p className="text-xs text-muted-foreground">Voice Agent</p>
          </div>
        )}
      </div>

      {projectId && (
        <nav className="flex items-center gap-1">
          <Link
            href={`/projects/${projectId}`}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-md transition-colors",
              isOnVoiceAgent
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            )}
          >
            Voice Agent
          </Link>
          <Link
            href={`/projects/${projectId}/transcripts`}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-md transition-colors",
              isOnTranscripts
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            )}
          >
            Transcripts
          </Link>
        </nav>
      )}

    </header>
  )
}
