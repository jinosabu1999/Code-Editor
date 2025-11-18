"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Replace, X, ArrowUp, ArrowDown } from "lucide-react"

interface SearchPanelProps {
  isOpen: boolean
  onClose: () => void
  theme: any
  currentFile: any
  onReplace: (searchTerm: string, replaceTerm: string) => void
}

export default function SearchPanel({ isOpen, onClose, theme, currentFile, onReplace }: SearchPanelProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [replaceTerm, setReplaceTerm] = useState("")
  const [caseSensitive, setCaseSensitive] = useState(false)
  const [wholeWord, setWholeWord] = useState(false)
  const [currentMatch, setCurrentMatch] = useState(0)
  const [totalMatches, setTotalMatches] = useState(0)

  if (!isOpen) return null

  const findMatches = () => {
    if (!currentFile || !searchTerm) return []

    const flags = caseSensitive ? "g" : "gi"
    const pattern = wholeWord ? `\\b${searchTerm}\\b` : searchTerm
    const regex = new RegExp(pattern, flags)

    return [...currentFile.content.matchAll(regex)]
  }

  const handleSearch = () => {
    const matches = findMatches()
    setTotalMatches(matches.length)
    setCurrentMatch(matches.length > 0 ? 1 : 0)
  }

  const handleReplace = () => {
    if (searchTerm && replaceTerm) {
      onReplace(searchTerm, replaceTerm)
      handleSearch()
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-2xl" onClick={onClose} aria-hidden="true" />
      <div
        className={`fixed top-20 right-4 z-50 w-80 ${theme.primary} ${theme.border} shadow-2xl rounded-lg overflow-hidden backdrop-blur-3xl bg-card/95`}
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-lg font-semibold flex items-center ${theme.text}`}>
              <Search className="h-5 w-5 mr-2 text-blue-500" />
              Search & Replace
            </h3>
            <Button
              variant="outline"
              size="icon"
              className={`border ${theme.border} hover:bg-red-500/20`}
              onClick={onClose}
            >
              <X className="h-5 w-5 text-red-500" />
            </Button>
          </div>

          <div className="space-y-4">
            <div>
              <label className={`text-sm mb-2 block ${theme.text}`}>Search for:</label>
              <div className="flex space-x-2">
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Enter search term..."
                  className={`${theme.primary} ${theme.text} border ${theme.border}`}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
                <Button variant="outline" className={`${theme.button} px-3`} onClick={handleSearch}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <label className={`text-sm mb-2 block ${theme.text}`}>Replace with:</label>
              <div className="flex space-x-2">
                <Input
                  value={replaceTerm}
                  onChange={(e) => setReplaceTerm(e.target.value)}
                  placeholder="Enter replacement..."
                  className={`${theme.primary} ${theme.text} border ${theme.border}`}
                  onKeyDown={(e) => e.key === "Enter" && handleReplace()}
                />
                <Button
                  variant="outline"
                  className={`${theme.button} px-3`}
                  onClick={handleReplace}
                  disabled={!searchTerm || !replaceTerm}
                >
                  <Replace className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={caseSensitive}
                    onChange={(e) => setCaseSensitive(e.target.checked)}
                    className="rounded"
                  />
                  <span className={`text-sm ${theme.text}`}>Case sensitive</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={wholeWord}
                    onChange={(e) => setWholeWord(e.target.checked)}
                    className="rounded"
                  />
                  <span className={`text-sm ${theme.text}`}>Whole word</span>
                </label>
              </div>
            </div>

            {totalMatches > 0 && (
              <div className={`text-sm ${theme.text} opacity-70 text-center`}>
                {currentMatch} of {totalMatches} matches
              </div>
            )}

            <div className="flex justify-between">
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  className={`${theme.button} h-8 w-8`}
                  disabled={currentMatch <= 1}
                  title="Previous match"
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className={`${theme.button} h-8 w-8`}
                  disabled={currentMatch >= totalMatches}
                  title="Next match"
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
              </div>
              <Button
                variant="outline"
                className={`${theme.button} text-sm`}
                onClick={() => {
                  setSearchTerm("")
                  setReplaceTerm("")
                  setCurrentMatch(0)
                  setTotalMatches(0)
                }}
              >
                Clear
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
