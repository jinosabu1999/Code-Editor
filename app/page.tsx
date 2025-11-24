"use client"
import { useState, useEffect, useRef, useCallback } from "react"
import {
  Menu,
  Home,
  FolderGit2,
  Plus,
  Search,
  Play,
  ChevronRight,
  Save,
  Palette,
  Type,
  Clock,
  MoreVertical,
  X,
  Edit2,
  Trash2,
  Undo,
  Redo,
  ChevronUp,
  ChevronDown,
  File,
  AlignLeft,
  ToggleLeft,
  FileCode,
  FolderOpen,
  Code,
  Settings,
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

const formatRelativeTime = (date: Date) => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d`
  const weeks = Math.floor(days / 7)
  return `${weeks}w`
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

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [searchMatches, setSearchMatches] = useState<number[]>([])
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0)
  const [editorSearchQuery, setEditorSearchQuery] = useState("")
  const editorRef = useRef<HTMLTextAreaElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)

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

  const openProject = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId)
    if (project) {
      setCurrentProject(project)
      if (project.files.length > 0) {
        setCurrentFileId(project.files[0].id)
      }
      setCurrentView("editor")
    }
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

  const getProjectStats = () => {
    const total = projects.length
    const htmlFiles = projects.reduce((acc, p) => acc + p.files.filter((f) => f.name.endsWith(".html")).length, 0)
    const cssFiles = projects.reduce((acc, p) => acc + p.files.filter((f) => f.name.endsWith(".css")).length, 0)
    const jsFiles = projects.reduce((acc, p) => acc + p.files.filter((f) => f.name.endsWith(".js")).length, 0)
    const totalLines = projects.reduce(
      (acc, p) => acc + p.files.reduce((sum, f) => sum + f.content.split("\n").length, 0),
      0,
    )
    return { total, htmlFiles, cssFiles, jsFiles, totalLines }
  }

  const searchInEditor = useCallback(() => {
    const currentFile = getCurrentFile()
    if (!editorSearchQuery || !currentFile) return

    const content = currentFile.content.toLowerCase()
    const query = editorSearchQuery.toLowerCase()
    const matches: number[] = []

    let index = content.indexOf(query)
    while (index !== -1) {
      matches.push(index)
      index = content.indexOf(query, index + 1)
    }

    setSearchMatches(matches)
    setCurrentMatchIndex(0)

    if (matches.length > 0 && editorRef.current) {
      editorRef.current.focus()
      editorRef.current.setSelectionRange(matches[0], matches[0] + editorSearchQuery.length)
      editorRef.current.scrollTop = (matches[0] / content.length) * editorRef.current.scrollHeight
    }
  }, [editorSearchQuery])

  const jumpToMatch = useCallback(
    (direction: "next" | "prev") => {
      const currentFile = getCurrentFile()
      if (searchMatches.length === 0 || !editorRef.current || !currentFile) return

      let newIndex = currentMatchIndex
      if (direction === "next") {
        newIndex = (currentMatchIndex + 1) % searchMatches.length
      } else {
        newIndex = (currentMatchIndex - 1 + searchMatches.length) % searchMatches.length
      }

      setCurrentMatchIndex(newIndex)
      const match = searchMatches[newIndex]
      editorRef.current.focus()
      editorRef.current.setSelectionRange(match, match + editorSearchQuery.length)
      editorRef.current.scrollTop = (match / currentFile.content.length) * editorRef.current.scrollHeight
    },
    [searchMatches, currentMatchIndex, editorSearchQuery],
  )

  useEffect(() => {
    if (editorSearchQuery) {
      searchInEditor()
    } else {
      setSearchMatches([])
      setCurrentMatchIndex(0)
    }
  }, [editorSearchQuery, searchInEditor])

  const updateFileContent = (fileId: string, content: string) => {
    if (!currentProject) return

    const updatedFiles = currentProject.files.map((f) => (f.id === fileId ? { ...f, content } : f))
    const updatedProject = { ...currentProject, files: updatedFiles, updatedAt: new Date() }

    setCurrentProject(updatedProject)
    setProjects((prev) => prev.map((p) => (p.id === currentProject.id ? updatedProject : p)))

    // Update history
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(content)
    if (newHistory.length > 50) newHistory.shift()
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }

  const saveCurrentFile = () => {
    if (!currentProject) return
    setProjects((prev) => prev.map((p) => (p.id === currentProject.id ? currentProject : p)))
  }

  const createNewProject = () => {
    const name = prompt("Project name:")
    if (name) createProject(name, "JavaScript")
  }

  // --- Render Functions ---
  // Add app name at top and remove search
  const renderDashboard = () => (
    <div className="flex-1 overflow-auto pb-20">
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <img src="/logo.png" alt="NexLoft" className="w-16 h-16 rounded-2xl" />
          <div>
            <h1 className="text-3xl font-bold">NexLoft</h1>
            <p className="text-muted-foreground">Where Beginners Become Builders</p>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="glass-panel p-4 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FolderOpen className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{projects.length}</p>
                <p className="text-sm text-muted-foreground">Projects</p>
              </div>
            </div>
          </div>

          <div className="glass-panel p-4 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileCode className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{projects.reduce((acc, p) => acc + p.files.length, 0)}</p>
                <p className="text-sm text-muted-foreground">Files</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-3">
          <h2 className="font-semibold">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                const name = prompt("Enter project name:")
                if (name) createProject(name, "JavaScript")
              }}
              className="glass-panel p-4 rounded-xl hover:bg-accent transition-colors text-left"
            >
              <Plus className="w-6 h-6 text-primary mb-2" />
              <p className="font-medium">New Project</p>
              <p className="text-sm text-muted-foreground">Start a new project</p>
            </button>
          </div>
        </div>

        {/* Projects Section */}
        <div className="space-y-3">
          <h2 className="font-semibold">My Projects</h2>
          {projects.length === 0 ? (
            <div className="glass-panel p-8 rounded-xl text-center">
              <FolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground mb-4">No projects yet</p>
              <button
                onClick={() => {
                  const name = prompt("Enter project name:")
                  if (name) createProject(name, "JavaScript")
                }}
                className="btn-primary px-6 py-2 rounded-lg font-medium"
              >
                Create Your First Project
              </button>
            </div>
          ) : (
            <div className="grid gap-3">
              {projects.slice(0, 3).map((project) => (
                <button
                  key={project.id}
                  onClick={() => {
                    setCurrentProject(project)
                    setCurrentFileId(project.files[0]?.id || "")
                    setCurrentView("editor")
                  }}
                  className="glass-panel p-4 rounded-xl hover:bg-accent transition-colors text-left"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{project.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {project.files.length} files • Updated {formatTimeAgo(project.updatedAt)}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        {projects.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-semibold">Recent Activity</h2>
            <div className="glass-panel p-4 rounded-xl space-y-3">
              {projects
                .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
                .slice(0, 5)
                .map((project) => (
                  <div key={project.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <FileCode className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{project.name}</p>
                      <p className="text-sm text-muted-foreground">{formatRelativeTime(project.updatedAt)}</p>
                    </div>
                  </div>
                ))}
            </div>
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
              onClick={() => openProject(project.id)}
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

  // Collapsible sidebar with smooth transitions
  // Expand sidebar button when collapsed
  // Search bar with match navigation
  const renderEditor = () => {
    if (!currentProject) {
      return (
        <div className="flex-1 flex items-center justify-center pb-20">
          <div className="text-center space-y-4 p-6">
            <FileCode className="w-16 h-16 text-muted-foreground mx-auto" />
            <h2 className="text-xl font-semibold">No Project Selected</h2>
            <p className="text-muted-foreground">Create a new project or select an existing one to start coding</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  const name = prompt("Enter project name:")
                  if (name) {
                    createProject(name, "JavaScript") // Use the main createProject function
                    setCurrentView("editor")
                  }
                }}
                className="btn-primary px-6 py-2 rounded-lg font-medium"
              >
                <Plus className="w-4 h-4 inline mr-2" />
                Create Project
              </button>
              {projects.length > 0 && (
                <button
                  onClick={() => setCurrentView("projects")}
                  className="glass-panel px-6 py-2 rounded-lg font-medium hover:bg-accent"
                >
                  <FolderOpen className="w-4 h-4 inline mr-2" />
                  Select Project
                </button>
              )}
            </div>
          </div>
        </div>
      )
    }

    const currentFile = currentProject.files.find((f) => f.id === currentFileId)

    return (
      <div className="flex-1 flex flex-col overflow-hidden pb-20">
        {/* Editor Header */}
        <div className="glass p-4 flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2 hover:bg-accent rounded-lg md:hidden"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h2 className="font-semibold flex-1 truncate">{currentProject.name}</h2>
          <button onClick={saveCurrentFile} className="p-2 hover:bg-accent rounded-lg" title="Save">
            <Save className="w-4 h-4" />
          </button>
          <button onClick={handleUndo} className="p-2 hover:bg-accent rounded-lg" title="Undo">
            <Undo className="w-4 h-4" />
          </button>
          <button onClick={handleRedo} className="p-2 hover:bg-accent rounded-lg" title="Redo">
            <Redo className="w-4 h-4" />
          </button>
          <button onClick={runCode} className="p-2 hover:bg-primary/20 text-primary rounded-lg" title="Run">
            <Play className="w-4 h-4 fill-current" />
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden relative">
          <div
            className={cn(
              "bg-card border-r border-border transition-all duration-300 ease-in-out flex-shrink-0 relative",
              sidebarCollapsed ? "w-0" : "w-64",
              "overflow-hidden",
            )}
          >
            <div className="p-4 w-64">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Files</h3>
                <div className="flex items-center gap-1">
                  <button onClick={() => setShowNewFileDialog(true)} className="p-1.5 hover:bg-accent rounded-lg">
                    <Plus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setSidebarCollapsed(true)}
                    className="p-1.5 hover:bg-accent rounded-lg"
                    title="Close sidebar"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                {currentProject.files.map((file) => (
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
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all",
                          currentFileId === file.id
                            ? "bg-primary/10 text-primary"
                            : "hover:bg-accent text-muted-foreground hover:text-foreground",
                        )}
                      >
                        <File className="w-4 h-4 flex-shrink-0" />
                        <span className="flex-1 text-sm truncate" onClick={() => setCurrentFileId(file.id)}>
                          {file.name}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingFileId(file.id)
                            setEditingFileName(file.name)
                          }}
                          className="p-1.5 hover:bg-primary/20 rounded opacity-100 text-primary"
                          title="Rename"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteFile(file.id)
                          }}
                          className="p-1.5 hover:bg-destructive/20 rounded opacity-100 text-destructive"
                          title="Delete"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {sidebarCollapsed && (
            <button
              onClick={() => setSidebarCollapsed(false)}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-primary text-primary-foreground rounded-r-lg shadow-lg hover:pl-3 transition-all"
              title="Open sidebar"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}

          {/* Editor Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {currentFile ? (
              <>
                <div className="p-2 bg-accent/50 border-b border-border flex items-center gap-2">
                  <Search className="w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={editorSearchQuery}
                    onChange={(e) => setEditorSearchQuery(e.target.value)}
                    placeholder="Search in file..."
                    className="flex-1 bg-transparent outline-none text-sm"
                  />
                  {searchMatches.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {currentMatchIndex + 1} of {searchMatches.length}
                      </span>
                      <button
                        onClick={() => jumpToMatch("prev")}
                        className="p-1 hover:bg-accent rounded"
                        title="Previous match"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => jumpToMatch("next")}
                        className="p-1 hover:bg-accent rounded"
                        title="Next match"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditorSearchQuery("")}
                        className="p-1 hover:bg-accent rounded"
                        title="Clear search"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex-1 relative overflow-hidden font-mono" style={{ fontSize: `${fontSize}px` }}>
                  {/* Line Numbers */}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-12 bg-muted/30 text-muted-foreground text-right pr-2 pt-3 select-none overflow-hidden"
                    style={{ fontSize: `${fontSize}px`, lineHeight: `${fontSize * 1.5}px` }}
                  >
                    {currentFile.content.split("\n").map((_, i) => (
                      <div key={i} style={{ height: `${fontSize * 1.5}px` }}>
                        {i + 1}
                      </div>
                    ))}
                  </div>

                  {/* Code Editor */}
                  <textarea
                    ref={editorRef}
                    value={currentFile.content}
                    onChange={(e) => updateFileContent(currentFileId, e.target.value)}
                    onKeyDown={(e) => {
                      // Directly handleKeyDown here
                      if (!autoIndent) return

                      if (e.key === "Enter") {
                        e.preventDefault()
                        const textarea = e.currentTarget
                        const start = textarea.selectionStart
                        const value = textarea.value
                        const lineStart = value.lastIndexOf("\n", start - 1) + 1
                        const line = value.substring(lineStart, start)
                        const indent = line.match(/^\s*/)?.[0] || ""

                        const newValue = value.substring(0, start) + "\n" + indent + value.substring(start)
                        updateFileContent(currentFileId, newValue)

                        setTimeout(() => {
                          textarea.selectionStart = textarea.selectionEnd = start + indent.length + 1
                        }, 0)
                      }
                    }}
                    className="absolute inset-0 pl-14 pr-4 pt-3 pb-3 bg-transparent resize-none outline-none text-foreground"
                    style={{
                      fontSize: `${fontSize}px`,
                      lineHeight: `${fontSize * 1.5}px`,
                      wordWrap: wordWrap ? "break-word" : "normal",
                      whiteSpace: wordWrap ? "pre-wrap" : "pre",
                    }}
                    spellCheck={false}
                  />
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <File className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No file selected</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Removed General section
  const renderSettings = () => (
    <div className="flex-1 overflow-auto pb-20">
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold">Settings</h1>

        {/* Theme & Appearance */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-primary uppercase tracking-wider">Theme & Appearance</h2>

          <div className="glass-panel p-4 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Palette className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium">App Theme</p>
                  <p className="text-sm text-muted-foreground">{appTheme === "dark" ? "Dark" : "Light"}</p>
                </div>
              </div>
              <button
                onClick={() => setAppTheme(appTheme === "dark" ? "light" : "dark")}
                className={cn(
                  "relative w-14 h-7 rounded-full transition-colors",
                  appTheme === "dark" ? "bg-primary" : "bg-muted",
                )}
              >
                <div
                  className={cn(
                    "absolute top-1 w-5 h-5 rounded-full bg-white transition-transform",
                    appTheme === "dark" ? "left-8" : "left-1",
                  )}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Editor Preferences */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-primary uppercase tracking-wider">Editor Preferences</h2>

          <div className="glass-panel p-4 rounded-xl space-y-4">
            {/* Font Size */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Type className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium">Font Size</p>
                  <p className="text-sm text-muted-foreground">{fontSize}px</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFontSize(Math.max(10, fontSize - 2))}
                  className="w-8 h-8 rounded-lg bg-muted hover:bg-accent flex items-center justify-center"
                >
                  -
                </button>
                <button
                  onClick={() => setFontSize(Math.min(24, fontSize + 2))}
                  className="w-8 h-8 rounded-lg bg-muted hover:bg-accent flex items-center justify-center"
                >
                  +
                </button>
              </div>
            </div>

            {/* Word Wrap */}
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <div className="flex items-center gap-3">
                <AlignLeft className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium">Word Wrap</p>
                </div>
              </div>
              <button
                onClick={() => setWordWrap(!wordWrap)}
                className={cn("relative w-14 h-7 rounded-full transition-colors", wordWrap ? "bg-primary" : "bg-muted")}
              >
                <div
                  className={cn(
                    "absolute top-1 w-5 h-5 rounded-full bg-white transition-transform",
                    wordWrap ? "left-8" : "left-1",
                  )}
                />
              </button>
            </div>

            {/* Auto Indent */}
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <div className="flex items-center gap-3">
                <ToggleLeft className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium">Auto-indent</p>
                </div>
              </div>
              <button
                onClick={() => setAutoIndent(!autoIndent)}
                className={cn(
                  "relative w-14 h-7 rounded-full transition-colors",
                  autoIndent ? "bg-primary" : "bg-muted",
                )}
              >
                <div
                  className={cn(
                    "absolute top-1 w-5 h-5 rounded-full bg-white transition-transform",
                    autoIndent ? "left-8" : "left-1",
                  )}
                />
              </button>
            </div>

            {/* Auto Save */}
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium">Automatic Save</p>
                  <p className="text-sm text-muted-foreground">On every {autoSaveInterval} seconds</p>
                </div>
              </div>
              <button
                onClick={() => setAutoSave(!autoSave)}
                className={cn("relative w-14 h-7 rounded-full transition-colors", autoSave ? "bg-primary" : "bg-muted")}
              >
                <div
                  className={cn(
                    "absolute top-1 w-5 h-5 rounded-full bg-white transition-transform",
                    autoSave ? "left-8" : "left-1",
                  )}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {currentView === "dashboard" && renderDashboard()}
        {currentView === "projects" && renderProjects()}
        {currentView === "editor" && renderEditor()}
        {currentView === "settings" && renderSettings()}
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 glass-panel border-t border-border z-50">
        <div className="flex items-center justify-around h-16">
          <button
            onClick={() => setCurrentView("dashboard")}
            className={cn(
              "flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors",
              currentView === "dashboard" ? "text-primary" : "text-muted-foreground",
            )}
          >
            <Home className="w-5 h-5" />
            <span className="text-xs">Dashboard</span>
          </button>

          <button
            onClick={() => setCurrentView("projects")}
            className={cn(
              "flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors",
              currentView === "projects" ? "text-primary" : "text-muted-foreground",
            )}
          >
            <FolderOpen className="w-5 h-5" />
            <span className="text-xs">Projects</span>
          </button>

          <button
            onClick={() => setCurrentView("editor")}
            className={cn(
              "flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors",
              currentView === "editor" ? "text-primary" : "text-muted-foreground",
            )}
          >
            <Code className="w-5 h-5" />
            <span className="text-xs">Editor</span>
          </button>

          <button
            onClick={() => setCurrentView("settings")}
            className={cn(
              "flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors",
              currentView === "settings" ? "text-primary" : "text-muted-foreground",
            )}
          >
            <Settings className="w-5 h-5" />
            <span className="text-xs">Settings</span>
          </button>
        </div>
      </nav>

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
