"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

type Theme = "light" | "dark"
type EditorSettings = {
  fontSize: number
  tabSize: number
  lineNumbers: boolean
  wordWrap: boolean
  autoSave: boolean
  autoComplete: boolean
}

interface SettingsContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  editorSettings: EditorSettings
  updateEditorSettings: (settings: Partial<EditorSettings>) => void
  isMobileView: boolean
}

const defaultSettings: EditorSettings = {
  fontSize: 14,
  tabSize: 2,
  lineNumbers: true,
  wordWrap: true,
  autoSave: true,
  autoComplete: true,
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light")
  const [editorSettings, setEditorSettings] = useState<EditorSettings>(defaultSettings)
  const [isMobileView, setIsMobileView] = useState(false)

  useEffect(() => {
    // Load settings from localStorage if available
    const savedTheme = localStorage.getItem("editor-theme")
    const savedSettings = localStorage.getItem("editor-settings")

    if (savedTheme && (savedTheme === "light" || savedTheme === "dark")) {
      setTheme(savedTheme as Theme)
    }

    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings)
        setEditorSettings({ ...defaultSettings, ...parsed })
      } catch (e) {
        console.error("Failed to parse saved settings")
        setEditorSettings(defaultSettings)
      }
    }

    // Check if mobile view
    const checkMobileView = () => {
      setIsMobileView(window.innerWidth < 768)
    }

    checkMobileView()
    window.addEventListener("resize", checkMobileView)

    return () => {
      window.removeEventListener("resize", checkMobileView)
    }
  }, [])

  // Save settings to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem("editor-theme", theme)
      localStorage.setItem("editor-settings", JSON.stringify(editorSettings))
    } catch (e) {
      console.error("Failed to save settings to localStorage")
    }
  }, [theme, editorSettings])

  const updateEditorSettings = (settings: Partial<EditorSettings>) => {
    setEditorSettings((prev) => ({ ...prev, ...settings }))
  }

  return (
    <SettingsContext.Provider
      value={{
        theme,
        setTheme,
        editorSettings,
        updateEditorSettings,
        isMobileView,
      }}
    >
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider")
  }
  return context
}
