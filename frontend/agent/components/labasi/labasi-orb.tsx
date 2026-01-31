"use client"

import { Suspense, Component, ReactNode } from "react"
import dynamic from "next/dynamic"
import type { AgentState } from "@/types/conversation"
import { cn } from "@/lib/utils"

// Dynamic import to avoid SSR issues with Three.js
const Orb = dynamic(
  () => import("@/components/ui/orb").then((mod) => mod.Orb),
  { ssr: false }
)

// Lab-themed colors: dark green gradient
const LAB_COLORS: [string, string] = ["#166534", "#15803d"]

interface LabasiOrbProps {
  agentState: AgentState
  className?: string
}

function OrbFallback() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-32 h-32 rounded-full bg-gradient-to-br from-green-700/20 to-green-600/20 animate-pulse" />
    </div>
  )
}

// Error boundary to catch Three.js errors
class OrbErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Orb error:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-green-700/30 to-green-600/30 flex items-center justify-center mb-2">
              <span className="text-4xl">🧪</span>
            </div>
            <p className="text-sm">Labasi</p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export function LabasiOrb({ agentState, className }: LabasiOrbProps) {
  return (
    <div className={cn("w-full h-full", className)}>
      <OrbErrorBoundary>
        <Suspense fallback={<OrbFallback />}>
          <Orb colors={LAB_COLORS} agentState={agentState} />
        </Suspense>
      </OrbErrorBoundary>
    </div>
  )
}
