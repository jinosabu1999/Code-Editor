"use client"

import { Clock, Code2, Zap, MapPin } from "lucide-react"
import { cn } from "@/lib/utils"

interface EnhancedStatusBarProps {
  fileName?: string
  language?: string
  lines?: number
  cursor?: { line: number; column: number }
  savedAt?: Date
  className?: string
}

export default function EnhancedStatusBar({
  fileName,
  language,
  lines,
  cursor,
  savedAt,
  className,
}: EnhancedStatusBarProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div
      className={cn(
        "flex items-center justify-between px-4 py-2 rounded-xl bg-card/60 backdrop-blur-xl border border-border text-xs text-muted-foreground animate-fade-in",
        className,
      )}
    >
      <div className="flex items-center gap-4">
        {fileName && (
          <div className="flex items-center gap-1.5">
            <Code2 className="h-3.5 w-3.5 text-accent" />
            <span className="font-medium text-foreground">{fileName}</span>
          </div>
        )}

        {language && (
          <div className="flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5" />
            <span>{language}</span>
          </div>
        )}

        {lines !== undefined && (
          <div className="flex items-center gap-1.5">
            <span>{lines} lines</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        {cursor && (
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            <span>
              Ln {cursor.line}, Col {cursor.column}
            </span>
          </div>
        )}

        {savedAt && (
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            <span>Saved at {formatTime(savedAt)}</span>
          </div>
        )}
      </div>
    </div>
  )
}
