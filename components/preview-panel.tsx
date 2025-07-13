"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Maximize, Minimize, Tablet, Monitor, RefreshCw } from "lucide-react"

interface PreviewPanelProps {
  html: string
  isFullscreen: boolean
  onToggleFullscreen: () => void
  theme: any
}

export default function PreviewPanel({ html, isFullscreen, onToggleFullscreen, theme }: PreviewPanelProps) {
  const [viewMode, setViewMode] = useState<"desktop" | "tablet">("desktop")
  const [isLoading, setIsLoading] = useState(false)

  const getPreviewWidth = () => {
    switch (viewMode) {
      case "tablet":
        return "w-[768px]"
      default:
        return "w-full"
    }
  }

  const refreshPreview = () => {
    setIsLoading(true)
    setTimeout(() => setIsLoading(false), 500)
  }

  return (
    <div className={`flex flex-col h-full ${theme.text}`}>
      <div className="flex items-center justify-between mb-2 sm:mb-4 flex-wrap gap-2">
        <div className="font-semibold text-sm sm:text-base">Preview</div>

        <div className="flex items-center space-x-1 sm:space-x-2">
          <div className="flex border rounded-md overflow-hidden">
            <Button
              variant="ghost"
              size="icon"
              className={`h-7 w-7 rounded-none ${viewMode === "tablet" ? theme.activeTab : theme.inactiveTab}`}
              onClick={() => setViewMode("tablet")}
              title="Tablet View"
            >
              <Tablet className="h-4 w-4 text-red-500" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`h-7 w-7 rounded-none ${viewMode === "desktop" ? theme.activeTab : theme.inactiveTab}`}
              onClick={() => setViewMode("desktop")}
              title="Desktop View"
            >
              <Monitor className="h-4 w-4 text-red-500" />
            </Button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className={`h-7 w-7 hover:bg-red-500/20`}
            onClick={refreshPreview}
            title="Refresh Preview"
          >
            <RefreshCw className={`h-4 w-4 text-red-500 ${isLoading ? "animate-spin" : ""}`} />
          </Button>

          <Button variant="outline" className={`${theme.button} text-xs sm:text-sm h-7`} onClick={onToggleFullscreen}>
            {isFullscreen ? (
              <>
                <Minimize className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Exit Fullscreen</span>
              </>
            ) : (
              <>
                <Maximize className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Fullscreen</span>
              </>
            )}
          </Button>
        </div>
      </div>

      <div
        className={`flex-1 overflow-auto rounded-md ${theme.preview} transition-all duration-300 flex justify-center`}
      >
        <div
          className={`h-full ${getPreviewWidth()} transition-all duration-300 ${viewMode !== "desktop" ? "border-x border-gray-300 dark:border-gray-700" : ""}`}
        >
          {!isLoading && <iframe srcDoc={html} className="w-full h-full" sandbox="allow-scripts" title="Preview" />}
        </div>
      </div>
    </div>
  )
}
