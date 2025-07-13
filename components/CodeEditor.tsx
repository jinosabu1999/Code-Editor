"use client"

import type React from "react"
import { useState, useEffect, useCallback, useReducer } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Undo,
  Redo,
  Upload,
  Download,
  SettingsIcon,
  Save,
  Menu,
  X,
  ChevronLeft,
  Trash2,
  Search,
  Copy,
  ClipboardPasteIcon as Paste,
  ZoomIn,
  ZoomOut,
  FileText,
  Play,
  Square,
  RotateCcw,
  Eye,
  EyeOff,
  Code,
} from "lucide-react"

import { SettingsProvider, useSettings } from "@/contexts/settings-context"
import SyntaxHighlighter from "@/components/syntax-highlighter"
import FileExplorer from "@/components/file-explorer"
import SettingsPanel from "@/components/settings-panel"
import PreviewPanel from "@/components/preview-panel"
import SearchPanel from "@/components/search-panel"
import {
  type FileSystemState,
  initialFileSystem,
  getFileById,
  createFile,
  updateFile,
  deleteFile,
} from "@/utils/file-system"

const getLanguageFromFileName = (fileName) => {
  const extension = fileName.split(".").pop()?.toLowerCase()
  switch (extension) {
    case "html":
      return {
        name: "HTML",
        template: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
</head>
<body>
    <h1>Hello World!</h1>
</body>
</html>`,
      }
    case "css":
      return {
        name: "CSS",
        template: `/* CSS Reset */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: Arial, sans-serif;
    line-height: 1.6;
    color: #333;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
}`,
      }
    case "js":
      return {
        name: "JavaScript",
        template: `// JavaScript ES6+ Template
console.log('Hello World!');

// Function example
const greet = (name) => {
    return \`Hello, \${name}!\`;
};

// Event listener example
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded');
});`,
      }
    default:
      return null
  }
}

// Enhanced reducer for file system operations with proper history
function fileSystemReducer(state: FileSystemState, action) {
  switch (action.type) {
    case "CREATE_FILE":
      return createFile(
        state,
        action.name,
        action.fileType,
        action.content || getLanguageFromFileName(action.name)?.template || "",
        action.parentId,
      )

    case "UPDATE_FILE":
      const fileToUpdate = getFileById(state.files, action.id)
      if (fileToUpdate && action.updates.content !== undefined) {
        // Handle history for undo/redo
        const currentContent = fileToUpdate.content
        const newContent = action.updates.content

        if (currentContent !== newContent) {
          const history = fileToUpdate.history || [currentContent]
          const historyIndex = fileToUpdate.historyIndex ?? 0

          // Add to history if it's a new change (not undo/redo)
          if (!action.skipHistory) {
            const newHistory = [...history.slice(0, historyIndex + 1), newContent]
            action.updates.history = newHistory
            action.updates.historyIndex = newHistory.length - 1
          }
        }
      }
      return updateFile(state, action.id, action.updates)

    case "DELETE_FILE":
      return deleteFile(state, action.id)

    case "SET_STATE":
      return action.state

    case "DUPLICATE_FILE":
      const fileToDuplicate = getFileById(state.files, action.id)
      if (fileToDuplicate) {
        const newName = `${fileToDuplicate.name.split(".")[0]}_copy.${fileToDuplicate.name.split(".").pop()}`
        return createFile(state, newName, fileToDuplicate.type, fileToDuplicate.content, fileToDuplicate.parentId)
      }
      return state

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

  // Fixed themes with proper light theme
  const themes = {
    light: {
      bg: "bg-gradient-to-br from-white to-gray-50",
      text: "text-gray-900",
      primary: "bg-white shadow-lg border border-gray-200",
      secondary: "bg-gray-50",
      accent: "text-blue-600",
      border: "border-gray-200",
      editor: "bg-white text-gray-900",
      button: "bg-blue-600 hover:bg-blue-700 text-white shadow-md",
      activeTab: "bg-white text-blue-600 border-blue-500 border-b-2 shadow-sm",
      inactiveTab: "text-gray-600 hover:text-gray-900 hover:bg-gray-50",
      preview: "bg-white text-gray-900",
      success: "text-green-600",
      warning: "text-yellow-600",
      error: "text-red-600",
    },
    dark: {
      bg: "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900",
      text: "text-slate-100",
      primary: "bg-slate-800/80 backdrop-blur-sm shadow-2xl border-slate-700/50",
      secondary: "bg-slate-700/80 backdrop-blur-sm",
      accent: "text-blue-400",
      border: "border-slate-700/50",
      editor: "bg-slate-900 text-slate-100",
      button: "bg-blue-600 hover:bg-blue-700 text-white shadow-lg",
      activeTab: "bg-slate-900 text-blue-400 border-blue-500 border-b-2 shadow-sm",
      inactiveTab: "text-slate-400 hover:text-slate-200 hover:bg-slate-700",
      preview: "bg-slate-900 text-slate-100",
      success: "text-emerald-400",
      warning: "text-amber-400",
      error: "text-red-400",
    },
  }

  const currentTheme = themes[appTheme] || themes.light

  // Enhanced notification system
  const showNotification = useCallback((message: string, type: "success" | "error" | "warning" = "success") => {
    if (type === "success") {
      setSuccess(message)
      setTimeout(() => setSuccess(""), 3000)
    } else if (type === "error") {
      setError(message)
      setTimeout(() => setError(""), 5000)
    }
  }, [])

  // Load saved files from localStorage
  useEffect(() => {
    const savedFileSystem = localStorage.getItem("code-editor-files")
    if (savedFileSystem) {
      try {
        const parsedState = JSON.parse(savedFileSystem)
        dispatch({ type: "SET_STATE", state: parsedState })

        if (parsedState.files.length > 0) {
          setActiveFileId(parsedState.files[0].id)
        }
      } catch (e) {
        showNotification("Failed to load saved files", "error")
      }
    }

    // Enhanced keyboard shortcuts
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
          case "d":
            if (e.shiftKey) {
              e.preventDefault()
              clearAll()
            }
            break
          case "f":
            e.preventDefault()
            setIsSearchOpen(true)
            break
          case "n":
            e.preventDefault()
            createNewFile("untitled.html", "html")
            break
          case "o":
            e.preventDefault()
            document.getElementById("file-upload")?.click()
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

      // ESC key handlers
      if (e.key === "Escape") {
        setIsSearchOpen(false)
        setIsSettingsOpen(false)
        if (isPreviewFullscreen) {
          setIsPreviewFullscreen(false)
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Auto-save functionality
  useEffect(() => {
    if (editorSettings.autoSave) {
      const saveTimer = setInterval(() => {
        saveCurrentFile()
      }, 30000)
      return () => clearInterval(saveTimer)
    }
  }, [editorSettings.autoSave, fileSystem])

  // Update preview when active file changes
  useEffect(() => {
    updatePreview()
  }, [activeFileId, fileSystem])

  // Save file system to localStorage
  useEffect(() => {
    localStorage.setItem("code-editor-files", JSON.stringify(fileSystem))
  }, [fileSystem])

  // Responsive sidebar
  useEffect(() => {
    setIsSidebarOpen(!isMobileView)
  }, [isMobileView])

  // Zoom functions
  const zoomIn = () => setCurrentZoom((prev) => Math.min(prev + 10, 200))
  const zoomOut = () => setCurrentZoom((prev) => Math.max(prev - 10, 50))
  const resetZoom = () => setCurrentZoom(100)

  // Fixed Undo/Redo operations
  const undo = () => {
    const currentFile = getCurrentFile()
    if (!currentFile || !currentFile.history || currentFile.historyIndex <= 0) {
      showNotification("Nothing to undo", "warning")
      return
    }

    const newIndex = currentFile.historyIndex - 1
    const previousContent = currentFile.history[newIndex]

    dispatch({
      type: "UPDATE_FILE",
      id: activeFileId,
      updates: {
        content: previousContent,
        historyIndex: newIndex,
      },
      skipHistory: true,
    })
    showNotification("Undone")
  }

  const redo = () => {
    const currentFile = getCurrentFile()
    if (!currentFile || !currentFile.history || currentFile.historyIndex >= currentFile.history.length - 1) {
      showNotification("Nothing to redo", "warning")
      return
    }

    const newIndex = currentFile.historyIndex + 1
    const nextContent = currentFile.history[newIndex]

    dispatch({
      type: "UPDATE_FILE",
      id: activeFileId,
      updates: {
        content: nextContent,
        historyIndex: newIndex,
      },
      skipHistory: true,
    })
    showNotification("Redone")
  }

  // Clear all content
  const clearAll = () => {
    const currentFile = getCurrentFile()
    if (!currentFile) return

    if (confirm("Are you sure you want to clear all content? This action cannot be undone.")) {
      updateCurrentFile("")
      showNotification("Content cleared")
    }
  }

  // Enhanced file upload handler
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files.length === 0) return

    files.forEach((file) => {
      const reader = new FileReader()
      reader.onload = (e: ProgressEvent<FileReader>) => {
        const content = e.target?.result as string
        if (content) {
          const languageInfo = getLanguageFromFileName(file.name)

          if (!languageInfo) {
            showNotification(`Invalid file type: ${file.name}. Please upload .html, .css, or .js files`, "error")
            return
          }

          const fileType = file.name.split(".").pop()?.toLowerCase()

          dispatch({
            type: "CREATE_FILE",
            name: file.name,
            fileType,
            content,
          })

          setActiveFileId(fileSystem.nextId)
          showNotification(`File ${file.name} uploaded successfully`)
        }
      }
      reader.readAsText(file)
    })

    // Clear the input
    event.target.value = ""
  }

  // File operations
  const getCurrentFile = useCallback(() => {
    return getFileById(fileSystem.files, activeFileId)
  }, [fileSystem.files, activeFileId])

  const updateCurrentFile = (newContent: string) => {
    const currentFile = getCurrentFile()
    if (!currentFile) return

    dispatch({
      type: "UPDATE_FILE",
      id: activeFileId,
      updates: { content: newContent },
    })

    // Update preview immediately
    updatePreview()
  }

  // Fixed preview update function
  const updatePreview = () => {
    try {
      const currentFile = getCurrentFile()

      if (currentFile && currentFile.type === "html") {
        // If current file is HTML, show it directly
        setPreview(currentFile.content)
        return
      }

      // Look for index.html or any HTML file
      let htmlFile = fileSystem.files.find((f) => f.name === "index.html")
      if (!htmlFile) {
        htmlFile = fileSystem.files.find((f) => f.type === "html")
      }

      if (htmlFile) {
        const cssFiles = fileSystem.files.filter((f) => f.type === "css")
        const jsFiles = fileSystem.files.filter((f) => f.type === "js")

        let htmlContent = htmlFile.content

        // Inject CSS
        if (cssFiles.length > 0) {
          const styleTag = cssFiles.map((file) => `<style>\n${file.content}\n</style>`).join("\n")
          if (htmlContent.includes("</head>")) {
            htmlContent = htmlContent.replace("</head>", `${styleTag}\n</head>`)
          } else {
            htmlContent = `<head>\n${styleTag}\n</head>\n${htmlContent}`
          }
        }

        // Inject JavaScript
        if (jsFiles.length > 0) {
          const scriptTag = jsFiles.map((file) => `<script>\n${file.content}\n</script>`).join("\n")
          if (htmlContent.includes("</body>")) {
            htmlContent = htmlContent.replace("</body>", `${scriptTag}\n</body>`)
          } else {
            htmlContent = `${htmlContent}\n${scriptTag}`
          }
        }

        setPreview(htmlContent)
      } else {
        // Show message when no HTML file exists
        const noFileMessage = `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>No Preview</title>
            <style>
              body {
                display: flex; 
                align-items: center; 
                justify-content: center; 
                height: 100vh; 
                font-family: system-ui, -apple-system, sans-serif;
                background: ${appTheme === "dark" ? "#0F172A" : "#F8FAFC"};
                color: ${appTheme === "dark" ? "#E2E8F0" : "#334155"};
                margin: 0;
                padding: 20px;
                text-align: center;
              }
              .message {
                max-width: 400px;
              }
              .icon {
                font-size: 48px; 
                margin-bottom: 16px;
              }
              h3 {
                margin: 0 0 10px 0; 
                font-size: 18px; 
                font-weight: 600;
              }
              p {
                margin: 0; 
                opacity: 0.7;
              }
            </style>
          </head>
          <body>
            <div class="message">
              <div class="icon">📄</div>
              <h3>No HTML file found</h3>
              <p>Create an HTML file to see the preview</p>
            </div>
          </body>
          </html>
        `
        setPreview(noFileMessage)
      }

      setError("")
    } catch (err) {
      showNotification(`Preview error: ${err.message}`, "error")
    }
  }

  // Enhanced save function
  const saveCurrentFile = () => {
    try {
      localStorage.setItem("code-editor-files", JSON.stringify(fileSystem))
      setLastSaved(new Date())
      const currentFile = getCurrentFile()
      if (currentFile) {
        showNotification(`${currentFile.name} saved successfully!`)
      }
    } catch (e) {
      showNotification("Failed to save file", "error")
    }
  }

  // File management
  const createNewFile = (name: string, type: string, parentId: number | null = null) => {
    dispatch({
      type: "CREATE_FILE",
      name,
      fileType: type,
      parentId,
    })
    setActiveFileId(fileSystem.nextId)
    showNotification(`Created ${name}`)
  }

  const deleteFileById = (id: number) => {
    if (fileSystem.files.length <= 1) {
      showNotification("Cannot delete the only file", "error")
      return
    }

    const fileToDelete = getFileById(fileSystem.files, id)
    if (fileToDelete && confirm(`Are you sure you want to delete ${fileToDelete.name}?`)) {
      dispatch({
        type: "DELETE_FILE",
        id,
      })

      if (activeFileId === id) {
        const remainingFiles = fileSystem.files.filter((f) => f.id !== id)
        if (remainingFiles.length > 0) {
          setActiveFileId(remainingFiles[0].id)
        }
      }
      showNotification(`Deleted ${fileToDelete.name}`)
    }
  }

  const duplicateFile = (id: number) => {
    dispatch({
      type: "DUPLICATE_FILE",
      id,
    })
    showNotification("File duplicated")
  }

  const renameFile = (id: number, newName: string) => {
    dispatch({
      type: "UPDATE_FILE",
      id,
      updates: { name: newName },
    })
    showNotification("File renamed")
  }

  // Enhanced export functionality
  const exportFiles = async () => {
    try {
      const files = fileSystem.files.filter((f) => f.type !== "folder")

      if (files.length === 0) {
        showNotification("No files to export", "error")
        return
      }

      if (files.length === 1) {
        const file = files[0]
        const blob = new Blob([file.content], { type: "text/plain" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = file.name
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)

        showNotification(`${file.name} exported successfully!`)
      } else {
        // Create a simple archive format
        let archiveContent = "# Code Editor Project Export\n\n"
        files.forEach((file) => {
          archiveContent += `## File: ${file.name}\n\`\`\`${file.type}\n${file.content}\n\`\`\`\n\n`
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

        showNotification(`${files.length} files exported successfully!`)
      }
    } catch (e) {
      showNotification("Failed to export files", "error")
    }
  }

  // Copy/Paste functionality
  const copyContent = async () => {
    const currentFile = getCurrentFile()
    if (currentFile) {
      try {
        await navigator.clipboard.writeText(currentFile.content)
        showNotification("Content copied to clipboard")
      } catch (e) {
        showNotification("Failed to copy content", "error")
      }
    }
  }

  const pasteContent = async () => {
    try {
      const text = await navigator.clipboard.readText()
      updateCurrentFile(text)
      showNotification("Content pasted")
    } catch (e) {
      showNotification("Failed to paste content", "error")
    }
  }

  // Fixed run code function
  const runCode = () => {
    setIsRunning(true)
    showNotification("Running code...")

    // Force update preview
    updatePreview()

    setTimeout(() => {
      setIsRunning(false)
      showNotification("Code executed and preview updated!")
    }, 1000)
  }

  return (
    <div
      className={`min-h-screen p-2 sm:p-4 ${currentTheme.bg} ${currentTheme.text} transition-all duration-300 relative overflow-hidden`}
      style={{ zoom: `${currentZoom}%` }}
    >
      {/* Enhanced toolbar with proper alt text */}
      <div className="flex flex-wrap gap-2 sm:gap-4 mb-4">
        <div className="flex items-center space-x-1 sm:space-x-2">
          <Button
            variant="outline"
            size="icon"
            className={`${currentTheme.button} h-8 w-8 sm:h-10 sm:w-10`}
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            title={isSidebarOpen ? "Hide file explorer sidebar" : "Show file explorer sidebar"}
            aria-label={isSidebarOpen ? "Hide sidebar" : "Show sidebar"}
          >
            {isSidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>

          <Button
            variant="outline"
            className={`${currentTheme.button} text-xs sm:text-sm h-8 sm:h-10`}
            onClick={() => createNewFile("untitled.html", "html")}
            title="Create a new HTML file (Ctrl+N)"
            aria-label="Create new file"
          >
            <FileText className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden xs:inline">New</span>
          </Button>

          <Button
            variant="outline"
            className={`${currentTheme.button} text-xs sm:text-sm h-8 sm:h-10`}
            onClick={() => document.getElementById("file-upload")?.click()}
            title="Upload files from your computer (Ctrl+O)"
            aria-label="Upload files"
          >
            <Upload className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden xs:inline">Upload</span>
          </Button>
          <input
            id="file-upload"
            type="file"
            accept=".html,.css,.js"
            multiple
            className="hidden"
            onChange={handleFileUpload}
            aria-label="File upload input"
          />

          <Button
            variant="outline"
            className={`${currentTheme.button} text-xs sm:text-sm h-8 sm:h-10`}
            onClick={exportFiles}
            title="Download all files to your computer"
            aria-label="Download files"
          >
            <Download className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden xs:inline">Download</span>
          </Button>

          <Button
            variant="outline"
            className={`${currentTheme.button} text-xs sm:text-sm h-8 sm:h-10`}
            onClick={saveCurrentFile}
            title="Save current file (Ctrl+S)"
            aria-label="Save file"
          >
            <Save className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden xs:inline">Save</span>
          </Button>
        </div>

        <div className="flex items-center space-x-1 sm:space-x-2">
          <Button
            variant="outline"
            size="icon"
            className={`${currentTheme.button} h-8 w-8 sm:h-10 sm:w-10`}
            onClick={() => setIsSearchOpen(true)}
            title="Open search and replace panel (Ctrl+F)"
            aria-label="Search and replace"
          >
            <Search className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            className={`${currentTheme.button} h-8 w-8 sm:h-10 sm:w-10`}
            onClick={copyContent}
            title="Copy current file content to clipboard"
            aria-label="Copy content"
          >
            <Copy className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            className={`${currentTheme.button} h-8 w-8 sm:h-10 sm:w-10`}
            onClick={pasteContent}
            title="Paste content from clipboard"
            aria-label="Paste content"
          >
            <Paste className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            className={`${currentTheme.button} h-8 w-8 sm:h-10 sm:w-10`}
            onClick={runCode}
            disabled={isRunning}
            title="Execute the current code and update preview"
            aria-label={isRunning ? "Code is running" : "Run code"}
          >
            {isRunning ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
        </div>

        <div className="flex items-center ml-auto space-x-1 sm:space-x-2">
          <div className="flex items-center space-x-1">
            <Button
              variant="outline"
              size="icon"
              className={`${currentTheme.button} h-8 w-8`}
              onClick={zoomOut}
              title="Zoom out interface (Ctrl+-)"
              aria-label="Zoom out"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span
              className="text-xs font-mono min-w-[3rem] text-center"
              aria-label={`Current zoom level: ${currentZoom}%`}
            >
              {currentZoom}%
            </span>
            <Button
              variant="outline"
              size="icon"
              className={`${currentTheme.button} h-8 w-8`}
              onClick={zoomIn}
              title="Zoom in interface (Ctrl++)"
              aria-label="Zoom in"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>

          <Button
            variant="outline"
            size="icon"
            className={`${currentTheme.button} h-8 w-8 sm:h-10 sm:w-10`}
            onClick={() => setIsPreviewVisible(!isPreviewVisible)}
            title={isPreviewVisible ? "Hide preview panel" : "Show preview panel"}
            aria-label={isPreviewVisible ? "Hide preview" : "Show preview"}
          >
            {isPreviewVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>

          <div className={`text-xs sm:text-sm opacity-70 mr-2 hidden sm:block ${currentTheme.success}`}>
            Last saved: {lastSaved.toLocaleTimeString()}
          </div>

          <Button
            variant="outline"
            size="icon"
            className={`${currentTheme.button} h-8 w-8 sm:h-10 sm:w-10`}
            onClick={() => setIsSettingsOpen(true)}
            title="Open editor settings and preferences"
            aria-label="Open settings"
          >
            <SettingsIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Enhanced notifications */}
      {(error || success) && (
        <Alert
          variant={success ? "default" : "destructive"}
          className={`mb-2 sm:mb-4 ${
            success
              ? appTheme === "dark"
                ? "bg-emerald-900/20 border-emerald-500/50"
                : "bg-emerald-50 border-emerald-200"
              : appTheme === "dark"
                ? "bg-red-900/20 border-red-500/50"
                : "bg-red-50 border-red-200"
          }`}
          role="alert"
          aria-live="polite"
        >
          <AlertDescription className={success ? currentTheme.success : currentTheme.error}>
            {success || error}
          </AlertDescription>
        </Alert>
      )}

      {/* Main content grid */}
      <div className="flex flex-col lg:flex-row gap-2 sm:gap-4 h-[calc(100vh-8rem)]">
        {/* File explorer sidebar */}
        {isSidebarOpen && (
          <Card
            className={`p-2 sm:p-4 ${currentTheme.primary} ${currentTheme.border} w-full lg:w-64 shrink-0 overflow-hidden`}
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
              theme={currentTheme}
            />
          </Card>
        )}

        {/* Editor and Preview Grid */}
        <div className="flex flex-col lg:flex-row gap-2 sm:gap-4 flex-1 overflow-hidden">
          {/* Editor */}
          <Card
            className={`p-2 sm:p-4 ${currentTheme.primary} ${currentTheme.border} flex-1 min-w-0 ${isPreviewFullscreen ? "hidden" : ""}`}
            role="main"
            aria-label="Code editor"
          >
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <div className="flex items-center space-x-1 sm:space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  className={`${currentTheme.button} h-7 w-7`}
                  onClick={undo}
                  title="Undo last change (Ctrl+Z)"
                  aria-label="Undo"
                >
                  <Undo className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className={`${currentTheme.button} h-7 w-7`}
                  onClick={redo}
                  title="Redo last undone change (Ctrl+Y)"
                  aria-label="Redo"
                >
                  <Redo className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className={`${currentTheme.button} h-7 w-7`}
                  onClick={clearAll}
                  title="Clear all content in current file (Ctrl+Shift+D)"
                  aria-label="Clear all content"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className={`${currentTheme.button} h-7 w-7`}
                  onClick={resetZoom}
                  title="Reset zoom to 100% (Ctrl+0)"
                  aria-label="Reset zoom"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>

              <div className={`text-xs sm:text-sm font-medium truncate ${currentTheme.accent} flex items-center`}>
                <Code className="h-4 w-4 mr-2" />
                {getCurrentFile()?.name || "No file selected"}
              </div>
            </div>

            <div className={`w-full h-[calc(100%-2.5rem)] rounded-lg overflow-hidden`}>
              {getCurrentFile() ? (
                <SyntaxHighlighter
                  code={getCurrentFile()?.content || ""}
                  language={getCurrentFile()?.type || "html"}
                  onChange={(newContent) => updateCurrentFile(newContent)}
                  fontSize={editorSettings.fontSize}
                  lineNumbers={editorSettings.lineNumbers}
                  wordWrap={editorSettings.wordWrap}
                  className="h-full"
                  theme={appTheme}
                />
              ) : (
                <div
                  className={`h-full flex items-center justify-center ${appTheme === "dark" ? "text-slate-400" : "text-slate-500"}`}
                  role="status"
                  aria-label="No file selected"
                >
                  <div className="text-center">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No file selected</p>
                    <p className="text-sm opacity-70">Create or select a file to start coding</p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Preview */}
          {isPreviewVisible && (
            <Card
              className={`p-2 sm:p-4 ${currentTheme.primary} ${currentTheme.border}
              ${isPreviewFullscreen ? "fixed inset-2 sm:inset-4 z-50" : "flex-1 min-w-0"}`}
              role="complementary"
              aria-label="Code preview"
            >
              <PreviewPanel
                html={preview}
                isFullscreen={isPreviewFullscreen}
                onToggleFullscreen={() => setIsPreviewFullscreen(!isPreviewFullscreen)}
                theme={currentTheme}
              />
            </Card>
          )}
        </div>
      </div>

      {/* Enhanced panels */}
      <SettingsPanel isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} theme={currentTheme} />
      <SearchPanel
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        theme={currentTheme}
        currentFile={getCurrentFile()}
        onReplace={(searchTerm, replaceTerm) => {
          const currentFile = getCurrentFile()
          if (currentFile) {
            const newContent = currentFile.content.replace(new RegExp(searchTerm, "g"), replaceTerm)
            updateCurrentFile(newContent)
            showNotification(`Replaced "${searchTerm}" with "${replaceTerm}"`)
          }
        }}
      />

      {/* Mobile close button for fullscreen preview */}
      {isPreviewFullscreen && (
        <Button
          variant="outline"
          size="icon"
          className={`${currentTheme.button} fixed top-4 right-4 z-50 lg:hidden`}
          onClick={() => setIsPreviewFullscreen(false)}
          title="Exit fullscreen preview mode"
          aria-label="Exit fullscreen"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}

// Wrap the component with the settings provider
export default function CodeEditor() {
  return (
    <SettingsProvider>
      <CodeEditorContent />
    </SettingsProvider>
  )
}
