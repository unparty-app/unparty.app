'use client'

import { useState } from 'react'
import { useFetch } from '@/hooks/useFetch'
import { useTheme } from '../../contexts/ThemeContext'
import { Prisma } from '@prisma/client'

interface UserResponse {
  userId: string
  responseData: Prisma.JsonValue
  createdAt: string
  updatedAt: string
  organizationContext?: string
  userDetails?: {
    firstName: string
    lastName: string
    email: string
  }
  organizationDetails?: {
    name: string
    slug: string
  }
}

interface QuestionData {
  questionType: string
  responses: UserResponse[]
}

interface GroupedResponses {
  [categoryId: string]: {
    [questionId: string]: QuestionData
  }
}

interface ResponsesData {
  totalResponses: number
  groupedResponses: GroupedResponses
  categorySummaries: Array<{
    category: string
    title: string
    description: string
    totalQuestions: number
    totalResponses: number
    usersStarted: number
  }>
  questions: Array<{
    id: string
    text: string
    type: string
    category: string
    responseCount: number
  }>
}

interface Question {
  id: string
  text: string
  type: string
  choices?: string[]
}

interface QuestionCategory {
  id: string
  label: string
  questions: Question[]
}

interface CategorySummary {
  category: string
  title: string
  description: string
  totalQuestions: number
  totalResponses: number
  usersStarted: number
}

export default function ResponsesAdminContent() {
  const { colorValue } = useTheme()
  const [selectedCategory, setSelectedCategory] = useState<string>('core')

  // Category list comes from the unfiltered summary endpoint; loaded once
  const { data: summary } = useFetch<{ categorySummaries?: CategorySummary[] }>('/api/admin/question-responses')
  const questionCategories: QuestionCategory[] = (summary?.categorySummaries ?? []).map((category) => ({
    id: category.category.toLowerCase(),
    label: category.title,
    questions: [] // Will be populated when needed
  }))

  const { data: responsesData, loading } = useFetch<ResponsesData>(
    `/api/admin/question-responses?categoryId=${selectedCategory}`
  )

  const formatResponseData = (responseData: Prisma.JsonValue, questionType: string, question?: Question): string => {
    if (questionType === 'TEXT') {
      return String(responseData)
    } else if (questionType === 'MULTIPLE_CHOICE' && question?.choices && typeof responseData === 'number') {
      return question.choices[responseData] || `Choice ${responseData}`
    } else if (questionType === 'RANKING' && question?.choices && Array.isArray(responseData)) {
      return responseData
        .map((value: Prisma.JsonValue) => {
          const index = typeof value === 'number' ? value : Number(value)
          return question.choices?.[index] || `Choice ${index}`
        })
        .join(' → ')
    }
    return JSON.stringify(responseData)
  }

  const categoryResponses = responsesData?.groupedResponses[selectedCategory.toUpperCase()] || {}
  const categoryQuestions = responsesData?.questions.filter(q => q.category.toLowerCase() === selectedCategory) || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-google-sans-code text-2xl font-bold uppercase text-[var(--foreground)] ">User.</h1>
        <div className="font-google-sans-code text-sm text-[var(--text-muted)] ">
          Total Responses: {responsesData?.totalResponses || 0}
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {questionCategories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`rounded px-3 py-2 font-vt323 text-sm transition ${
              selectedCategory === category.id
                ? 'font-bold text-black'
                : 'text-[var(--text-muted)] hover:bg-theme-wash hover:text-[var(--foreground)]   '
            }`}
            style={selectedCategory === category.id ? { backgroundColor: colorValue } : {}}
          >
            {category.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="rounded-xl border border-theme-line bg-[var(--background-highlight)] p-8 text-center ">
          <p className="font-google-sans-code text-[var(--text-muted)] ">thinking...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {categoryQuestions.map((question) => {
            const questionResponses = categoryResponses[question.id]

            if (!questionResponses || questionResponses.responses.length === 0) {
              return (
                <div key={question.id} className="rounded-xl border border-theme-line bg-[var(--background-highlight)] p-6 ">
                  <h3 className="mb-2 font-google-sans-code font-bold text-[var(--foreground)] ">{question.text}</h3>
                  <p className="font-google-sans-code text-sm text-[var(--text-muted)] ">👾this is empty, you should get to work.</p>
                </div>
              )
            }

            return (
              <div key={question.id} className="rounded-xl border border-theme-line bg-[var(--background-highlight)] p-6 ">
                <h3 className="mb-4 font-google-sans-code font-bold text-[var(--foreground)] ">{question.text}</h3>
                <div className="mb-4 font-google-sans-code text-xs text-[var(--text-muted)] ">
                  Type: {questionResponses.questionType} | Responses: {questionResponses.responses.length}
                </div>

                <div className="space-y-3">
                  {questionResponses.responses.map((response, index) => (
                    <div key={index} className="rounded-lg border border-theme-line bg-[var(--background-highlight)] p-4 ">
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="font-google-sans-code text-sm font-medium text-[var(--foreground)] ">
                            {response.userDetails
                              ? `${response.userDetails.firstName} ${response.userDetails.lastName}`
                              : `User: ${response.userId.slice(0, 8)}...`
                            }
                          </span>
                          {response.userDetails?.email && (
                            <span className="font-google-sans-code text-xs text-[var(--text-muted)] ">
                              {response.userDetails.email}
                            </span>
                          )}
                          {response.organizationContext && response.organizationContext !== 'Personal' && (
                            <div className="mt-1 flex items-center gap-2">
                              <span className="font-google-sans-code text-xs text-blue-600 dark:text-blue-400">
                                {response.organizationDetails?.name || response.organizationContext}
                              </span>
                              {response.organizationDetails?.slug && (
                                <span className="font-google-sans-code text-xs text-[var(--text-muted)] ">
                                  @{response.organizationDetails.slug}
                                </span>
                              )}
                            </div>
                          )}
                          {response.organizationContext === 'Personal' && (
                            <span className="mt-1 font-google-sans-code uppercase text-xs text-[var(--text-muted)] ">
                              YOU.
                            </span>
                          )}
                        </div>
                        <span className="font-vt323 text-xs text-[var(--text-muted)] ">
                          {new Date(response.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="font-google-sans-code text-sm text-[var(--foreground)] ">
                        {formatResponseData(response.responseData, questionResponses.questionType, question)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}

          {categoryQuestions.length === 0 && (
            <div className="rounded-xl border border-theme-line bg-[var(--background-highlight)] p-8 text-center ">
              <p className="font-google-sans-code text-[var(--text-muted)] ">👾 so look, there is nothing here yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
