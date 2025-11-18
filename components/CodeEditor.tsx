"use client"

import type React from "react"
import { useState, useEffect, useCallback, useReducer, useMemo, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { X, FileText, Eye, EyeOff, Rows, Columns, Focus, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react'

import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"
import { SettingsProvider, useSettings } from "@/contexts/settings-context"
import SyntaxHighlighter from "@/components/syntax-highlighter"
import FileExplorer from "@/components/file-explorer"
import SettingsPanel from "@/components/settings-panel"
import PreviewPanel from "@/components/preview-panel"
import SearchPanel from "@/components/search-panel"
import ProjectSearch from "@/components/project-search"
import CommandPalette from "@/components/command-palette"
import AnimatedToolbar from "@/components/animated-toolbar"
import EnhancedStatusBar from "@/components/enhanced-status-bar"
import {
  type FileSystemState,
  initialFileSystem,
  getFileById,
  createFile,
  updateFile,
  deleteFile,
} from "@/utils/file-system"

const getLanguageFromFileName = (fileName: string) => {
  const extension = fileName.split(".").pop()?.toLowerCase()
  switch (extension) {
    case "html":
      return { name: "HTML", parser: "html" }
    case "css":
      return { name: "CSS", parser: "css" }
    case "js":
      return { name: "JavaScript", parser: "babel" }
    default:
      return null
  }
}

// Reducer unchanged (enhanced duplicate already present)
function fileSystemReducer(state: FileSystemState, action: any) {
  switch (action.type) {
    case "CREATE_FILE":
      return createFile(state, action.name, action.fileType, action.content || "", action.parentId)
    case "UPDATE_FILE": {
      const fileToUpdate = getFileById(state.files, action.id)
      if (fileToUpdate && action.updates.content !== undefined) {
        const currentContent = fileToUpdate.content
        const newContent = action.updates.content
        if (currentContent !== newContent && !action.skipHistory) {
          const history = fileToUpdate.history || [currentContent]
          const historyIndex = fileToUpdate.historyIndex ?? 0
          const newHistory = [...history.slice(0, historyIndex + 1), newContent]
          action.updates.history = newHistory
          action.updates.historyIndex = newHistory.length - 1
        }
      }
      return updateFile(state, action.id, action.updates)
    }
    case "DELETE_FILE":
      return deleteFile(state, action.id)
    case "SET_STATE":
      return action.state
    case "DUPLICATE_FILE": {
      const fileToDuplicate = getFileById(state.files, action.id)
      if (fileToDuplicate) {
        const base = fileToDuplicate.name.replace(/\.[^/.]+$/, "")
        const ext = fileToDuplicate.name.split(".").pop()
        const newName = `${base}_copy.${ext}`
        return createFile(state, newName, fileToDuplicate.type, fileToDuplicate.content, fileToDuplicate.parentId)
      }
      return state
    }
    default:
      return state
  }
}

function CodeEditorContent() {
  const { theme: appTheme, editorSettings, isMobileView } = useSettings()
  const [fileSystem, dispatch] = useReducer(fileSystemReducer, initialFileSystem)
  const [activeFileId, setActiveFileId] = useState(1)
  const [preview, setPreview] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [lastSaved, setLastSaved] = useState(new Date())
  const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobileView)
  const [isPreviewVisible, setIsPreviewVisible] = useState(true)
  const [currentZoom, setCurrentZoom] = useState(100)
  const [isRunning, setIsRunning] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [splitOrientation, setSplitOrientation] = useState<"horizontal" | "vertical">("horizontal")
  const [zen, setZen] = useState(false)
  const [commandOpen, setCommandOpen] = useState(false)
  const [projectSearchOpen, setProjectSearchOpen] = useState(false)
  const [cursorPos, setCursorPos] = useState<{ line: number; column: number } | undefined>(undefined)

  const isUpdatingRef = useRef(false)

  const fileSystemRef = useRef(fileSystem)
  const activeFileIdRef = useRef(activeFileId)
  const appThemeRef = useRef(appTheme)

  useEffect(() => {
    fileSystemRef.current = fileSystem
  }, [fileSystem])

  useEffect(() => {
    activeFileIdRef.current = activeFileId
  }, [activeFileId])

  useEffect(() => {
    appThemeRef.current = appTheme
  }, [appTheme])

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      setSplitOrientation(mobile ? "vertical" : "horizontal")
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // Themes
  const themes = {
    light: {
      bg: "bg-white",
      text: "text-zinc-900",
      primary: "bg-white border border-zinc-200 shadow-sm",
      secondary: "bg-zinc-50",
      accent: "text-zinc-900",
      border: "border-zinc-200",
      editor: "bg-white text-zinc-900",
      button: "bg-zinc-900 hover:bg-zinc-800 text-white shadow-sm",
      activeTab: "bg-white text-zinc-900 border-b-2 border-zinc-900",
      inactiveTab: "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50",
      preview: "bg-white text-zinc-900",
      success: "text-emerald-600",
      warning: "text-amber-600",
      error: "text-red-600",
    },
    dark: {
      bg: "bg-black",
      text: "text-zinc-100",
      primary: "bg-zinc-950 border border-zinc-800",
      secondary: "bg-zinc-900",
      accent: "text-white",
      border: "border-zinc-800",
      editor: "bg-black text-zinc-100",
      button: "bg-white hover:bg-zinc-200 text-black shadow-sm",
      activeTab: "bg-zinc-900 text-white border-b-2 border-white",
      inactiveTab: "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900",
      preview: "bg-black text-zinc-100",
      success: "text-emerald-400",
      warning: "text-amber-400",
      error: "text-red-400",
    },
  }
  const currentTheme = themes[appTheme] || themes.light

  const showNotification = useCallback((message: string, type: "success" | "error" | "warning" = "success") => {
    if (type === "success") {
      setSuccess(message)
      setTimeout(() => setSuccess(""), 3000)
    } else if (type === "error") {
      setError(message)
      setTimeout(() => setError(""), 5000)
    }
  }, [])

  const getCurrentFile = useMemo(() => {
    return getFileById(fileSystem.files, activeFileId)
  }, [fileSystem.files, activeFileId])

  const currentLanguage = useMemo(() => {
    const f = getCurrentFile
    if (!f) return { name: "", parser: "" }
    return getLanguageFromFileName(f.name) || { name: f.type.toUpperCase(), parser: f.type }
  }, [getCurrentFile])

  const updateCurrentFile = useCallback((newContent: string) => {
    const currentFile = getFileById(fileSystemRef.current.files, activeFileIdRef.current)
    if (!currentFile) return
    dispatch({
      type: "UPDATE_FILE",
      id: activeFileIdRef.current,
      updates: { content: newContent },
    })
  }, [])

  const updatePreview = useCallback(() => {
    try {
      const currentFile = getFileById(fileSystemRef.current.files, activeFileIdRef.current)
      let htmlFile = fileSystemRef.current.files.find((f) => f.name === "index.html")
      if (!htmlFile) htmlFile = fileSystemRef.current.files.find((f) => f.type === "html")

      let htmlContent = htmlFile?.content || ""

      if (currentFile && currentFile.type === "html") {
        htmlContent = currentFile.content || ""
      }

      if (!htmlContent) {
        const msg = `
<!doctype html>
<html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/></head>
<body style="height:100vh;display:flex;align-items:center;justify-content:center;font-family:system-ui;color:${
          appThemeRef.current === "dark" ? "#E2E8F0" : "#334155"
        };background:${appThemeRef.current === "dark" ? "#0F172A" : "#F8FAFC"}">
  <div style="text-align:center;max-width:420px;padding:20px">
    <div style="font-size:48px;margin-bottom:12px">📄</div>
    <div style="font-weight:600;margin-bottom:6px">No HTML file found</div>
    <div style="opacity:0.75">Create an HTML file to see the preview</div>
  </div>
</body></html>`
        setPreview(msg)
        return
      }

      if (!htmlContent.includes("viewport")) {
        htmlContent = htmlContent.replace(
          "<head>",
          '<head>\n<meta name="viewport" content="width=device-width, initial-scale=1.0">',
        )
      }

      const cssFiles = fileSystemRef.current.files.filter((f) => f.type === "css")
      if (cssFiles.length) {
        const styleTag = cssFiles.map((f) => `<style>\n${f.content || ""}\n</style>`).join("\n")
        if (htmlContent.includes("</head>")) {
          htmlContent = htmlContent.replace("</head>", `${styleTag}\n</head>`)
        } else {
          htmlContent = `<head>${styleTag}</head>\n${htmlContent}`
        }
      }

      const jsFiles = fileSystemRef.current.files.filter((f) => f.type === "js")
      if (jsFiles.length) {
        const scripts = jsFiles.map((f) => `<script>\n${f.content || ""}\n</script>`).join("\n")
        if (htmlContent.includes("</body>")) {
          htmlContent = htmlContent.replace("</body>", `${scripts}\n</body>`)
        } else {
          htmlContent = `${htmlContent}\n${scripts}`
        }
      }

      setPreview(htmlContent)
    } catch (e: any) {
      showNotification(`Preview error: ${e.message}`, "error")
    }
  }, [showNotification])

  // Load from localStorage only once on mount
  useEffect(() => {
    const saved = localStorage.getItem("code-editor-files")
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        dispatch({ type: "SET_STATE", state: parsed })
        if (parsed.files.length > 0) setActiveFileId(parsed.files[0].id)
      } catch {
        showNotification("Failed to load saved files", "error")
      }
    }
  }, []) // Empty dependency array - runs only once on mount

  // Keyboard handler setup - runs when zen or fullscreen changes
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey
      if (isCtrlOrCmd) {
        switch (e.key.toLowerCase()) {
          case "s":
            e.preventDefault()
            saveCurrentFile()
            break
          case "z":
            if (!e.shiftKey) {
              e.preventDefault()
              undo()
            }
            break
          case "y":
          case "z":
            if (e.shiftKey && e.key.toLowerCase() === "z") {
              e.preventDefault()
              redo()
            } else if (e.key.toLowerCase() === "y") {
              e.preventDefault()
              redo()
            }
            break
          case "f":
            e.preventDefault()
            setIsSearchOpen(true)
            break
          case "k":
            e.preventDefault()
            setCommandOpen(true)
            break
          case "b":
            e.preventDefault()
            setIsSidebarOpen((v) => !v)
            break
          case "=":
          case "+":
            e.preventDefault()
            zoomIn()
            break
          case "-":
            e.preventDefault()
            zoomOut()
            break
          case "0":
            e.preventDefault()
            resetZoom()
            break
        }
      }
      if (e.key === "Escape") {
        setIsSearchOpen(false)
        setIsSettingsOpen(false)
        setCommandOpen(false)
        if (isPreviewFullscreen) setIsPreviewFullscreen(false)
        if (zen) setZen(false)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [zen, isPreviewFullscreen]) // Depends on zen and fullscreen for Escape key handling

  useEffect(() => {
    if (editorSettings.autoSave) {
      const tm = setInterval(() => {
        try {
          localStorage.setItem("code-editor-files", JSON.stringify(fileSystem))
          setLastSaved(new Date())
        } catch (err) {
          console.error("Auto-save failed:", err)
        }
      }, 30000)
      return () => clearInterval(tm)
    }
  }, [editorSettings.autoSave])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      updatePreview()
    }, 100)
    return () => clearTimeout(timeoutId)
  }, [activeFileId, fileSystem.files])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      try {
        localStorage.setItem("code-editor-files", JSON.stringify(fileSystem))
      } catch (err) {
        console.error("Failed to persist filesystem:", err)
      }
    }, 500)
    return () => clearTimeout(timeoutId)
  }, [fileSystem])

  const zoomIn = () => setCurrentZoom((prev) => Math.min(prev + 10, 200))
  const zoomOut = () => setCurrentZoom((prev) => Math.max(prev - 10, 50))
  const resetZoom = () => setCurrentZoom(100)

  const undo = () => {
    const currentFile = getCurrentFile
    if (!currentFile || !currentFile.history || currentFile.historyIndex! <= 0) {
      showNotification("Nothing to undo", "warning")
      return
    }
    const newIndex = (currentFile.historyIndex ?? 0) - 1
    const previousContent = currentFile.history![newIndex]
    dispatch({
      type: "UPDATE_FILE",
      id: activeFileId,
      updates: { content: previousContent, historyIndex: newIndex },
      skipHistory: true,
    })
    showNotification("Undone")
  }

  const redo = () => {
    const currentFile = getCurrentFile
    if (!currentFile || !currentFile.history || currentFile.historyIndex! >= currentFile.history!.length - 1) {
      showNotification("Nothing to redo", "warning")
      return
    }
    const newIndex = (currentFile.historyIndex ?? 0) + 1
    const nextContent = currentFile.history![newIndex]
    dispatch({
      type: "UPDATE_FILE",
      id: activeFileId,
      updates: { content: nextContent, historyIndex: newIndex },
      skipHistory: true,
    })
    showNotification("Redone")
  }

  const clearAll = () => {
    const currentFile = getCurrentFile
    if (!currentFile) return
    if (confirm("Clear all content in current file?")) {
      updateCurrentFile("")
      showNotification("Content cleared")
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files.length === 0) return
    files.forEach((file) => {
      const reader = new FileReader()
      reader.onload = (e: ProgressEvent<FileReader>) => {
        const content = e.target?.result as string
        if (content) {
          const ext = file.name.split(".").pop()?.toLowerCase()
          if (!["html", "css", "js"].includes(ext || "")) {
            showNotification(`Invalid file type: ${file.name}`, "error")
            return
          }
          dispatch({ type: "CREATE_FILE", name: file.name, fileType: ext, content })
          setActiveFileId(fileSystem.nextId)
          showNotification(`Uploaded ${file.name}`)
        }
      }
      reader.readAsText(file)
    })
    event.target.value = ""
  }

  const saveCurrentFile = () => {
    try {
      localStorage.setItem("code-editor-files", JSON.stringify(fileSystem))
      setLastSaved(new Date())
      const currentFile = getCurrentFile
      if (currentFile) showNotification(`${currentFile.name} saved!`)
    } catch {
      showNotification("Failed to save file", "error")
    }
  }

  const createNewFile = (name: string, type: string, parentId: number | null = null) => {
    dispatch({ type: "CREATE_FILE", name, fileType: type, parentId })
    setActiveFileId(fileSystem.nextId)
    showNotification(`Created ${name}`)
  }

  const deleteFileById = (id: number) => {
    if (fileSystem.files.length <= 1) {
      showNotification("Cannot delete the only file", "error")
      return
    }
    const fileToDelete = getFileById(fileSystem.files, id)
    if (fileToDelete && confirm(`Delete ${fileToDelete.name}?`)) {
      dispatch({ type: "DELETE_FILE", id })
      if (activeFileId === id) {
        const remaining = fileSystem.files.filter((f) => f.id !== id)
        if (remaining.length > 0) setActiveFileId(remaining[0].id)
      }
      showNotification(`Deleted ${fileToDelete.name}`)
    }
  }

  const duplicateFile = (id: number) => {
    dispatch({ type: "DUPLICATE_FILE", id })
    showNotification("File duplicated")
  }

  const renameFile = (id: number, newName: string) => {
    dispatch({ type: "UPDATE_FILE", id, updates: { name: newName } })
    showNotification("File renamed")
  }

  const exportFiles = async () => {
    try {
      const files = fileSystem.files.filter((f) => f.type !== "folder")
      if (files.length === 0) {
        showNotification("No files to export", "error")
        return
      }
      if (files.length === 1) {
        const file = files[0]
        const blob = new Blob([file.content || ""], { type: "text/plain" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = file.name
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        showNotification(`${file.name} exported!`)
      } else {
        let archiveContent = "# Project Export\n\n"
        files.forEach((f) => {
          archiveContent += `## ${f.name}\n\`\`\`${f.type}\n${f.content || ""}\n\`\`\`\n\n`
        })
        const blob = new Blob([archiveContent], { type: "text/markdown" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = "project-export.md"
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        showNotification(`${files.length} files exported!`)
      }
    } catch {
      showNotification("Failed to export files", "error")
    }
  }

  const copyContent = async () => {
    const currentFile = getCurrentFile
    if (currentFile) {
      try {
        await navigator.clipboard.writeText(currentFile.content || "")
        showNotification("Copied to clipboard")
      } catch {
        showNotification("Copy failed", "error")
      }
    }
  }

  const pasteContent = async () => {
    try {
      const text = await navigator.clipboard.readText()
      updateCurrentFile(text)
      showNotification("Pasted content")
    } catch {
      showNotification("Paste failed", "error")
    }
  }

  // Prettier format
  const formatCode = async () => {
    const file = getCurrentFile
    if (!file) return
    const lang = getLanguageFromFileName(file.name)
    if (!lang) return
    try {
      const prettier = await import("prettier/standalone")
      const parsers: Record<string, any> = {
        html: await import("prettier/parser-html"),
        css: await import("prettier/parser-postcss"),
        babel: await import("prettier/parser-babel"),
      }
      const formatted = (prettier as any).format(file.content || "", {
        parser: lang.parser,
        plugins: [parsers[lang.parser]],
      })
      updateCurrentFile(formatted)
      showNotification("Formatted ✨")
    } catch {
      showNotification("Formatter not available", "error")
    }
  }

  const runCode = () => {
    setIsRunning(true)
    showNotification("Running...")
    setTimeout(() => {
      updatePreview()
      setIsRunning(false)
      showNotification("Preview updated!")
    }, 400)
  }

  // Command palette actions
  const commandActions = [
    {
      id: "new-html",
      label: "New HTML File",
      group: "File",
      shortcut: "Ctrl/Cmd+N",
      onSelect: () => createNewFile("untitled.html", "html"),
    },
    { id: "save", label: "Save", group: "File", shortcut: "Ctrl/Cmd+S", onSelect: saveCurrentFile },
    { id: "export", label: "Export Project", group: "File", onSelect: exportFiles },
    { id: "run", label: "Run Code", group: "Run", shortcut: "Ctrl/Cmd+Enter", onSelect: runCode },
    { id: "format", label: "Format Code", group: "Edit", onSelect: formatCode },
    { id: "undo", label: "Undo", group: "Edit", shortcut: "Ctrl/Cmd+Z", onSelect: undo },
    { id: "redo", label: "Redo", group: "Edit", shortcut: "Ctrl/Cmd+Shift+Z", onSelect: redo },
    {
      id: "find-file",
      label: "Find in Project",
      group: "Search",
      shortcut: "Ctrl/Cmd+Shift+F",
      onSelect: () => setProjectSearchOpen(true),
    },
    { id: "toggle-preview", label: "Toggle Preview", group: "View", onSelect: () => setIsPreviewVisible((v) => !v) },
    { id: "toggle-sidebar", label: "Toggle Sidebar", group: "View", onSelect: () => setIsSidebarOpen((v) => !v) },
    {
      id: "toggle-split",
      label: "Toggle Split Orientation",
      group: "View",
      onSelect: () => setSplitOrientation((o) => (o === "horizontal" ? "vertical" : "horizontal")),
    },
    { id: "zen", label: "Toggle Zen Mode", group: "View", onSelect: () => setZen((z) => !z) },
  ]

  // Derived
  const currentFile = getCurrentFile
  const linesCount = (currentFile?.content || "").split("\n").length

  return (
    <div
      className="min-h-screen p-2 sm:p-4 bg-background transition-all duration-300 relative overflow-hidden"
      style={{ zoom: isMobile ? "100%" : `${currentZoom}%` }}
    >
      
      {!zen && (
        <AnimatedToolbar
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onNewFile={() => createNewFile("untitled.html", "html")}
          onUpload={() => document.getElementById("file-upload")?.click()}
          onRun={runCode}
          isRunning={isRunning}
          onUndo={undo}
          onRedo={redo}
          onClear={clearAll}
          onFormat={formatCode}
          onSearch={() => setProjectSearchOpen(true)}
          onSettings={() => setIsSettingsOpen(true)}
          isMobile={isMobile}
          className="mb-4"
        />
      )}

      <input
        id="file-upload"
        type="file"
        accept=".html,.css,.js"
        multiple
        className="hidden"
        onChange={handleFileUpload}
        aria-label="File upload input"
      />

      {(error || success) && (
        <Alert
          variant={success ? "default" : "destructive"}
          className={`mb-4 rounded-lg border backdrop-blur-xl animate-slide-in-up ${
            success
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
              : "bg-red-500/10 border-red-500/20 text-red-500"
          }`}
          role="alert"
          aria-live="polite"
        >
          {success ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <AlertDescription className="ml-2">{success || error}</AlertDescription>
        </Alert>
      )}

      <div className={`${zen ? "h-[calc(100vh-3rem)]" : isMobile ? "h-auto" : "h-[calc(100vh-10rem)]"}`}>
        {isMobile || zen ? (
          // Mobile or Zen: stack
          <div className="flex flex-col gap-4">
            {!zen && isSidebarOpen && (
              <Card
                className="p-0 bg-card border-border rounded-lg shadow-sm h-48 overflow-auto animate-slide-in-up"
                role="complementary"
                aria-label="File explorer"
              >
                <FileExplorer
                  files={fileSystem.files}
                  activeFileId={activeFileId}
                  onFileSelect={setActiveFileId}
                  onCreateFile={createNewFile}
                  onDeleteFile={deleteFileById}
                  onRenameFile={renameFile}
                  onDuplicateFile={duplicateFile}
                  theme={{}}
                />
              </Card>
            )}

            <Card
              className="p-0 bg-card border-border rounded-lg shadow-sm flex-1 min-w-0 animate-slide-in-up overflow-hidden"
              role="main"
              aria-label="Code editor"
            >
              <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground/80">
                  <FileText className="h-4 w-4 opacity-50" />
                  <span className="truncate max-w-[200px]">{currentFile?.name || "No file selected"}</span>
                </div>
              </div>

              <div className="w-full h-[500px] sm:h-auto">
                {currentFile ? (
                  <SyntaxHighlighter
                    code={currentFile?.content || ""}
                    language={currentFile?.type || "html"}
                    onChange={updateCurrentFile}
                    fontSize={editorSettings.fontSize}
                    lineNumbers={editorSettings.lineNumbers}
                    wordWrap={editorSettings.wordWrap}
                    className="h-full"
                    theme={appTheme}
                    onCursorChange={setCursorPos}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground" role="status">
                    <div className="text-center">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
                      <p className="font-medium">No file selected</p>
                      <p className="text-sm opacity-70">Create or select a file to start coding</p>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {!zen && isPreviewVisible && (
              <Card
                className="p-0 bg-card border-border rounded-lg shadow-sm min-h-[320px] animate-slide-in-up overflow-hidden"
                role="complementary"
                aria-label="Code preview"
              >
                <PreviewPanel
                  html={preview}
                  isFullscreen={isPreviewFullscreen}
                  onToggleFullscreen={() => setIsPreviewFullscreen(!isPreviewFullscreen)}
                  theme={{}}
                />
              </Card>
            )}
          </div>
        ) : (
          // Desktop with resizable panels
          <ResizablePanelGroup direction={splitOrientation} className="gap-4 h-full">
            {isSidebarOpen && (
              <>
                <ResizablePanel defaultSize={20} minSize={15} maxSize={30} className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
                  <div className="h-full flex flex-col">
                    <div className="px-4 py-3 border-b border-border bg-muted/30">
                      <span className="text-sm font-medium text-muted-foreground">Explorer</span>
                    </div>
                    <div className="flex-1 overflow-auto">
                      <FileExplorer
                        files={fileSystem.files}
                        activeFileId={activeFileId}
                        onFileSelect={setActiveFileId}
                        onCreateFile={createNewFile}
                        onDeleteFile={deleteFileById}
                        onRenameFile={renameFile}
                        onDuplicateFile={duplicateFile}
                        theme={{}}
                      />
                    </div>
                  </div>
                </ResizablePanel>
                <ResizableHandle withHandle className="bg-transparent hover:bg-primary/10 w-2 transition-colors" />
              </>
            )}

            <ResizablePanel defaultSize={isPreviewVisible ? 45 : 70} minSize={30} className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
              <div className="h-full flex flex-col">
                <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground/80">
                    <FileText className="h-4 w-4 opacity-50" />
                    <span className="truncate max-w-[300px]">{currentFile?.name || "No file selected"}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSplitOrientation((o) => (o === "horizontal" ? "vertical" : "horizontal"))}
                      className="h-7 w-7 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
                      title="Toggle split"
                    >
                      {splitOrientation === "horizontal" ? (
                        <Rows className="h-3.5 w-3.5" />
                      ) : (
                        <Columns className="h-3.5 w-3.5" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsPreviewVisible(!isPreviewVisible)}
                      className="h-7 w-7 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
                      title={isPreviewVisible ? "Hide preview" : "Show preview"}
                    >
                      {isPreviewVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setZen((z) => !z)}
                      className="h-7 w-7 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
                      title="Zen mode"
                    >
                      <Focus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="flex-1 relative">
                  {currentFile ? (
                    <div className="h-full absolute inset-0">
                      <SyntaxHighlighter
                        code={currentFile?.content || ""}
                        language={currentFile?.type || "html"}
                        onChange={updateCurrentFile}
                        fontSize={editorSettings.fontSize}
                        lineNumbers={editorSettings.lineNumbers}
                        wordWrap={editorSettings.wordWrap}
                        className="h-full"
                        theme={appTheme}
                        onCursorChange={setCursorPos}
                      />
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground" role="status">
                      <div className="text-center">
                        <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
                        <p className="font-medium">No file selected</p>
                        <p className="text-sm opacity-70">Create or select a file to start coding</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </ResizablePanel>

            {isPreviewVisible && (
              <>
                <ResizableHandle withHandle className="bg-transparent hover:bg-primary/10 w-2 transition-colors" />
                <ResizablePanel defaultSize={35} minSize={25} className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
                  <div className={`h-full flex flex-col ${isPreviewFullscreen ? "fixed inset-0 z-50 bg-background" : ""}`}>
                    <PreviewPanel
                      html={preview}
                      isFullscreen={isPreviewFullscreen}
                      onToggleFullscreen={() => setIsPreviewFullscreen(!isPreviewFullscreen)}
                      theme={{}}
                    />
                  </div>
                </ResizablePanel>
              </>
            )}
          </ResizablePanelGroup>
        )}
      </div>

      {!zen && (
        <EnhancedStatusBar
          fileName={currentFile?.name}
          language={currentLanguage.name}
          lines={linesCount}
          cursor={cursorPos}
          savedAt={lastSaved}
          className="mt-2"
        />
      )}

      {/* Panels */}
      <SettingsPanel isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} theme={{}} />
      <SearchPanel
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        theme={{}}
        currentFile={currentFile}
        onReplace={(searchTerm, replaceTerm) => {
          if (!currentFile) return
          const rx = new RegExp(searchTerm, "g")
          const newContent = (currentFile.content || "").replace(rx, replaceTerm)
          updateCurrentFile(newContent)
          showNotification(`Replaced "${searchTerm}"`)
        }}
      />
      <ProjectSearch
        isOpen={projectSearchOpen}
        onClose={() => setProjectSearchOpen(false)}
        files={fileSystem.files}
        onOpenFile={(id) => setActiveFileId(id)}
        theme={{}}
      />
      <CommandPalette open={commandOpen} setOpen={setCommandOpen} actions={commandActions} />

      {/* Mobile close button for fullscreen preview */}
      {isPreviewFullscreen && (
        <Button
          variant="ghost"
          size="icon"
          className="fixed top-4 right-4 z-50 h-10 w-10 rounded-full bg-card/80 backdrop-blur-xl border border-border shadow-xl hover:bg-card"
          onClick={() => setIsPreviewFullscreen(false)}
          title="Exit fullscreen"
          aria-label="Exit fullscreen"
        >
          <X className="h-5 w-5" />
        </Button>
      )}
    </div>
  )
}

export default function CodeEditor() {
  return (
    <SettingsProvider>
      <CodeEditorContent />
    </SettingsProvider>
  )
}
