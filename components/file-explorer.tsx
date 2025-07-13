"use client"

import { useState } from "react"
import { type FileItem, getChildrenOf } from "@/utils/file-system"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { File, Folder, FolderOpen, Plus, Trash2, Edit, Save, X, ChevronRight, ChevronDown, Copy } from "lucide-react"

interface FileExplorerProps {
  files: FileItem[]
  activeFileId: number
  onFileSelect: (id: number) => void
  onCreateFile: (name: string, type: string, parentId: number | null) => void
  onDeleteFile: (id: number) => void
  onRenameFile: (id: number, newName: string) => void
  onDuplicateFile?: (id: number) => void
  theme: any
}

export default function FileExplorer({
  files,
  activeFileId,
  onFileSelect,
  onCreateFile,
  onDeleteFile,
  onRenameFile,
  onDuplicateFile,
  theme,
}: FileExplorerProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<number>>(new Set())
  const [newItemParent, setNewItemParent] = useState<number | null>(null)
  const [newItemType, setNewItemType] = useState<"file" | "folder">("file")
  const [newItemName, setNewItemName] = useState("")
  const [editingFile, setEditingFile] = useState<number | null>(null)
  const [editName, setEditName] = useState("")

  const toggleFolder = (id: number) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedFolders(newExpanded)
  }

  const startNewItem = (parentId: number | null, type: "file" | "folder") => {
    setNewItemParent(parentId)
    setNewItemType(type)
    setNewItemName("")
  }

  const cancelNewItem = () => {
    setNewItemParent(null)
  }

  const createNewItem = () => {
    if (!newItemName.trim()) return

    if (newItemType === "folder") {
      onCreateFile(newItemName, "folder", newItemParent)
      if (newItemParent !== null) {
        setExpandedFolders(new Set([...expandedFolders, newItemParent]))
      }
    } else {
      let name = newItemName
      if (!name.includes(".")) {
        name += ".html"
      }
      const extension = name.split(".").pop()?.toLowerCase()
      const validTypes = ["html", "css", "js"]
      const type = validTypes.includes(extension) ? extension : "html"

      onCreateFile(name, type, newItemParent)
    }

    setNewItemParent(null)
    setNewItemName("")
  }

  const startRenameFile = (id: number, currentName: string) => {
    setEditingFile(id)
    setEditName(currentName)
  }

  const cancelRename = () => {
    setEditingFile(null)
  }

  const completeRename = (id: number) => {
    if (editName.trim()) {
      onRenameFile(id, editName)
    }
    setEditingFile(null)
  }

  const renderFileTree = (parentId: number | null, depth = 0) => {
    const children = getChildrenOf(files, parentId)

    return (
      <>
        {children.map((item) => (
          <div key={item.id} className="mb-1">
            {item.type === "folder" ? (
              <div>
                <div
                  className={`flex items-center group rounded-lg p-2 transition-all duration-200 hover:bg-gradient-to-r ${
                    theme.text === "text-gray-100"
                      ? "hover:from-indigo-600/20 hover:to-purple-600/20"
                      : "hover:from-indigo-50 hover:to-purple-50"
                  }`}
                  style={{ marginLeft: `${depth * 16}px` }}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 p-0 hover:bg-transparent"
                    onClick={() => toggleFolder(item.id)}
                  >
                    {expandedFolders.has(item.id) ? (
                      <ChevronDown className="h-4 w-4 text-indigo-500" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-indigo-500" />
                    )}
                  </Button>

                  {editingFile === item.id ? (
                    <div className="flex items-center flex-1 ml-2">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className={`h-7 py-0 px-2 text-sm ${theme.primary} ${theme.text} border ${theme.border} rounded-md`}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") completeRename(item.id)
                          if (e.key === "Escape") cancelRename()
                        }}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 p-0 ml-1 hover:bg-emerald-500/20 rounded-md"
                        onClick={() => completeRename(item.id)}
                      >
                        <Save className="h-3 w-3 text-emerald-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 p-0 ml-1 hover:bg-red-500/20 rounded-md"
                        onClick={cancelRename}
                      >
                        <X className="h-3 w-3 text-red-500" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center flex-1 ml-2">
                      <Button
                        variant="ghost"
                        className="h-7 px-2 py-0 justify-start text-sm hover:bg-transparent flex-1 font-medium"
                        onClick={() => toggleFolder(item.id)}
                      >
                        {expandedFolders.has(item.id) ? (
                          <FolderOpen className="h-4 w-4 mr-2 shrink-0 text-amber-500" />
                        ) : (
                          <Folder className="h-4 w-4 mr-2 shrink-0 text-amber-500" />
                        )}
                        <span className={`truncate ${theme.text}`}>{item.name}</span>
                      </Button>

                      <div className="opacity-0 group-hover:opacity-100 flex transition-opacity duration-200 ml-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 p-0 hover:bg-blue-500/20 rounded-md"
                          onClick={() => startNewItem(item.id, "file")}
                          title="Add File"
                        >
                          <Plus className="h-3 w-3 text-blue-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 p-0 ml-1 hover:bg-yellow-500/20 rounded-md"
                          onClick={() => startRenameFile(item.id, item.name)}
                          title="Rename"
                        >
                          <Edit className="h-3 w-3 text-yellow-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 p-0 ml-1 hover:bg-green-500/20 rounded-md"
                          onClick={() => onDuplicateFile?.(item.id)}
                          title="Duplicate"
                        >
                          <Copy className="h-3 w-3 text-green-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 p-0 ml-1 hover:bg-red-500/20 rounded-md"
                          onClick={() => onDeleteFile(item.id)}
                          title="Delete"
                        >
                          <Trash2 className="h-3 w-3 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {expandedFolders.has(item.id) && (
                  <div className="mt-1">
                    {renderFileTree(item.id, depth + 1)}

                    {newItemParent === item.id && (
                      <div
                        className="flex items-center mt-2 p-2 rounded-lg bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-900/20 dark:to-indigo-900/20"
                        style={{ marginLeft: `${(depth + 1) * 16}px` }}
                      >
                        <Input
                          value={newItemName}
                          onChange={(e) => setNewItemName(e.target.value)}
                          placeholder={`New ${newItemType}...`}
                          className={`h-7 py-0 px-2 text-sm ${theme.primary} ${theme.text} border ${theme.border} rounded-md`}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") createNewItem()
                            if (e.key === "Escape") cancelNewItem()
                          }}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 p-0 ml-2 hover:bg-emerald-500/20 rounded-md"
                          onClick={createNewItem}
                        >
                          <Save className="h-3 w-3 text-emerald-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 p-0 ml-1 hover:bg-red-500/20 rounded-md"
                          onClick={cancelNewItem}
                        >
                          <X className="h-3 w-3 text-red-500" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div
                className={`flex items-center group rounded-lg p-2 transition-all duration-200 ${
                  activeFileId === item.id
                    ? theme.text === "text-gray-100"
                      ? "bg-gradient-to-r from-cyan-600/30 to-blue-600/30 border-l-4 border-cyan-400 shadow-lg"
                      : "bg-gradient-to-r from-cyan-100 to-blue-100 border-l-4 border-cyan-500 shadow-md"
                    : theme.text === "text-gray-100"
                      ? "hover:bg-gradient-to-r hover:from-slate-700/50 hover:to-slate-600/50"
                      : "hover:bg-gradient-to-r hover:from-slate-50 hover:to-slate-100"
                }`}
                style={{ marginLeft: `${depth * 16}px` }}
              >
                {editingFile === item.id ? (
                  <div className="flex items-center flex-1">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className={`h-7 py-0 px-2 text-sm ${theme.primary} ${theme.text} border ${theme.border} rounded-md`}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") completeRename(item.id)
                        if (e.key === "Escape") cancelRename()
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 p-0 ml-2 hover:bg-emerald-500/20 rounded-md"
                      onClick={() => completeRename(item.id)}
                    >
                      <Save className="h-3 w-3 text-emerald-500" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 p-0 ml-1 hover:bg-red-500/20 rounded-md"
                      onClick={cancelRename}
                    >
                      <X className="h-3 w-3 text-red-500" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center flex-1">
                    <Button
                      variant="ghost"
                      className="h-7 px-2 py-0 justify-start text-sm flex-1 transition-all duration-200 hover:bg-transparent font-medium"
                      onClick={() => onFileSelect(item.id)}
                    >
                      <File
                        className={`h-4 w-4 mr-2 shrink-0 ${
                          item.type === "html"
                            ? "text-orange-500"
                            : item.type === "css"
                              ? "text-blue-500"
                              : item.type === "js"
                                ? "text-yellow-500"
                                : "text-gray-500"
                        }`}
                      />
                      <span
                        className={`truncate ${
                          activeFileId === item.id
                            ? theme.text === "text-gray-100"
                              ? "text-cyan-100 font-semibold"
                              : "text-cyan-700 font-semibold"
                            : theme.text
                        }`}
                      >
                        {item.name}
                      </span>
                    </Button>

                    <div className="opacity-0 group-hover:opacity-100 flex transition-opacity duration-200 ml-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 p-0 hover:bg-yellow-500/20 rounded-md"
                        onClick={() => startRenameFile(item.id, item.name)}
                        title="Rename"
                      >
                        <Edit className="h-3 w-3 text-yellow-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 p-0 ml-1 hover:bg-green-500/20 rounded-md"
                        onClick={() => onDuplicateFile?.(item.id)}
                        title="Duplicate"
                      >
                        <Copy className="h-3 w-3 text-green-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 p-0 ml-1 hover:bg-red-500/20 rounded-md"
                        onClick={() => onDeleteFile(item.id)}
                        title="Delete"
                      >
                        <Trash2 className="h-3 w-3 text-red-500" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {newItemParent === parentId && (
          <div
            className="flex items-center mt-2 p-2 rounded-lg bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-900/20 dark:to-indigo-900/20"
            style={{ marginLeft: `${depth * 16}px` }}
          >
            <Input
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder={`New ${newItemType}...`}
              className={`h-7 py-0 px-2 text-sm ${theme.primary} ${theme.text} border ${theme.border} rounded-md`}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") createNewItem()
                if (e.key === "Escape") cancelNewItem()
              }}
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 p-0 ml-2 hover:bg-emerald-500/20 rounded-md"
              onClick={createNewItem}
            >
              <Save className="h-3 w-3 text-emerald-500" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 p-0 ml-1 hover:bg-red-500/20 rounded-md"
              onClick={cancelNewItem}
            >
              <X className="h-3 w-3 text-red-500" />
            </Button>
          </div>
        )}
      </>
    )
  }

  return (
    <div className="p-3">
      <div className="flex items-center justify-between mb-4">
        <h3 className={`font-bold text-base ${theme.accent} flex items-center`}>
          <Folder className="h-5 w-5 mr-2 text-indigo-500" />
          Files
        </h3>
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 p-0 hover:bg-blue-500/20 relative rounded-lg shadow-sm border border-blue-200 dark:border-blue-700"
            onClick={() => startNewItem(null, "file")}
            title="New File"
          >
            <File className="h-4 w-4 text-blue-500" />
            <Plus className="h-3 w-3 absolute -right-1 -bottom-1 bg-blue-500 text-white rounded-full shadow-md" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 p-0 hover:bg-amber-500/20 relative rounded-lg shadow-sm border border-amber-200 dark:border-amber-700"
            onClick={() => startNewItem(null, "folder")}
            title="New Folder"
          >
            <Folder className="h-4 w-4 text-amber-500" />
            <Plus className="h-3 w-3 absolute -right-1 -bottom-1 bg-amber-500 text-white rounded-full shadow-md" />
          </Button>
        </div>
      </div>

      <div className="overflow-y-auto max-h-[calc(100vh-12rem)] space-y-1">{renderFileTree(null)}</div>
    </div>
  )
}
