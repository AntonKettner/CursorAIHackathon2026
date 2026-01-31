"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronLeft } from "lucide-react"
import { cn } from "@/lib/utils"

interface LabasiHeaderProps {
  isConnected?: boolean
  status?: string
  projectId?: string
  projectName?: string
}

export function LabasiHeader({
  isConnected,
  status,
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
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-700 to-green-600 flex items-center justify-center">
          <span className="text-white font-bold text-lg">L</span>
        </div>
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            {projectName || "Labasi"}
          </h1>
          <p className="text-xs text-muted-foreground">
            {projectName ? "Voice Agent" : "Laboratory Assistant"}
          </p>
        </div>
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

      {status !== undefined && (
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "w-2 h-2 rounded-full transition-colors",
              isConnected ? "bg-green-600" : "bg-muted-foreground"
            )}
          />
          <span className="text-sm text-muted-foreground capitalize">{status}</span>
        </div>
      )}
      {status === undefined && <div className="w-24" />}
    </header>
  )
}
