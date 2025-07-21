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

  // PERFECT scroll synchronization - this is the key fix
  const handleScroll = useCallback(() => {
    if (textareaRef.current && lineNumbersRef.current) {
      const textarea = textareaRef.current
      const lineNumbers = lineNumbersRef.current

      // Perfect 1:1 synchronization
      lineNumbers.scrollTop = textarea.scrollTop
      lineNumbers.scrollLeft = textarea.scrollLeft
    }
  }, [])

  // Enhanced scroll event handling with immediate sync
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea && lineNumbersRef.current) {
      // Multiple event listeners for perfect sync
      const events = ["scroll", "input", "keyup", "mouseup", "touchend"]

      events.forEach((event) => {
        textarea.addEventListener(event, handleScroll, { passive: true })
      })

      // Initial sync
      handleScroll()

      return () => {
        events.forEach((event) => {
          textarea.removeEventListener(event, handleScroll)
        })
      }
    }
  }, [handleScroll, code])

  // Handle tab key and basic editing
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const textarea = e.target as HTMLTextAreaElement
      const { selectionStart, selectionEnd, value } = textarea

      if (e.key === "Tab") {
        e.preventDefault()
        const indent = "  " // 2 spaces
        const newValue = value.substring(0, selectionStart) + indent + value.substring(selectionEnd)
        onChange(newValue)

        // Set cursor position after the tab
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = selectionStart + indent.length
          handleScroll() // Sync after change
        }, 0)
      } else if (e.key === "Enter") {
        // Auto-indentation
        const lines = value.substring(0, selectionStart).split("\n")
        const currentLine = lines[lines.length - 1]
        const indent = currentLine.match(/^\s*/)?.[0] || ""

        // Add extra indent for opening braces
        const extraIndent =
          currentLine.trim().endsWith("{") || currentLine.trim().endsWith(":") || currentLine.trim().endsWith("(")
            ? "  "
            : ""

        const newIndent = indent + extraIndent
        const newValue = value.substring(0, selectionStart) + "\n" + newIndent + value.substring(selectionEnd)

        onChange(newValue)

        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = selectionStart + 1 + newIndent.length
          handleScroll() // Sync after change
        }, 0)

        e.preventDefault()
      }
      // Bracket matching
      else if (["(", "[", "{", '"', "'", "`"].includes(e.key)) {
        const closingBrackets = {
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

          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = selectionStart + 1
            handleScroll() // Sync after change
          }, 0)
        }
      }
    },
    [onChange, handleScroll],
  )

  // Generate line numbers with EXACT matching dimensions
  const generateLineNumbers = useCallback(() => {
    const lines = code.split("\n")
    const lineHeight = fontSize * 1.5 // Exact same line height as textarea
    const paddingTop = isMobile ? 12 : 16 // Match textarea padding

    return (
      <div
        style={{
          lineHeight: "1.5", // Exact same as textarea
          paddingTop: `${paddingTop}px`, // Match textarea padding
          fontSize: `${fontSize}px`, // Same font size for perfect alignment
          fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace", // Same font
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
              height: `${lineHeight}px`, // Exact line height match
              display: "flex",
              alignItems: "flex-start", // Top alignment like textarea
              justifyContent: "flex-end",
              boxSizing: "border-box",
              margin: 0, // No margin
              border: 0, // No border
            }}
          >
            {i + 1}
          </div>
        ))}
      </div>
    )
  }, [code, fontSize, theme, isMobile])

  // Auto-resize textarea and sync dimensions
  useEffect(() => {
    if (textareaRef.current && lineNumbersRef.current) {
      const textarea = textareaRef.current
      const lineNumbers = lineNumbersRef.current

      if (isMobile) {
        // On mobile, ensure textarea can scroll and shows all content
        textarea.style.height = "auto"
        const scrollHeight = Math.max(textarea.scrollHeight, 300)
        textarea.style.height = scrollHeight + "px"
        lineNumbers.style.height = scrollHeight + "px"
      }

      // Sync scroll position after resize
      setTimeout(handleScroll, 0)
    }
  }, [code, isMobile, handleScroll])

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
        backgroundColor: theme === "dark" ? "#111827" : "#FFFFFF",
        minHeight: isMobile ? "300px" : "200px",
        height: isMobile ? "auto" : "100%",
        maxHeight: isMobile ? "60vh" : "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div className={`flex flex-1 ${isMobile ? "overflow-auto" : "overflow-hidden"}`}>
        {/* Line numbers with perfect synchronization */}
        {lineNumbers && (
          <div
            ref={lineNumbersRef}
            className="flex-shrink-0 border-r border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
            style={{
              overflow: "hidden", // Hide scrollbars but allow programmatic scrolling
              width: isMobile ? "3rem" : "4rem",
              position: "relative",
            }}
          >
            {generateLineNumbers()}
          </div>
        )}

        {/* Textarea container */}
        <div className="flex-1 relative overflow-hidden">
          <textarea
            ref={textareaRef}
            value={code}
            onChange={(e) => {
              onChange(e.target.value)
              // Sync scroll after content change
              setTimeout(handleScroll, 0)
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onScroll={handleScroll} // Direct scroll handler
            className="w-full h-full resize-none bg-transparent border-0 outline-none"
            style={{
              fontSize: `${isMobile ? Math.max(fontSize - 2, 12) : fontSize}px`,
              lineHeight: "1.5", // Exact match with line numbers
              padding: isMobile ? "12px" : "16px", // Match line numbers padding
              whiteSpace: wordWrap ? "pre-wrap" : "pre",
              wordBreak: wordWrap ? "break-word" : "normal",
              color: theme === "dark" ? "#E2E8F0" : "#1E293B",
              caretColor: theme === "dark" ? "#60A5FA" : "#2563EB",
              fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace",
              overflow: "auto",
              minHeight: isMobile ? "300px" : "100%",
              maxHeight: isMobile ? "60vh" : "none",
              margin: 0, // No margin
              border: 0, // No border
            }}
            spellCheck="false"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            placeholder={`Start typing your ${language.toUpperCase()} code...`}
          />
        </div>
      </div>

      {/* Enhanced focus indicator */}
      {isFocused && (
        <div
          className="absolute top-2 right-2 px-2 py-1 rounded text-xs font-medium shadow-md"
          style={{
            backgroundColor: theme === "dark" ? "#1F2937" : "#F3F4F6",
            color: theme === "dark" ? "#60A5FA" : "#2563EB",
            border: `1px solid ${theme === "dark" ? "#374151" : "#E5E7EB"}`,
            zIndex: 3,
          }}
        >
          {language.toUpperCase()}
        </div>
      )}
    </div>
  )
}
