'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'

export const SearchUsers = () => {
  const router = useRouter()
  const pathname = usePathname()
  const [isSearching, setIsSearching] = useState(false)

  return (
    <div className="rounded-xl border border-theme-line bg-[var(--background-highlight)] p-6">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          setIsSearching(true)
          const form = e.currentTarget
          const formData = new FormData(form)
          const queryTerm = formData.get('search') as string
          if (queryTerm.trim()) {
            router.push(pathname + '?search=' + encodeURIComponent(queryTerm))
          } else {
            router.push(pathname)
          }
          setIsSearching(false)
        }}
        className="flex items-end gap-4"
      >
        <div className="flex-1">
          <label htmlFor="search" className="mb-2 block font-google-sans-code text-sm font-medium text-[var(--foreground)]">
            Search for users by name or email
          </label>
          <input 
            id="search" 
            name="search" 
            type="text" 
            placeholder="Enter name or email..."
            className="w-full rounded-lg border border-theme-line bg-[var(--background-highlight)] px-3 py-2 font-google-sans-code text-[var(--foreground)] placeholder:text-[var(--text-muted)] focus:border-theme focus:outline-none"
          />
        </div>
        <button 
          type="submit" 
          disabled={isSearching}
          className="rounded-lg border border-theme-line bg-[var(--background-highlight)] px-6 py-2 font-google-sans-code text-sm text-[var(--text-muted)] transition hover:bg-theme-wash hover:text-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSearching ? 'thinking...' : 'Search'}
        </button>
      </form>
    </div>
  )
}