"use client"

import type React from "react"
import { useEffect, useMemo, useRef, useState } from "react"

interface MinimapProps {
  code: string
  theme: any
  editorApi?: {
    scrollToPercent: (p: number) => void
    getScrollInfo: () => { scrollTop: number; scrollHeight: number; clientHeight: number }
  }
}

export default function Minimap({ code, theme = {}, editorApi }: MinimapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const editorApiRef = useRef<typeof editorApi>(editorApi)

  useEffect(() => {
    editorApiRef.current = editorApi
  }, [editorApi])

  const [viewportPct, setViewportPct] = useState({ start: 0, height: 0 })
  const rafRef = useRef<number | null>(null)
  const lastStartRef = useRef(0)
  const lastHeightRef = useRef(0)
  const lastTsRef = useRef(0)

  useEffect(() => {
    const loop = (ts: number) => {
      const api = editorApiRef.current
      if (api) {
        const { scrollTop, scrollHeight, clientHeight } = api.getScrollInfo()
        const start = scrollHeight > 0 ? scrollTop / scrollHeight : 0
        const height = scrollHeight > 0 ? clientHeight / scrollHeight : 1

        const dt = ts - lastTsRef.current
        const changed =
          Math.abs(start - lastStartRef.current) > 0.002 || Math.abs(height - lastHeightRef.current) > 0.002

        if ((dt > 33 && changed) || (lastTsRef.current === 0 && changed)) {
          lastTsRef.current = ts
          lastStartRef.current = start
          lastHeightRef.current = height
          setViewportPct({ start, height })
        }
      }
      rafRef.current = window.requestAnimationFrame(loop)
    }

    rafRef.current = window.requestAnimationFrame(loop)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [])

  const lines = useMemo(() => code.split("\n"), [code])
  const isDraggingRef = useRef(false)

  const seekToClientY = (clientY: number) => {
    const api = editorApiRef.current
    const el = containerRef.current
    if (!api || !el) return
    const rect = el.getBoundingClientRect()
    const y = clientY - rect.top
    const pct = Math.min(1, Math.max(0, y / rect.height))
    api.scrollToPercent(pct)
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    isDraggingRef.current = true
    seekToClientY(e.clientY)
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return
    seekToClientY(e.clientY)
  }

  const handleMouseUp = () => {
    isDraggingRef.current = false
  }

  return (
    <div
      ref={containerRef}
      className="hidden lg:block relative h-full w-20 rounded-xl border border-border bg-card/40 backdrop-blur-sm overflow-hidden transition-all duration-200 hover:bg-card/60"
      role="application"
      aria-label="Code minimap"
      title="Minimap"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseUp}
      onMouseUp={handleMouseUp}
    >
      <div className="absolute inset-0 p-1">
        <pre
          className="m-0 leading-[8px] text-[8px] whitespace-pre-wrap break-words opacity-60 text-muted-foreground"
          style={{
            fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace",
          }}
        >
          {lines.map((l, i) => (
            <div key={i} className="truncate">
              {l.length > 120 ? l.slice(0, 120) : l}
            </div>
          ))}
        </pre>
      </div>
      <div
        className="absolute left-0 right-0 rounded-lg border-2 border-accent pointer-events-none transition-all duration-100"
        style={{
          top: `${viewportPct.start * 100}%`,
          height: `${viewportPct.height * 100}%`,
          boxShadow: "0 0 20px hsl(var(--accent) / 0.4)",
          background: "hsl(var(--accent) / 0.1)",
        }}
      />
    </div>
  )
}
