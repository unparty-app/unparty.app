'use client'

import { useState } from 'react'
import { useTheme } from '../../contexts/ThemeContext'

import { X, Plus, Eye, ChevronDown, ChevronUp, Edit3, Trash2, Save, EyeOff } from '@/app/components/icons'
import { useFetch } from '@/hooks/useFetch'
import unpppConfigs from '@/data/UnpppsConfig.json'

interface Question {
  id: string
  text: string
  type: string
  choices: string[]
  model: string
  audience: string
  order: number
  responseCount: number
  step: {
    id: string
    title: string
    category: string
  }
}

interface Category {
  id: string
  category: string
  title: string
  // Set on a project's step: its questions open with that step on the
  // project's page (/theunparty*, StepModal)
  unpppId?: string | null
  questionCount: number
}

interface QuestionsData {
  questions: Question[]
  categories: Category[]
}

const questionTypes = [
  { value: 'TEXT', label: 'Text' },
  { value: 'MULTIPLE_CHOICE', label: 'Multiple Choice' },
  { value: 'RANKING', label: 'Ranking' }
]

const audienceOptions = [
  { value: 'published', label: 'Published' },
  { value: 'private', label: 'Private' }
]

const modelOptions = [
  { value: 'about', label: 'About' },
  { value: 'build', label: 'Build' },
  { value: 'connect', label: 'Connect' },
  { value: 'unparty', label: 'Unparty' }
]

export default function QuestionsAdminContent() {
  const { colorValue } = useTheme()
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedAudience, setSelectedAudience] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set())

  // Form state for editing/creating
  const [formData, setFormData] = useState({
    stepId: '',
    text: '',
    type: 'TEXT',
    choices: [''],
    model: 'about',
    audience: 'published',
    order: 0
  })

  const questionParams = new URLSearchParams()
  if (selectedCategory) questionParams.append('category', selectedCategory)
  if (selectedAudience) questionParams.append('audience', selectedAudience)
  const {
    data: questionsData,
    loading,
    refetch: refetchQuestions
  } = useFetch<QuestionsData>(`/api/admin/questions?${questionParams}`)

  const startEdit = (question: Question) => {
    setEditingQuestion(question.id)
    setFormData({
      stepId: question.step.id,
      text: question.text,
      type: question.type,
      choices: question.choices.length > 0 ? question.choices : [''],
      model: question.model,
      audience: question.audience,
      order: question.order
    })
  }

  const startCreate = () => {
    setIsCreating(true)
    setFormData({
      stepId: questionsData?.categories[0]?.id || '',
      text: '',
      type: 'TEXT',
      choices: [''],
      model: 'about',
      audience: 'published',
      order: 0
    })
  }

  const cancelEdit = () => {
    setEditingQuestion(null)
    setIsCreating(false)
    setFormData({
      stepId: '',
      text: '',
      type: 'TEXT',
      choices: [''],
      model: 'about',
      audience: 'published',
      order: 0
    })
  }

  const saveQuestion = async () => {
    try {
      const isEditing = editingQuestion !== null
      const url = isEditing ? `/api/admin/questions/${editingQuestion}` : '/api/admin/questions'
      const method = isEditing ? 'PUT' : 'POST'

      const payload = {
        ...formData,
        choices: formData.type === 'TEXT' ? [] : formData.choices.filter(choice => choice.trim() !== '')
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        refetchQuestions()
        cancelEdit()
      } else {
        const error = await response.json()
        console.error('Failed to save question:', error)
      }
    } catch (error) {
      console.error('Failed to save question:', error)
    }
  }

  const deleteQuestion = async (questionId: string, responseCount: number) => {
    if (responseCount > 0) {
      alert(`Cannot delete question with ${responseCount} user responses`)
      return
    }

    if (!confirm('Are you sure you want to delete this question?')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/questions/${questionId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        refetchQuestions()
      } else {
        const error = await response.json()
        console.error('Failed to delete question:', error)
      }
    } catch (error) {
      console.error('Failed to delete question:', error)
    }
  }

  const addChoice = () => {
    setFormData(prev => ({
      ...prev,
      choices: [...prev.choices, '']
    }))
  }

  const updateChoice = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      choices: prev.choices.map((choice, i) => i === index ? value : choice)
    }))
  }

  const removeChoice = (index: number) => {
    setFormData(prev => ({
      ...prev,
      choices: prev.choices.filter((_, i) => i !== index)
    }))
  }

  const toggleExpand = (questionId: string) => {
    setExpandedQuestions(prev => {
      const newSet = new Set(prev)
      if (newSet.has(questionId)) {
        newSet.delete(questionId)
      } else {
        newSet.add(questionId)
      }
      return newSet
    })
  }

  const filteredQuestions = (questionsData?.questions || []).filter(q =>
    !searchQuery ||
    q.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    q.text.toLowerCase().includes(searchQuery.toLowerCase())
  )
  const categories = questionsData?.categories || []
  // Where a question can be asked: a project's steps (by project name), then
  // the category steps, each with its title so same-category steps differ
  const projectSteps = categories.filter((c) => c.unpppId)
  const categorySteps = categories.filter((c) => !c.unpppId)
  const projectName = (id: string) => (unpppConfigs.unppps.find((u) => u.id === id)?.name ?? id).replace(/\.$/, '')
  // The filter lists each category once
  const categoryNames = [...new Set(categories.map((c) => c.category))]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-google-sans-code text-2xl font-bold text-[var(--foreground)] ">MANAGE.</h1>
        <button
          onClick={startCreate}
          className="flex items-center gap-2 rounded-lg px-4 py-2 font-google-sans-code text-sm font-medium text-black transition"
          style={{ backgroundColor: colorValue }}
        >
          <Plus size={16} />
          ADD.
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by ID or text..."
          className="rounded-lg border border-theme-line bg-[var(--background-highlight)] px-3 py-2 font-google-sans-code text-sm "
        />
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="rounded-lg border border-theme-line bg-[var(--background-highlight)] px-3 py-2 font-google-sans-code text-sm "
        >
          <option value="">ALL.</option>
          {categoryNames.map((name) => (
            <option key={name} value={name}>
              {name} ({categories.filter((c) => c.category === name).reduce((n, c) => n + c.questionCount, 0)})
            </option>
          ))}
        </select>

        <select
          value={selectedAudience}
          onChange={(e) => setSelectedAudience(e.target.value)}
          className="rounded-lg border border-theme-line bg-[var(--background-highlight)] px-3 py-2 font-google-sans-code text-sm "
        >
          <option value="">AUDIENCE.</option>
          {audienceOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Create Form */}
      {isCreating && (
        <div className="rounded-xl border border-theme-line bg-[var(--background-highlight)] p-6 ">
          <h3 className="mb-4 font-google-sans-code font-bold text-[var(--foreground)] ">Create New Question</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block font-google-sans-code text-sm text-[var(--text-muted)] ">Asked on</label>
                <select
                  value={formData.stepId}
                  onChange={(e) => setFormData(prev => ({ ...prev, stepId: e.target.value }))}
                  className="w-full rounded-lg border border-theme-line bg-[var(--background-highlight)] px-3 py-2 font-google-sans-code text-sm "
                >
                  {projectSteps.length > 0 && (
                    <optgroup label="Projects: opens with the step on its page">
                      {projectSteps.map((step) => (
                        <option key={step.id} value={step.id}>
                          {projectName(step.unpppId!)} · {step.title} ({step.questionCount})
                        </option>
                      ))}
                    </optgroup>
                  )}
                  <optgroup label="Categories">
                    {categorySteps.map((step) => (
                      <option key={step.id} value={step.id}>
                        {step.category} · {step.title} ({step.questionCount})
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>
              <div>
                <label className="mb-2 block font-google-sans-code text-sm text-[var(--text-muted)] ">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full rounded-lg border border-theme-line bg-[var(--background-highlight)] px-3 py-2 font-google-sans-code text-sm "
                >
                  {questionTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block font-google-sans-code text-sm text-[var(--text-muted)] ">Model</label>
                <select
                  value={formData.model}
                  onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                  className="w-full rounded-lg border border-theme-line bg-[var(--background-highlight)] px-3 py-2 font-google-sans-code text-sm "
                >
                  {modelOptions.map((model) => (
                    <option key={model.value} value={model.value}>
                      {model.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block font-google-sans-code text-sm text-[var(--text-muted)] ">Audience</label>
                <select
                  value={formData.audience}
                  onChange={(e) => setFormData(prev => ({ ...prev, audience: e.target.value }))}
                  className="w-full rounded-lg border border-theme-line bg-[var(--background-highlight)] px-3 py-2 font-google-sans-code text-sm "
                >
                  {audienceOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-2 block font-google-sans-code text-sm text-[var(--text-muted)] ">Question Text</label>
              <textarea
                value={formData.text}
                onChange={(e) => setFormData(prev => ({ ...prev, text: e.target.value }))}
                className="w-full rounded-lg border border-theme-line bg-[var(--background-highlight)] px-3 py-2 font-google-sans-code text-sm "
                rows={3}
                placeholder="ADD your question..."
              />
            </div>

            {(formData.type === 'MULTIPLE_CHOICE' || formData.type === 'RANKING') && (
              <div>
                <label className="mb-2 block font-google-sans-code text-sm text-[var(--text-muted)] ">Choices</label>
                <div className="space-y-2">
                  {formData.choices.map((choice, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={choice}
                        onChange={(e) => updateChoice(index, e.target.value)}
                        className="flex-1 rounded-lg border border-theme-line bg-[var(--background-highlight)] px-3 py-2 font-google-sans-code text-sm "
                        placeholder={`Choice ${index + 1}`}
                      />
                      {formData.choices.length > 1 && (
                        <button
                          onClick={() => removeChoice(index)}
                          className="rounded-lg bg-red-500/20 px-3 py-2 text-red-600 transition hover:bg-red-500/30"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={addChoice}
                    className="rounded-lg bg-[var(--background-highlight)] px-3 py-2 font-google-sans-code text-sm text-[var(--text-muted)] transition hover:bg-theme-wash "
                  >
                    ADD Choice
                  </button>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={saveQuestion}
                className="flex items-center gap-2 rounded-lg px-4 py-2 font-google-sans-code text-sm font-medium text-black transition"
                style={{ backgroundColor: colorValue }}
              >
                <Save size={16} />
                CREATE Question
              </button>
              <button
                onClick={cancelEdit}
                className="flex items-center gap-2 rounded-lg bg-[var(--background-highlight)] px-4 py-2 font-google-sans-code text-sm text-[var(--text-muted)] transition hover:bg-theme-wash "
              >
                <X size={16} />
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Questions List */}
      {loading ? (
        <div className="rounded-xl border border-theme-line bg-[var(--background-highlight)] p-8 text-center ">
          <p className="font-google-sans-code text-[var(--text-muted)] ">Loading questions...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredQuestions.map((question) => (
            <div key={question.id} className="rounded-xl border border-theme-line bg-[var(--background-highlight)] ">
              {editingQuestion === question.id ? (
                // Edit Form
                <div className="p-6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block font-google-sans-code text-sm text-[var(--text-muted)] ">Type</label>
                        <select
                          value={formData.type}
                          onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                          className="w-full rounded-lg border border-theme-line bg-[var(--background-highlight)] px-3 py-2 font-google-sans-code text-sm "
                        >
                          {questionTypes.map((type) => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-2 block font-google-sans-code text-sm text-[var(--text-muted)] ">Model</label>
                        <select
                          value={formData.model}
                          onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                          className="w-full rounded-lg border border-theme-line bg-[var(--background-highlight)] px-3 py-2 font-google-sans-code text-sm "
                        >
                          {modelOptions.map((model) => (
                            <option key={model.value} value={model.value}>
                              {model.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-2 block font-google-sans-code text-sm text-[var(--text-muted)] ">Audience</label>
                        <select
                          value={formData.audience}
                          onChange={(e) => setFormData(prev => ({ ...prev, audience: e.target.value }))}
                          className="w-full rounded-lg border border-theme-line bg-[var(--background-highlight)] px-3 py-2 font-google-sans-code text-sm "
                        >
                          {audienceOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-2 block font-google-sans-code text-sm text-[var(--text-muted)] ">Order</label>
                        <input
                          type="number"
                          value={formData.order}
                          onChange={(e) => setFormData(prev => ({ ...prev, order: parseInt(e.target.value) || 0 }))}
                          className="w-full rounded-lg border border-theme-line bg-[var(--background-highlight)] px-3 py-2 font-google-sans-code text-sm "
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block font-google-sans-code text-sm text-[var(--text-muted)] ">Question Text</label>
                      <textarea
                        value={formData.text}
                        onChange={(e) => setFormData(prev => ({ ...prev, text: e.target.value }))}
                        className="w-full rounded-lg border border-theme-line bg-[var(--background-highlight)] px-3 py-2 font-google-sans-code text-sm "
                        rows={3}
                      />
                    </div>

                    {(formData.type === 'MULTIPLE_CHOICE' || formData.type === 'RANKING') && (
                      <div>
                        <label className="mb-2 block font-google-sans-code text-sm text-[var(--text-muted)] ">Choices</label>
                        <div className="space-y-2">
                          {formData.choices.map((choice, index) => (
                            <div key={index} className="flex gap-2">
                              <input
                                type="text"
                                value={choice}
                                onChange={(e) => updateChoice(index, e.target.value)}
                                className="flex-1 rounded-lg border border-theme-line bg-[var(--background-highlight)] px-3 py-2 font-google-sans-code text-sm "
                                placeholder={`Choice ${index + 1}`}
                              />
                              {formData.choices.length > 1 && (
                                <button
                                  onClick={() => removeChoice(index)}
                                  className="rounded-lg bg-red-500/20 px-3 py-2 text-red-600 transition hover:bg-red-500/30"
                                >
                                  <X size={16} />
                                </button>
                              )}
                            </div>
                          ))}
                          <button
                            onClick={addChoice}
                            className="rounded-lg bg-[var(--background-highlight)] px-3 py-2 font-google-sans-code text-sm text-[var(--text-muted)] transition hover:bg-theme-wash "
                          >
                            ADD Choice
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={saveQuestion}
                        className="flex items-center gap-2 rounded-lg px-4 py-2 font-google-sans-code text-sm font-medium text-black transition"
                        style={{ backgroundColor: colorValue }}
                      >
                        <Save size={16} />
                        SAVE
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="flex items-center gap-2 rounded-lg bg-[var(--background-highlight)] px-4 py-2 font-google-sans-code text-sm text-[var(--text-muted)] transition hover:bg-theme-wash "
                      >
                        <X size={16} />
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                // Question Display
                <div className="p-6">
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-2">
                        <span className="rounded bg-[var(--background-highlight)] px-2 py-1 font-google-sans-code text-xs text-[var(--text-muted)] ">
                          {question.step.category}
                        </span>
                        <span className="rounded bg-[var(--background-highlight)] px-2 py-1 font-google-sans-code text-xs text-[var(--text-muted)] ">
                          {question.type}
                        </span>
                        <span className="rounded bg-[var(--background-highlight)] px-2 py-1 font-google-sans-code text-xs text-[var(--text-muted)] ">
                          {question.model}
                        </span>
                        <div className="flex items-center gap-1">
                          {question.audience === 'published' ? (
                            <Eye size={14} className="text-green-500" />
                          ) : (
                            <EyeOff size={14} className="text-[var(--text-muted)]" />
                          )}
                          <span className="font-google-sans-code text-xs text-[var(--text-muted)] ">
                            {question.audience}
                          </span>
                        </div>
                        <span className="font-google-sans-code text-xs text-[var(--text-muted)] ">
                          {question.responseCount} responses
                        </span>
                      </div>
                      <h3 className="mb-2 font-google-sans-code font-medium text-[var(--foreground)] ">
                        {question.id}
                      </h3>
                      <p className="font-google-sans-code text-sm text-[var(--foreground)] ">
                        {question.text}
                      </p>
                    </div>
                    <div className="ml-4 flex items-center gap-2">
                      <button
                        onClick={() => toggleExpand(question.id)}
                        className="rounded-lg bg-[var(--background-highlight)] p-2 text-[var(--text-muted)] transition hover:bg-theme-wash "
                      >
                        {expandedQuestions.has(question.id) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                      <button
                        onClick={() => startEdit(question)}
                        className="rounded-lg bg-blue-500/20 p-2 text-blue-600 transition hover:bg-blue-500/30"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => deleteQuestion(question.id, question.responseCount)}
                        className="rounded-lg bg-red-500/20 p-2 text-red-600 transition hover:bg-red-500/30"
                        disabled={question.responseCount > 0}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {expandedQuestions.has(question.id) && question.choices.length > 0 && (
                    <div className="mt-4 border-t border-theme-line pt-4 ">
                      <h4 className="mb-2 font-google-sans-code text-sm text-[var(--text-muted)] ">Choices:</h4>
                      <div className="space-y-1">
                        {question.choices.map((choice, index) => (
                          <div key={index} className="rounded border border-theme-line bg-[var(--background-highlight)] px-3 py-2 font-google-sans-code text-sm text-[var(--foreground)] ">
                            {index + 1}. {choice}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {filteredQuestions.length === 0 && (
            <div className="rounded-xl border border-theme-line bg-[var(--background-highlight)] p-8 text-center ">
              <p className="font-google-sans-code text-[var(--text-muted)] ">ah! nothing here</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
