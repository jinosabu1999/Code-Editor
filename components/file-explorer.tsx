"use client"

import { useState } from "react"
import { type FileItem, getChildrenOf } from "@/utils/file-system"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { File, Folder, FolderOpen, Plus, Trash2, Edit, Save, X, ChevronRight, ChevronDown, Copy } from 'lucide-react'

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
          <div key={item.id} className="mb-0.5">
            {item.type === "folder" ? (
              <div>
                <div
                  className={`flex items-center group rounded-md px-2 py-1 transition-colors duration-200 hover:bg-muted/50`}
                  style={{ marginLeft: `${depth * 12}px` }}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 p-0 hover:bg-transparent text-muted-foreground"
                    onClick={() => toggleFolder(item.id)}
                  >
                    {expandedFolders.has(item.id) ? (
                      <ChevronDown className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5" />
                    )}
                  </Button>

                  {editingFile === item.id ? (
                    <div className="flex items-center flex-1 ml-1">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="h-6 py-0 px-2 text-xs bg-background border-border rounded-sm"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") completeRename(item.id)
                          if (e.key === "Escape") cancelRename()
                        }}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 p-0 ml-1 hover:bg-emerald-500/10 rounded-sm"
                        onClick={() => completeRename(item.id)}
                      >
                        <Save className="h-3 w-3 text-emerald-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 p-0 ml-1 hover:bg-red-500/10 rounded-sm"
                        onClick={cancelRename}
                      >
                        <X className="h-3 w-3 text-red-500" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center flex-1 ml-1 group/item">
                      <Button
                        variant="ghost"
                        className="h-6 px-1 py-0 justify-start text-sm hover:bg-transparent flex-1 font-medium text-foreground/80"
                        onClick={() => toggleFolder(item.id)}
                      >
                        {expandedFolders.has(item.id) ? (
                          <FolderOpen className="h-3.5 w-3.5 mr-2 shrink-0 text-muted-foreground" />
                        ) : (
                          <Folder className="h-3.5 w-3.5 mr-2 shrink-0 text-muted-foreground" />
                        )}
                        <span className="truncate">{item.name}</span>
                      </Button>

                      <div className="opacity-0 group-hover/item:opacity-100 flex transition-opacity duration-200 ml-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 p-0 hover:bg-muted rounded-sm"
                          onClick={() => startNewItem(item.id, "file")}
                          title="Add File"
                        >
                          <Plus className="h-3 w-3 text-muted-foreground" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 p-0 ml-0.5 hover:bg-muted rounded-sm"
                          onClick={() => startRenameFile(item.id, item.name)}
                          title="Rename"
                        >
                          <Edit className="h-3 w-3 text-muted-foreground" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 p-0 ml-0.5 hover:bg-muted rounded-sm"
                          onClick={() => onDuplicateFile?.(item.id)}
                          title="Duplicate"
                        >
                          <Copy className="h-3 w-3 text-muted-foreground" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 p-0 ml-0.5 hover:bg-red-500/10 rounded-sm"
                          onClick={() => onDeleteFile(item.id)}
                          title="Delete"
                        >
                          <Trash2 className="h-3 w-3 text-muted-foreground hover:text-red-500" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {expandedFolders.has(item.id) && (
                  <div className="mt-0.5">
                    {renderFileTree(item.id, depth + 1)}

                    {newItemParent === item.id && (
                      <div
                        className="flex items-center mt-1 p-1 rounded-md bg-muted/30"
                        style={{ marginLeft: `${(depth + 1) * 12}px` }}
                      >
                        <Input
                          value={newItemName}
                          onChange={(e) => setNewItemName(e.target.value)}
                          placeholder={`New ${newItemType}...`}
                          className="h-6 py-0 px-2 text-xs bg-background border-border rounded-sm"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") createNewItem()
                            if (e.key === "Escape") cancelNewItem()
                          }}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 p-0 ml-1 hover:bg-emerald-500/10 rounded-sm"
                          onClick={createNewItem}
                        >
                          <Save className="h-3 w-3 text-emerald-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 p-0 ml-1 hover:bg-red-500/10 rounded-sm"
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
                className={`flex items-center group rounded-md px-2 py-1 transition-colors duration-200 ${
                  activeFileId === item.id
                    ? "bg-muted text-foreground font-medium"
                    : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                }`}
                style={{ marginLeft: `${depth * 12}px` }}
              >
                {editingFile === item.id ? (
                  <div className="flex items-center flex-1">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="h-6 py-0 px-2 text-xs bg-background border-border rounded-sm"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") completeRename(item.id)
                        if (e.key === "Escape") cancelRename()
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 p-0 ml-1 hover:bg-emerald-500/10 rounded-sm"
                      onClick={() => completeRename(item.id)}
                    >
                      <Save className="h-3 w-3 text-emerald-500" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 p-0 ml-1 hover:bg-red-500/10 rounded-sm"
                      onClick={cancelRename}
                    >
                      <X className="h-3 w-3 text-red-500" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center flex-1 group/item">
                    <Button
                      variant="ghost"
                      className="h-6 px-1 py-0 justify-start text-sm flex-1 transition-none hover:bg-transparent font-normal"
                      onClick={() => onFileSelect(item.id)}
                    >
                      <File className="h-3.5 w-3.5 mr-2 shrink-0 opacity-70" />
                      <span className="truncate">{item.name}</span>
                    </Button>

                    <div className="opacity-0 group-hover/item:opacity-100 flex transition-opacity duration-200 ml-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 p-0 hover:bg-muted rounded-sm"
                        onClick={() => startRenameFile(item.id, item.name)}
                        title="Rename"
                      >
                        <Edit className="h-3 w-3 text-muted-foreground" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 p-0 ml-0.5 hover:bg-muted rounded-sm"
                        onClick={() => onDuplicateFile?.(item.id)}
                        title="Duplicate"
                      >
                        <Copy className="h-3 w-3 text-muted-foreground" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 p-0 ml-0.5 hover:bg-red-500/10 rounded-sm"
                        onClick={() => onDeleteFile(item.id)}
                        title="Delete"
                      >
                        <Trash2 className="h-3 w-3 text-muted-foreground hover:text-red-500" />
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
            className="flex items-center mt-1 p-1 rounded-md bg-muted/30"
            style={{ marginLeft: `${depth * 12}px` }}
          >
            <Input
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder={`New ${newItemType}...`}
              className="h-6 py-0 px-2 text-xs bg-background border-border rounded-sm"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") createNewItem()
                if (e.key === "Escape") cancelNewItem()
              }}
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 p-0 ml-1 hover:bg-emerald-500/10 rounded-sm"
              onClick={createNewItem}
            >
              <Save className="h-3 w-3 text-emerald-500" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 p-0 ml-1 hover:bg-red-500/10 rounded-sm"
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
    <div className="p-2">
      <div className="overflow-y-auto max-h-[calc(100vh-12rem)] space-y-0.5">{renderFileTree(null)}</div>
    </div>
  )
}
