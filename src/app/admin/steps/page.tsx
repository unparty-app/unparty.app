'use client'

import { useState } from 'react'
import { useFetch } from '@/hooks/useFetch'
import { StepStatus, Priority, StepVisibility } from '@prisma/client'

import { Search, Users, Tag, Link2, Calendar, Boxes } from '@/app/components/icons'
import Image from 'next/image'
import { foundersQuestions } from '@/app/founders/foundersquestions'
import unpppsConfig from '@/data/UnpppsConfig.json'
import { resolveCoverSrc, isVideoCover } from '../../components/editorial/CoverImageBackground'
import CoverVideo from '../../components/CoverVideo'

const unpppOptions = [...unpppsConfig.unppps].sort((a, b) => a.name.localeCompare(b.name))
const unpppById = new Map(unpppsConfig.unppps.map(u => [u.id, u]))

interface BulkDeleteCriteria {
  status?: StepStatus
  priority?: Priority
  organizationId?: string
  hasQuestionMetadata?: boolean
}

interface UserProgress {
  userId: string
  completed: boolean
  startedAt: string | null
  completedAt: string | null
  user: {
    id: string
    firstName: string | null
    lastName: string | null
    email: string
  }
}

interface ProgressStats {
  totalUsers: number
  completedUsers: number
  startedUsers: number
  notStartedUsers: number
}

interface Category {
  id: string
  name: string
  color?: string
}

// Type-safe metadata interfaces
interface FounderQuestionMetadata {
  founderQuestions: string[]
  founderCategory?: string
}

interface TimeBasedMetadata {
  minTimeMinutes: number
}

interface ActionMetadata {
  actionTrigger: string
}

interface PhotoUploadMetadata {
  uploadWord: string
}

type StepMetadata = Partial<FounderQuestionMetadata & TimeBasedMetadata & ActionMetadata & PhotoUploadMetadata> & { stepType?: string } & Record<string, unknown>

interface Step {
  id: string
  title: string
  description: string
  optional: boolean
  link?: string
  cover?: string | null
  icon?: string | null
  status: StepStatus
  priority: Priority
  dueDate?: string
  organizationId?: string
  visibility: StepVisibility
  unpppId?: string | null
  createdAt: string
  updatedAt: string
  progressStats: ProgressStats
  userProgress: UserProgress[]
  categories: Category[]
  metadata?: StepMetadata
  questions?: {
    id: string
    text: string
    type: string
  }[]
}

// Type guard for founder question metadata
function hasFounderQuestions(metadata: StepMetadata | undefined): metadata is StepMetadata & { founderQuestions: string[] } {
  return !!(metadata && Array.isArray(metadata.founderQuestions) && metadata.founderQuestions.length > 0)
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  pages: number
}

const PAGE_SIZE = 10

export default function StepsPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StepStatus | ''>('')
  const [priorityFilter, setPriorityFilter] = useState<Priority | ''>('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingStep, setEditingStep] = useState<Step | null>(null)
  const [updating, setUpdating] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletingStep, setDeletingStep] = useState<Step | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [showProgressModal, setShowProgressModal] = useState(false)
  const [selectedStep, setSelectedStep] = useState<Step | null>(null)
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false)
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [selectedStepsForDelete, setSelectedStepsForDelete] = useState<string[]>([])
  const [showBulkVisibilityModal, setShowBulkVisibilityModal] = useState(false)
  const [bulkUpdatingVisibility, setBulkUpdatingVisibility] = useState(false)

  const [newStep, setNewStep] = useState<{
    title: string
    description: string
    optional: boolean
    link: string
    cover: string
    icon: string
    status: StepStatus
    priority: Priority
    dueDate: string
    organizationId: string
    visibility: StepVisibility
    categoryIds: string[]
    stepType: 'question-based' | 'link-based' | 'action-based' | 'time-based' | 'photo-upload'
    minTimeMinutes?: number
    actionTrigger?: string
    uploadWord?: string
    founderQuestionIds?: string[]
    founderCategoryId?: string
    unpppId: string
  }>({
    title: '',
    description: '',
    optional: false,
    link: '',
    cover: '',
    icon: '',
    status: 'PENDING' as StepStatus,
    priority: 'MEDIUM' as Priority,
    dueDate: '',
    organizationId: '',
    visibility: StepVisibility.ALL_USERS,
    categoryIds: [],
    stepType: 'question-based',
    minTimeMinutes: undefined,
    actionTrigger: undefined,
    uploadWord: undefined,
    founderQuestionIds: [],
    founderCategoryId: '',
    unpppId: ''
  })
  
  
  // Founder questions data
  const founderCategories = foundersQuestions.categories
  const selectedFounderCategory = founderCategories.find(cat => cat.id === newStep.founderCategoryId)
  
  // Column visibility state with localStorage persistence
  const [columnVisibility, setColumnVisibility] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('admin-steps-columns')
      if (saved) {
        return JSON.parse(saved)
      }
    }
    return {
      visibility: true,
      categories: true,
      unppp: true,
      link: true,
      dueDate: true,
      progress: true
    }
  })

  // Save column visibility to localStorage
  const updateColumnVisibility = (newVisibility: typeof columnVisibility) => {
    setColumnVisibility(newVisibility)
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin-steps-columns', JSON.stringify(newVisibility))
    }
  }

  const params = new URLSearchParams({
    page: currentPage.toString(),
    limit: PAGE_SIZE.toString(),
    ...(search && { search }),
    ...(statusFilter && { status: statusFilter }),
    ...(priorityFilter && { priority: priorityFilter })
  })
  const { data, loading, refetch: fetchSteps } = useFetch<{ steps: Step[]; pagination: PaginationInfo }>(
    `/api/admin/steps?${params}`
  )
  const steps = data?.steps ?? []
  const pagination = data?.pagination ?? { page: currentPage, limit: PAGE_SIZE, total: 0, pages: 0 }
  const { data: categories = [] } = useFetch<Category[]>('/api/admin/categories')

  const createStep = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    
    try {
      const response = await fetch('/api/admin/steps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newStep,
          dueDate: newStep.dueDate ? new Date(newStep.dueDate).toISOString() : null
        })
      })

      if (response.ok) {
        setShowCreateModal(false)
        setNewStep({
          title: '',
          description: '',
          optional: false,
          link: '',
          cover: '',
          icon: '',
          status: 'PENDING' as StepStatus,
          priority: 'MEDIUM' as Priority,
          dueDate: '',
          organizationId: '',
          visibility: StepVisibility.ALL_USERS,
          categoryIds: [],
          stepType: 'question-based',
          minTimeMinutes: undefined,
          actionTrigger: undefined,
          uploadWord: undefined,
          founderQuestionIds: [],
          founderCategoryId: '',
          unpppId: ''
        })
        fetchSteps() // Refresh the list
      } else {
        console.error('Failed to create step')
      }
    } catch (error) {
      console.error('Failed to create step:', error)
    } finally {
      setCreating(false)
    }
  }

  const editStep = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingStep) return
    
    setUpdating(true)
    
    try {
      const response = await fetch('/api/steps', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...editingStep,
          dueDate: editingStep.dueDate ? new Date(editingStep.dueDate).toISOString() : null
        })
      })

      if (response.ok) {
        setShowEditModal(false)
        setEditingStep(null)
        fetchSteps() // Refresh the list
      } else {
        console.error('Failed to update step')
      }
    } catch (error) {
      console.error('Failed to update step:', error)
    } finally {
      setUpdating(false)
    }
  }

  const deleteStep = async () => {
    if (!deletingStep) return
    
    setDeleting(true)
    
    try {
      const response = await fetch(`/api/steps?id=${deletingStep.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setShowDeleteModal(false)
        setDeletingStep(null)
        fetchSteps() // Refresh the list
      } else {
        console.error('Failed to delete step')
      }
    } catch (error) {
      console.error('Failed to delete step:', error)
    } finally {
      setDeleting(false)
    }
  }

  const bulkDeleteSteps = async (criteria?: BulkDeleteCriteria) => {
    setBulkDeleting(true)
    
    try {
      const payload = criteria ? { criteria } : { stepIds: selectedStepsForDelete }
      
      const response = await fetch('/api/admin/steps/bulk-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        const result = await response.json()
        setShowBulkDeleteModal(false)
        setSelectedStepsForDelete([])
        fetchSteps() // Refresh the list
        console.log(`Deleted ${result.deletedCount} steps`)
      } else {
        console.error('Failed to bulk delete steps')
      }
    } catch (error) {
      console.error('Failed to bulk delete steps:', error)
    } finally {
      setBulkDeleting(false)
    }
  }

  const getStatusColor = (status: StepStatus) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-600/20 text-yellow-700 dark:text-yellow-300 border-yellow-700'
      case 'IN_PROGRESS': return 'bg-blue-600/20 text-blue-700 dark:text-blue-300 border-blue-700'
      case 'COMPLETED': return 'bg-green-600/20 text-green-700 dark:text-green-300 border-green-700'
      default: return 'bg-theme-wash text-[var(--text-muted)] border-theme-line'
    }
  }

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case 'LOW': return 'bg-theme-wash text-[var(--text-muted)] border-theme-line'
      case 'MEDIUM': return 'bg-orange-600/20 text-orange-700 dark:text-orange-300 border-orange-700'
      case 'HIGH': return 'bg-red-600/20 text-red-700 dark:text-red-300 border-red-700'
      default: return 'bg-theme-wash text-[var(--text-muted)] border-theme-line'
    }
  }

  const toggleStepVisibility = async (stepId: string) => {
    try {
      const response = await fetch(`/api/admin/steps/${stepId}/visibility`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        // Refresh the steps list
        fetchSteps()
      } else {
        console.error('Failed to toggle step visibility')
      }
    } catch (error) {
      console.error('Failed to toggle step visibility:', error)
    }
  }

  const bulkUpdateVisibility = async (visibility: StepVisibility) => {
    if (selectedStepsForDelete.length === 0) return
    
    setBulkUpdatingVisibility(true)
    
    try {
      // Update visibility for each selected step
      const promises = selectedStepsForDelete.map(stepId =>
        fetch(`/api/admin/steps/${stepId}/visibility`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ visibility })
        })
      )

      const results = await Promise.all(promises)
      const successCount = results.filter(r => r.ok).length

      if (successCount > 0) {
        setShowBulkVisibilityModal(false)
        setSelectedStepsForDelete([])
        fetchSteps() // Refresh the list
        console.log(`Updated visibility for ${successCount} steps`)
      } else {
        console.error('Failed to update step visibility')
      }
    } catch (error) {
      console.error('Failed to bulk update visibility:', error)
    } finally {
      setBulkUpdatingVisibility(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-google-sans-code text-2xl font-bold uppercase text-[var(--foreground)]">Steps Management</h1>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowBulkVisibilityModal(true)}
            disabled={selectedStepsForDelete.length === 0}
            className="rounded-xl border border-purple-700 bg-purple-600/20 px-4 py-2 font-google-sans-code text-sm text-purple-700 dark:text-purple-300 transition hover:bg-purple-600/40 hover:text-purple-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            👁️ Bulk Visibility ({selectedStepsForDelete.length})
          </button>
          <button 
            onClick={() => setShowBulkDeleteModal(true)}
            className="rounded-xl border border-red-700 bg-red-600/20 px-4 py-2 font-google-sans-code text-sm text-red-700 dark:text-red-300 transition hover:bg-red-600/40 hover:text-red-200"
          >
            Bulk Clean
          </button>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="rounded-xl border border-theme-line bg-[var(--background-highlight)] px-4 py-2 font-google-sans-code text-sm text-[var(--text-muted)] transition hover:bg-theme-wash hover:text-[var(--foreground)]"
          >
            + New Step
          </button>
        </div>
      </div>

      {/* Horizontal Tab Bar */}
      <div className="flex w-full flex-wrap items-center gap-2 overflow-hidden rounded-xl border border-theme-line bg-[var(--background-highlight)] p-4 font-google-sans-code text-sm">
        {/* Status Filters */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setStatusFilter('')}
            className={`whitespace-nowrap rounded-lg px-3 py-1 text-xs font-medium transition-all ${
              !statusFilter 
                ? 'border border-theme-line bg-theme-wash text-[var(--foreground)]' 
                : 'text-[var(--text-muted)] hover:bg-theme-wash hover:text-[var(--foreground)]'
            }`}
          >
            ALL
          </button>
          <button
            onClick={() => setStatusFilter('PENDING')}
            className={`whitespace-nowrap rounded-lg px-3 py-1 text-xs font-medium transition-all ${
              statusFilter === 'PENDING' 
                ? 'border border-yellow-700 bg-yellow-600/20 text-yellow-700 dark:text-yellow-300' 
                : 'text-[var(--text-muted)] hover:bg-yellow-600/10 hover:text-yellow-300'
            }`}
          >
            PENDING
          </button>
          <button
            onClick={() => setStatusFilter('IN_PROGRESS')}
            className={`whitespace-nowrap rounded-lg px-3 py-1 text-xs font-medium transition-all ${
              statusFilter === 'IN_PROGRESS' 
                ? 'border border-blue-700 bg-blue-600/20 text-blue-700 dark:text-blue-300' 
                : 'text-[var(--text-muted)] hover:bg-blue-600/10 hover:text-blue-300'
            }`}
          >
            IN PROGRESS
          </button>
          <button
            onClick={() => setStatusFilter('COMPLETED')}
            className={`whitespace-nowrap rounded-lg px-3 py-1 text-xs font-medium transition-all ${
              statusFilter === 'COMPLETED' 
                ? 'border border-green-700 bg-green-600/20 text-green-700 dark:text-green-300' 
                : 'text-[var(--text-muted)] hover:bg-green-600/10 hover:text-green-300'
            }`}
          >
            COMPLETED
          </button>
        </div>

        <span className="text-[var(--text-muted)]">|</span>

        {/* Priority Filters */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPriorityFilter('HIGH')}
            className={`whitespace-nowrap rounded-lg px-3 py-1 text-xs font-medium transition-all ${
              priorityFilter === 'HIGH' 
                ? 'border border-red-700 bg-red-600/20 text-red-700 dark:text-red-300' 
                : 'text-[var(--text-muted)] hover:bg-red-600/10 hover:text-red-300'
            }`}
          >
            HIGH
          </button>
          <button
            onClick={() => setPriorityFilter('MEDIUM')}
            className={`whitespace-nowrap rounded-lg px-3 py-1 text-xs font-medium transition-all ${
              priorityFilter === 'MEDIUM' 
                ? 'border border-orange-700 bg-orange-600/20 text-orange-700 dark:text-orange-300' 
                : 'text-[var(--text-muted)] hover:bg-orange-600/10 hover:text-orange-300'
            }`}
          >
            MEDIUM
          </button>
          <button
            onClick={() => setPriorityFilter('LOW')}
            className={`whitespace-nowrap rounded-lg px-3 py-1 text-xs font-medium transition-all ${
              priorityFilter === 'LOW' 
                ? 'border border-theme-line bg-theme-wash text-[var(--text-muted)]' 
                : 'text-[var(--text-muted)] hover:bg-theme-wash hover:text-[var(--foreground)]'
            }`}
          >
            LOW
          </button>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Search and Controls */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-48 rounded-lg border border-theme-line bg-[var(--background-highlight)] py-2 pl-9 pr-3 font-google-sans-code text-xs text-[var(--foreground)] placeholder:text-[var(--text-muted)] focus:border-theme focus:outline-none"
            />
          </div>
          
          {/* Column Visibility Toggles */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => updateColumnVisibility({ ...columnVisibility, visibility: !columnVisibility.visibility })}
              className={`rounded-lg p-2 transition-all ${
                columnVisibility.visibility ? 'bg-purple-600/20 text-purple-700 dark:text-purple-300' : 'text-[var(--text-muted)] hover:bg-theme-wash hover:text-[var(--foreground)]'
              }`}
              title="Toggle Visibility Column"
            >
              <Users size={14} />
            </button>
            <button
              onClick={() => updateColumnVisibility({ ...columnVisibility, categories: !columnVisibility.categories })}
              className={`rounded-lg p-2 transition-all ${
                columnVisibility.categories ? 'bg-blue-600/20 text-blue-700 dark:text-blue-300' : 'text-[var(--text-muted)] hover:bg-theme-wash hover:text-[var(--foreground)]'
              }`}
              title="Toggle Categories Column"
            >
              <Tag size={14} />
            </button>
            <button
              onClick={() => updateColumnVisibility({ ...columnVisibility, unppp: !columnVisibility.unppp })}
              className={`rounded-lg p-2 transition-all ${
                columnVisibility.unppp ? 'bg-pink-600/20 text-pink-700 dark:text-pink-300' : 'text-[var(--text-muted)] hover:bg-theme-wash hover:text-[var(--foreground)]'
              }`}
              title="Toggle Unppp Column"
            >
              <Boxes size={14} />
            </button>
            <button
              onClick={() => updateColumnVisibility({ ...columnVisibility, link: !columnVisibility.link })}
              className={`rounded-lg p-2 transition-all ${
                columnVisibility.link ? 'bg-green-600/20 text-green-700 dark:text-green-300' : 'text-[var(--text-muted)] hover:bg-theme-wash hover:text-[var(--foreground)]'
              }`}
              title="Toggle Link Column"
            >
              <Link2 size={14} />
            </button>
            <button
              onClick={() => updateColumnVisibility({ ...columnVisibility, dueDate: !columnVisibility.dueDate })}
              className={`rounded-lg p-2 transition-all ${
                columnVisibility.dueDate ? 'bg-orange-600/20 text-orange-700 dark:text-orange-300' : 'text-[var(--text-muted)] hover:bg-theme-wash hover:text-[var(--foreground)]'
              }`}
              title="Toggle Due Date Column"
            >
              <Calendar size={14} />
            </button>
          </div>

          {/* Clear Filters */}
          {(search || statusFilter || priorityFilter) && (
            <button
              onClick={() => {
                setSearch('')
                setStatusFilter('')
                setPriorityFilter('')
              }}
              className="rounded-lg p-2 text-[var(--text-muted)] transition-colors hover:bg-theme-wash hover:text-[var(--foreground)]"
              title="Clear All Filters"
            >
              <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-theme-line bg-[var(--background-highlight)]">
        {loading ? (
          <div className="p-8 text-center">
            <div className="mx-auto size-8 animate-spin rounded-full border-b-2 border-theme-line"></div>
            <p className="mt-2 font-google-sans-code text-[var(--text-muted)]">Loading steps...</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[var(--background-highlight)]">
                  <tr>
                    <th className="px-6 py-3 text-left font-google-sans-code text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                      <input
                        type="checkbox"
                        checked={selectedStepsForDelete.length === steps.length && steps.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedStepsForDelete(steps.map(s => s.id))
                          } else {
                            setSelectedStepsForDelete([])
                          }
                        }}
                        className="rounded"
                      />
                    </th>
                    <th className="px-6 py-3 text-left font-google-sans-code text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left font-google-sans-code text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left font-google-sans-code text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                      Priority
                    </th>
                    {columnVisibility.visibility && (
                      <th className="px-6 py-3 text-left font-google-sans-code text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                        Visibility
                      </th>
                    )}
                    {columnVisibility.categories && (
                      <th className="px-6 py-3 text-left font-google-sans-code text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                        Categories
                      </th>
                    )}
                    {columnVisibility.unppp && (
                      <th className="px-6 py-3 text-left font-google-sans-code text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                        Unppp
                      </th>
                    )}
                    {columnVisibility.link && (
                      <th className="px-6 py-3 text-left font-google-sans-code text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                        Link
                      </th>
                    )}
                    {columnVisibility.dueDate && (
                      <th className="px-6 py-3 text-left font-google-sans-code text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                        Due Date
                      </th>
                    )}
                    {columnVisibility.progress && (
                      <th className="px-6 py-3 text-left font-google-sans-code text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                        Progress
                      </th>
                    )}
                    <th className="px-6 py-3 text-left font-google-sans-code text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme-line">
                  {steps.map((step) => (
                    <tr key={step.id} className="hover:bg-theme-wash">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedStepsForDelete.includes(step.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedStepsForDelete([...selectedStepsForDelete, step.id])
                            } else {
                              setSelectedStepsForDelete(selectedStepsForDelete.filter(id => id !== step.id))
                            }
                          }}
                          className="rounded"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-google-sans-code text-sm font-medium text-[var(--foreground)]">
                            {step.title}
                            {step.optional && (
                              <span className="ml-2 font-google-sans-code text-xs text-[var(--text-muted)]">(Optional)</span>
                            )}
                            {/* Founder Questions Indicator */}
                            {(hasFounderQuestions(step.metadata) || (step.questions?.length ?? 0) > 0) && (
                              <span className="ml-2 inline-flex items-center gap-1 rounded-full border border-purple-700/30 bg-purple-600/20 px-2 py-0.5 font-google-sans-code text-xs text-purple-700 dark:text-purple-300">
                                🎯 {step.questions?.length ?? (hasFounderQuestions(step.metadata) ? step.metadata.founderQuestions.length : 0)}Q
                              </span>
                            )}
                          </div>
                          <div className="font-google-sans-code text-sm text-[var(--text-muted)]">
                            {step.description.length > 100
                              ? `${step.description.substring(0, 100)}...`
                              : step.description}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex rounded-full border px-2 py-1 font-google-sans-code text-xs font-semibold ${getStatusColor(step.status)}`}>
                          {step.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex rounded-full border px-2 py-1 font-google-sans-code text-xs font-semibold ${getPriorityColor(step.priority)}`}>
                          {step.priority}
                        </span>
                      </td>
                      {columnVisibility.visibility && (
                        <td className="px-6 py-4">
                          <span className="inline-flex rounded-full border border-purple-700 bg-purple-600/20 px-2 py-1 font-google-sans-code text-xs font-semibold text-purple-700 dark:text-purple-300">
                            {step.visibility.replace(/_/g, ' ')}
                          </span>
                          {step.organizationId && (
                            <div className="mt-1 font-google-sans-code text-xs text-[var(--text-muted)]">Org: {step.organizationId.slice(0, 8)}...</div>
                          )}
                        </td>
                      )}
                      {columnVisibility.categories && (
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {step.categories.map((category) => (
                              <span 
                                key={category.id}
                                className="inline-flex rounded-full border px-2 py-1 font-google-sans-code text-xs font-semibold"
                                style={{ 
                                  backgroundColor: `${category.color}20`, 
                                  color: category.color, 
                                  borderColor: `${category.color}70` 
                                }}
                              >
                                {category.name}
                              </span>
                            ))}
                            {step.categories.length === 0 && (
                              <span className="font-google-sans-code text-xs text-[var(--text-muted)]">No categories</span>
                            )}
                          </div>
                        </td>
                      )}
                      {columnVisibility.unppp && (
                        <td className="px-6 py-4">
                          {step.unpppId && unpppById.get(step.unpppId) ? (
                            <span
                              className="inline-flex rounded-full border px-2 py-1 font-google-sans-code text-xs font-semibold"
                              style={{
                                backgroundColor: `${unpppById.get(step.unpppId)!.color}20`,
                                color: unpppById.get(step.unpppId)!.color,
                                borderColor: `${unpppById.get(step.unpppId)!.color}70`
                              }}
                            >
                              {unpppById.get(step.unpppId)!.name}
                            </span>
                          ) : (
                            <span className="font-google-sans-code text-xs text-[var(--text-muted)]">—</span>
                          )}
                        </td>
                      )}
                      {columnVisibility.link && (
                        <td className="px-6 py-4 font-google-sans-code text-sm text-[var(--foreground)]">
                          {step.link ? (
                            <a
                              href={step.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-700 dark:text-blue-400 transition hover:text-blue-300"
                            >
                              Open Link →
                            </a>
                          ) : (
                            <span className="text-[var(--text-muted)]">No link</span>
                          )}
                        </td>
                      )}
                      {columnVisibility.dueDate && (
                        <td className="px-6 py-4 font-google-sans-code text-sm text-[var(--foreground)]">
                          {step.dueDate
                            ? new Date(step.dueDate).toLocaleDateString()
                            : <span className="text-[var(--text-muted)]">No due date</span>}
                        </td>
                      )}
                      {columnVisibility.progress && (
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <div className="h-2 flex-1 rounded-full bg-theme-wash">
                                <div 
                                  className="h-2 rounded-full bg-green-500" 
                                  style={{ 
                                    width: step.progressStats.totalUsers > 0 
                                      ? `${(step.progressStats.completedUsers / step.progressStats.totalUsers) * 100}%` 
                                      : '0%' 
                                  }}
                                ></div>
                              </div>
                              <span className="min-w-[60px] font-google-sans-code text-xs text-[var(--text-muted)]">
                                {step.progressStats.completedUsers}/{step.progressStats.totalUsers}
                              </span>
                            </div>
                            <button
                              onClick={() => {
                                setSelectedStep(step)
                                setShowProgressModal(true)
                              }}
                              className="font-google-sans-code text-xs text-blue-700 dark:text-blue-400 hover:text-blue-300"
                            >
                              View Details →
                            </button>
                          </div>
                        </td>
                      )}
                      <td className="px-6 py-4 text-sm font-medium">
                        <div className="flex items-center gap-2">
                          {/* Visibility Toggle */}
                          <button
                            onClick={() => toggleStepVisibility(step.id)}
                            className={`rounded-full px-2 py-1 font-google-sans-code text-xs font-medium transition-all ${
                              step.visibility === 'ALL_USERS'
                                ? 'border border-green-700 bg-green-600/20 text-green-700 dark:text-green-300 hover:bg-green-600/40'
                                : 'border border-theme-line bg-theme-wash text-[var(--text-muted)] hover:bg-theme-wash'
                            }`}
                            title={`Toggle visibility (currently ${step.visibility === 'ALL_USERS' ? 'public' : 'hidden'})`}
                          >
                            {step.visibility === 'ALL_USERS' ? '👁️' : '🚫'}
                          </button>
                          
                          <button 
                            onClick={() => {
                              setEditingStep(step)
                              setShowEditModal(true)
                            }}
                            className="font-google-sans-code text-sm text-blue-700 dark:text-blue-400 hover:text-blue-300"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => {
                              setDeletingStep(step)
                              setShowDeleteModal(true)
                            }}
                            className="font-google-sans-code text-sm text-red-700 dark:text-red-400 hover:text-red-300"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {steps.length === 0 && (
              <div className="p-8 text-center">
                <div className="text-[var(--text-muted)]">
                  <h3 className="mb-2 font-google-sans-code text-lg font-medium text-[var(--foreground)]">No steps found</h3>
                  <p className="font-google-sans-code text-[var(--text-muted)]">
                    {search || statusFilter || priorityFilter 
                      ? 'Try adjusting your filters or search terms.'
                      : 'No steps have been created yet. Seed the database to get started.'}
                  </p>
                </div>
              </div>
            )}

            {pagination.pages > 1 && (
              <div className="border-t border-theme-line bg-[var(--background-highlight)] px-4 py-3 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex flex-1 justify-between sm:hidden">
                    <button
                      onClick={() => setCurrentPage(p => p - 1)}
                      disabled={pagination.page === 1}
                      className="relative inline-flex items-center rounded-md border border-theme-line bg-[var(--background-highlight)] px-4 py-2 font-google-sans-code text-sm font-medium text-[var(--text-muted)] hover:bg-theme-wash disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(p => p + 1)}
                      disabled={pagination.page === pagination.pages}
                      className="relative inline-flex items-center rounded-md border border-theme-line bg-[var(--background-highlight)] px-4 py-2 font-google-sans-code text-sm font-medium text-[var(--text-muted)] hover:bg-theme-wash disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                    <div>
                      <p className="font-google-sans-code text-sm text-[var(--text-muted)]">
                        Showing{' '}
                        <span className="font-medium text-[var(--foreground)]">
                          {(pagination.page - 1) * pagination.limit + 1}
                        </span>{' '}
                        to{' '}
                        <span className="font-medium text-[var(--foreground)]">
                          {Math.min(pagination.page * pagination.limit, pagination.total)}
                        </span>{' '}
                        of{' '}
                        <span className="font-medium text-[var(--foreground)]">{pagination.total}</span>{' '}
                        results
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex -space-x-px rounded-md shadow-sm">
                        {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`relative inline-flex items-center border px-4 py-2 font-google-sans-code text-sm font-medium ${
                              page === pagination.page
                                ? 'z-10 border-blue-700 bg-blue-600/20 text-blue-700 dark:text-blue-300'
                                : 'border-theme-line bg-[var(--background-highlight)] text-[var(--text-muted)] hover:bg-theme-wash'
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                      </nav>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Step Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-[var(--background-highlight)]">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="flex w-full max-w-md flex-col overflow-hidden rounded-xl border border-theme-line bg-[var(--background-highlight)]">
              {/* Modal Header */}
              <div className="border-b border-theme-line px-6 py-4">
                <h2 className="font-google-sans-code text-xl font-bold text-[var(--foreground)]">Create New Step</h2>
              </div>
              
              {/* Scrollable Form Content */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                <form id="create-step-form" onSubmit={createStep} className="space-y-4">
              <div>
                <label className="mb-2 block font-google-sans-code text-sm font-medium text-[var(--foreground)]">Title</label>
                <input
                  type="text"
                  required
                  value={newStep.title}
                  onChange={(e) => setNewStep({ ...newStep, title: e.target.value })}
                  className="w-full rounded-lg border border-theme-line bg-[var(--background-highlight)] px-3 py-2 font-google-sans-code text-[var(--foreground)] placeholder:text-[var(--text-muted)] focus:border-theme focus:outline-none"
                  placeholder="Enter step title..."
                />
              </div>

              <div>
                <label className="mb-2 block font-google-sans-code text-sm font-medium text-[var(--foreground)]">Description</label>
                <textarea
                  required
                  value={newStep.description}
                  onChange={(e) => setNewStep({ ...newStep, description: e.target.value })}
                  className="w-full rounded-lg border border-theme-line bg-[var(--background-highlight)] px-3 py-2 font-google-sans-code text-[var(--foreground)] placeholder:text-[var(--text-muted)] focus:border-theme focus:outline-none"
                  placeholder="Enter step description..."
                  rows={3}
                />
              </div>

              <div>
                <label className="mb-2 block font-google-sans-code text-sm font-medium text-[var(--foreground)]">Step Type</label>
                <select
                  value={newStep.stepType}
                  onChange={(e) => setNewStep({ ...newStep, stepType: e.target.value as 'question-based' | 'link-based' | 'action-based' | 'time-based' | 'photo-upload' })}
                  className="w-full rounded-lg border border-theme-line bg-[var(--background-highlight)] px-3 py-2 font-google-sans-code text-[var(--foreground)] focus:border-theme focus:outline-none"
                >
                  <option value="question-based">Question-Based (Auto-complete when questions answered)</option>
                  <option value="link-based">Link-Based (Complete when link visited)</option>
                  <option value="action-based">Action-Based (Complete on specific user action)</option>
                  <option value="time-based">Time-Based (Complete after minimum time spent)</option>
                  <option value="photo-upload">Photo Upload (Complete on authenticated photo upload)</option>
                </select>
              </div>

              {newStep.stepType === 'photo-upload' && (
                <div>
                  <label className="mb-2 block font-google-sans-code text-sm font-medium text-[var(--foreground)]">Upload Word</label>
                  <input
                    type="text"
                    required
                    value={newStep.uploadWord || ''}
                    onChange={(e) => setNewStep({ ...newStep, uploadWord: e.target.value })}
                    className="w-full rounded-lg border border-theme-line bg-[var(--background-highlight)] px-3 py-2 font-google-sans-code text-[var(--foreground)] placeholder:text-[var(--text-muted)] focus:border-theme focus:outline-none"
                    placeholder="e.g., 'active', 'think', 'like', 'hobby'..."
                  />
                  <p className="mt-2 font-google-sans-code text-xs text-[var(--text-muted)]">
                    Set Cover below to the exact id of the image this step registers against (e.g. &quot;cover-001&quot;) — any ScrollRow using that image becomes clickable and opens the upload modal.
                  </p>
                </div>
              )}

              {newStep.stepType === 'link-based' && (
                <div>
                  <label className="mb-2 block font-google-sans-code text-sm font-medium text-[var(--foreground)]">Link (Required for Link-Based)</label>
                  <input
                    type="url"
                    required
                    value={newStep.link}
                    onChange={(e) => setNewStep({ ...newStep, link: e.target.value })}
                    className="w-full rounded-lg border border-theme-line bg-[var(--background-highlight)] px-3 py-2 font-google-sans-code text-[var(--foreground)] placeholder:text-[var(--text-muted)] focus:border-theme focus:outline-none"
                    placeholder="https://..."
                  />
                </div>
              )}

              {newStep.stepType === 'time-based' && (
                <div>
                  <label className="mb-2 block font-google-sans-code text-sm font-medium text-[var(--foreground)]">Minimum Time (Minutes)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newStep.minTimeMinutes || ''}
                    onChange={(e) => setNewStep({ ...newStep, minTimeMinutes: parseInt(e.target.value) || undefined })}
                    className="w-full rounded-lg border border-theme-line bg-[var(--background-highlight)] px-3 py-2 font-google-sans-code text-[var(--foreground)] placeholder:text-[var(--text-muted)] focus:border-theme focus:outline-none"
                    placeholder="Enter minimum minutes..."
                  />
                </div>
              )}

              {newStep.stepType === 'action-based' && (
                <div>
                  <label className="mb-2 block font-google-sans-code text-sm font-medium text-[var(--foreground)]">Action Trigger</label>
                  <input
                    type="text"
                    required
                    value={newStep.actionTrigger || ''}
                    onChange={(e) => setNewStep({ ...newStep, actionTrigger: e.target.value })}
                    className="w-full rounded-lg border border-theme-line bg-[var(--background-highlight)] px-3 py-2 font-google-sans-code text-[var(--foreground)] placeholder:text-[var(--text-muted)] focus:border-theme focus:outline-none"
                    placeholder="e.g., 'profile_completed', 'first_submission'..."
                  />
                </div>
              )}

              {newStep.stepType === 'question-based' && (
                <>
                  <div>
                    <label className="mb-2 block font-google-sans-code text-sm font-medium text-[var(--foreground)]">Founder Category</label>
                    <select
                      value={newStep.founderCategoryId || ''}
                      onChange={(e) => setNewStep({ ...newStep, founderCategoryId: e.target.value, founderQuestionIds: [] })}
                      className="w-full rounded-lg border border-theme-line bg-[var(--background-highlight)] px-3 py-2 font-google-sans-code text-[var(--foreground)] focus:border-theme focus:outline-none"
                    >
                      <option value="">-- Select Category --</option>
                      {founderCategories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.label} ({cat.questions.length} questions)
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedFounderCategory && (
                    <div>
                      <label className="mb-2 block font-google-sans-code text-sm font-medium text-[var(--foreground)]">
                        Select Questions ({newStep.founderQuestionIds?.length || 0} selected)
                      </label>
                      <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-theme-line bg-[var(--background-highlight)] p-3">
                        <label className="flex items-center gap-2 font-google-sans-code text-xs text-[var(--foreground)]">
                          <input
                            type="checkbox"
                            checked={newStep.founderQuestionIds?.length === selectedFounderCategory.questions.length}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewStep({ 
                                  ...newStep, 
                                  founderQuestionIds: selectedFounderCategory.questions.map(q => q.id) 
                                })
                              } else {
                                setNewStep({ ...newStep, founderQuestionIds: [] })
                              }
                            }}
                            className="rounded"
                          />
                          <span className="font-bold">Select All</span>
                        </label>
                        <div className="my-2 border-t border-theme-line" />
                        {selectedFounderCategory.questions.map((question) => (
                          <label key={question.id} className="flex items-start gap-2 font-google-sans-code text-xs text-[var(--foreground)]">
                            <input
                              type="checkbox"
                              checked={newStep.founderQuestionIds?.includes(question.id) || false}
                              onChange={(e) => {
                                const currentIds = newStep.founderQuestionIds || []
                                if (e.target.checked) {
                                  setNewStep({ 
                                    ...newStep, 
                                    founderQuestionIds: [...currentIds, question.id] 
                                  })
                                } else {
                                  setNewStep({ 
                                    ...newStep, 
                                    founderQuestionIds: currentIds.filter(id => id !== question.id) 
                                  })
                                }
                              }}
                              className="mt-1 rounded"
                            />
                            <div className="flex-1">
                              <div className="font-medium">{question.id}</div>
                              <div className="text-[var(--text-muted)]">{question.text}</div>
                              <div className="mt-1 text-[var(--text-muted)]">Type: {question.type}</div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {(newStep.stepType === 'question-based' || (newStep.stepType !== 'link-based' && newStep.link)) && (
                <div>
                  <label className="mb-2 block font-google-sans-code text-sm font-medium text-[var(--foreground)]">Link (Optional)</label>
                  <input
                    type="url"
                    value={newStep.link}
                    onChange={(e) => setNewStep({ ...newStep, link: e.target.value })}
                    className="w-full rounded-lg border border-theme-line bg-[var(--background-highlight)] px-3 py-2 font-google-sans-code text-[var(--foreground)] placeholder:text-[var(--text-muted)] focus:border-theme focus:outline-none"
                    placeholder="https://..."
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block font-google-sans-code text-sm font-medium text-[var(--foreground)]">Priority</label>
                  <select
                    value={newStep.priority}
                    onChange={(e) => setNewStep({ ...newStep, priority: e.target.value as Priority })}
                    className="w-full rounded-lg border border-theme-line bg-[var(--background-highlight)] px-3 py-2 font-google-sans-code text-[var(--foreground)] focus:border-theme focus:outline-none"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block font-google-sans-code text-sm font-medium text-[var(--foreground)]">Status</label>
                  <select
                    value={newStep.status}
                    onChange={(e) => setNewStep({ ...newStep, status: e.target.value as StepStatus })}
                    className="w-full rounded-lg border border-theme-line bg-[var(--background-highlight)] px-3 py-2 font-google-sans-code text-[var(--foreground)] focus:border-theme focus:outline-none"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 font-google-sans-code text-sm text-[var(--foreground)]">
                  <input
                    type="checkbox"
                    checked={newStep.optional}
                    onChange={(e) => setNewStep({ ...newStep, optional: e.target.checked })}
                    className="rounded"
                  />
                  Optional Step
                </label>
              </div>

              <div>
                <label className="mb-2 block font-google-sans-code text-sm font-medium text-[var(--foreground)]">Due Date (Optional)</label>
                <input
                  type="date"
                  value={newStep.dueDate}
                  onChange={(e) => setNewStep({ ...newStep, dueDate: e.target.value })}
                  className="w-full rounded-lg border border-theme-line bg-[var(--background-highlight)] px-3 py-2 font-google-sans-code text-[var(--foreground)] focus:border-theme focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block font-google-sans-code text-sm font-medium text-[var(--foreground)]">Visibility</label>
                <select
                  value={newStep.visibility}
                  onChange={(e) => setNewStep({ ...newStep, visibility: e.target.value as StepVisibility })}
                  className="w-full rounded-lg border border-theme-line bg-[var(--background-highlight)] px-3 py-2 font-google-sans-code text-[var(--foreground)] focus:border-theme focus:outline-none"
                >
                  <option value={StepVisibility.ALL_USERS}>All Users</option>
                  <option value={StepVisibility.ORGANIZATION_ONLY}>Organization Only</option>
                  <option value={StepVisibility.CATEGORY_RESTRICTED}>Category Restricted</option>
                </select>
              </div>

              {newStep.visibility === StepVisibility.ORGANIZATION_ONLY && (
                <div>
                  <label className="mb-2 block font-google-sans-code text-sm font-medium text-[var(--foreground)]">Organization ID</label>
                  <input
                    type="text"
                    value={newStep.organizationId}
                    onChange={(e) => setNewStep({ ...newStep, organizationId: e.target.value })}
                    className="w-full rounded-lg border border-theme-line bg-[var(--background-highlight)] px-3 py-2 font-google-sans-code text-[var(--foreground)] placeholder:text-[var(--text-muted)] focus:border-theme focus:outline-none"
                    placeholder="Enter Clerk organization ID..."
                  />
                </div>
              )}

              {categories.length > 0 && (
                <div>
                  <label className="mb-2 block font-google-sans-code text-sm font-medium text-[var(--foreground)]">Categories (Optional)</label>
                  <div className="max-h-32 space-y-2 overflow-y-auto">
                    {categories.map((category) => (
                      <label key={category.id} className="flex items-center gap-2 font-google-sans-code text-sm text-[var(--foreground)]">
                        <input
                          type="checkbox"
                          checked={newStep.categoryIds.includes(category.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewStep({ ...newStep, categoryIds: [...newStep.categoryIds, category.id] })
                            } else {
                              setNewStep({ ...newStep, categoryIds: newStep.categoryIds.filter(id => id !== category.id) })
                            }
                          }}
                          className="rounded"
                        />
                        <span style={{ color: category.color }}>{category.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="mb-2 block font-google-sans-code text-sm font-medium text-[var(--foreground)]">Related Unppp (Optional)</label>
                <select
                  value={newStep.unpppId}
                  onChange={(e) => setNewStep({ ...newStep, unpppId: e.target.value })}
                  className="w-full rounded-lg border border-theme-line bg-[var(--background-highlight)] px-3 py-2 font-google-sans-code text-[var(--foreground)] focus:border-theme focus:outline-none"
                >
                  <option value="">-- None --</option>
                  {unpppOptions.map((unppp) => (
                    <option key={unppp.id} value={unppp.id}>{unppp.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-[1fr_auto] gap-4">
                <div>
                  <label className="mb-2 block font-google-sans-code text-sm font-medium text-[var(--foreground)]">Cover (Optional)</label>
                  <input
                    type="text"
                    value={newStep.cover}
                    onChange={(e) => setNewStep({ ...newStep, cover: e.target.value })}
                    className="w-full rounded-lg border border-theme-line bg-[var(--background-highlight)] px-3 py-2 font-google-sans-code text-[var(--foreground)] placeholder:text-[var(--text-muted)] focus:border-theme focus:outline-none"
                    placeholder="bare coverId (cover-002), absolute image path, or absolute .mp4 path — falls back to the related unppp's cover/color"
                  />
                  <label className="mb-2 mt-3 block font-google-sans-code text-sm font-medium text-[var(--foreground)]">Icon (Optional)</label>
                  <input
                    type="text"
                    value={newStep.icon}
                    onChange={(e) => setNewStep({ ...newStep, icon: e.target.value })}
                    className="w-full rounded-lg border border-theme-line bg-[var(--background-highlight)] px-3 py-2 font-google-sans-code text-[var(--foreground)] placeholder:text-[var(--text-muted)] focus:border-theme focus:outline-none"
                    placeholder="emoji or icon name"
                  />
                </div>
                {newStep.cover && (
                  <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg border border-theme-line">
                    {isVideoCover(newStep.cover) ? (
                      <CoverVideo src={newStep.cover} alt="" className="size-full object-cover" />
                    ) : (
                      <Image src={resolveCoverSrc(newStep.cover)} alt="" fill sizes="96px" className="object-cover" />
                    )}
                  </div>
                )}
              </div>
                </form>
              </div>

              {/* Modal Footer with Buttons */}
              <div className="border-t border-theme-line px-6 py-4">
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 rounded-lg border border-theme-line bg-theme-wash px-4 py-2 font-google-sans-code text-sm text-[var(--text-muted)] transition hover:bg-theme-wash hover:text-[var(--foreground)]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    form="create-step-form"
                    disabled={creating}
                    className="flex-1 rounded-lg border border-blue-700 bg-blue-600/20 px-4 py-2 font-google-sans-code text-sm text-blue-700 dark:text-blue-300 transition hover:bg-blue-600/40 hover:text-blue-200 disabled:opacity-50"
                  >
                    {creating ? 'Creating...' : 'Create Step'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Step Modal */}
      {showEditModal && editingStep && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-[var(--background-highlight)]">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="flex w-full max-w-md flex-col overflow-hidden rounded-xl border border-theme-line bg-[var(--background-highlight)]">
              {/* Modal Header */}
              <div className="border-b border-theme-line px-6 py-4">
                <h2 className="font-google-sans-code text-xl font-bold text-[var(--foreground)]">Edit Step</h2>
              </div>
              
              {/* Scrollable Form Content */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                <form id="edit-step-form" onSubmit={editStep} className="space-y-4">
                <div>
                <label className="mb-2 block font-google-sans-code text-sm font-medium text-[var(--foreground)]">Title</label>
                <input
                  type="text"
                  required
                  value={editingStep.title}
                  onChange={(e) => setEditingStep({ ...editingStep, title: e.target.value })}
                  className="w-full rounded-lg border border-theme-line bg-[var(--background-highlight)] px-3 py-2 font-google-sans-code text-[var(--foreground)] placeholder:text-[var(--text-muted)] focus:border-theme focus:outline-none"
                  placeholder="Enter step title..."
                />
              </div>

              <div>
                <label className="mb-2 block font-google-sans-code text-sm font-medium text-[var(--foreground)]">Description</label>
                <textarea
                  required
                  value={editingStep.description}
                  onChange={(e) => setEditingStep({ ...editingStep, description: e.target.value })}
                  className="w-full rounded-lg border border-theme-line bg-[var(--background-highlight)] px-3 py-2 font-google-sans-code text-[var(--foreground)] placeholder:text-[var(--text-muted)] focus:border-theme focus:outline-none"
                  placeholder="Enter step description..."
                  rows={3}
                />
              </div>

              <div>
                <label className="mb-2 block font-google-sans-code text-sm font-medium text-[var(--foreground)]">Link (Optional)</label>
                <input
                  type="url"
                  value={editingStep.link || ''}
                  onChange={(e) => setEditingStep({ ...editingStep, link: e.target.value })}
                  className="w-full rounded-lg border border-theme-line bg-[var(--background-highlight)] px-3 py-2 font-google-sans-code text-[var(--foreground)] placeholder:text-[var(--text-muted)] focus:border-theme focus:outline-none"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="mb-2 block font-google-sans-code text-sm font-medium text-[var(--foreground)]">Step Type</label>
                <select
                  value={editingStep.metadata?.stepType || ''}
                  onChange={(e) =>
                    setEditingStep({
                      ...editingStep,
                      metadata: { ...editingStep.metadata, stepType: e.target.value || undefined }
                    })
                  }
                  className="w-full rounded-lg border border-theme-line bg-[var(--background-highlight)] px-3 py-2 font-google-sans-code text-[var(--foreground)] focus:border-theme focus:outline-none"
                >
                  <option value="">— manual / other —</option>
                  <option value="question-based">Question-Based (Auto-complete when questions answered)</option>
                  <option value="link-based">Link-Based (Complete when link visited)</option>
                  <option value="action-based">Action-Based (Complete on specific user action)</option>
                  <option value="time-based">Time-Based (Complete after minimum time spent)</option>
                  <option value="photo-upload">Photo Upload (Complete on authenticated photo upload)</option>
                </select>
              </div>

              {editingStep.metadata?.stepType === 'time-based' && (
                <div>
                  <label className="mb-2 block font-google-sans-code text-sm font-medium text-[var(--foreground)]">Minimum Time (Minutes)</label>
                  <input
                    type="number"
                    min="1"
                    value={editingStep.metadata?.minTimeMinutes || ''}
                    onChange={(e) =>
                      setEditingStep({
                        ...editingStep,
                        metadata: { ...editingStep.metadata, minTimeMinutes: parseInt(e.target.value) || undefined }
                      })
                    }
                    className="w-full rounded-lg border border-theme-line bg-[var(--background-highlight)] px-3 py-2 font-google-sans-code text-[var(--foreground)] placeholder:text-[var(--text-muted)] focus:border-theme focus:outline-none"
                    placeholder="Enter minimum minutes..."
                  />
                </div>
              )}

              {editingStep.metadata?.stepType === 'action-based' && (
                <div>
                  <label className="mb-2 block font-google-sans-code text-sm font-medium text-[var(--foreground)]">Action Trigger</label>
                  <input
                    type="text"
                    value={editingStep.metadata?.actionTrigger || ''}
                    onChange={(e) =>
                      setEditingStep({
                        ...editingStep,
                        metadata: { ...editingStep.metadata, actionTrigger: e.target.value }
                      })
                    }
                    className="w-full rounded-lg border border-theme-line bg-[var(--background-highlight)] px-3 py-2 font-google-sans-code text-[var(--foreground)] placeholder:text-[var(--text-muted)] focus:border-theme focus:outline-none"
                    placeholder="e.g., 'profile_completed', 'first_submission'..."
                  />
                </div>
              )}

              {editingStep.metadata?.stepType === 'photo-upload' && (
                <div>
                  <label className="mb-2 block font-google-sans-code text-sm font-medium text-[var(--foreground)]">Upload Word</label>
                  <input
                    type="text"
                    value={editingStep.metadata?.uploadWord || ''}
                    onChange={(e) =>
                      setEditingStep({
                        ...editingStep,
                        metadata: { ...editingStep.metadata, uploadWord: e.target.value }
                      })
                    }
                    className="w-full rounded-lg border border-theme-line bg-[var(--background-highlight)] px-3 py-2 font-google-sans-code text-[var(--foreground)] placeholder:text-[var(--text-muted)] focus:border-theme focus:outline-none"
                    placeholder="e.g., 'active', 'think', 'like', 'hobby'..."
                  />
                  <p className="mt-2 font-google-sans-code text-xs text-[var(--text-muted)]">
                    Cover below must match the exact id of the registered image (e.g. &quot;cover-001&quot;).
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block font-google-sans-code text-sm font-medium text-[var(--foreground)]">Priority</label>
                  <select
                    value={editingStep.priority}
                    onChange={(e) => setEditingStep({ ...editingStep, priority: e.target.value as Priority })}
                    className="w-full rounded-lg border border-theme-line bg-[var(--background-highlight)] px-3 py-2 font-google-sans-code text-[var(--foreground)] focus:border-theme focus:outline-none"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block font-google-sans-code text-sm font-medium text-[var(--foreground)]">Status</label>
                  <select
                    value={editingStep.status}
                    onChange={(e) => setEditingStep({ ...editingStep, status: e.target.value as StepStatus })}
                    className="w-full rounded-lg border border-theme-line bg-[var(--background-highlight)] px-3 py-2 font-google-sans-code text-[var(--foreground)] focus:border-theme focus:outline-none"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 font-google-sans-code text-sm text-[var(--foreground)]">
                  <input
                    type="checkbox"
                    checked={editingStep.optional}
                    onChange={(e) => setEditingStep({ ...editingStep, optional: e.target.checked })}
                    className="rounded"
                  />
                  Optional Step
                </label>
              </div>

              <div>
                <label className="mb-2 block font-google-sans-code text-sm font-medium text-[var(--foreground)]">Due Date (Optional)</label>
                <input
                  type="date"
                  value={editingStep.dueDate ? new Date(editingStep.dueDate).toISOString().split('T')[0] : ''}
                  onChange={(e) => setEditingStep({ ...editingStep, dueDate: e.target.value ? e.target.value : undefined })}
                  className="w-full rounded-lg border border-theme-line bg-[var(--background-highlight)] px-3 py-2 font-google-sans-code text-[var(--foreground)] focus:border-theme focus:outline-none"
                />
              </div>

              {/* Enhanced Visibility Controls */}
              <div className="space-y-3">
                <label className="mb-2 block font-google-sans-code text-sm font-medium text-[var(--foreground)]">Visibility & Access</label>
                
                <div>
                  <label className="mb-1 block font-google-sans-code text-xs font-medium text-[var(--text-muted)]">Who can see this step?</label>
                  <select
                    value={editingStep.visibility}
                    onChange={(e) => setEditingStep({ ...editingStep, visibility: e.target.value as StepVisibility })}
                    className="w-full rounded-lg border border-theme-line bg-[var(--background-highlight)] px-3 py-2 font-google-sans-code text-sm text-[var(--foreground)] focus:border-theme focus:outline-none"
                  >
                    <option value="ALL_USERS">👁️ All Users (Public)</option>
                    <option value="ORGANIZATION_ONLY">🏢 Organization Only</option>
                    <option value="CATEGORY_RESTRICTED">🏷️ Category Restricted</option>
                    <option value="SPECIFIC_USERS">👤 Specific Users</option>
                  </select>
                </div>

                {editingStep.visibility === 'ORGANIZATION_ONLY' && (
                  <div>
                    <label className="mb-1 block font-google-sans-code text-xs font-medium text-[var(--text-muted)]">Organization ID</label>
                    <input
                      type="text"
                      value={editingStep.organizationId || ''}
                      onChange={(e) => setEditingStep({ ...editingStep, organizationId: e.target.value })}
                      className="w-full rounded-lg border border-theme-line bg-[var(--background-highlight)] px-3 py-2 font-google-sans-code text-sm text-[var(--foreground)] placeholder:text-[var(--text-muted)] focus:border-theme focus:outline-none"
                      placeholder="Enter Clerk organization ID..."
                    />
                  </div>
                )}

                <div className="flex items-center gap-2 rounded-lg border border-blue-700/30 bg-blue-600/10 p-3">
                  <div className="text-xs text-blue-700 dark:text-blue-400">💡</div>
                  <div className="font-google-sans-code text-xs text-blue-700 dark:text-blue-300">
                    {editingStep.visibility === 'ALL_USERS' && 'Step will be visible to all users immediately'}
                    {editingStep.visibility === 'ORGANIZATION_ONLY' && 'Step will only be visible to members of the specified organization'}
                    {editingStep.visibility === 'CATEGORY_RESTRICTED' && 'Step will only be visible to users with category access'}
                    {editingStep.visibility === 'SPECIFIC_USERS' && 'Step is hidden from all users (admin only)'}
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-2 block font-google-sans-code text-sm font-medium text-[var(--foreground)]">Related Unppp (Optional)</label>
                <select
                  value={editingStep.unpppId || ''}
                  onChange={(e) => setEditingStep({ ...editingStep, unpppId: e.target.value || null })}
                  className="w-full rounded-lg border border-theme-line bg-[var(--background-highlight)] px-3 py-2 font-google-sans-code text-[var(--foreground)] focus:border-theme focus:outline-none"
                >
                  <option value="">-- None --</option>
                  {unpppOptions.map((unppp) => (
                    <option key={unppp.id} value={unppp.id}>{unppp.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-[1fr_auto] gap-4">
                <div>
                  <label className="mb-2 block font-google-sans-code text-sm font-medium text-[var(--foreground)]">Cover (Optional)</label>
                  <input
                    type="text"
                    value={editingStep.cover || ''}
                    onChange={(e) => setEditingStep({ ...editingStep, cover: e.target.value })}
                    className="w-full rounded-lg border border-theme-line bg-[var(--background-highlight)] px-3 py-2 font-google-sans-code text-[var(--foreground)] placeholder:text-[var(--text-muted)] focus:border-theme focus:outline-none"
                    placeholder="bare coverId (cover-002), absolute image path, or absolute .mp4 path — falls back to the related unppp's cover/color"
                  />
                  <label className="mb-2 mt-3 block font-google-sans-code text-sm font-medium text-[var(--foreground)]">Icon (Optional)</label>
                  <input
                    type="text"
                    value={editingStep.icon || ''}
                    onChange={(e) => setEditingStep({ ...editingStep, icon: e.target.value })}
                    className="w-full rounded-lg border border-theme-line bg-[var(--background-highlight)] px-3 py-2 font-google-sans-code text-[var(--foreground)] placeholder:text-[var(--text-muted)] focus:border-theme focus:outline-none"
                    placeholder="emoji or icon name"
                  />
                </div>
                {editingStep.cover && (
                  <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg border border-theme-line">
                    {isVideoCover(editingStep.cover) ? (
                      <CoverVideo src={editingStep.cover} alt="" className="size-full object-cover" />
                    ) : (
                      <Image src={resolveCoverSrc(editingStep.cover)} alt="" fill sizes="96px" className="object-cover" />
                    )}
                  </div>
                )}
              </div>

              {/* Founder Questions Display */}
              {(hasFounderQuestions(editingStep.metadata) || (editingStep.questions && editingStep.questions.length > 0)) ? (
                <div className="rounded-lg border border-purple-700/30 bg-purple-600/10 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="font-google-sans-code text-sm font-bold text-purple-700 dark:text-purple-300">🎯 Founder Questions</div>
                    <div className="font-google-sans-code text-xs text-purple-700 dark:text-purple-400">
                      ({editingStep.questions?.length || (hasFounderQuestions(editingStep.metadata) ? editingStep.metadata.founderQuestions.length : 0)} questions)
                    </div>
                  </div>
                  
                  {hasFounderQuestions(editingStep.metadata) && editingStep.metadata.founderCategory && (
                    <div className="mb-2 font-google-sans-code text-xs text-purple-700 dark:text-purple-400">
                      Category: <span className="font-bold">{editingStep.metadata.founderCategory.toUpperCase()}</span>
                    </div>
                  )}
                  
                  <div className="max-h-32 space-y-1 overflow-y-auto font-google-sans-code text-xs text-purple-700 dark:text-purple-200">
                    {editingStep.questions?.map((q, idx) => (
                      <div key={q.id} className="rounded bg-purple-600/20 p-2">
                        <div className="font-bold">{idx + 1}. {q.id}</div>
                        <div className="text-purple-700 dark:text-purple-300">{q.text?.substring(0, 60)}...</div>
                      </div>
                    )) || (hasFounderQuestions(editingStep.metadata) && editingStep.metadata.founderQuestions.map((qId, idx) => (
                      <div key={qId} className="rounded bg-purple-600/20 p-2">
                        <div className="font-bold">{idx + 1}. {qId}</div>
                      </div>
                    )))}
                  </div>
                  
                  <div className="mt-3 font-google-sans-code text-xs text-purple-700 dark:text-purple-400">
                    💡 To modify questions, create a new step or use the API
                  </div>
                </div>
              ) : null}
              </form>
            </div>
            
            {/* Modal Footer with Buttons */}
            <div className="border-t border-theme-line px-6 py-4">
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false)
                    setEditingStep(null)
                  }}
                  className="flex-1 rounded-lg border border-theme-line bg-theme-wash px-4 py-2 font-google-sans-code text-sm text-[var(--text-muted)] transition hover:bg-theme-wash hover:text-[var(--foreground)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="edit-step-form"
                  disabled={updating}
                  className="flex-1 rounded-lg border border-blue-700 bg-blue-600/20 px-4 py-2 font-google-sans-code text-sm text-blue-700 dark:text-blue-300 transition hover:bg-blue-600/40 hover:text-blue-200 disabled:opacity-50"
                >
                  {updating ? 'Updating...' : 'Update Step'}
                </button>
              </div>
              </div>
            </div>
            </div>
          </div>
      )}
    

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingStep && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--background-highlight)] p-4">
          <div className="w-full max-w-md rounded-xl border border-theme-line bg-[var(--background-highlight)] p-6">
            <h2 className="mb-4 font-google-sans-code text-xl font-bold text-[var(--foreground)]">Delete Step</h2>
            
            <div className="space-y-4">
              <p className="font-google-sans-code text-[var(--text-muted)]">
                Are you sure you want to delete this step? This action cannot be undone.
              </p>
              
              <div className="rounded-lg border border-theme-line bg-[var(--background-highlight)] p-4">
                <h3 className="font-google-sans-code font-semibold text-[var(--foreground)]">{deletingStep.title}</h3>
                <p className="mt-1 font-google-sans-code text-sm text-[var(--text-muted)]">
                  {deletingStep.description.length > 100
                    ? `${deletingStep.description.substring(0, 100)}...`
                    : deletingStep.description}
                </p>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(false)
                    setDeletingStep(null)
                  }}
                  className="flex-1 rounded-lg border border-theme-line bg-theme-wash px-4 py-2 font-google-sans-code text-sm text-[var(--text-muted)] transition hover:bg-theme-wash hover:text-[var(--foreground)]"
                >
                  Cancel
                </button>
                <button
                  onClick={deleteStep}
                  disabled={deleting}
                  className="flex-1 rounded-lg border border-red-700 bg-red-600/20 px-4 py-2 font-google-sans-code text-sm text-red-700 dark:text-red-300 transition hover:bg-red-600/40 hover:text-red-200 disabled:opacity-50"
                >
                  {deleting ? 'Deleting...' : 'Delete Step'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Progress Details Modal */}
      {showProgressModal && selectedStep && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--background-highlight)] p-4">
          <div className="max-h-[80vh] w-full max-w-4xl overflow-hidden rounded-xl border border-theme-line bg-[var(--background-highlight)] p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-google-sans-code text-xl font-bold text-[var(--foreground)]">User Progress: {selectedStep.title}</h2>
              <button
                onClick={() => {
                  setShowProgressModal(false)
                  setSelectedStep(null)
                }}
                className="font-google-sans-code text-lg text-[var(--text-muted)] hover:text-[var(--foreground)]"
              >
                ×
              </button>
            </div>

            <div className="mb-6 grid grid-cols-4 gap-4">
              <div className="rounded-lg border border-theme-line bg-[var(--background-highlight)] p-4 text-center">
                <div className="font-google-sans-code text-2xl font-bold text-[var(--foreground)]">{selectedStep.progressStats.totalUsers}</div>
                <div className="font-google-sans-code text-sm text-[var(--text-muted)]">Total Users</div>
              </div>
              <div className="rounded-lg border border-green-700 bg-green-600/20 p-4 text-center">
                <div className="font-google-sans-code text-2xl font-bold text-green-700 dark:text-green-300">{selectedStep.progressStats.completedUsers}</div>
                <div className="font-google-sans-code text-sm text-[var(--text-muted)]">Completed</div>
              </div>
              <div className="rounded-lg border border-blue-700 bg-blue-600/20 p-4 text-center">
                <div className="font-google-sans-code text-2xl font-bold text-blue-700 dark:text-blue-300">{selectedStep.progressStats.startedUsers}</div>
                <div className="font-google-sans-code text-sm text-[var(--text-muted)]">In Progress</div>
              </div>
              <div className="rounded-lg border border-theme-line bg-theme-wash p-4 text-center">
                <div className="font-google-sans-code text-2xl font-bold text-[var(--text-muted)]">{selectedStep.progressStats.notStartedUsers}</div>
                <div className="font-google-sans-code text-sm text-[var(--text-muted)]">Not Started</div>
              </div>
            </div>

            <div className="max-h-96 overflow-auto">
              <table className="w-full">
                <thead className="sticky top-0 bg-[var(--background-highlight)]">
                  <tr>
                    <th className="px-4 py-3 text-left font-google-sans-code text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                      User
                    </th>
                    <th className="px-4 py-3 text-left font-google-sans-code text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left font-google-sans-code text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                      Started At
                    </th>
                    <th className="px-4 py-3 text-left font-google-sans-code text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                      Completed At
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme-line">
                  {selectedStep.userProgress.map((progress) => (
                    <tr key={progress.userId} className="hover:bg-theme-wash">
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-google-sans-code text-sm font-medium text-[var(--foreground)]">
                            {progress.user.firstName && progress.user.lastName 
                              ? `${progress.user.firstName} ${progress.user.lastName}`
                              : 'Unknown User'
                            }
                          </div>
                          <div className="font-google-sans-code text-sm text-[var(--text-muted)]">
                            {progress.user.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full border px-2 py-1 font-google-sans-code text-xs font-semibold ${
                          progress.completed 
                            ? 'border-green-700 bg-green-600/20 text-green-700 dark:text-green-300'
                            : progress.startedAt 
                              ? 'border-blue-700 bg-blue-600/20 text-blue-700 dark:text-blue-300'
                              : 'border-theme-line bg-theme-wash text-[var(--text-muted)]'
                        }`}>
                          {progress.completed ? 'Completed' : progress.startedAt ? 'In Progress' : 'Not Started'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-google-sans-code text-sm text-[var(--text-muted)]">
                        {progress.startedAt 
                          ? new Date(progress.startedAt).toLocaleDateString()
                          : '—'
                        }
                      </td>
                      <td className="px-4 py-3 font-google-sans-code text-sm text-[var(--text-muted)]">
                        {progress.completedAt 
                          ? new Date(progress.completedAt).toLocaleDateString()
                          : '—'
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {selectedStep.userProgress.length === 0 && (
                <div className="p-8 text-center">
                  <div className="text-[var(--text-muted)]">
                    <h3 className="mb-2 font-google-sans-code text-lg font-medium text-[var(--foreground)]">No user progress yet</h3>
                    <p className="font-google-sans-code text-[var(--text-muted)]">No users have started this step.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bulk Visibility Modal */}
      {showBulkVisibilityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--background-highlight)] p-4">
          <div className="w-full max-w-md rounded-xl border border-theme-line bg-[var(--background-highlight)] p-6">
            <h2 className="mb-4 font-google-sans-code text-xl font-bold text-[var(--foreground)]">Bulk Visibility Update</h2>
            
            <div className="space-y-4">
              <p className="font-google-sans-code text-sm text-[var(--text-muted)]">
                Update visibility for {selectedStepsForDelete.length} selected step(s):
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={() => bulkUpdateVisibility('ALL_USERS')}
                  disabled={bulkUpdatingVisibility}
                  className="w-full rounded-lg border border-green-700 bg-green-600/20 px-4 py-3 text-left font-google-sans-code text-sm text-green-700 dark:text-green-300 transition hover:bg-green-600/40 hover:text-green-200 disabled:opacity-50"
                >
                  <div className="flex items-center gap-2">
                    <span>👁️</span>
                    <div>
                      <div className="font-semibold">Make Public</div>
                      <div className="text-xs opacity-75">Visible to all users</div>
                    </div>
                  </div>
                </button>
                
                <button
                  onClick={() => bulkUpdateVisibility('ORGANIZATION_ONLY')}
                  disabled={bulkUpdatingVisibility}
                  className="w-full rounded-lg border border-orange-700 bg-orange-600/20 px-4 py-3 text-left font-google-sans-code text-sm text-orange-700 dark:text-orange-300 transition hover:bg-orange-600/40 hover:text-orange-200 disabled:opacity-50"
                >
                  <div className="flex items-center gap-2">
                    <span>🏢</span>
                    <div>
                      <div className="font-semibold">Organization Only</div>
                      <div className="text-xs opacity-75">Visible to organization members</div>
                    </div>
                  </div>
                </button>
                
                <button
                  onClick={() => bulkUpdateVisibility('CATEGORY_RESTRICTED')}
                  disabled={bulkUpdatingVisibility}
                  className="w-full rounded-lg border border-purple-700 bg-purple-600/20 px-4 py-3 text-left font-google-sans-code text-sm text-purple-700 dark:text-purple-300 transition hover:bg-purple-600/40 hover:text-purple-200 disabled:opacity-50"
                >
                  <div className="flex items-center gap-2">
                    <span>🏷️</span>
                    <div>
                      <div className="font-semibold">Category Restricted</div>
                      <div className="text-xs opacity-75">Visible with category access</div>
                    </div>
                  </div>
                </button>
                
                <button
                  onClick={() => bulkUpdateVisibility('SPECIFIC_USERS')}
                  disabled={bulkUpdatingVisibility}
                  className="w-full rounded-lg border border-theme-line bg-theme-wash px-4 py-3 text-left font-google-sans-code text-sm text-[var(--text-muted)] transition hover:bg-theme-wash hover:text-[var(--foreground)] disabled:opacity-50"
                >
                  <div className="flex items-center gap-2">
                    <span>🚫</span>
                    <div>
                      <div className="font-semibold">Hide from All</div>
                      <div className="text-xs opacity-75">Hidden from all users</div>
                    </div>
                  </div>
                </button>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowBulkVisibilityModal(false)
                    setSelectedStepsForDelete([])
                  }}
                  className="flex-1 rounded-lg border border-theme-line bg-theme-wash px-4 py-2 font-google-sans-code text-sm text-[var(--text-muted)] transition hover:bg-theme-wash hover:text-[var(--foreground)]"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Modal */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--background-highlight)] p-4">
          <div className="w-full max-w-md rounded-xl border border-theme-line bg-[var(--background-highlight)] p-6">
            <h2 className="mb-4 font-google-sans-code text-xl font-bold text-[var(--foreground)]">Bulk Delete Options</h2>
            
            <div className="space-y-4">
              <p className="font-google-sans-code text-sm text-[var(--text-muted)]">
                Choose how to clean up steps from the old question system:
              </p>
              
              {selectedStepsForDelete.length > 0 && (
                <div className="rounded-lg border border-blue-700 bg-blue-600/20 p-4">
                  <h3 className="mb-2 font-google-sans-code font-semibold text-blue-700 dark:text-blue-300">Selected Steps</h3>
                  <p className="mb-3 font-google-sans-code text-sm text-[var(--text-muted)]">
                    Delete {selectedStepsForDelete.length} selected step(s)
                  </p>
                  <button
                    onClick={() => bulkDeleteSteps()}
                    disabled={bulkDeleting}
                    className="w-full rounded-lg border border-red-700 bg-red-600/20 px-4 py-2 font-google-sans-code text-sm text-red-700 dark:text-red-300 transition hover:bg-red-600/40 hover:text-red-200 disabled:opacity-50"
                  >
                    {bulkDeleting ? 'Deleting...' : `Delete ${selectedStepsForDelete.length} Selected`}
                  </button>
                </div>
              )}
              
              <div className="rounded-lg border border-yellow-700 bg-yellow-600/20 p-4">
                <h3 className="mb-2 font-google-sans-code font-semibold text-yellow-700 dark:text-yellow-300">Clean Question Steps</h3>
                <p className="mb-3 font-google-sans-code text-sm text-[var(--text-muted)]">
                  Delete all steps that contain question metadata (old hybrid system)
                </p>
                <button
                  onClick={() => bulkDeleteSteps({ hasQuestionMetadata: true })}
                  disabled={bulkDeleting}
                  className="w-full rounded-lg border border-red-700 bg-red-600/20 px-4 py-2 font-google-sans-code text-sm text-red-700 dark:text-red-300 transition hover:bg-red-600/40 hover:text-red-200 disabled:opacity-50"
                >
                  {bulkDeleting ? 'Deleting...' : 'Clean Question Steps'}
                </button>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowBulkDeleteModal(false)
                    setSelectedStepsForDelete([])
                  }}
                  className="flex-1 rounded-lg border border-theme-line bg-theme-wash px-4 py-2 font-google-sans-code text-sm text-[var(--text-muted)] transition hover:bg-theme-wash hover:text-[var(--foreground)]"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}