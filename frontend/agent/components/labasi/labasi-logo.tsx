"use client"

import { FlaskConical } from "lucide-react"
import { cn } from "@/lib/utils"

interface LabasiLogoProps {
  className?: string
  size?: "sm" | "md" | "lg"
}

export function LabasiLogo({ className, size = "md" }: LabasiLogoProps) {
  const sizeConfig = {
    sm: { icon: "w-5 h-5", text: "text-lg" },
    md: { icon: "w-7 h-7", text: "text-2xl" },
    lg: { icon: "w-10 h-10", text: "text-4xl" },
  }

  const config = sizeConfig[size]

  return (
    <div className={cn("flex items-center", className)} aria-label="Labasi logo">
      <FlaskConical className={cn(config.icon, "text-[#5AABA9]")} strokeWidth={2.5} />
      <span className={cn(config.text, "font-bold tracking-tight")}>
        <span className="text-foreground">lab</span>
        <span className="text-[#5AABA9]">asi</span>
      </span>
    </div>
  )
}
