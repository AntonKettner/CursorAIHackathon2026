"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronLeft, Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { LabasiLogo } from "./labasi-logo"
import { Button } from "@/components/ui/button"

interface LabasiHeaderProps {
  projectId?: string
  projectName?: string
}

export function LabasiHeader({
  projectId,
  projectName,
}: LabasiHeaderProps) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isOnVoiceAgent = projectId && pathname === `/projects/${projectId}`
  const isOnTranscripts = projectId && pathname === `/projects/${projectId}/transcripts`

  return (
    <header className="border-b border-border">
      {/* Main header bar */}
      <div className="flex items-center justify-between px-4 lg:px-6 py-3 lg:py-4">
        <div className="flex items-center gap-2 lg:gap-3">
          {projectId ? (
            <Link
              href="/"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
          ) : null}
          <LabasiLogo size="md" />
          {/* Project name - hidden on mobile */}
          {projectName && (
            <div className="hidden lg:block ml-2 pl-4 border-l border-border">
              <h1 className="text-lg font-semibold text-foreground">
                {projectName}
              </h1>
              <p className="text-xs text-muted-foreground">Voice Agent</p>
            </div>
          )}
        </div>

        {/* Desktop nav */}
        {projectId && (
          <nav className="hidden lg:flex items-center gap-1">
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

        {/* Mobile burger menu button */}
        {projectId && (
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </Button>
        )}
      </div>

      {/* Mobile menu dropdown */}
      {projectId && mobileMenuOpen && (
        <div className="lg:hidden border-t border-border bg-background">
          {projectName && (
            <div className="px-4 py-3 border-b border-border">
              <h1 className="text-base font-semibold text-foreground">
                {projectName}
              </h1>
              <p className="text-xs text-muted-foreground">Voice Agent</p>
            </div>
          )}
          <nav className="flex flex-col p-2">
            <Link
              href={`/projects/${projectId}`}
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                "px-4 py-3 text-sm font-medium rounded-md transition-colors",
                isOnVoiceAgent
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              )}
            >
              Voice Agent
            </Link>
            <Link
              href={`/projects/${projectId}/transcripts`}
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                "px-4 py-3 text-sm font-medium rounded-md transition-colors",
                isOnTranscripts
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              )}
            >
              Transcripts
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
