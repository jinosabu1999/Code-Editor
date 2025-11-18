"use client"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Play,
  Square,
  Upload,
  FileText,
  Undo,
  Redo,
  Trash2,
  Wand2,
  Search,
  Settings,
  Menu,
  ChevronLeft,
} from "lucide-react"
import ThemeSwitcher from "./theme-switcher"
import { cn } from "@/lib/utils"

interface AnimatedToolbarProps {
  isSidebarOpen: boolean
  onToggleSidebar: () => void
  onNewFile: () => void
  onUpload: () => void
  onRun: () => void
  isRunning: boolean
  onUndo: () => void
  onRedo: () => void
  onClear: () => void
  onFormat: () => void
  onSearch: () => void
  onSettings: () => void
  isMobile: boolean
  className?: string
}

export default function AnimatedToolbar({
  isSidebarOpen,
  onToggleSidebar,
  onNewFile,
  onUpload,
  onRun,
  isRunning,
  onUndo,
  onRedo,
  onClear,
  onFormat,
  onSearch,
  onSettings,
  isMobile,
  className,
}: AnimatedToolbarProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 p-3 rounded-2xl bg-card/80 backdrop-blur-xl border border-border shadow-lg animate-slide-in-up",
        className,
      )}
    >
      {/* Left section - File operations */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="h-9 w-9 rounded-lg hover:bg-accent/10 transition-all duration-200"
          title={isSidebarOpen ? "Hide sidebar" : "Show sidebar"}
        >
          {isSidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>

        <Separator orientation="vertical" className="h-6 mx-1" />

        <Button
          variant="ghost"
          size="icon"
          onClick={onNewFile}
          className="h-9 w-9 rounded-lg hover:bg-accent/10 transition-all duration-200"
          title="New file"
        >
          <FileText className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={onUpload}
          className="h-9 w-9 rounded-lg hover:bg-accent/10 transition-all duration-200"
          title="Upload files"
        >
          <Upload className="h-4 w-4" />
        </Button>
      </div>

      {/* Center section - Edit operations */}
      {!isMobile && (
        <>
          <Separator orientation="vertical" className="h-6 mx-1" />
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={onUndo}
              className="h-9 w-9 rounded-lg hover:bg-accent/10 transition-all duration-200"
              title="Undo"
            >
              <Undo className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={onRedo}
              className="h-9 w-9 rounded-lg hover:bg-accent/10 transition-all duration-200"
              title="Redo"
            >
              <Redo className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={onClear}
              className="h-9 w-9 rounded-lg hover:bg-destructive/10 transition-all duration-200"
              title="Clear"
            >
              <Trash2 className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={onFormat}
              className="h-9 w-9 rounded-lg hover:bg-accent/10 transition-all duration-200"
              title="Format code"
            >
              <Wand2 className="h-4 w-4" />
            </Button>
          </div>
        </>
      )}

      {/* Right section - Actions */}
      <div className="flex items-center gap-1 ml-auto">
        <Button
          variant="ghost"
          size="icon"
          onClick={onRun}
          disabled={isRunning}
          className="h-9 w-9 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-all duration-200"
          title="Run code"
        >
          {isRunning ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>

        <Separator orientation="vertical" className="h-6 mx-1" />

        <Button
          variant="ghost"
          size="icon"
          onClick={onSearch}
          className="h-9 w-9 rounded-lg hover:bg-accent/10 transition-all duration-200"
          title="Search"
        >
          <Search className="h-4 w-4" />
        </Button>

        <ThemeSwitcher />

        <Button
          variant="ghost"
          size="icon"
          onClick={onSettings}
          className="h-9 w-9 rounded-lg hover:bg-accent/10 transition-all duration-200"
          title="Settings"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
