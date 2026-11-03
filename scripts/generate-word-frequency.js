#!/usr/bin/env node

/**
 * Generate Word Frequency - Build-time script
 *
 * Aggregates word frequency across published Articles and Stories, the same
 * corpus/tokenization theunpartycloud's compatibility word cloud uses
 * (../theunpartycloud/src/app/api/content/route.ts) - ported here so the
 * counts can live alongside KeywordsConfig.json and feed the keyword modal
 * directly, rather than round-tripping through the other app at request time.
 *
 * Fetches from a running theunpartyapp instance (defaults to localhost:3000;
 * override with WORD_FREQUENCY_BASE_URL for a deployed instance) and writes
 * src/data/WordFrequency.json: an array of { word, count, definition }, definition
 * populated from KeywordsConfig.json when the word matches a configured keyword.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const BASE_URL = process.env.WORD_FREQUENCY_BASE_URL || 'http://localhost:3000'
const OUTPUT_PATH = path.join(__dirname, '../src/data/WordFrequency.json')
const KEYWORDS_CONFIG_PATH = path.join(__dirname, '../src/data/KeywordsConfig.json')
const TOP_N = 200

// Common English stopwords, filtered out so the corpus word list reflects
// actual UNPARTY themes/vocabulary rather than function words.
const STOPWORDS = new Set([
  'the', 'and', 'for', 'are', 'but', 'not', 'you', 'your', 'that', 'this',
  'with', 'have', 'has', 'had', 'was', 'were', 'been', 'being', 'from',
  'they', 'them', 'their', 'what', 'which', 'who', 'whom', 'when', 'where',
  'why', 'how', 'all', 'any', 'each', 'few', 'more', 'most', 'other',
  'some', 'such', 'only', 'own', 'same', 'than', 'too', 'very', 'can',
  'will', 'just', 'should', 'now', 'about', 'into', 'over', 'after',
  'out', 'off', 'above', 'below', 'again', 'once', 'here', 'there',
  'because', 'while', 'against', 'between', 'through', 'during', 'before',
  'itself', 'himself', 'herself', 'ourselves', 'themselves', 'yourself',
  'does', 'did', 'doing', 'these', 'those', 'then', 'also', 'like',
  'get', 'got', 'one', 'two', 'its',
])

// Section types with no meaningful prose: raw source code, and per-commit
// metadata ("Commit 1 — Sep 4, 14:31 — Duration: ~2.5 hours").
const NON_PROSE_SECTION_TYPES = new Set(['code', 'personal'])

function stripHtmlTags(text) {
  return text.replace(/<[^>]+>/g, ' ')
}

function stripMarkdown(markdown) {
  return stripHtmlTags(markdown)
    .replace(/:::[\s\S]*?:::/g, ' ') // custom :::directive[...]::: blocks
    .replace(/```[\s\S]*?```/g, ' ') // fenced code blocks
    .replace(/`[^`]*`/g, ' ') // inline code
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ') // images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // links -> link text
    .replace(/[#*_>~-]/g, ' ') // markdown punctuation
    .replace(/\s+/g, ' ')
    .trim()
}

function extractArticleText(article) {
  const parts = [article.title || '', ...(article.tags || [])]

  for (const section of article.sections || []) {
    if (NON_PROSE_SECTION_TYPES.has(section.type)) continue

    if (typeof section.content === 'string' && section.content.trim()) {
      parts.push(section.content)
    }
    if (typeof section.userPrompt === 'string') {
      parts.push(section.userPrompt)
    }
    // "table" sections keep their text in metadata rather than `content`.
    if (section.type === 'table' && section.metadata) {
      if (Array.isArray(section.metadata.headers)) {
        parts.push(section.metadata.headers.join(' '))
      }
      if (Array.isArray(section.metadata.rows)) {
        for (const row of section.metadata.rows) {
          parts.push(row.join(' '))
        }
      }
    }
  }

  return stripHtmlTags(parts.join(' '))
}

function tokenize(text) {
  return text
    .toLowerCase()
    .split(/[^a-z0-9']+/)
    .filter((word) => word.length > 2 && !/^\d+$/.test(word) && !STOPWORDS.has(word))
}

// KeywordsConfig keys are like "unparty (n)" - strip the grammatical marker
// so a bare corpus word ("unparty") can match it.
function buildDefinitionLookup() {
  const config = JSON.parse(fs.readFileSync(KEYWORDS_CONFIG_PATH, 'utf-8'))
  const lookup = new Map()
  for (const [term, definition] of Object.entries(config.keywords || {})) {
    const bare = term.replace(/\s*\([^)]+\)\s*$/, '').toLowerCase()
    lookup.set(bare, definition)
  }
  return lookup
}

async function main() {
  console.log(`Fetching content from ${BASE_URL}...`)

  const [articlesRes, storiesRes] = await Promise.all([
    fetch(`${BASE_URL}/api/articles`),
    fetch(`${BASE_URL}/api/stories/all`),
  ])

  if (!articlesRes.ok || !storiesRes.ok) {
    console.error(`Failed to fetch content (articles: ${articlesRes.status}, stories: ${storiesRes.status})`)
    process.exit(1)
  }

  const articlesData = await articlesRes.json()
  const storiesData = await storiesRes.json()

  const articles = Array.isArray(articlesData.articles) ? articlesData.articles : []
  // /api/stories/all returns unpublished stories too - filter here.
  const stories = (Array.isArray(storiesData) ? storiesData : []).filter(
    (story) => story.metadata?.published
  )

  console.log(`Tokenizing ${articles.length} articles and ${stories.length} stories...`)

  const counts = new Map()
  const addText = (text) => {
    for (const word of tokenize(text)) {
      counts.set(word, (counts.get(word) || 0) + 1)
    }
  }

  for (const article of articles) {
    addText(extractArticleText(article))
  }

  for (const story of stories) {
    addText(story.metadata?.title || '')
    addText(stripMarkdown(story.content || ''))
  }

  const definitionLookup = buildDefinitionLookup()

  const words = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, TOP_N)
    .map(([word, count]) => ({
      word,
      count,
      definition: definitionLookup.get(word) || '',
    }))

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(words, null, 2) + '\n')

  const withDefinitions = words.filter((w) => w.definition).length
  console.log(`Wrote ${words.length} words to ${path.relative(process.cwd(), OUTPUT_PATH)} (${withDefinitions} with a matched definition)`)
}

main().catch((error) => {
  console.error('Failed to generate word frequency:', error)
  process.exit(1)
})
