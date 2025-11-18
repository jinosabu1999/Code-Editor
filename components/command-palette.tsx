"use client"

import { useEffect } from "react"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"

type CommandAction = {
  id: string
  label: string
  shortcut?: string
  group?: string
  onSelect: () => void
}

interface CommandPaletteProps {
  open: boolean
  setOpen: (v: boolean) => void
  actions: CommandAction[]
}

export default function CommandPalette({ open, setOpen, actions }: CommandPaletteProps) {
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen(!open)
      }
    }
    window.addEventListener("keydown", down)
    return () => window.removeEventListener("keydown", down)
  }, [open, setOpen])

  const groups = Array.from(new Set(actions.map((a) => a.group || "General")))

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {groups.map((g) => {
          const groupActions = actions.filter((a) => (a.group || "General") === g)
          if (groupActions.length === 0) return null
          return (
            <CommandGroup key={g} heading={g}>
              {groupActions.map((a) => (
                <CommandItem
                  key={a.id}
                  onSelect={() => {
                    setOpen(false)
                    a.onSelect()
                  }}
                >
                  <span className="flex-1">{a.label}</span>
                  {a.shortcut && (
                    <span aria-hidden className="ml-2 text-xs opacity-60 font-mono px-1 py-0.5 rounded border">
                      {a.shortcut}
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          )
        })}
        <CommandSeparator />
      </CommandList>
    </CommandDialog>
  )
}
