"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, Search, Highlighter } from "lucide-react"
import type { FileItem } from "@/utils/file-system"

interface ProjectSearchProps {
  isOpen: boolean
  onClose: () => void
  files: FileItem[]
  onOpenFile: (id: number) => void
  theme: any
}

export default function ProjectSearch({ isOpen, onClose, files, onOpenFile, theme }: ProjectSearchProps) {
  const [query, setQuery] = useState("")
  const [caseSensitive, setCaseSensitive] = useState(false)

  const results = useMemo(() => {
    if (!query.trim()) return []
    const flags = caseSensitive ? "g" : "gi"
    const rx = new RegExp(query, flags)
    const list: { id: number; file: string; line: number; snippet: string }[] = []
    for (const f of files) {
      if (f.type === "folder") continue
      const lines = (f.content || "").split("\n")
      lines.forEach((line, idx) => {
        if (rx.test(line)) {
          list.push({
            id: f.id,
            file: f.name,
            line: idx + 1,
            snippet: line.trim().slice(0, 180),
          })
        }
        rx.lastIndex = 0
      })
    }
    return list
  }, [query, caseSensitive, files])

  if (!isOpen) return null

  return (
    <div
      className={`fixed inset-0 z-50 flex items-start justify-center p-4 ${theme.text}`}
      role="dialog"
      aria-label="Project search"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-2xl" onClick={onClose} />
      <div
        className={`relative w-full max-w-3xl rounded-xl border shadow-2xl ${theme.primary} ${theme.border} backdrop-blur-3xl bg-card/95`}
      >
        <div className="flex items-center gap-2 p-3 border-b">
          <Search className="h-4 w-4 text-blue-500" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search across project..."
            className={`${theme.text}`}
            autoFocus
          />
          <label className="text-xs opacity-70 flex items-center gap-1 select-none">
            <input type="checkbox" checked={caseSensitive} onChange={(e) => setCaseSensitive(e.target.checked)} />
            Case sensitive
          </label>
          <Button variant="outline" size="icon" className="h-8 w-8 bg-transparent" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4 text-red-500" />
          </Button>
        </div>
        <div className="max-h-[60vh] overflow-auto p-2">
          {results.length === 0 ? (
            <div className="p-6 text-sm opacity-70">No matches.</div>
          ) : (
            <ul className="space-y-2">
              {results.map((r, i) => (
                <li
                  key={`${r.id}-${i}`}
                  className="rounded-lg border p-2 hover:bg-blue-500/10 cursor-pointer"
                  onClick={() => {
                    onOpenFile(r.id)
                    onClose()
                  }}
                >
                  <div className="text-xs opacity-70">{r.file}</div>
                  <div className="text-[11px] opacity-60">Line {r.line}</div>
                  <div className="text-sm mt-1 flex items-center gap-2">
                    <Highlighter className="h-4 w-4 opacity-60" />
                    <span className="truncate">{r.snippet}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="px-3 py-2 text-xs opacity-70 border-t">
          Tip: Use Ctrl/Cmd+K to open the Command Palette and run "Find in Project".
        </div>
      </div>
    </div>
  )
}
