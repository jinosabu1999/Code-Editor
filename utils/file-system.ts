export type FileType = "html" | "css" | "js" | "folder"

export interface FileItem {
  id: number
  name: string
  type: FileType
  content?: string
  history?: string[]
  historyIndex?: number
  parentId: number | null
}

export interface FileSystemState {
  files: FileItem[]
  nextId: number
}

export const initialFileSystem: FileSystemState = {
  files: [
    {
      id: 1,
      name: "index.html",
      type: "html",
      content: "<!-- Write your HTML here -->\n<div>\n  <h1>Hello World!</h1>\n</div>",
      history: ["<!-- Write your HTML here -->\n<div>\n  <h1>Hello World!</h1>\n</div>"],
      historyIndex: 0,
      parentId: null,
    },
  ],
  nextId: 2,
}

export function getFileById(files: FileItem[], id: number): FileItem | undefined {
  return files.find((file) => file.id === id)
}

export function getChildrenOf(files: FileItem[], parentId: number | null): FileItem[] {
  return files.filter((file) => file.parentId === parentId)
}

export function getFilePathById(files: FileItem[], id: number): string {
  const file = getFileById(files, id)
  if (!file) return ""

  if (file.parentId === null) {
    return file.name
  }

  const parent = getFileById(files, file.parentId)
  if (!parent) return file.name

  return `${getFilePathById(files, parent.id)}/${file.name}`
}

export function createFile(
  state: FileSystemState,
  name: string,
  type: FileType,
  content = "",
  parentId: number | null = null,
): FileSystemState {
  const newFile: FileItem = {
    id: state.nextId,
    name,
    type,
    parentId,
    content,
    history: [content],
    historyIndex: 0,
  }

  return {
    files: [...state.files, newFile],
    nextId: state.nextId + 1,
  }
}

export function updateFile(state: FileSystemState, id: number, updates: Partial<FileItem>): FileSystemState {
  return {
    ...state,
    files: state.files.map((file) => (file.id === id ? { ...file, ...updates } : file)),
  }
}

export function deleteFile(state: FileSystemState, id: number): FileSystemState {
  // Get all descendant files (if it's a folder)
  const getAllDescendants = (fileId: number): number[] => {
    const directChildren = state.files.filter((f) => f.parentId === fileId)
    return [...directChildren.map((c) => c.id), ...directChildren.flatMap((c) => getAllDescendants(c.id))]
  }

  const idsToRemove = [id, ...getAllDescendants(id)]

  return {
    ...state,
    files: state.files.filter((file) => !idsToRemove.includes(file.id)),
  }
}

export function moveFile(state: FileSystemState, id: number, newParentId: number | null): FileSystemState {
  // Prevent moving a file into its own descendant
  if (newParentId !== null) {
    let currentParent = newParentId
    while (currentParent !== null) {
      if (currentParent === id) return state // Would create a cycle
      const parent = state.files.find((f) => f.id === currentParent)
      if (!parent) break
      currentParent = parent.parentId
    }
  }

  return updateFile(state, id, { parentId: newParentId })
}
