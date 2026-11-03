'use client'

import { useState } from 'react'
import { useFetch } from '@/hooks/useFetch'
import { useTheme } from '../../contexts/ThemeContext'

interface Article {
  id: string
  slug: string
  title: string
  description: string
  category: string
  content: string
  published: boolean
  author: string
  date: string
  createdAt: string
  updatedAt: string
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  pages: number
}

const PAGE_SIZE = 10

export default function ArticlesAdminContent() {
  const { colorValue } = useTheme()
  const [currentPage, setCurrentPage] = useState(1)
  const [search, setSearch] = useState('')
  const [publishedFilter, setPublishedFilter] = useState<string>('')
  const [categoryFilter, setCategoryFilter] = useState('')

  const params = new URLSearchParams({
    page: currentPage.toString(),
    limit: PAGE_SIZE.toString(),
    ...(search && { search }),
    ...(publishedFilter && { published: publishedFilter }),
    ...(categoryFilter && { category: categoryFilter })
  })
  const { data, loading } = useFetch<{ articles: Article[]; pagination: PaginationInfo }>(
    `/api/admin/articles?${params}`
  )
  const articles = data?.articles ?? []
  const pagination = data?.pagination ?? { page: currentPage, limit: PAGE_SIZE, total: 0, pages: 0 }

  const inputClass = 'rounded-lg border px-3 py-2 font-google-sans-code text-sm'
  const inputStyle = { borderColor: `${colorValue}20`, backgroundColor: 'var(--background)', color: 'var(--foreground)' }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-google-sans-code text-2xl font-bold uppercase" style={{ color: 'var(--foreground)' }}>
          ARTICLES.
        </h1>
        <button
          className="rounded-lg px-4 py-2 font-google-sans-code text-sm font-medium text-black transition-opacity hover:opacity-90"
          style={{ backgroundColor: colorValue }}
        >
          + New Article
        </button>
      </div>

      <div className="mb-6 rounded-xl border p-6" style={{ backgroundColor: 'var(--background)', borderColor: `${colorValue}20` }}>
        <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-4">
          <input
            type="text"
            placeholder="Search articles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={inputClass}
            style={inputStyle}
          />
          <select
            value={publishedFilter}
            onChange={(e) => setPublishedFilter(e.target.value)}
            className={inputClass}
            style={inputStyle}
          >
            <option value="">All Articles</option>
            <option value="true">Published</option>
            <option value="false">Drafts</option>
          </select>
          <input
            type="text"
            placeholder="Filter by category..."
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className={inputClass}
            style={inputStyle}
          />
          <button
            onClick={() => {
              setSearch('')
              setPublishedFilter('')
              setCategoryFilter('')
            }}
            className="rounded-lg px-4 py-2 font-google-sans-code text-sm transition-opacity hover:opacity-80"
            style={{ backgroundColor: 'var(--background-highlight)', color: 'var(--text-muted)' }}
          >
            Clear Filters
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border" style={{ backgroundColor: 'var(--background)', borderColor: `${colorValue}20` }}>
        {loading ? (
          <div className="p-8 text-center">
            <div
              className="mx-auto size-8 animate-spin rounded-full border-4 border-solid align-[-0.125em]"
              style={{ borderTopColor: colorValue, borderLeftColor: colorValue, borderBottomColor: colorValue, borderRightColor: 'transparent' }}
            />
            <p className="mt-2 font-google-sans-code text-sm" style={{ color: 'var(--text-muted)' }}>Loading articles...</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${colorValue}20` }}>
                    {['Title', 'Category', 'Author', 'Status', 'Date', 'Actions'].map(h => (
                      <th key={h} className="px-6 py-3 text-left font-google-sans-code text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {articles.map((article, i) => (
                    <tr
                      key={article.id}
                      style={{ borderBottom: i < articles.length - 1 ? `1px solid ${colorValue}10` : undefined }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--background-highlight)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td className="px-6 py-4">
                        <div className="font-google-sans-code text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                          {article.title}
                        </div>
                        <div className="font-google-sans-code text-sm" style={{ color: 'var(--text-muted)' }}>
                          {article.description.length > 100
                            ? `${article.description.substring(0, 100)}...`
                            : article.description}
                        </div>
                        <div className="mt-1 font-google-sans-code text-xs" style={{ color: 'var(--text-muted)' }}>
                          /{article.slug}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className="inline-flex rounded-full px-2 py-1 font-google-sans-code text-xs font-semibold"
                          style={{ backgroundColor: `${colorValue}15`, color: colorValue }}
                        >
                          {article.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-google-sans-code text-sm" style={{ color: 'var(--foreground)' }}>
                        {article.author}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex rounded-full px-2 py-1 font-google-sans-code text-xs font-semibold ${
                          article.published
                            ? 'bg-green-500/15 text-green-500'
                            : 'bg-yellow-500/15 text-yellow-500'
                        }`}>
                          {article.published ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-vt323 text-sm" style={{ color: 'var(--text-muted)' }}>
                        {new Date(article.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 font-google-sans-code text-sm font-medium">
                        <button className="mr-3 transition-colors" style={{ color: colorValue }}>Edit</button>
                        <button className="mr-3 transition-colors" style={{ color: colorValue }}>
                          {article.published ? 'Unpublish' : 'Publish'}
                        </button>
                        <button className="transition-colors text-red-500 hover:text-red-400">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination.pages > 1 && (
              <div className="border-t px-4 py-3 sm:px-6" style={{ borderColor: `${colorValue}20` }}>
                <div className="flex items-center justify-between">
                  <p className="font-google-sans-code text-sm" style={{ color: 'var(--text-muted)' }}>
                    Showing{' '}
                    <span className="font-vt323 text-base">{(pagination.page - 1) * pagination.limit + 1}</span>
                    {' '}–{' '}
                    <span className="font-vt323 text-base">{Math.min(pagination.page * pagination.limit, pagination.total)}</span>
                    {' '}of{' '}
                    <span className="font-vt323 text-base">{pagination.total}</span>
                  </p>
                  <nav className="inline-flex gap-1">
                    <button
                      onClick={() => setCurrentPage(p => p - 1)}
                      disabled={pagination.page === 1}
                      className="rounded-lg border px-3 py-1 font-google-sans-code text-sm disabled:opacity-40"
                      style={{ borderColor: `${colorValue}20`, color: 'var(--text-muted)' }}
                    >
                      ←
                    </button>
                    {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className="rounded-lg border px-3 py-1 font-vt323 text-sm"
                        style={page === pagination.page
                          ? { backgroundColor: colorValue, borderColor: colorValue, color: 'black' }
                          : { borderColor: `${colorValue}20`, color: 'var(--text-muted)' }
                        }
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage(p => p + 1)}
                      disabled={pagination.page === pagination.pages}
                      className="rounded-lg border px-3 py-1 font-google-sans-code text-sm disabled:opacity-40"
                      style={{ borderColor: `${colorValue}20`, color: 'var(--text-muted)' }}
                    >
                      →
                    </button>
                  </nav>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
