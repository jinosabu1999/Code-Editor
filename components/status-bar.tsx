"use client"

interface StatusBarProps {
  fileName?: string
  language?: string
  zoom: number
  cursor?: { line: number; column: number }
  lines: number
  savedAt?: Date
  theme: any
}

export default function StatusBar({ fileName, language, zoom, cursor, lines, savedAt, theme }: StatusBarProps) {
  return (
    <div
      className="mt-0 border-t border-border bg-card px-4 py-1.5 text-xs flex flex-wrap items-center justify-between text-muted-foreground"
      aria-label="Status bar"
    >
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 hover:text-foreground transition-colors cursor-pointer">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span className="font-medium">Ready</span>
        </div>
        {fileName && <span className="opacity-70 border-l border-border pl-4">{fileName}</span>}
        {language && <span className="opacity-70">{language.toUpperCase()}</span>}
      </div>
      
      <div className="flex items-center gap-4">
        {cursor && (
          <span className="opacity-70 font-mono">
            Ln {cursor.line}, Col {cursor.column}
          </span>
        )}
        <span className="opacity-70 border-l border-border pl-4">UTF-8</span>
        <span className="opacity-70">{zoom}%</span>
      </div>
    </div>
  )
}
