"use client"

import { cn } from "@/lib/utils"

interface LabasiHeaderProps {
  isConnected: boolean
  status: string
}

export function LabasiHeader({ isConnected, status }: LabasiHeaderProps) {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-border">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-700 to-green-600 flex items-center justify-center">
          <span className="text-white font-bold text-lg">L</span>
        </div>
        <div>
          <h1 className="text-xl font-semibold text-foreground">Labasi</h1>
          <p className="text-xs text-muted-foreground">Laboratory Assistant</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div
          className={cn(
            "w-2 h-2 rounded-full transition-colors",
            isConnected ? "bg-green-600" : "bg-muted-foreground"
          )}
        />
        <span className="text-sm text-muted-foreground capitalize">{status}</span>
      </div>
    </header>
  )
}
