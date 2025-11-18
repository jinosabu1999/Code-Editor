"use client"

import type React from "react"
import { useRef, useState, useCallback, useEffect } from "react"

interface SyntaxHighlighterProps {
  code: string
  language: string
  onChange: (code: string) => void
  fontSize: number
  lineNumbers: boolean
  wordWrap: boolean
  className?: string
  theme: string
  // New callbacks for advanced UX
  onCursorChange?: (pos: { line: number; column: number }) => void
}

export default function SyntaxHighlighter({
  code,
  language,
  onChange,
  fontSize,
  lineNumbers,
  wordWrap,
  className = "",
  theme = "light",
  onCursorChange,
}: SyntaxHighlighterProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const lineNumbersRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isFocused, setIsFocused] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // PERFECT scroll synchronization (numbers follow editor)
  const handleScroll = useCallback(() => {
    if (textareaRef.current && lineNumbersRef.current) {
      const textarea = textareaRef.current
      const lineNumbers = lineNumbersRef.current
      lineNumbers.scrollTop = textarea.scrollTop
      lineNumbers.scrollLeft = textarea.scrollLeft
    }
  }, [])

  // Cursor position utility
  const updateCursor = useCallback(() => {
    if (!onCursorChange || !textareaRef.current) return
    const el = textareaRef.current
    const idx = el.selectionStart ?? 0
    const before = el.value.slice(0, idx)
    const lines = before.split("\n")
    const line = lines.length
    const column = (lines[lines.length - 1] || "").length + 1
    onCursorChange({ line, column })
  }, [onCursorChange])

  // Event handlers & sync setup
  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    const events = ["scroll", "input", "keyup", "mouseup", "touchend"]
    const onAny = () => {
      handleScroll()
      updateCursor()
    }
    events.forEach((ev) => textarea.addEventListener(ev, onAny, { passive: true } as any))
    // initial
    handleScroll()
    updateCursor()
    return () => {
      events.forEach((ev) => textarea.removeEventListener(ev, onAny as any))
    }
  }, [handleScroll, updateCursor, code])

  // Handle tab/enter/brackets
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const textarea = e.target as HTMLTextAreaElement
      const { selectionStart, selectionEnd, value } = textarea

      if (e.key === "Tab") {
        e.preventDefault()
        const indent = "  "
        const newValue = value.substring(0, selectionStart) + indent + value.substring(selectionEnd)
        onChange(newValue)
        requestAnimationFrame(() => {
          textarea.selectionStart = textarea.selectionEnd = selectionStart + indent.length
          handleScroll()
          updateCursor()
        })
      } else if (e.key === "Enter") {
        const linesBefore = value.substring(0, selectionStart).split("\n")
        const currentLine = linesBefore[linesBefore.length - 1]
        const indent = currentLine.match(/^\s*/)?.[0] || ""
        const extraIndent =
          currentLine.trim().endsWith("{") || currentLine.trim().endsWith(":") || currentLine.trim().endsWith("(")
            ? "  "
            : ""
        const newIndent = indent + extraIndent
        const newValue = value.substring(0, selectionStart) + "\n" + newIndent + value.substring(selectionEnd)
        onChange(newValue)
        requestAnimationFrame(() => {
          textarea.selectionStart = textarea.selectionEnd = selectionStart + 1 + newIndent.length
          handleScroll()
          updateCursor()
        })
        e.preventDefault()
      } else if (["(", "[", "{", '"', "'", "`"].includes(e.key)) {
        const closingBrackets: Record<string, string> = {
          "(": ")",
          "[": "]",
          "{": "}",
          '"': '"',
          "'": "'",
          "`": "`",
        }
        const closing = closingBrackets[e.key]
        if (closing && selectionStart === selectionEnd) {
          e.preventDefault()
          const newValue = value.substring(0, selectionStart) + e.key + closing + value.substring(selectionEnd)
          onChange(newValue)
          requestAnimationFrame(() => {
            textarea.selectionStart = textarea.selectionEnd = selectionStart + 1
            handleScroll()
            updateCursor()
          })
        }
      }
    },
    [onChange, updateCursor, handleScroll],
  )

  // Generate line numbers matching dimensions
  const generateLineNumbers = useCallback(() => {
    const lines = code.split("\n")
    const paddingTop = isMobile ? 12 : 16

    return (
      <div
        style={{
          lineHeight: "1.5",
          paddingTop: `${paddingTop}px`,
          fontSize: `${fontSize}px`,
          fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace",
        }}
      >
        {lines.map((_, i) => (
          <div
            key={i}
            style={{
              color: theme === "dark" ? "#6B7280" : "#9CA3AF",
              userSelect: "none",
              textAlign: "right",
              paddingRight: isMobile ? "8px" : "12px",
              minWidth: isMobile ? "2.5rem" : "3rem",
              height: `${fontSize * 1.5}px`,
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "flex-end",
              boxSizing: "border-box",
            }}
          >
            {i + 1}
          </div>
        ))}
      </div>
    )
  }, [code, fontSize, theme, isMobile])

  // Auto-resize for mobile
  useEffect(() => {
    if (!textareaRef.current || !lineNumbersRef.current) return
    const textarea = textareaRef.current
    const lineNums = lineNumbersRef.current

    if (isMobile) {
      textarea.style.height = "auto"
      const scrollHeight = Math.max(textarea.scrollHeight, 300)
      textarea.style.height = scrollHeight + "px"
      lineNums.style.height = scrollHeight + "px"
    }
    requestAnimationFrame(() => {
      handleScroll()
      updateCursor()
    })
  }, [code, isMobile, handleScroll, updateCursor])

  return (
    <div
      ref={containerRef}
      className={`relative font-mono ${className} overflow-hidden rounded-lg border-2 transition-all duration-200 ${
        isFocused
          ? theme === "dark"
            ? "border-blue-500 shadow-lg shadow-blue-500/20"
            : "border-blue-500 shadow-lg shadow-blue-500/10"
          : theme === "dark"
            ? "border-gray-700"
            : "border-gray-300"
      }`}
      style={{
        backgroundColor: theme === "dark" ? "#0b1220" : "#FFFFFF",
        minHeight: isMobile ? "300px" : "200px",
        height: isMobile ? "auto" : "100%",
        maxHeight: isMobile ? "60vh" : "100%",
        display: "flex",
        flexDirection: "column",
        boxShadow: theme === "dark" ? "0 0 40px rgba(59,130,246,0.12)" : "0 0 28px rgba(59,130,246,0.08)",
      }}
    >
      <div className={`flex flex-1 ${isMobile ? "overflow-auto" : "overflow-hidden"}`}>
        {lineNumbers && (
          <div
            ref={lineNumbersRef}
            className="flex-shrink-0 border-r border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-slate-900/60"
            style={{
              overflow: "hidden",
              width: isMobile ? "3rem" : "4rem",
              position: "relative",
            }}
          >
            {generateLineNumbers()}
          </div>
        )}

        <div className="flex-1 relative overflow-hidden">
          <textarea
            ref={textareaRef}
            value={code}
            onChange={(e) => {
              onChange(e.target.value)
              requestAnimationFrame(() => {
                handleScroll()
                updateCursor()
              })
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onScroll={handleScroll}
            className="w-full h-full resize-none bg-transparent border-0 outline-none"
            style={{
              fontSize: `${isMobile ? Math.max(fontSize - 2, 12) : fontSize}px`,
              lineHeight: "1.5",
              padding: isMobile ? "12px" : "16px",
              whiteSpace: wordWrap ? "pre-wrap" : "pre",
              wordBreak: wordWrap ? "break-word" : "normal",
              color: theme === "dark" ? "#E2E8F0" : "#1F2937",
              caretColor: theme === "dark" ? "#60A5FA" : "#2563EB",
              fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace",
              overflow: "auto",
              minHeight: isMobile ? "300px" : "100%",
              maxHeight: isMobile ? "60vh" : "none",
            }}
            spellCheck="false"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            placeholder={`Start typing your ${language.toUpperCase()} code...`}
          />
        </div>
      </div>

      {isFocused && (
        <div
          className="absolute top-2 right-2 px-2 py-1 rounded text-xs font-medium shadow-md"
          style={{
            backgroundColor: theme === "dark" ? "#0d1a2b" : "#F3F4F6",
            color: theme === "dark" ? "#60A5FA" : "#2563EB",
            border: `1px solid ${theme === "dark" ? "#1f2a44" : "#E5E7EB"}`,
            zIndex: 3,
          }}
        >
          {language.toUpperCase()}
        </div>
      )}
    </div>
  )
}
