'use client'

import { useEffect, useState, useCallback } from 'react'
import { useUIStore } from '@/store/useUIStore'
import { searchApi } from '@/lib/api/search'
import { focusAreasApi } from '@/lib/api/focus-areas'
import { useFocusAreaStore } from '@/store/useFocusAreaStore'
import { SearchResultItem } from './SearchResultItem'
import { NoSearchResultsIllustration } from '@/components/ui/EmptyState'
import { Search, X } from 'lucide-react'
import type { SearchResult } from '@/types'

export function SearchModal() {
  const { isSearchOpen, closeSearch } = useUIStore()
  const { focusAreas } = useFocusAreaStore()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cmd+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        isSearchOpen ? closeSearch() : useUIStore.getState().openSearch()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isSearchOpen, closeSearch])

  const handleSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([])
      setHasSearched(false)
      setError(null)
      return
    }
    setIsLoading(true)
    setHasSearched(true)
    setError(null)
    try {
      // Ensure focus areas are loaded so we can enrich results
      let areas = focusAreas
      if (areas.length === 0) {
        areas = await focusAreasApi.list()
        useFocusAreaStore.getState().setFocusAreas(areas)
      }
      const data = await searchApi.search({ q })
      const enriched = data.results.map((r) => ({
        ...r,
        focus_area: areas.find((fa) => fa.id === r.focus_area_id),
      }))
      setResults(enriched)
    } catch {
      setError('Search failed. Please try again.')
      setResults([])
    }
    setIsLoading(false)
  }, [focusAreas])

  useEffect(() => {
    const t = setTimeout(() => handleSearch(query), 350)
    return () => clearTimeout(t)
  }, [query, handleSearch])

  useEffect(() => {
    if (!isSearchOpen) {
      setQuery('')
      setResults([])
      setHasSearched(false)
      setError(null)
    }
  }, [isSearchOpen])

  if (!isSearchOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
      <div className="frosted-overlay absolute inset-0" onClick={closeSearch} />
      <div className="relative w-full max-w-xl card overflow-hidden shadow-modal">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-border)]">
          <Search size={16} className="text-[var(--color-text-secondary)] flex-shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search entries, notes, activities…"
            className="flex-1 bg-transparent text-[var(--color-text-primary)] placeholder:text-[var(--color-text-disabled)] text-sm focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-[var(--color-text-disabled)] hover:text-[var(--color-text-secondary)]">
              <X size={14} />
            </button>
          )}
          <kbd className="text-xs text-[var(--color-text-disabled)] bg-[var(--color-bg-subtle)] px-1.5 py-0.5 rounded">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {isLoading && (
            <div className="py-8 text-center text-sm text-[var(--color-text-secondary)]">
              Searching…
            </div>
          )}

          {!isLoading && error && (
            <div className="py-8 text-center text-sm text-red-400">
              {error}
            </div>
          )}

          {!isLoading && !error && hasSearched && results.length === 0 && (
            <div className="py-10 flex flex-col items-center gap-3 text-[var(--color-text-disabled)]">
              <NoSearchResultsIllustration />
              <p className="text-sm">No results for &ldquo;{query}&rdquo;</p>
            </div>
          )}

          {!isLoading && !error && results.map((result) => (
            <SearchResultItem
              key={result.id}
              result={result}
              query={query}
              onSelect={closeSearch}
            />
          ))}

          {!query && !hasSearched && (
            <div className="py-8 text-center text-sm text-[var(--color-text-disabled)]">
              Type to search across all your entries
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
