"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Maximize, Minimize, Tablet, Monitor, RefreshCw, ExternalLink, Code2, AlertCircle } from "lucide-react"

interface PreviewPanelProps {
  html: string
  isFullscreen: boolean
  onToggleFullscreen: () => void
  theme: any
}

export default function PreviewPanel({ html, isFullscreen, onToggleFullscreen, theme }: PreviewPanelProps) {
  const [viewMode, setViewMode] = useState<"desktop" | "tablet">("desktop")
  const [isLoading, setIsLoading] = useState(false)
  const [key, setKey] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [isPreviewReady, setIsPreviewReady] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const getPreviewWidth = () => {
    if (isMobile) return "w-full"
    switch (viewMode) {
      case "tablet":
        return "w-[768px] max-w-[768px]"
      default:
        return "w-full"
    }
  }

  const getPreviewScale = () => {
    if (isMobile) return "scale-100"
    switch (viewMode) {
      case "tablet":
        return "scale-90 origin-top"
      default:
        return "scale-100"
    }
  }

  const refreshPreview = () => {
    setIsLoading(true)
    setPreviewError(null)
    setIsPreviewReady(false)
    setKey((prev) => prev + 1) // Force iframe reload

    setTimeout(() => {
      setIsLoading(false)
      setIsPreviewReady(true)
    }, 800)
  }

  // Enhanced HTML processing for better preview
  const processHtmlForPreview = (htmlContent: string) => {
    if (!htmlContent || !htmlContent.trim()) return ""

    let processedHtml = htmlContent

    // Ensure proper DOCTYPE and HTML structure
    if (!processedHtml.includes("<!DOCTYPE")) {
      if (!processedHtml.includes("<html")) {
        processedHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Preview</title>
    <style>
        body { 
            margin: 0; 
            padding: 20px; 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
        }
        * { box-sizing: border-box; }
    </style>
</head>
<body>
    ${processedHtml}
</body>
</html>`
      }
    }

    // Ensure mobile viewport meta tag
    if (!processedHtml.includes("viewport")) {
      processedHtml = processedHtml.replace(
        "<head>",
        '<head>\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">',
      )
    }

    // Add error handling script
    const errorHandlingScript = `
    <script>
      window.addEventListener('error', function(e) {
        console.error('Preview Error:', e.error);
        parent.postMessage({type: 'error', message: e.error.message}, '*');
      });
      
      window.addEventListener('load', function() {
        parent.postMessage({type: 'loaded'}, '*');
      });
    </script>`

    if (processedHtml.includes("</body>")) {
      processedHtml = processedHtml.replace("</body>", `${errorHandlingScript}\n</body>`)
    } else {
      processedHtml += errorHandlingScript
    }

    return processedHtml
  }

  // Listen for iframe messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === "error") {
        setPreviewError(event.data.message)
      } else if (event.data.type === "loaded") {
        setIsPreviewReady(true)
        setPreviewError(null)
      }
    }

    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  }, [])

  // Auto-refresh when HTML changes with debouncing
  useEffect(() => {
    if (html && html.trim()) {
      const timer = setTimeout(() => {
        setKey((prev) => prev + 1)
        setIsPreviewReady(false)
      }, 500) // Debounce for 500ms

      return () => clearTimeout(timer)
    }
  }, [html])

  // Open preview in new tab
  const openInNewTab = () => {
    const processedHtml = processHtmlForPreview(html)
    const blob = new Blob([processedHtml], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    window.open(url, "_blank")
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const hasValidHtml = html && html.trim() && html.trim() !== ""

  return (
    <div className={`flex flex-col h-full ${theme.text}`}>
      {/* Enhanced header with better controls */}
      <div className="flex items-center justify-between mb-3 p-2 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 border border-gray-200 dark:border-gray-600">
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <Code2 className="h-4 w-4 text-blue-500" />
            <span className="font-semibold text-sm">Live Preview</span>
          </div>

          {/* Status indicator */}
          <div className="flex items-center space-x-1">
            {isLoading && (
              <div className="flex items-center space-x-1 text-xs text-blue-500">
                <RefreshCw className="h-3 w-3 animate-spin" />
                <span>Loading...</span>
              </div>
            )}
            {isPreviewReady && !previewError && hasValidHtml && (
              <div className="flex items-center space-x-1 text-xs text-green-500">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Ready</span>
              </div>
            )}
            {previewError && (
              <div className="flex items-center space-x-1 text-xs text-red-500">
                <AlertCircle className="h-3 w-3" />
                <span>Error</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-1">
          {/* View mode controls - hidden on mobile */}
          {!isMobile && (
            <div className="flex border rounded-md overflow-hidden mr-2">
              <Button
                variant="ghost"
                size="icon"
                className={`h-7 w-7 rounded-none ${viewMode === "tablet" ? theme.activeTab : theme.inactiveTab}`}
                onClick={() => setViewMode("tablet")}
                title="Tablet View (768px)"
              >
                <Tablet className="h-4 w-4 text-purple-500" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={`h-7 w-7 rounded-none ${viewMode === "desktop" ? theme.activeTab : theme.inactiveTab}`}
                onClick={() => setViewMode("desktop")}
                title="Desktop View (Full Width)"
              >
                <Monitor className="h-4 w-4 text-blue-500" />
              </Button>
            </div>
          )}

          <Button
            variant="ghost"
            size="icon"
            className={`h-7 w-7 hover:bg-green-500/20`}
            onClick={refreshPreview}
            title="Refresh Preview"
          >
            <RefreshCw className={`h-4 w-4 text-green-500 ${isLoading ? "animate-spin" : ""}`} />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className={`h-7 w-7 hover:bg-purple-500/20`}
            onClick={openInNewTab}
            title="Open in New Tab"
            disabled={!hasValidHtml}
          >
            <ExternalLink className="h-4 w-4 text-purple-500" />
          </Button>

          <Button variant="outline" className={`${theme.button} text-xs h-7 px-2`} onClick={onToggleFullscreen}>
            {isFullscreen ? (
              <>
                <Minimize className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Exit</span>
              </>
            ) : (
              <>
                <Maximize className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Full</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Error display */}
      {previewError && (
        <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Preview Error:</span>
          </div>
          <p className="text-sm text-red-600 dark:text-red-400 mt-1">{previewError}</p>
        </div>
      )}

      {/* Enhanced preview container */}
      <div
        className={`flex-1 rounded-lg border-2 transition-all duration-300 flex justify-center overflow-auto ${
          theme.text === "text-gray-900" ? "border-gray-200 bg-gray-50" : "border-gray-700 bg-gray-800"
        }`}
        style={{
          minHeight: isMobile ? "300px" : "200px",
          maxHeight: isMobile ? "70vh" : "100%",
        }}
      >
        <div
          className={`h-full ${getPreviewWidth()} transition-all duration-300 ${
            viewMode !== "desktop" && !isMobile ? "border-x-2 border-gray-300 dark:border-gray-600" : ""
          }`}
          style={{
            transform: getPreviewScale(),
          }}
        >
          {hasValidHtml ? (
            <iframe
              key={key}
              ref={iframeRef}
              srcDoc={processHtmlForPreview(html)}
              className="w-full h-full border-0 rounded-md bg-white shadow-inner"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
              title="Live Preview"
              style={{
                minHeight: isMobile ? "300px" : "100%",
                backgroundColor: "white",
              }}
              onLoad={() => {
                setIsLoading(false)
                setIsPreviewReady(true)
              }}
              onError={() => {
                setPreviewError("Failed to load preview")
                setIsLoading(false)
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-white rounded-md">
              <div className="text-center p-8">
                <div className="text-6xl mb-4 opacity-20">🖥️</div>
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No Preview Available</h3>
                <p className="text-sm text-gray-500 mb-4">Write some HTML code to see the live preview</p>
                <div className="text-xs text-gray-400 bg-gray-50 p-3 rounded-lg">
                  <p>
                    💡 <strong>Tip:</strong> Your HTML will appear here in real-time
                  </p>
                  <p>🎨 CSS and JavaScript files will be automatically included</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Preview info footer */}
      <div className="mt-2 flex items-center justify-between text-xs opacity-70">
        <div className="flex items-center space-x-4">
          <span>{viewMode === "tablet" ? "📱 Tablet (768px)" : "🖥️ Desktop (Full Width)"}</span>
          {hasValidHtml && <span className="text-green-500">✓ {html.split("\n").length} lines</span>}
        </div>
        <div className="text-right">
          <span>Live Preview • Auto-refresh</span>
        </div>
      </div>
    </div>
  )
}
