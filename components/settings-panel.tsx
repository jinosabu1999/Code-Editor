"use client"
import { useSettings } from "@/contexts/settings-context"
import { Button } from "@/components/ui/button"
import { Settings, Moon, Sun, Plus, Minus, Check, X } from "lucide-react"

interface SettingsPanelProps {
  isOpen: boolean
  onClose: () => void
  theme: any
}

export default function SettingsPanel({ isOpen, onClose, theme }: SettingsPanelProps) {
  const { theme: appTheme, setTheme, editorSettings, updateEditorSettings } = useSettings()

  if (!isOpen) return null

  return (
    <div
      className={`fixed inset-0 z-50 ${theme.bg} ${theme.text} md:absolute md:inset-auto md:right-0 md:top-0 md:h-full md:w-80 ${theme.primary} ${theme.border} shadow-lg overflow-auto`}
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-lg font-semibold flex items-center ${theme.text}`}>
            <Settings className="h-5 w-5 mr-2 text-red-500" />
            Settings
          </h2>
          <Button
            variant="outline"
            size="icon"
            className={`border ${theme.border} hover:bg-red-500/20`}
            onClick={onClose}
          >
            <X className="h-5 w-5 text-red-500" />
          </Button>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className={`text-sm font-medium mb-3 ${theme.accent}`}>Theme</h3>
            <div className="flex space-x-2">
              <Button
                variant={appTheme === "light" ? "default" : "outline"}
                className={
                  appTheme === "light"
                    ? "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-0 shadow-lg"
                    : `border ${theme.border} hover:bg-blue-600/20 text-blue-400 hover:text-blue-300`
                }
                onClick={() => setTheme("light")}
              >
                <Sun className={`h-4 w-4 mr-2 ${appTheme === "light" ? "text-white" : "text-blue-400"}`} />
                <span className={appTheme === "light" ? "text-white font-medium" : "text-blue-400 font-medium"}>
                  Light
                </span>
              </Button>
              <Button
                variant={appTheme === "dark" ? "default" : "outline"}
                className={
                  appTheme === "dark"
                    ? "bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white border-0 shadow-lg"
                    : `border ${theme.border} hover:bg-purple-600/20 text-purple-400 hover:text-purple-300`
                }
                onClick={() => setTheme("dark")}
              >
                <Moon className={`h-4 w-4 mr-2 ${appTheme === "dark" ? "text-white" : "text-purple-400"}`} />
                <span className={appTheme === "dark" ? "text-white font-medium" : "text-purple-400 font-medium"}>
                  Dark
                </span>
              </Button>
            </div>
          </div>

          <div>
            <h3 className={`text-sm font-medium mb-3 ${theme.accent}`}>Editor</h3>

            <div className="space-y-4">
              <div>
                <label className={`text-xs mb-2 block ${theme.text} opacity-80`}>
                  Font Size: {editorSettings.fontSize}px
                </label>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className={`h-8 w-8 border ${theme.border} hover:bg-orange-500/20 text-orange-500 hover:text-orange-400`}
                    onClick={() => updateEditorSettings({ fontSize: Math.max(10, editorSettings.fontSize - 1) })}
                    disabled={editorSettings.fontSize <= 10}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <div
                    className={`flex-1 mx-2 h-2 ${appTheme === "dark" ? "bg-gray-700" : "bg-gray-200"} rounded-full overflow-hidden`}
                  >
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-300"
                      style={{ width: `${((editorSettings.fontSize - 10) / 14) * 100}%` }}
                    ></div>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    className={`h-8 w-8 border ${theme.border} hover:bg-orange-500/20 text-orange-500 hover:text-orange-400`}
                    onClick={() => updateEditorSettings({ fontSize: Math.min(24, editorSettings.fontSize + 1) })}
                    disabled={editorSettings.fontSize >= 24}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div>
                <label className={`text-xs mb-2 block ${theme.text} opacity-80`}>
                  Tab Size: {editorSettings.tabSize} spaces
                </label>
                <div className="flex space-x-2">
                  {[2, 4, 8].map((size) => (
                    <Button
                      key={size}
                      variant={editorSettings.tabSize === size ? "default" : "outline"}
                      className={
                        editorSettings.tabSize === size
                          ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-0 shadow-lg font-bold"
                          : `border ${theme.border} hover:bg-green-500/20 text-green-400 hover:text-green-300 font-medium`
                      }
                      onClick={() => updateEditorSettings({ tabSize: size })}
                    >
                      <span className="font-bold">{size}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {[
                { key: "lineNumbers", label: "Line Numbers" },
                { key: "wordWrap", label: "Word Wrap" },
                { key: "autoSave", label: "Auto Save" },
                { key: "autoComplete", label: "Auto Complete" },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between">
                  <label className={`text-sm ${theme.text} font-medium`}>{label}</label>
                  <Button
                    variant="outline"
                    size="icon"
                    className={`${
                      editorSettings[key]
                        ? "bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 border-0 shadow-lg"
                        : `border ${theme.border} hover:bg-cyan-500/20 text-cyan-400 hover:text-cyan-300`
                    } h-8 w-8 transition-all duration-300`}
                    onClick={() => updateEditorSettings({ [key]: !editorSettings[key] })}
                  >
                    {editorSettings[key] ? (
                      <Check className="h-4 w-4 text-white" />
                    ) : (
                      <X className="h-4 w-4 text-cyan-400" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className={`text-sm font-medium mb-3 ${theme.accent}`}>Keyboard Shortcuts</h3>
            <div className={`text-xs space-y-2 ${theme.text} opacity-80 overflow-x-auto pb-2`}>
              <table className="w-full min-w-full">
                <tbody>
                  {[
                    { action: "Save", shortcut: "Ctrl+S" },
                    { action: "Undo", shortcut: "Ctrl+Z" },
                    { action: "Redo", shortcut: "Ctrl+Y" },
                    { action: "Clear All", shortcut: "Ctrl+Shift+D" },
                  ].map(({ action, shortcut }) => (
                    <tr
                      key={action}
                      className={`border-b ${appTheme === "dark" ? "border-gray-700" : "border-gray-200"}`}
                    >
                      <td className="py-2 font-medium">{action}</td>
                      <td className="py-2 text-right">
                        <span
                          className={`font-mono text-xs px-2 py-1 rounded font-bold ${
                            appTheme === "dark"
                              ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
                              : "bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700"
                          }`}
                        >
                          {shortcut}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
