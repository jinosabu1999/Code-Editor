"use client"
import { useState, useEffect, useRef, useCallback } from "react"
import type React from "react"

import {
  Menu,
  Home,
  FolderGit2,
  Plus,
  Search,
  Play,
  ChevronRight,
  Save,
  Type,
  Clock,
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
  Download,
  Upload,
  Copy,
  Zap,
  Sparkles,
  BookOpen,
  Moon,
  Sun,
  Terminal,
  Maximize2,
  Minimize2,
  RotateCcw,
  Check,
  AlertCircle,
  Info,
  Layout,
  Layers,
  Star,
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
  starred?: boolean
}

type CodeFile = {
  id: string
  name: string
  content: string
  language: string
}

type AppTheme = "dark" | "light"

type Toast = {
  id: string
  message: string
  type: "success" | "error" | "info"
}

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
    case "py":
      return "python"
    default:
      return "plaintext"
  }
}

const CODE_SNIPPETS = {
  html: [
    {
      name: "HTML Boilerplate",
      code: `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>Document</title>\n  <link rel="stylesheet" href="style.css">\n</head>\n<body>\n  \n  <script src="script.js"></script>\n</body>\n</html>`,
    },
    { name: "Div Container", code: `<div class="container">\n  \n</div>` },
    {
      name: "Form",
      code: `<form action="" method="post">\n  <label for="input">Label:</label>\n  <input type="text" id="input" name="input">\n  <button type="submit">Submit</button>\n</form>`,
    },
    {
      name: "Navigation",
      code: `<nav>\n  <ul>\n    <li><a href="#">Home</a></li>\n    <li><a href="#">About</a></li>\n    <li><a href="#">Contact</a></li>\n  </ul>\n</nav>`,
    },
  ],
  css: [
    { name: "Reset CSS", code: `* {\n  margin: 0;\n  padding: 0;\n  box-sizing: border-box;\n}` },
    {
      name: "Flexbox Center",
      code: `.center {\n  display: flex;\n  justify-content: center;\n  align-items: center;\n}`,
    },
    {
      name: "Grid Layout",
      code: `.grid {\n  display: grid;\n  grid-template-columns: repeat(3, 1fr);\n  gap: 1rem;\n}`,
    },
    { name: "Media Query", code: `@media (max-width: 768px) {\n  \n}` },
  ],
  javascript: [
    { name: "Console Log", code: `console.log();` },
    { name: "Arrow Function", code: `const functionName = () => {\n  \n};` },
    { name: "Event Listener", code: `document.addEventListener('DOMContentLoaded', () => {\n  \n});` },
    {
      name: "Fetch API",
      code: `fetch('url')\n  .then(response => response.json())\n  .then(data => console.log(data))\n  .catch(error => console.error(error));`,
    },
    { name: "For Loop", code: `for (let i = 0; i < array.length; i++) {\n  \n}` },
    { name: "Array Map", code: `const newArray = array.map(item => {\n  return item;\n});` },
  ],
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
  const [showLineNumbers, setShowLineNumbers] = useState(true)
  const [tabSize, setTabSize] = useState(2)

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

  const [toasts, setToasts] = useState<Toast[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [previewContent, setPreviewContent] = useState("")
  const [showSnippets, setShowSnippets] = useState(false)
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false)
  const [consoleOutput, setConsoleOutput] = useState<string[]>([])
  const [showConsole, setShowConsole] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false)
  const [newProjectName, setNewProjectName] = useState("")
  const [newProjectLanguage, setNewProjectLanguage] = useState<"JavaScript" | "HTML/CSS" | "Python">("JavaScript")

  const showToast = useCallback((message: string, type: "success" | "error" | "info" = "info") => {
    const id = generateId()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3000)
  }, [])

  // --- Load from localStorage ---
  useEffect(() => {
    const savedProjects = localStorage.getItem("nexloft-projects")
    const savedSettings = localStorage.getItem("nexloft-settings")

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
        setShowLineNumbers(settings.showLineNumbers !== false)
        setTabSize(settings.tabSize || 2)
      } catch (e) {
        console.error("Failed to load settings")
      }
    }
  }, [])

  // --- Save to localStorage ---
  useEffect(() => {
    localStorage.setItem("nexloft-projects", JSON.stringify(projects))
  }, [projects])

  useEffect(() => {
    const settings = {
      appTheme,
      fontSize,
      autoIndent,
      wordWrap,
      autoSave,
      autoSaveInterval,
      showLineNumbers,
      tabSize,
    }
    localStorage.setItem("nexloft-settings", JSON.stringify(settings))
  }, [appTheme, fontSize, autoIndent, wordWrap, autoSave, autoSaveInterval, showLineNumbers, tabSize])

  // --- Apply theme ---
  useEffect(() => {
    if (appTheme === "dark") {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [appTheme])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + S to save
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault()
        saveCurrentFile()
        showToast("File saved!", "success")
      }
      // Ctrl/Cmd + B to toggle sidebar
      if ((e.ctrlKey || e.metaKey) && e.key === "b") {
        e.preventDefault()
        setSidebarCollapsed((prev) => !prev)
      }
      // Ctrl/Cmd + P to show snippets
      if ((e.ctrlKey || e.metaKey) && e.key === "p") {
        e.preventDefault()
        setShowSnippets((prev) => !prev)
      }
      // Ctrl/Cmd + Enter to run code
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault()
        runCode()
      }
      // Escape to close modals
      if (e.key === "Escape") {
        setShowSnippets(false)
        setShowKeyboardShortcuts(false)
        setShowConsole(false)
        setShowPreview(false)
        setShowCreateProjectModal(false)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  // --- Project Operations ---
  const createProject = (name: string, language: "JavaScript" | "HTML/CSS" | "Python" = "JavaScript") => {
    const defaultFiles: CodeFile[] =
      language === "HTML/CSS"
        ? [
            {
              id: generateId(),
              name: "index.html",
              content: `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>${name}</title>\n  <link rel="stylesheet" href="style.css">\n</head>\n<body>\n  <h1>Hello World!</h1>\n  <script src="script.js"></script>\n</body>\n</html>`,
              language: "html",
            },
            {
              id: generateId(),
              name: "style.css",
              content: `* {\n  margin: 0;\n  padding: 0;\n  box-sizing: border-box;\n}\n\nbody {\n  font-family: system-ui, sans-serif;\n  min-height: 100vh;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);\n  color: white;\n}\n\nh1 {\n  font-size: 3rem;\n  text-shadow: 2px 2px 4px rgba(0,0,0,0.3);\n}`,
              language: "css",
            },
            {
              id: generateId(),
              name: "script.js",
              content: `// Your JavaScript code here\nconsole.log("Hello from ${name}!");`,
              language: "javascript",
            },
          ]
        : language === "Python"
          ? [
              {
                id: generateId(),
                name: "main.py",
                content: `# ${name}\n# Your Python code here\n\ndef main():\n    print("Hello, World!")\n\nif __name__ == "__main__":\n    main()`,
                language: "python",
              },
            ]
          : [
              {
                id: generateId(),
                name: "main.js",
                content: `// ${name}\n// Your JavaScript code here\n\nfunction greet(name) {\n  console.log(\`Hello, \${name}!\`);\n}\n\ngreet("World");`,
                language: "javascript",
              },
            ]

    const newProject: Project = {
      id: generateId(),
      name,
      language: language === "HTML/CSS" ? "HTML/CSS" : language === "Python" ? "Python" : "JavaScript",
      status: "In Progress",
      progress: 0,
      updatedAt: new Date(),
      files: defaultFiles,
      starred: false,
    }

    setProjects((prev) => [newProject, ...prev])
    setCurrentProject(newProject)
    setCurrentFileId(defaultFiles[0].id)
    setCurrentView("editor")
    showToast(`Project "${name}" created!`, "success")
  }

  const deleteProject = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId)
    if (confirm(`Delete project "${project?.name}"? This cannot be undone.`)) {
      setProjects((prev) => prev.filter((p) => p.id !== projectId))
      if (currentProject?.id === projectId) {
        setCurrentProject(null)
        setCurrentFileId("")
      }
      showToast("Project deleted", "info")
    }
  }

  const toggleStarProject = (projectId: string) => {
    setProjects((prev) => prev.map((p) => (p.id === projectId ? { ...p, starred: !p.starred } : p)))
  }

  const duplicateProject = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId)
    if (project) {
      const newProject: Project = {
        ...project,
        id: generateId(),
        name: `${project.name} (Copy)`,
        updatedAt: new Date(),
        files: project.files.map((f) => ({ ...f, id: generateId() })),
      }
      setProjects((prev) => [newProject, ...prev])
      showToast(`Project duplicated!`, "success")
    }
  }

  const exportProject = (project: Project) => {
    const data = JSON.stringify(project, null, 2)
    const blob = new Blob([data], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${project.name.replace(/\s+/g, "-").toLowerCase()}.json`
    a.click()
    URL.revokeObjectURL(url)
    showToast("Project exported!", "success")
  }

  const importProject = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string)
          const newProject: Project = {
            ...data,
            id: generateId(),
            updatedAt: new Date(),
            files: data.files.map((f: CodeFile) => ({ ...f, id: generateId() })),
          }
          setProjects((prev) => [newProject, ...prev])
          showToast(`Project "${newProject.name}" imported!`, "success")
        } catch (err) {
          showToast("Failed to import project", "error")
        }
      }
      reader.readAsText(file)
    }
    event.target.value = ""
  }

  // --- File Operations ---
  const createFile = (filename: string) => {
    if (!currentProject || !filename) return

    const newFile: CodeFile = {
      id: generateId(),
      name: filename,
      content: "",
      language: getLanguageFromExtension(filename),
    }

    const updatedProject = {
      ...currentProject,
      files: [...currentProject.files, newFile],
      updatedAt: new Date(),
    }

    setCurrentProject(updatedProject)
    setProjects((prev) => prev.map((p) => (p.id === updatedProject.id ? updatedProject : p)))
    setCurrentFileId(newFile.id)
    setShowNewFileDialog(false)
    setNewFileName("")
    showToast(`File "${filename}" created!`, "success")
  }

  const deleteFile = (fileId: string) => {
    if (!currentProject) return

    const file = currentProject.files.find((f) => f.id === fileId)
    if (currentProject.files.length <= 1) {
      showToast("Cannot delete the last file", "error")
      return
    }

    if (confirm(`Delete "${file?.name}"?`)) {
      const updatedFiles = currentProject.files.filter((f) => f.id !== fileId)
      const updatedProject = { ...currentProject, files: updatedFiles, updatedAt: new Date() }
      setCurrentProject(updatedProject)
      setProjects((prev) => prev.map((p) => (p.id === updatedProject.id ? updatedProject : p)))
      if (currentFileId === fileId) {
        setCurrentFileId(updatedFiles[0]?.id || "")
      }
      showToast("File deleted", "info")
    }
  }

  const renameFile = (fileId: string, newName: string) => {
    if (!currentProject || !newName) return

    const updatedFiles = currentProject.files.map((f) =>
      f.id === fileId ? { ...f, name: newName, language: getLanguageFromExtension(newName) } : f,
    )
    const updatedProject = { ...currentProject, files: updatedFiles, updatedAt: new Date() }
    setCurrentProject(updatedProject)
    setProjects((prev) => prev.map((p) => (p.id === updatedProject.id ? updatedProject : p)))
    setEditingFileId(null)
    setEditingFileName("")
    showToast("File renamed", "success")
  }

  // --- Editor Operations ---
  const updateFileContent = (content: string) => {
    if (!currentProject || !currentFileId) return

    const updatedFiles = currentProject.files.map((f) => (f.id === currentFileId ? { ...f, content } : f))
    const updatedProject = { ...currentProject, files: updatedFiles, updatedAt: new Date() }
    setCurrentProject(updatedProject)

    // Add to history for undo/redo
    setHistory((prev) => [...prev.slice(0, historyIndex + 1), content])
    setHistoryIndex((prev) => prev + 1)

    // Auto-save with debounce
    if (autoSave) {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
      autoSaveTimerRef.current = setTimeout(() => {
        setProjects((prev) => prev.map((p) => (p.id === updatedProject.id ? updatedProject : p)))
      }, autoSaveInterval * 1000)
    }
  }

  const saveCurrentFile = useCallback(() => {
    if (!currentProject) return
    setProjects((prev) => prev.map((p) => (p.id === currentProject.id ? currentProject : p)))
  }, [currentProject])

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex((prev) => prev - 1)
      const prevContent = history[historyIndex - 1]
      if (currentProject && currentFileId) {
        const updatedFiles = currentProject.files.map((f) =>
          f.id === currentFileId ? { ...f, content: prevContent } : f,
        )
        setCurrentProject({ ...currentProject, files: updatedFiles })
      }
    }
  }

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex((prev) => prev + 1)
      const nextContent = history[historyIndex + 1]
      if (currentProject && currentFileId) {
        const updatedFiles = currentProject.files.map((f) =>
          f.id === currentFileId ? { ...f, content: nextContent } : f,
        )
        setCurrentProject({ ...currentProject, files: updatedFiles })
      }
    }
  }

  const insertSnippet = (code: string) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const currentFile = currentProject?.files.find((f) => f.id === currentFileId)
    if (!currentFile) return

    const newContent = currentFile.content.substring(0, start) + code + currentFile.content.substring(end)
    updateFileContent(newContent)
    setShowSnippets(false)

    // Set cursor position after snippet
    setTimeout(() => {
      textarea.focus()
      textarea.selectionStart = textarea.selectionEnd = start + code.length
    }, 0)
  }

  const copyCode = () => {
    const currentFile = currentProject?.files.find((f) => f.id === currentFileId)
    if (currentFile) {
      navigator.clipboard.writeText(currentFile.content)
      showToast("Code copied to clipboard!", "success")
    }
  }

  // --- Run Code ---
  const runCode = () => {
    if (!currentProject) return
    setConsoleOutput([])
    setShowConsole(true)

    const htmlFile = currentProject.files.find((f) => f.name.endsWith(".html"))
    const cssFile = currentProject.files.find((f) => f.name.endsWith(".css"))
    const jsFile = currentProject.files.find((f) => f.name.endsWith(".js"))

    if (htmlFile) {
      let html = htmlFile.content
      if (cssFile) {
        html = html.replace("</head>", `<style>${cssFile.content}</style></head>`)
      }
      if (jsFile) {
        // Capture console.log output
        const consoleScript = `
          <script>
            (function() {
              const originalLog = console.log;
              const originalError = console.error;
              const originalWarn = console.warn;
              console.log = function(...args) {
                window.parent.postMessage({ type: 'console', level: 'log', args: args.map(a => String(a)) }, '*');
                originalLog.apply(console, args);
              };
              console.error = function(...args) {
                window.parent.postMessage({ type: 'console', level: 'error', args: args.map(a => String(a)) }, '*');
                originalError.apply(console, args);
              };
              console.warn = function(...args) {
                window.parent.postMessage({ type: 'console', level: 'warn', args: args.map(a => String(a)) }, '*');
                originalWarn.apply(console, args);
              };
              window.onerror = function(msg, url, line) {
                window.parent.postMessage({ type: 'console', level: 'error', args: ['Error: ' + msg + ' (line ' + line + ')'] }, '*');
              };
            })();
          </script>
        `
        html = html.replace("<head>", `<head>${consoleScript}`)
        html = html.replace(/<script src=["']script\.js["']><\/script>/g, `<script>${jsFile.content}</script>`)
      }
      setPreviewContent(html)
      setShowPreview(true)
    } else if (jsFile) {
      // Run JS only
      try {
        const logs: string[] = []
        const originalLog = console.log
        console.log = (...args) => {
          logs.push(args.map((a) => (typeof a === "object" ? JSON.stringify(a, null, 2) : String(a))).join(" "))
        }
        // eslint-disable-next-line no-eval
        eval(jsFile.content)
        console.log = originalLog
        setConsoleOutput(logs)
        if (logs.length === 0) {
          setConsoleOutput(["Code executed successfully (no output)"])
        }
      } catch (err: any) {
        setConsoleOutput([`Error: ${err.message}`])
      }
    } else {
      showToast("No runnable file found", "error")
    }
  }

  // Listen for console messages from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "console") {
        setConsoleOutput((prev) => [...prev, `[${event.data.level}] ${event.data.args.join(" ")}`])
      }
    }
    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  }, [])

  // --- Search in Editor ---
  useEffect(() => {
    if (!editorSearchQuery || !currentProject) {
      setSearchMatches([])
      return
    }

    const currentFile = currentProject.files.find((f) => f.id === currentFileId)
    if (!currentFile) return

    const matches: number[] = []
    let index = 0
    const query = editorSearchQuery.toLowerCase()
    const content = currentFile.content.toLowerCase()

    while ((index = content.indexOf(query, index)) !== -1) {
      matches.push(index)
      index += query.length
    }

    setSearchMatches(matches)
    setCurrentMatchIndex(0)
  }, [editorSearchQuery, currentFileId, currentProject])

  const jumpToMatch = (direction: "next" | "prev") => {
    if (searchMatches.length === 0) return

    let newIndex = currentMatchIndex
    if (direction === "next") {
      newIndex = (currentMatchIndex + 1) % searchMatches.length
    } else {
      newIndex = (currentMatchIndex - 1 + searchMatches.length) % searchMatches.length
    }
    setCurrentMatchIndex(newIndex)

    const textarea = textareaRef.current
    if (textarea) {
      textarea.focus()
      textarea.selectionStart = searchMatches[newIndex]
      textarea.selectionEnd = searchMatches[newIndex] + editorSearchQuery.length

      // Scroll to match
      const lineHeight = fontSize * 1.5
      const linesBeforeMatch = (textarea.value.substring(0, searchMatches[newIndex]).match(/\n/g) || []).length
      textarea.scrollTop = Math.max(0, linesBeforeMatch * lineHeight - 100)
    }
  }

  // --- Handle Tab key for indentation ---
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault()
      const textarea = e.currentTarget
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const spaces = " ".repeat(tabSize)
      const newContent = textarea.value.substring(0, start) + spaces + textarea.value.substring(end)
      updateFileContent(newContent)
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + tabSize
      }, 0)
    }

    // Auto-indent on Enter
    if (e.key === "Enter" && autoIndent) {
      e.preventDefault()
      const textarea = e.currentTarget
      const start = textarea.selectionStart
      const beforeCursor = textarea.value.substring(0, start)
      const currentLine = beforeCursor.split("\n").pop() || ""
      const indent = currentLine.match(/^\s*/)?.[0] || ""
      const newContent = textarea.value.substring(0, start) + "\n" + indent + textarea.value.substring(start)
      updateFileContent(newContent)
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 1 + indent.length
      }, 0)
    }

    // Auto-close brackets
    const brackets: Record<string, string> = { "(": ")", "[": "]", "{": "}", '"': '"', "'": "'", "`": "`" }
    if (brackets[e.key]) {
      e.preventDefault()
      const textarea = e.currentTarget
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const selectedText = textarea.value.substring(start, end)
      const newContent =
        textarea.value.substring(0, start) + e.key + selectedText + brackets[e.key] + textarea.value.substring(end)
      updateFileContent(newContent)
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 1
      }, 0)
    }
  }

  // --- Get line numbers ---
  const getLineNumbers = (content: string) => {
    const lines = content.split("\n").length
    return Array.from({ length: lines }, (_, i) => i + 1)
  }

  // --- Filtered Projects ---
  const filteredProjects = projects.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = !filterLanguage || p.language === filterLanguage
    return matchesSearch && matchesFilter
  })

  const starredProjects = projects.filter((p) => p.starred)
  const recentProjects = [...projects].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()).slice(0, 5)

  // =========================
  // RENDER FUNCTIONS
  // =========================

  const renderDashboard = () => (
    <div className="flex-1 overflow-auto pb-24">
      <div className="p-4 sm:p-6 space-y-6 max-w-4xl mx-auto">
        {/* Header with Logo */}
        <div className="flex items-center gap-4">
          <img src="/logo.png" alt="NexLoft" className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl shadow-lg" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              NexLoft
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">Where Beginners Become Builders</p>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="glass-panel p-4 rounded-xl hover:scale-105 transition-transform">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FolderOpen className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold">{projects.length}</p>
                <p className="text-xs text-muted-foreground">Projects</p>
              </div>
            </div>
          </div>

          <div className="glass-panel p-4 rounded-xl hover:scale-105 transition-transform">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                <FileCode className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold">{projects.reduce((acc, p) => acc + p.files.length, 0)}</p>
                <p className="text-xs text-muted-foreground">Files</p>
              </div>
            </div>
          </div>

          <div className="glass-panel p-4 rounded-xl hover:scale-105 transition-transform">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <Star className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold">{starredProjects.length}</p>
                <p className="text-xs text-muted-foreground">Starred</p>
              </div>
            </div>
          </div>

          <div className="glass-panel p-4 rounded-xl hover:scale-105 transition-transform">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Zap className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold">
                  {projects.filter((p) => p.status === "Completed").length}
                </p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-3">
          <h2 className="font-semibold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <button
              onClick={() => setShowCreateProjectModal(true)}
              className="glass-panel p-4 rounded-xl hover:bg-accent hover:scale-105 transition-all text-left group"
            >
              <Plus className="w-6 h-6 text-primary mb-2 group-hover:rotate-90 transition-transform" />
              <p className="font-medium">New Project</p>
              <p className="text-xs text-muted-foreground">Start fresh</p>
            </button>

            <label className="glass-panel p-4 rounded-xl hover:bg-accent hover:scale-105 transition-all text-left cursor-pointer group">
              <Upload className="w-6 h-6 text-secondary mb-2 group-hover:translate-y-[-2px] transition-transform" />
              <p className="font-medium">Import</p>
              <p className="text-xs text-muted-foreground">Load project</p>
              <input type="file" accept=".json" onChange={importProject} className="hidden" />
            </label>

            <button
              onClick={() => setCurrentView("projects")}
              className="glass-panel p-4 rounded-xl hover:bg-accent hover:scale-105 transition-all text-left group"
            >
              <Layers className="w-6 h-6 text-green-500 mb-2 group-hover:scale-110 transition-transform" />
              <p className="font-medium">Browse</p>
              <p className="text-xs text-muted-foreground">All projects</p>
            </button>
          </div>
        </div>

        {/* Starred Projects */}
        {starredProjects.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-semibold flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500" />
              Starred Projects
            </h2>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
              {starredProjects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => {
                    setCurrentProject(project)
                    setCurrentFileId(project.files[0]?.id || "")
                    setCurrentView("editor")
                  }}
                  className="glass-panel p-4 rounded-xl hover:bg-accent transition-all text-left min-w-[200px] flex-shrink-0"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <h3 className="font-semibold truncate">{project.name}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground">{project.files.length} files</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Recent Projects */}
        <div className="space-y-3">
          <h2 className="font-semibold flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            Recent Projects
          </h2>
          {projects.length === 0 ? (
            <div className="glass-panel p-8 rounded-xl text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <FolderOpen className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">No projects yet</h3>
              <p className="text-muted-foreground mb-4 text-sm">Create your first project to get started</p>
              <button
                onClick={() => setShowCreateProjectModal(true)}
                className="btn-primary px-6 py-2 rounded-lg font-medium"
              >
                <Plus className="w-4 h-4 inline mr-2" />
                Create Project
              </button>
            </div>
          ) : (
            <div className="grid gap-3">
              {recentProjects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => {
                    setCurrentProject(project)
                    setCurrentFileId(project.files[0]?.id || "")
                    setCurrentView("editor")
                  }}
                  className="glass-panel p-4 rounded-xl hover:bg-accent hover:translate-x-1 transition-all text-left group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-lg font-bold text-primary">{project.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold truncate">{project.name}</h3>
                        {project.starred && <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 flex-shrink-0" />}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {project.files.length} files • {formatTimeAgo(project.updatedAt)}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform flex-shrink-0" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tips Section */}
        <div className="glass-panel p-4 rounded-xl bg-gradient-to-r from-primary/5 to-secondary/5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Pro Tip</h3>
              <p className="text-sm text-muted-foreground">
                Use <kbd className="px-1.5 py-0.5 rounded bg-muted text-xs">Ctrl+S</kbd> to save,
                <kbd className="px-1.5 py-0.5 rounded bg-muted text-xs ml-1">Ctrl+P</kbd> for snippets, and
                <kbd className="px-1.5 py-0.5 rounded bg-muted text-xs ml-1">Ctrl+Enter</kbd> to run code.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderProjects = () => (
    <div className="flex-1 overflow-auto pb-24">
      <div className="p-4 sm:p-6 space-y-4 max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-bold">Projects</h1>
          <button
            onClick={() => setShowCreateProjectModal(true)}
            className="w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:scale-105 transition-transform shadow-lg"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-2 flex-wrap">
          <div className="flex-1 min-w-[200px] glass-panel rounded-xl flex items-center px-4">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent px-3 py-3 outline-none"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="p-1 hover:bg-accent rounded">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {["All", "JavaScript", "HTML/CSS", "Python"].map((lang) => (
            <button
              key={lang}
              onClick={() => setFilterLanguage(lang === "All" ? null : lang)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                (lang === "All" && !filterLanguage) || filterLanguage === lang
                  ? "bg-primary text-primary-foreground"
                  : "glass-panel hover:bg-accent",
              )}
            >
              {lang}
            </button>
          ))}
        </div>

        {/* Projects List */}
        {filteredProjects.length === 0 ? (
          <div className="glass-panel p-8 rounded-xl text-center">
            <FolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">{searchQuery ? "No projects found" : "No projects yet"}</p>
            {!searchQuery && (
              <button
                onClick={() => setShowCreateProjectModal(true)}
                className="btn-primary px-6 py-2 rounded-lg font-medium"
              >
                Create Your First Project
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredProjects.map((project) => (
              <div key={project.id} className="glass-panel p-4 rounded-xl hover:bg-accent/50 transition-all group">
                <div className="flex items-start gap-4">
                  <button
                    onClick={() => {
                      setCurrentProject(project)
                      setCurrentFileId(project.files[0]?.id || "")
                      setCurrentView("editor")
                    }}
                    className="flex-1 text-left flex items-center gap-4"
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-lg font-bold text-primary">{project.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold truncate">{project.name}</h3>
                        <span className="px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary">
                          {project.language}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {project.files.length} files • Updated {formatTimeAgo(project.updatedAt)}
                      </p>
                    </div>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleStarProject(project.id)}
                      className={cn(
                        "p-2 rounded-lg transition-colors",
                        project.starred ? "text-yellow-500" : "text-muted-foreground hover:text-yellow-500",
                      )}
                      title={project.starred ? "Unstar" : "Star"}
                    >
                      <Star className={cn("w-5 h-5", project.starred && "fill-current")} />
                    </button>
                    <button
                      onClick={() => exportProject(project)}
                      className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                      title="Export"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => duplicateProject(project.id)}
                      className="p-2 rounded-lg text-muted-foreground hover:text-secondary hover:bg-secondary/10 transition-colors"
                      title="Duplicate"
                    >
                      <Copy className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => deleteProject(project.id)}
                      className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  const renderEditor = () => {
    if (!currentProject) {
      return (
        <div className="flex-1 flex items-center justify-center pb-24">
          <div className="text-center space-y-4 p-6 max-w-md">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mx-auto">
              <FileCode className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-xl font-semibold">No Project Selected</h2>
            <p className="text-muted-foreground">Create a new project or select an existing one to start coding</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => setShowCreateProjectModal(true)}
                className="btn-primary px-6 py-3 rounded-xl font-medium"
              >
                <Plus className="w-4 h-4 inline mr-2" />
                Create Project
              </button>
              {projects.length > 0 && (
                <button
                  onClick={() => setCurrentView("projects")}
                  className="glass-panel px-6 py-3 rounded-xl font-medium hover:bg-accent transition-colors"
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
      <div className={cn("flex-1 flex flex-col overflow-hidden", !isFullscreen && "pb-24")}>
        {/* Editor Header */}
        <div className="glass p-3 flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2 hover:bg-accent rounded-lg"
            title="Toggle sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h2 className="font-semibold flex-1 truncate text-sm sm:text-base">{currentProject.name}</h2>

          <div className="flex items-center gap-1">
            <button onClick={copyCode} className="p-2 hover:bg-accent rounded-lg" title="Copy code">
              <Copy className="w-4 h-4" />
            </button>
            <button onClick={() => setShowSnippets(true)} className="p-2 hover:bg-accent rounded-lg" title="Snippets">
              <Sparkles className="w-4 h-4" />
            </button>
            <button onClick={saveCurrentFile} className="p-2 hover:bg-accent rounded-lg" title="Save">
              <Save className="w-4 h-4" />
            </button>
            <button onClick={handleUndo} className="p-2 hover:bg-accent rounded-lg" title="Undo">
              <Undo className="w-4 h-4" />
            </button>
            <button onClick={handleRedo} className="p-2 hover:bg-accent rounded-lg" title="Redo">
              <Redo className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 hover:bg-accent rounded-lg hidden sm:block"
              title="Toggle fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button onClick={runCode} className="p-2 hover:bg-primary/20 text-primary rounded-lg" title="Run">
              <Play className="w-4 h-4 fill-current" />
            </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden relative">
          {/* Sidebar */}
          <div
            className={cn(
              "bg-card border-r border-border transition-all duration-300 ease-in-out flex-shrink-0 absolute sm:relative z-20 h-full",
              sidebarCollapsed ? "w-0 -translate-x-full sm:translate-x-0" : "w-64 translate-x-0",
              "overflow-hidden",
            )}
          >
            <div className="p-4 w-64 h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Files</h3>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setShowNewFileDialog(true)}
                    className="p-2 hover:bg-accent rounded-lg text-primary"
                    title="New file"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setSidebarCollapsed(true)}
                    className="p-2 hover:bg-accent rounded-lg text-muted-foreground"
                    title="Close sidebar"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="space-y-1 flex-1 overflow-auto">
                {currentProject.files.map((file) => (
                  <div key={file.id} className="group">
                    {editingFileId === file.id ? (
                      <div className="flex items-center gap-1 p-2 bg-accent rounded-lg">
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
                          onBlur={() => {
                            if (editingFileName) renameFile(file.id, editingFileName)
                          }}
                          className="flex-1 px-2 py-1 text-sm bg-background rounded border border-primary outline-none"
                          autoFocus
                        />
                      </div>
                    ) : (
                      <div
                        className={cn(
                          "flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all",
                          currentFileId === file.id
                            ? "bg-primary/10 text-primary border border-primary/20"
                            : "hover:bg-accent text-muted-foreground hover:text-foreground",
                        )}
                        onClick={() => setCurrentFileId(file.id)}
                      >
                        <File className="w-4 h-4 flex-shrink-0" />
                        <span className="flex-1 text-sm truncate">{file.name}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingFileId(file.id)
                            setEditingFileName(file.name)
                          }}
                          className="p-1.5 hover:bg-primary/20 rounded text-primary opacity-70 hover:opacity-100"
                          title="Rename"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteFile(file.id)
                          }}
                          className="p-1.5 hover:bg-destructive/20 rounded text-destructive opacity-70 hover:opacity-100"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* New File Dialog */}
              {showNewFileDialog && (
                <div className="mt-4 p-3 bg-accent rounded-lg">
                  <input
                    type="text"
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    placeholder="filename.html"
                    className="w-full px-3 py-2 bg-background rounded-lg border border-border outline-none focus:border-primary text-sm mb-2"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") createFile(newFileName)
                      if (e.key === "Escape") {
                        setShowNewFileDialog(false)
                        setNewFileName("")
                      }
                    }}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => createFile(newFileName)}
                      className="flex-1 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium"
                    >
                      Create
                    </button>
                    <button
                      onClick={() => {
                        setShowNewFileDialog(false)
                        setNewFileName("")
                      }}
                      className="flex-1 py-1.5 bg-muted rounded-lg text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Toggle (when collapsed) */}
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
                {/* Search Bar */}
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
                      <span className="text-xs text-muted-foreground px-2 py-1 bg-primary/10 rounded-full">
                        {currentMatchIndex + 1} / {searchMatches.length}
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

                {/* Code Editor */}
                <div className="flex-1 relative overflow-hidden font-mono" style={{ fontSize: `${fontSize}px` }}>
                  <div className="absolute inset-0 flex overflow-auto">
                    {/* Line Numbers */}
                    {showLineNumbers && (
                      <div className="flex-shrink-0 bg-muted/30 text-muted-foreground select-none py-4 px-2 text-right border-r border-border">
                        {getLineNumbers(currentFile.content).map((num) => (
                          <div key={num} className="leading-6 h-6">
                            {num}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Editor */}
                    <div className="flex-1 relative">
                      <textarea
                        ref={textareaRef}
                        value={currentFile.content}
                        onChange={(e) => updateFileContent(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className={cn(
                          "absolute inset-0 w-full h-full bg-transparent text-foreground resize-none outline-none p-4 leading-6",
                          "caret-primary",
                        )}
                        style={{
                          fontFamily: "inherit",
                          fontSize: "inherit",
                          tabSize: tabSize,
                          whiteSpace: wordWrap ? "pre-wrap" : "pre",
                          overflowWrap: wordWrap ? "break-word" : "normal",
                        }}
                        spellCheck={false}
                      />
                    </div>
                  </div>
                </div>

                {/* Mobile Toolbar */}
                <div className="glass border-t border-border p-2 flex items-center gap-1 overflow-x-auto sm:hidden">
                  {["{}", "[]", "()", "<>", "=>", ";", ".", '"', "'", "/"].map((char) => (
                    <button
                      key={char}
                      onClick={() => {
                        const textarea = textareaRef.current
                        if (!textarea) return
                        const start = textarea.selectionStart
                        const newContent =
                          currentFile.content.substring(0, start) + char + currentFile.content.substring(start)
                        updateFileContent(newContent)
                        setTimeout(() => {
                          textarea.focus()
                          textarea.selectionStart = textarea.selectionEnd = start + char.length
                        }, 0)
                      }}
                      className="px-3 py-2 bg-muted hover:bg-accent rounded-lg font-mono text-sm flex-shrink-0"
                    >
                      {char}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">Select a file to edit</div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const renderSettings = () => (
    <div className="flex-1 overflow-auto pb-24">
      <div className="p-4 sm:p-6 space-y-6 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold">Settings</h1>

        {/* Theme & Appearance */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-primary uppercase tracking-wider">Theme & Appearance</h2>

          <div className="glass-panel p-4 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {appTheme === "dark" ? (
                  <Moon className="w-5 h-5 text-primary" />
                ) : (
                  <Sun className="w-5 h-5 text-primary" />
                )}
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
                    "absolute top-1 w-5 h-5 rounded-full bg-white transition-transform shadow-sm",
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
                  className="w-10 h-10 rounded-lg bg-muted hover:bg-accent flex items-center justify-center text-lg font-bold"
                >
                  -
                </button>
                <span className="w-12 text-center font-mono">{fontSize}</span>
                <button
                  onClick={() => setFontSize(Math.min(28, fontSize + 2))}
                  className="w-10 h-10 rounded-lg bg-muted hover:bg-accent flex items-center justify-center text-lg font-bold"
                >
                  +
                </button>
              </div>
            </div>

            {/* Tab Size */}
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <div className="flex items-center gap-3">
                <Code className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium">Tab Size</p>
                  <p className="text-sm text-muted-foreground">{tabSize} spaces</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {[2, 4, 8].map((size) => (
                  <button
                    key={size}
                    onClick={() => setTabSize(size)}
                    className={cn(
                      "w-10 h-10 rounded-lg font-medium transition-colors",
                      tabSize === size ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-accent",
                    )}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Line Numbers */}
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <div className="flex items-center gap-3">
                <Layout className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium">Line Numbers</p>
                </div>
              </div>
              <button
                onClick={() => setShowLineNumbers(!showLineNumbers)}
                className={cn(
                  "relative w-14 h-7 rounded-full transition-colors",
                  showLineNumbers ? "bg-primary" : "bg-muted",
                )}
              >
                <div
                  className={cn(
                    "absolute top-1 w-5 h-5 rounded-full bg-white transition-transform shadow-sm",
                    showLineNumbers ? "left-8" : "left-1",
                  )}
                />
              </button>
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
                    "absolute top-1 w-5 h-5 rounded-full bg-white transition-transform shadow-sm",
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
                  <p className="font-medium">Auto Indent</p>
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
                    "absolute top-1 w-5 h-5 rounded-full bg-white transition-transform shadow-sm",
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
                  <p className="font-medium">Auto Save</p>
                  <p className="text-sm text-muted-foreground">Every {autoSaveInterval} seconds</p>
                </div>
              </div>
              <button
                onClick={() => setAutoSave(!autoSave)}
                className={cn("relative w-14 h-7 rounded-full transition-colors", autoSave ? "bg-primary" : "bg-muted")}
              >
                <div
                  className={cn(
                    "absolute top-1 w-5 h-5 rounded-full bg-white transition-transform shadow-sm",
                    autoSave ? "left-8" : "left-1",
                  )}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-primary uppercase tracking-wider">Data Management</h2>

          <div className="glass-panel rounded-xl overflow-hidden">
            <label className="flex items-center justify-between p-4 hover:bg-accent transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <Upload className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium">Import Project</p>
                  <p className="text-sm text-muted-foreground">Load from JSON file</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
              <input type="file" accept=".json" onChange={importProject} className="hidden" />
            </label>

            <div className="border-t border-border" />

            <button
              onClick={() => {
                if (confirm("Reset all settings to default?")) {
                  setFontSize(14)
                  setTabSize(2)
                  setWordWrap(true)
                  setAutoIndent(false)
                  setAutoSave(true)
                  setAutoSaveInterval(5)
                  setShowLineNumbers(true)
                  showToast("Settings reset to defaults", "success")
                }
              }}
              className="flex items-center justify-between p-4 w-full hover:bg-accent transition-colors"
            >
              <div className="flex items-center gap-3">
                <RotateCcw className="w-5 h-5 text-primary" />
                <div className="text-left">
                  <p className="font-medium">Reset Settings</p>
                  <p className="text-sm text-muted-foreground">Restore default values</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>

            <div className="border-t border-border" />

            <button
              onClick={() => {
                if (confirm("Delete ALL projects? This cannot be undone!")) {
                  setProjects([])
                  setCurrentProject(null)
                  localStorage.removeItem("nexloft-projects")
                  showToast("All projects deleted", "info")
                }
              }}
              className="flex items-center justify-between p-4 w-full hover:bg-destructive/10 transition-colors text-destructive"
            >
              <div className="flex items-center gap-3">
                <Trash2 className="w-5 h-5" />
                <div className="text-left">
                  <p className="font-medium">Delete All Projects</p>
                  <p className="text-sm opacity-70">Remove all data</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* About */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-primary uppercase tracking-wider">About</h2>

          <div className="glass-panel p-4 rounded-xl">
            <div className="flex items-center gap-4">
              <img src="/logo.png" alt="NexLoft" className="w-12 h-12 rounded-xl" />
              <div>
                <h3 className="font-semibold">NexLoft</h3>
                <p className="text-sm text-muted-foreground">Version 1.0.0</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-3">
              Where Beginners Become Builders. A mobile-first code editor designed for learning and building.
            </p>
          </div>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-primary uppercase tracking-wider">Keyboard Shortcuts</h2>

          <div className="glass-panel p-4 rounded-xl space-y-3">
            {[
              { key: "Ctrl + S", action: "Save file" },
              { key: "Ctrl + B", action: "Toggle sidebar" },
              { key: "Ctrl + P", action: "Open snippets" },
              { key: "Ctrl + Enter", action: "Run code" },
              { key: "Tab", action: "Insert spaces" },
              { key: "Escape", action: "Close modals" },
            ].map((shortcut) => (
              <div key={shortcut.key} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{shortcut.action}</span>
                <kbd className="px-2 py-1 rounded bg-muted text-xs font-mono">{shortcut.key}</kbd>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="h-[100dvh] flex flex-col bg-background text-foreground overflow-hidden">
      {/* Main Content */}
      {currentView === "dashboard" && renderDashboard()}
      {currentView === "projects" && renderProjects()}
      {currentView === "editor" && renderEditor()}
      {currentView === "settings" && renderSettings()}

      {/* Bottom Navigation - Always visible */}
      {!isFullscreen && (
        <nav className="fixed bottom-0 left-0 right-0 glass border-t border-border z-50">
          <div className="flex items-center justify-around max-w-lg mx-auto">
            {[
              { id: "dashboard", icon: Home, label: "Home" },
              { id: "projects", icon: FolderGit2, label: "Projects" },
              { id: "editor", icon: Code, label: "Editor" },
              { id: "settings", icon: Settings, label: "Settings" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id as any)}
                className={cn(
                  "flex flex-col items-center py-3 px-4 transition-all",
                  currentView === item.id ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <item.icon className={cn("w-6 h-6 mb-1", currentView === item.id && "scale-110")} />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </nav>
      )}

      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              "px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-in slide-in-from-right",
              toast.type === "success" && "bg-green-500 text-white",
              toast.type === "error" && "bg-destructive text-white",
              toast.type === "info" && "bg-primary text-primary-foreground",
            )}
          >
            {toast.type === "success" && <Check className="w-4 h-4" />}
            {toast.type === "error" && <AlertCircle className="w-4 h-4" />}
            {toast.type === "info" && <Info className="w-4 h-4" />}
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        ))}
      </div>

      {/* Create Project Modal */}
      {showCreateProjectModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-2xl w-full max-w-md space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Create Project</h2>
              <button onClick={() => setShowCreateProjectModal(false)} className="p-2 hover:bg-accent rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Project Name</label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="My Awesome Project"
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl outline-none focus:border-primary transition-colors"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Project Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["HTML/CSS", "JavaScript", "Python"] as const).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setNewProjectLanguage(lang)}
                      className={cn(
                        "p-3 rounded-xl text-sm font-medium transition-all",
                        newProjectLanguage === lang ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-accent",
                      )}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => {
                  if (newProjectName.trim()) {
                    createProject(newProjectName.trim(), newProjectLanguage)
                    setShowCreateProjectModal(false)
                    setNewProjectName("")
                  }
                }}
                disabled={!newProjectName.trim()}
                className="w-full btn-primary py-3 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Project
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Snippets Modal */}
      {showSnippets && currentProject && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-2xl w-full max-w-md max-h-[80vh] overflow-auto animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Code Snippets</h2>
              <button onClick={() => setShowSnippets(false)} className="p-2 hover:bg-accent rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {Object.entries(CODE_SNIPPETS).map(([lang, snippets]) => (
                <div key={lang}>
                  <h3 className="text-sm font-semibold text-primary uppercase mb-2">{lang}</h3>
                  <div className="space-y-2">
                    {snippets.map((snippet) => (
                      <button
                        key={snippet.name}
                        onClick={() => insertSnippet(snippet.code)}
                        className="w-full p-3 bg-muted hover:bg-accent rounded-xl text-left transition-colors"
                      >
                        <p className="font-medium text-sm">{snippet.name}</p>
                        <p className="text-xs text-muted-foreground truncate font-mono mt-1">
                          {snippet.code.split("\n")[0]}...
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col">
          <div className="glass p-4 flex items-center justify-between">
            <h2 className="font-semibold">Preview</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowConsole(!showConsole)}
                className={cn("p-2 rounded-lg", showConsole ? "bg-primary text-primary-foreground" : "hover:bg-accent")}
              >
                <Terminal className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setShowPreview(false)
                  setPreviewContent("")
                }}
                className="p-2 hover:bg-accent rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="flex-1 flex">
            <iframe srcDoc={previewContent} className="flex-1 bg-white" sandbox="allow-scripts" title="Preview" />
            {showConsole && (
              <div className="w-80 bg-card border-l border-border flex flex-col">
                <div className="p-3 border-b border-border flex items-center justify-between">
                  <span className="text-sm font-medium">Console</span>
                  <button
                    onClick={() => setConsoleOutput([])}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Clear
                  </button>
                </div>
                <div className="flex-1 overflow-auto p-3 font-mono text-xs space-y-1">
                  {consoleOutput.length === 0 ? (
                    <p className="text-muted-foreground">No output yet...</p>
                  ) : (
                    consoleOutput.map((log, i) => (
                      <div
                        key={i}
                        className={cn(
                          "p-2 rounded bg-muted",
                          log.includes("[error]") && "bg-destructive/10 text-destructive",
                          log.includes("[warn]") && "bg-yellow-500/10 text-yellow-600",
                        )}
                      >
                        {log}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Console Modal (for JS-only runs) */}
      {showConsole && !showPreview && (
        <div className="fixed inset-x-0 bottom-20 mx-4 glass-panel rounded-2xl max-h-60 overflow-hidden z-40 animate-in slide-in-from-bottom">
          <div className="p-3 border-b border-border flex items-center justify-between">
            <span className="font-medium flex items-center gap-2">
              <Terminal className="w-4 h-4 text-primary" />
              Console Output
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setConsoleOutput([])}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
              <button onClick={() => setShowConsole(false)} className="p-1 hover:bg-accent rounded">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="p-3 overflow-auto max-h-40 font-mono text-sm space-y-1">
            {consoleOutput.length === 0 ? (
              <p className="text-muted-foreground">No output yet...</p>
            ) : (
              consoleOutput.map((log, i) => (
                <div
                  key={i}
                  className={cn(
                    "p-2 rounded bg-muted/50",
                    log.startsWith("Error") && "bg-destructive/10 text-destructive",
                  )}
                >
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
