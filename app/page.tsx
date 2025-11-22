"use client"
import { useState, useEffect, useRef } from "react"
import {
  Menu,
  SettingsIcon,
  Home,
  FolderGit2,
  Code2,
  Plus,
  Search,
  Play,
  ChevronRight,
  Save,
  RotateCcw,
  RotateCw,
  Palette,
  Type,
  Clock,
  WrapText,
  Download,
  RefreshCw,
  Info,
  HelpCircle,
  Shield,
  MoreVertical,
  ArrowLeft,
  X,
  FileText,
  Edit2,
  Trash2,
} from "lucide-react"
import { cn } from "@/lib/utils"

// --- Types ---
type Project = {
  id: string
  name: string
  language: "Python" | "JavaScript" | "TypeScript" | "HTML/CSS"
  status: "In Progress" | "Completed" | "Archived"
  progress: number
  updatedAt: Date
  files: CodeFile[]
}

type CodeFile = {
  id: string
  name: string
  content: string
  language: string
}

type AppTheme = "dark" | "light"

// --- Helper Functions ---
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

const formatTimeAgo = (date: Date) => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

const getLanguageFromExtension = (filename: string): string => {
  const ext = filename.split(".").pop()?.toLowerCase()
  switch (ext) {
    case "html":
      return "html"
    case "css":
      return "css"
    case "js":
      return "javascript"
    case "ts":
      return "typescript"
    case "jsx":
      return "javascript"
    case "tsx":
      return "typescript"
    case "json":
      return "json"
    default:
      return "plaintext"
  }
}

export default function CodeEditorApp() {
  // --- State ---
  const [currentView, setCurrentView] = useState<"dashboard" | "projects" | "editor" | "settings">("dashboard")
  const [projects, setProjects] = useState<Project[]>([])
  const [currentProject, setCurrentProject] = useState<Project | null>(null)
  const [currentFileId, setCurrentFileId] = useState<string>("")

  // Settings
  const [appTheme, setAppTheme] = useState<AppTheme>("dark")
  const [fontSize, setFontSize] = useState(14)
  const [autoIndent, setAutoIndent] = useState(false)
  const [wordWrap, setWordWrap] = useState(true)
  const [autoSave, setAutoSave] = useState(true)
  const [autoSaveInterval, setAutoSaveInterval] = useState(5)

  // UI State
  const [searchQuery, setSearchQuery] = useState("")
  const [filterLanguage, setFilterLanguage] = useState<string | null>(null)
  const [showSidebar, setShowSidebar] = useState(false)
  const [showNewFileDialog, setShowNewFileDialog] = useState(false)
  const [newFileName, setNewFileName] = useState("")
  const [editingFileId, setEditingFileId] = useState<string | null>(null)
  const [editingFileName, setEditingFileName] = useState("")

  // Editor State
  const [history, setHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // --- Load from localStorage ---
  useEffect(() => {
    const savedProjects = localStorage.getItem("coder-projects")
    const savedSettings = localStorage.getItem("coder-settings")

    if (savedProjects) {
      try {
        const parsed = JSON.parse(savedProjects)
        setProjects(
          parsed.map((p: any) => ({
            ...p,
            updatedAt: new Date(p.updatedAt),
          })),
        )
      } catch (e) {
        console.error("Failed to load projects")
      }
    }

    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings)
        setAppTheme(settings.appTheme || "dark")
        setFontSize(settings.fontSize || 14)
        setAutoIndent(settings.autoIndent || false)
        setWordWrap(settings.wordWrap || true)
        setAutoSave(settings.autoSave || true)
        setAutoSaveInterval(settings.autoSaveInterval || 5)
      } catch (e) {
        console.error("Failed to load settings")
      }
    }
  }, [])

  // --- Save to localStorage ---
  useEffect(() => {
    if (projects.length > 0) {
      localStorage.setItem("coder-projects", JSON.stringify(projects))
    }
  }, [projects])

  useEffect(() => {
    const settings = {
      appTheme,
      fontSize,
      autoIndent,
      wordWrap,
      autoSave,
      autoSaveInterval,
    }
    localStorage.setItem("coder-settings", JSON.stringify(settings))
  }, [appTheme, fontSize, autoIndent, wordWrap, autoSave, autoSaveInterval])

  // --- Apply theme ---
  useEffect(() => {
    if (appTheme === "dark") {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [appTheme])

  // --- Auto-save functionality ---
  useEffect(() => {
    if (!autoSave || !currentProject || !currentFileId) return

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
    }

    autoSaveTimerRef.current = setTimeout(() => {
      const currentFile = currentProject.files.find((f) => f.id === currentFileId)
      if (currentFile && textareaRef.current) {
        handleSaveFile()
      }
    }, autoSaveInterval * 1000)

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [currentProject, currentFileId, autoSave, autoSaveInterval])

  // --- Project Management ---
  const createProject = (name: string, language: Project["language"]) => {
    const newProject: Project = {
      id: generateId(),
      name,
      language,
      status: "In Progress",
      progress: 0,
      updatedAt: new Date(),
      files: [
        {
          id: generateId(),
          name: language === "HTML/CSS" ? "index.html" : "main.js",
          content:
            language === "HTML/CSS"
              ? "<!DOCTYPE html>\n<html>\n<head>\n  <title>My App</title>\n</head>\n<body>\n  <h1>Hello World!</h1>\n</body>\n</html>"
              : "// Start coding here\nconsole.log('Hello, World!');",
          language: language === "HTML/CSS" ? "html" : "javascript",
        },
      ],
    }
    setProjects((prev) => [newProject, ...prev])
    setCurrentProject(newProject)
    setCurrentFileId(newProject.files[0].id)
    setCurrentView("editor")
  }

  const deleteProject = (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id))
    if (currentProject?.id === id) {
      setCurrentProject(null)
      setCurrentFileId("")
      setCurrentView("dashboard")
    }
  }

  const openProject = (project: Project) => {
    setCurrentProject(project)
    if (project.files.length > 0) {
      setCurrentFileId(project.files[0].id)
    }
    setCurrentView("editor")
  }

  const createFile = () => {
    if (!currentProject || !newFileName.trim()) return

    const newFile: CodeFile = {
      id: generateId(),
      name: newFileName.trim(),
      content: "",
      language: getLanguageFromExtension(newFileName.trim()),
    }

    const updatedProject = {
      ...currentProject,
      files: [...currentProject.files, newFile],
      updatedAt: new Date(),
    }

    setProjects((prev) => prev.map((p) => (p.id === currentProject.id ? updatedProject : p)))
    setCurrentProject(updatedProject)
    setCurrentFileId(newFile.id)
    setNewFileName("")
    setShowNewFileDialog(false)
  }

  const deleteFile = (fileId: string) => {
    if (!currentProject) return

    const updatedFiles = currentProject.files.filter((f) => f.id !== fileId)
    if (updatedFiles.length === 0) {
      alert("Cannot delete the last file")
      return
    }

    const updatedProject = {
      ...currentProject,
      files: updatedFiles,
      updatedAt: new Date(),
    }

    setProjects((prev) => prev.map((p) => (p.id === currentProject.id ? updatedProject : p)))
    setCurrentProject(updatedProject)

    if (currentFileId === fileId) {
      setCurrentFileId(updatedFiles[0].id)
    }
  }

  const renameFile = (fileId: string, newName: string) => {
    if (!currentProject || !newName.trim()) return

    const updatedFiles = currentProject.files.map((f) =>
      f.id === fileId ? { ...f, name: newName.trim(), language: getLanguageFromExtension(newName.trim()) } : f,
    )

    const updatedProject = {
      ...currentProject,
      files: updatedFiles,
      updatedAt: new Date(),
    }

    setProjects((prev) => prev.map((p) => (p.id === currentProject.id ? updatedProject : p)))
    setCurrentProject(updatedProject)
    setEditingFileId(null)
    setEditingFileName("")
  }

  // --- File Editing ---
  const handleCodeChange = (value: string) => {
    if (!currentProject || !currentFileId) return

    const updatedFiles = currentProject.files.map((f) => (f.id === currentFileId ? { ...f, content: value } : f))

    const updatedProject = {
      ...currentProject,
      files: updatedFiles,
      updatedAt: new Date(),
    }

    setCurrentProject(updatedProject)

    // Update history for undo/redo
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(value)
    if (newHistory.length > 50) newHistory.shift()
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }

  const handleSaveFile = () => {
    if (!currentProject) return
    setProjects((prev) => prev.map((p) => (p.id === currentProject.id ? currentProject : p)))
  }

  const handleUndo = () => {
    if (historyIndex > 0 && textareaRef.current) {
      const prevValue = history[historyIndex - 1]
      textareaRef.current.value = prevValue
      handleCodeChange(prevValue)
      setHistoryIndex(historyIndex - 1)
    }
  }

  const handleRedo = () => {
    if (historyIndex < history.length - 1 && textareaRef.current) {
      const nextValue = history[historyIndex + 1]
      textareaRef.current.value = nextValue
      handleCodeChange(nextValue)
      setHistoryIndex(historyIndex + 1)
    }
  }

  const runCode = () => {
    if (!currentProject || !currentFileId) return

    const currentFile = currentProject.files.find((f) => f.id === currentFileId)
    if (!currentFile) return

    if (currentFile.language === "html" || currentFile.name.endsWith(".html")) {
      // Find associated CSS and JS files
      const cssFile = currentProject.files.find((f) => f.name.endsWith(".css"))
      const jsFile = currentProject.files.find((f) => f.name.endsWith(".js"))

      let fullHTML = currentFile.content

      if (cssFile) {
        fullHTML = fullHTML.replace("</head>", `<style>${cssFile.content}</style>\n</head>`)
      }

      if (jsFile) {
        fullHTML = fullHTML.replace("</body>", `<script>${jsFile.content}</script>\n</body>`)
      }

      const newWindow = window.open("", "_blank")
      if (newWindow) {
        newWindow.document.write(fullHTML)
        newWindow.document.close()
      }
    } else if (currentFile.language === "javascript") {
      try {
        // eslint-disable-next-line no-eval
        eval(currentFile.content)
      } catch (err: any) {
        console.error("Runtime error:", err.message)
        alert(`Error: ${err.message}`)
      }
    }
  }

  // --- UI Helpers ---
  const getCurrentFile = () => {
    if (!currentProject || !currentFileId) return null
    return currentProject.files.find((f) => f.id === currentFileId) || null
  }

  const filteredProjects = projects.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesLanguage = !filterLanguage || p.language === filterLanguage
    return matchesSearch && matchesLanguage
  })

  // --- Render Functions ---
  const renderDashboard = () => (
    <div className="flex-1 overflow-auto p-4 md:p-6">
      {/* Search Bar */}
      <div className="mb-6 relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search projects..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 rounded-xl bg-accent/50 border border-border focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <button
          onClick={() => {
            const name = prompt("Project name:")
            if (name) createProject(name, "JavaScript")
          }}
          className="flex flex-col items-center justify-center p-6 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 hover:border-primary/40 transition-all"
        >
          <Plus className="w-8 h-8 text-primary mb-2" />
          <h3 className="font-semibold">New File</h3>
          <p className="text-sm text-muted-foreground">Start a new file</p>
        </button>

        <button
          onClick={() => setCurrentView("projects")}
          className="flex flex-col items-center justify-center p-6 rounded-2xl bg-gradient-to-br from-secondary/20 to-secondary/5 border border-secondary/20 hover:border-secondary/40 transition-all"
        >
          <Search className="w-8 h-8 text-secondary mb-2" />
          <h3 className="font-semibold">Search</h3>
          <p className="text-sm text-muted-foreground">Find code</p>
        </button>
      </div>

      {/* My Projects */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">My Projects</h2>

        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FolderGit2 className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
            <p className="text-muted-foreground mb-6">Create your first project to get started</p>
            <button
              onClick={() => {
                const name = prompt("Project name:")
                if (name) createProject(name, "JavaScript")
              }}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity"
            >
              Create Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.slice(0, 4).map((project) => (
              <button
                key={project.id}
                onClick={() => openProject(project)}
                className="relative group overflow-hidden rounded-2xl bg-gradient-to-br from-card to-card/50 border border-border hover:border-primary/50 transition-all p-6 text-left"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-3xl font-bold text-primary">
                    {project.name.charAt(0).toUpperCase()}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (confirm(`Delete ${project.name}?`)) deleteProject(project.id)
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-destructive/20 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </button>
                </div>
                <h3 className="font-semibold text-lg mb-1">{project.name}</h3>
                <p className="text-sm text-muted-foreground">Updated {formatTimeAgo(project.updatedAt)}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  const renderProjects = () => (
    <div className="flex-1 overflow-auto">
      {/* Header */}
      <div className="glass p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Projects</h1>
          <button onClick={() => setSearchQuery("")} className="p-2 hover:bg-accent rounded-lg">
            <Search className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setFilterLanguage(null)}
            className={cn(
              "px-4 py-2 rounded-xl whitespace-nowrap transition-all",
              !filterLanguage ? "bg-primary text-primary-foreground" : "bg-accent/50 text-foreground hover:bg-accent",
            )}
          >
            All
          </button>
          {["Python", "JavaScript", "TypeScript", "HTML/CSS"].map((lang) => (
            <button
              key={lang}
              onClick={() => setFilterLanguage(lang)}
              className={cn(
                "px-4 py-2 rounded-xl whitespace-nowrap transition-all",
                filterLanguage === lang
                  ? "bg-primary text-primary-foreground"
                  : "bg-accent/50 text-foreground hover:bg-accent",
              )}
            >
              {lang}
            </button>
          ))}
        </div>
      </div>

      {/* Project List */}
      <div className="p-4 md:p-6 space-y-4">
        {filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FolderGit2 className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No projects found</h3>
            <p className="text-muted-foreground">Try adjusting your filters or create a new project</p>
          </div>
        ) : (
          filteredProjects.map((project) => (
            <div
              key={project.id}
              className="glass-panel p-4 rounded-2xl hover:border-primary/50 transition-all cursor-pointer"
              onClick={() => openProject(project)}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-lg">{project.name}</h3>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    if (confirm(`Delete ${project.name}?`)) deleteProject(project.id)
                  }}
                  className="p-2 hover:bg-destructive/20 rounded-lg"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="px-3 py-1 rounded-full bg-primary/20 text-primary font-medium">
                  {project.language}
                </span>
                <span>Updated {formatTimeAgo(project.updatedAt)}</span>
              </div>
              <div className="mt-3">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-primary font-medium">{project.status}</span>
                  <span className="text-foreground font-medium">{project.progress}%</span>
                </div>
                <div className="h-2 bg-accent rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-secondary transition-all"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )

  const renderEditor = () => {
    const currentFile = getCurrentFile()

    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="glass p-3 md:p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => setShowSidebar(!showSidebar)} className="p-2 hover:bg-accent rounded-lg md:hidden">
              <Menu className="w-5 h-5" />
            </button>
            <span className="font-mono text-sm">{currentFile?.name || "No file selected"}</span>
          </div>
          <button
            onClick={runCode}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
          >
            <Play className="w-4 h-4" />
            <span className="hidden md:inline">Run</span>
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div
            className={cn(
              "w-64 bg-card border-r border-border overflow-auto transition-all",
              showSidebar ? "translate-x-0" : "-translate-x-full md:translate-x-0",
              "absolute md:relative h-full z-10 md:z-0",
            )}
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Files</h3>
                <button onClick={() => setShowNewFileDialog(true)} className="p-1 hover:bg-accent rounded-lg">
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {currentProject?.files.map((file) => (
                <div key={file.id} className="group">
                  {editingFileId === file.id ? (
                    <div className="flex items-center gap-1 mb-1">
                      <input
                        type="text"
                        value={editingFileName}
                        onChange={(e) => setEditingFileName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") renameFile(file.id, editingFileName)
                          if (e.key === "Escape") {
                            setEditingFileId(null)
                            setEditingFileName("")
                          }
                        }}
                        className="flex-1 px-2 py-1 text-sm bg-accent rounded border border-primary"
                        autoFocus
                      />
                    </div>
                  ) : (
                    <div
                      onClick={() => setCurrentFileId(file.id)}
                      className={cn(
                        "flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer mb-1 group",
                        currentFileId === file.id ? "bg-primary/20 text-primary" : "hover:bg-accent",
                      )}
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <FileText className="w-4 h-4" />
                        <span className="text-sm truncate">{file.name}</span>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingFileId(file.id)
                            setEditingFileName(file.name)
                          }}
                          className="p-1 hover:bg-accent rounded"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            if (confirm(`Delete ${file.name}?`)) deleteFile(file.id)
                          }}
                          className="p-1 hover:bg-destructive/20 rounded"
                        >
                          <Trash2 className="w-3 h-3 text-destructive" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Editor Area */}
          <div className="flex-1 overflow-auto bg-background">
            <textarea
              ref={textareaRef}
              value={currentFile?.content || ""}
              onChange={(e) => handleCodeChange(e.target.value)}
              placeholder="Start coding..."
              className="w-full h-full p-4 bg-transparent resize-none focus:outline-none font-mono"
              style={{
                fontSize: `${fontSize}px`,
                lineHeight: "1.6",
                whiteSpace: wordWrap ? "pre-wrap" : "pre",
                wordWrap: wordWrap ? "break-word" : "normal",
              }}
            />
          </div>
        </div>

        <div className="glass p-2 flex items-center justify-between border-t border-border">
          <div className="flex items-center gap-1">
            <button
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className="p-2 hover:bg-accent rounded-lg disabled:opacity-50"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className="p-2 hover:bg-accent rounded-lg disabled:opacity-50"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <button onClick={handleSaveFile} className="p-2 hover:bg-accent rounded-lg">
              <Save className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                const query = prompt("Search for:")
                if (query && textareaRef.current) {
                  const text = textareaRef.current.value
                  const index = text.indexOf(query)
                  if (index !== -1) {
                    textareaRef.current.focus()
                    textareaRef.current.setSelectionRange(index, index + query.length)
                  }
                }
              }}
              className="p-2 hover:bg-accent rounded-lg"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{currentFile?.language}</span>
            <span>•</span>
            <span>UTF-8</span>
          </div>
        </div>

        {/* New File Dialog */}
        {showNewFileDialog && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-2xl flex items-center justify-center z-50 p-4">
            <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Create New File</h3>
                <button
                  onClick={() => {
                    setShowNewFileDialog(false)
                    setNewFileName("")
                  }}
                  className="p-2 hover:bg-accent rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <input
                type="text"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") createFile()
                  if (e.key === "Escape") {
                    setShowNewFileDialog(false)
                    setNewFileName("")
                  }
                }}
                placeholder="filename.html, style.css, script.js..."
                className="w-full px-4 py-3 bg-accent rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary mb-4"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowNewFileDialog(false)
                    setNewFileName("")
                  }}
                  className="flex-1 px-4 py-2 bg-accent hover:bg-accent/80 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={createFile}
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground hover:opacity-90 rounded-xl"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderSettings = () => (
    <div className="flex-1 overflow-auto">
      <div className="glass p-4 md:p-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setCurrentView("dashboard")} className="p-2 hover:bg-accent rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>
      </div>

      <div className="p-4 md:p-6 space-y-6 max-w-2xl">
        {/* Theme & Appearance */}
        <div>
          <h2 className="text-sm font-bold text-primary mb-4 uppercase tracking-wider">Theme & Appearance</h2>
          <div className="space-y-3">
            <div className="glass-panel p-4 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Palette className="w-5 h-5 text-muted-foreground" />
                <div>
                  <div className="font-medium">App Theme</div>
                  <div className="text-sm text-muted-foreground">{appTheme === "dark" ? "Dark" : "Light"}</div>
                </div>
              </div>
              <button
                onClick={() => setAppTheme(appTheme === "dark" ? "light" : "dark")}
                className="px-4 py-2 bg-accent hover:bg-accent/80 rounded-lg"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Editor Preferences */}
        <div>
          <h2 className="text-sm font-bold text-primary mb-4 uppercase tracking-wider">Editor Preferences</h2>
          <div className="space-y-3">
            <div className="glass-panel p-4 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <Type className="w-5 h-5 text-muted-foreground" />
                <div className="flex-1">
                  <div className="font-medium">Font Size</div>
                  <div className="text-sm text-muted-foreground">{fontSize}px</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFontSize(Math.max(10, fontSize - 2))}
                  className="w-8 h-8 flex items-center justify-center bg-accent hover:bg-accent/80 rounded-lg"
                >
                  -
                </button>
                <button
                  onClick={() => setFontSize(Math.min(24, fontSize + 2))}
                  className="w-8 h-8 flex items-center justify-center bg-accent hover:bg-accent/80 rounded-lg"
                >
                  +
                </button>
              </div>
            </div>

            <div className="glass-panel p-4 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-xl">{"{ }"}</div>
                <div>
                  <div className="font-medium">Auto-indent</div>
                </div>
              </div>
              <button
                onClick={() => setAutoIndent(!autoIndent)}
                className={cn("w-12 h-7 rounded-full transition-all relative", autoIndent ? "bg-primary" : "bg-muted")}
              >
                <div
                  className={cn(
                    "absolute top-1 w-5 h-5 bg-white rounded-full transition-all",
                    autoIndent ? "left-6" : "left-1",
                  )}
                />
              </button>
            </div>

            <div className="glass-panel p-4 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <WrapText className="w-5 h-5 text-muted-foreground" />
                <div>
                  <div className="font-medium">Word Wrap</div>
                </div>
              </div>
              <button
                onClick={() => setWordWrap(!wordWrap)}
                className={cn("w-12 h-7 rounded-full transition-all relative", wordWrap ? "bg-primary" : "bg-muted")}
              >
                <div
                  className={cn(
                    "absolute top-1 w-5 h-5 bg-white rounded-full transition-all",
                    wordWrap ? "left-6" : "left-1",
                  )}
                />
              </button>
            </div>

            <div className="glass-panel p-4 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Automatic Save</div>
                    <div className="text-sm text-muted-foreground">On every {autoSaveInterval} seconds</div>
                  </div>
                </div>
                <button
                  onClick={() => setAutoSave(!autoSave)}
                  className={cn("w-12 h-7 rounded-full transition-all relative", autoSave ? "bg-primary" : "bg-muted")}
                >
                  <div
                    className={cn(
                      "absolute top-1 w-5 h-5 bg-white rounded-full transition-all",
                      autoSave ? "left-6" : "left-1",
                    )}
                  />
                </button>
              </div>
              {autoSave && (
                <input
                  type="range"
                  min="1"
                  max="30"
                  value={autoSaveInterval}
                  onChange={(e) => setAutoSaveInterval(Number(e.target.value))}
                  className="w-full"
                />
              )}
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div>
          <h2 className="text-sm font-bold text-primary mb-4 uppercase tracking-wider">Data Management</h2>
          <div className="space-y-3">
            <button
              onClick={() => {
                const dataStr = JSON.stringify({
                  projects,
                  settings: { appTheme, fontSize, autoIndent, wordWrap, autoSave, autoSaveInterval },
                })
                const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr)
                const link = document.createElement("a")
                link.setAttribute("href", dataUri)
                link.setAttribute("download", "coder-backup.json")
                link.click()
              }}
              className="glass-panel p-4 rounded-xl flex items-center justify-between w-full hover:border-primary/50 transition-all"
            >
              <div className="flex items-center gap-3">
                <Download className="w-5 h-5 text-muted-foreground" />
                <div className="text-left">
                  <div className="font-medium">Export Settings</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5" />
            </button>

            <button
              onClick={() => {
                if (confirm("Reset all settings to default? This cannot be undone.")) {
                  setAppTheme("dark")
                  setFontSize(14)
                  setAutoIndent(false)
                  setWordWrap(true)
                  setAutoSave(true)
                  setAutoSaveInterval(5)
                }
              }}
              className="glass-panel p-4 rounded-xl flex items-center justify-between w-full hover:border-destructive/50 transition-all"
            >
              <div className="flex items-center gap-3">
                <RefreshCw className="w-5 h-5 text-destructive" />
                <div className="text-left">
                  <div className="font-medium text-destructive">Reset to Default Settings</div>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* General */}
        <div>
          <h2 className="text-sm font-bold text-primary mb-4 uppercase tracking-wider">General</h2>
          <div className="space-y-3">
            <button className="glass-panel p-4 rounded-xl flex items-center justify-between w-full hover:border-primary/50 transition-all">
              <div className="flex items-center gap-3">
                <Info className="w-5 h-5 text-muted-foreground" />
                <div className="text-left">
                  <div className="font-medium">About</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5" />
            </button>

            <button className="glass-panel p-4 rounded-xl flex items-center justify-between w-full hover:border-primary/50 transition-all">
              <div className="flex items-center gap-3">
                <HelpCircle className="w-5 h-5 text-muted-foreground" />
                <div className="text-left">
                  <div className="font-medium">Help & Feedback</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5" />
            </button>

            <button className="glass-panel p-4 rounded-xl flex items-center justify-between w-full hover:border-primary/50 transition-all">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-muted-foreground" />
                <div className="text-left">
                  <div className="font-medium">Privacy Policy</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="h-screen flex flex-col bg-background text-foreground">
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {currentView === "dashboard" && renderDashboard()}
        {currentView === "projects" && renderProjects()}
        {currentView === "editor" && renderEditor()}
        {currentView === "settings" && renderSettings()}
      </div>

      {/* Bottom Navigation */}
      <nav className="glass border-t border-border">
        <div className="flex items-center justify-around p-2">
          <button
            onClick={() => setCurrentView("dashboard")}
            className={cn(
              "flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all",
              currentView === "dashboard" ? "text-primary bg-primary/10" : "text-muted-foreground",
            )}
          >
            <Home className="w-5 h-5" />
            <span className="text-xs font-medium">Dashboard</span>
          </button>

          <button
            onClick={() => setCurrentView("projects")}
            className={cn(
              "flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all",
              currentView === "projects" ? "text-primary bg-primary/10" : "text-muted-foreground",
            )}
          >
            <FolderGit2 className="w-5 h-5" />
            <span className="text-xs font-medium">Projects</span>
          </button>

          <button
            onClick={() => {
              if (currentProject) {
                setCurrentView("editor")
              } else {
                alert("Please select or create a project first")
              }
            }}
            className={cn(
              "flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all",
              currentView === "editor" ? "text-primary bg-primary/10" : "text-muted-foreground",
            )}
          >
            <Code2 className="w-5 h-5" />
            <span className="text-xs font-medium">Editor</span>
          </button>

          <button
            onClick={() => setCurrentView("settings")}
            className={cn(
              "flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all",
              currentView === "settings" ? "text-primary bg-primary/10" : "text-muted-foreground",
            )}
          >
            <SettingsIcon className="w-5 h-5" />
            <span className="text-xs font-medium">Settings</span>
          </button>
        </div>
      </nav>
    </div>
  )
}
