"use client"

import type React from "react"
import { useRef, useState, useCallback } from "react"

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
  const [isFocused, setIsFocused] = useState(false)

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
          }, 0)
        }
      }
    },
    [onChange],
  )

  // Generate line numbers
  const generateLineNumbers = useCallback(() => {
    const lines = code.split("\n")
    return lines.map((_, i) => (
      <div
        key={i}
        style={{
          color: theme === "dark" ? "#6B7280" : "#9CA3AF",
          userSelect: "none",
          textAlign: "right",
          paddingRight: "12px",
          minWidth: "3rem",
          fontSize: `${fontSize - 2}px`,
          lineHeight: "1.5",
          height: `${fontSize * 1.5}px`,
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
        }}
      >
        {i + 1}
      </div>
    ))
  }, [code, fontSize, theme])

  return (
    <div
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
        minHeight: "200px",
      }}
    >
      <div className="flex h-full">
        {/* Line numbers */}
        {lineNumbers && (
          <div className="flex-shrink-0 border-r border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 overflow-hidden">
            {generateLineNumbers()}
          </div>
        )}

        {/* Simple textarea - NO OVERLAY */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={code}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className="w-full h-full resize-none bg-transparent border-0 outline-none"
            style={{
              fontSize: `${fontSize}px`,
              lineHeight: "1.5",
              padding: "16px",
              whiteSpace: wordWrap ? "pre-wrap" : "pre",
              wordBreak: wordWrap ? "break-word" : "normal",
              color: theme === "dark" ? "#E2E8F0" : "#1E293B",
              caretColor: theme === "dark" ? "#60A5FA" : "#2563EB",
              fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace",
            }}
            spellCheck="false"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            placeholder={`Start typing your ${language.toUpperCase()} code...`}
          />
        </div>
      </div>

      {/* Focus indicator */}
      {isFocused && (
        <div
          className="absolute top-2 right-2 px-2 py-1 rounded text-xs font-medium"
          style={{
            backgroundColor: theme === "dark" ? "#1F2937" : "#F3F4F6",
            color: theme === "dark" ? "#60A5FA" : "#2563EB",
            zIndex: 3,
          }}
        >
          {language.toUpperCase()}
        </div>
      )}
    </div>
  )
}
