import type { EditorialArticle, EditorialSection } from '@/app/constants/editorial-articles/types'
import { isBuildType, TAGGABLE_WORD } from '@/lib/word-types'

// A ProblemWorksheet submission is a UserSubmission row of type FORM whose `content` is
// the JSON written by POST /api/problem/send. Every submit adds a row (#726), so a
// user's rows are the history of their idea. This replaced src/data/problem-worksheet.json,
// which kept one overwritten entry per user and never persisted on Vercel (#578)

export interface WorksheetAnswer {
  text: string
  responseData: unknown
}

export interface WorksheetFields {
  email: string
  name: string
  ideaName: string
  deadline: string
  /** The problem's own color (#RRGGBB), picked on the worksheet; absent on older rows */
  color?: string
  answeredQuestions: WorksheetAnswer[]
  /** The kind of build their words point to */
  buildType?: string
  /** Their own words, tagged by them with a kind of build (#265) */
  wordTypes?: Record<string, string>
}

const HEX = /^#[0-9a-f]{6}$/i

/** The tags worth keeping from a worksheet: real words, real kinds of build, at most 20 (the words four answers can pick) */
export function cleanWordTypes(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return Object.fromEntries(
    Object.entries(value)
      .filter(([word, type]) => TAGGABLE_WORD.test(word) && isBuildType(type))
      .slice(0, 20)
  ) as Record<string, string>
}

/** The worksheet fields from a FORM row's `content`, or null when it isn't a worksheet */
export function parseWorksheetContent(content: string | null): WorksheetFields | null {
  if (!content) return null
  try {
    const parsed = JSON.parse(content)
    if (!parsed || typeof parsed.ideaName !== 'string') return null
    return {
      email: String(parsed.email ?? ''),
      name: String(parsed.name ?? ''),
      ideaName: parsed.ideaName.trim(),
      deadline: String(parsed.deadline ?? ''),
      color: typeof parsed.color === 'string' && HEX.test(parsed.color) ? parsed.color : undefined,
      answeredQuestions: Array.isArray(parsed.answeredQuestions)
        ? parsed.answeredQuestions.filter((a: WorksheetAnswer) => a && typeof a.text === 'string')
        : [],
      buildType: isBuildType(parsed.buildType) ? parsed.buildType : undefined,
      wordTypes: cleanWordTypes(parsed.wordTypes),
    }
  } catch {
    return null
  }
}

/** One submit of a problem */
export interface ProblemVersion extends WorksheetFields {
  submissionId: string
  status: string
  submittedAt: string
}

/**
 * One idea and every submit of it, newest first. `id` is the first submission's id,
 * so a problem's URL holds while new versions arrive. Grouped by idea name, so a
 * renamed idea starts a new problem
 */
export interface Problem {
  id: string
  ideaName: string
  color?: string
  latest: ProblemVersion
  versions: ProblemVersion[]
}

interface SubmissionRow {
  id: string
  content: string | null
  status: string
  submittedAt: Date
}

/** A user's FORM rows as problems, the most recently worked on first */
export function groupProblems(rows: SubmissionRow[]): Problem[] {
  const byIdea = new Map<string, ProblemVersion[]>()
  for (const row of rows) {
    const fields = parseWorksheetContent(row.content)
    if (!fields) continue
    const key = fields.ideaName.trim().toLowerCase()
    const versions = byIdea.get(key) ?? []
    versions.push({ ...fields, submissionId: row.id, status: row.status, submittedAt: row.submittedAt.toISOString() })
    byIdea.set(key, versions)
  }
  return [...byIdea.values()]
    .map((versions) => {
      versions.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
      const latest = versions[0]
      return {
        id: versions[versions.length - 1].submissionId,
        ideaName: latest.ideaName,
        // The newest version that picked a color
        color: versions.find((v) => v.color)?.color,
        latest,
        versions,
      }
    })
    .sort((a, b) => b.latest.submittedAt.localeCompare(a.latest.submittedAt))
}

const formatDate = (value: string) => {
  const date = new Date(value.length === 10 ? `${value}T00:00:00` : value)
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

// List sections split their content on '|'
const listItem = (value: unknown) => String(value).replaceAll('|', '/')

/** 'Sep 30, 2026' for a date-only deadline or an ISO time; the raw value when unparseable */
export function formatShortDate(value: string): string {
  const date = new Date(value.length === 10 ? `${value}T00:00:00` : value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

/** An answer as article sections: a ranking reads as a numbered list, anything else as text */
function answerSections(answer: WorksheetAnswer, id: string): EditorialSection[] {
  const heading: EditorialSection = { id: `${id}-q`, type: 'heading', content: answer.text }
  const data = answer.responseData
  if (Array.isArray(data)) {
    return [heading, { id: `${id}-a`, type: 'list', content: data.map(listItem).join('|'), metadata: { numbered: true } }]
  }
  const text = typeof data === 'string' ? data : data == null ? '' : JSON.stringify(data)
  // Written by a person and shown as HTML, so it stays what they typed
  const content = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return text ? [heading, { id: `${id}-a`, type: 'paragraph', content }] : []
}

/**
 * A problem in the article shape, so it reads in the same EditorialArticle layout
 * as everything else on the site. The cover is the problem's color (or the theme's)
 */
export function problemToArticle(problem: Problem, author: string): EditorialArticle {
  const { latest, versions } = problem
  const sections: EditorialSection[] = [
    { id: 'hero', type: 'hero', content: `${latest.ideaName.toLowerCase()}.` },
    {
      id: 'deadline',
      type: 'paragraph',
      content: latest.deadline ? `Aiming to finish by **${formatDate(latest.deadline)}**.` : 'No finish date yet.',
    },
    ...(latest.buildType
      ? [{ id: 'build-type', type: 'paragraph' as const, content: `Your words point to **${latest.buildType}.**` }]
      : []),
    ...latest.answeredQuestions.flatMap((answer, i) => answerSections(answer, `answer-${i}`)),
  ]
  if (versions.length > 1) {
    sections.push(
      { id: 'versions-heading', type: 'heading', content: 'how it grew.' },
      {
        id: 'versions',
        type: 'list',
        content: versions
          .map((v, i) => `**${formatDate(v.submittedAt)}**${i === 0 ? ' (now)' : ''}: ${listItem(v.ideaName)}${v.deadline ? `, by ${formatDate(v.deadline)}` : ''}`)
          .join('|'),
      }
    )
  }
  return {
    slug: `problem-${problem.id}`,
    title: `${latest.ideaName.toUpperCase()}.`,
    subtitle: latest.deadline ? `by ${formatDate(latest.deadline)}` : '',
    description: `${latest.ideaName}: a problem worksheet.`,
    category: 'PROBLEM.',
    date: latest.submittedAt.slice(0, 10),
    published: true,
    coverColor: problem.color ?? 'theme',
    coverStyle: 'tile',
    author,
    tags: ['Problem'],
    sections,
  }
}
