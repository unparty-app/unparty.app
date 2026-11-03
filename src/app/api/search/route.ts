import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPublishedEditorialArticles } from '@/app/constants/editorial-articles';
import { PAGE_CATEGORIES } from '@/app/components/CTA';
import StorySchema from '@/utils/StorySchema';

// ============================================================================
// TYPES
// ============================================================================

export interface SearchResult {
  id: string;
  title: string;
  content: string; // Markdown content or snippet
  type: 'page' | 'article' | 'story' | 'step' | 'wiki' | 'runway';
  source: 'local' | 'external';
  relevance: number; // 0-1 score
  url: string;
  metadata?: {
    category?: string;
    author?: string;
    date?: string;
    description?: string;
  };
}

interface SearchResponse {
  results: SearchResult[];
  query: string;
  cached: boolean;
  sources: {
    local: number;
    external: number;
  };
  // False when SEARCH_API_URL is unset: the site searches only its own content
  externalEnabled: boolean;
  limitedResults?: boolean; // True if the external search API failed
}

interface CachedSearch {
  data: SearchResponse;
  timestamp: number;
}

interface ExternalSearchResponse {
  role: 'assistant';
  content: string; // Markdown formatted results
}

// ============================================================================
// CACHING
// ============================================================================

const searchCache = new Map<string, CachedSearch>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 100;

function getCachedSearch(query: string): SearchResponse | null {
  const cached = searchCache.get(query.toLowerCase().trim());
  if (!cached) return null;

  const age = Date.now() - cached.timestamp;
  if (age > CACHE_TTL) {
    searchCache.delete(query.toLowerCase().trim());
    return null;
  }

  return cached.data;
}

function cacheSearch(query: string, data: SearchResponse): void {
  // Limit cache size
  if (searchCache.size >= MAX_CACHE_SIZE) {
    const firstKey = searchCache.keys().next().value;
    if (firstKey) searchCache.delete(firstKey);
  }

  searchCache.set(query.toLowerCase().trim(), {
    data,
    timestamp: Date.now()
  });
}

// ============================================================================
// SEARCH FUNCTIONS
// ============================================================================

/**
 * Search local pages from PAGE_CATEGORIES
 */
function searchPages(query: string): SearchResult[] {
  const results: SearchResult[] = [];
  const lowerQuery = query.toLowerCase();

  Object.entries(PAGE_CATEGORIES).forEach(([category, pages]) => {
    pages.forEach((page) => {
      const pageLower = page.toLowerCase();
      const categoryLower = category.toLowerCase();

      // Exact match gets highest relevance
      if (pageLower === lowerQuery) {
        results.push({
          id: `page-${page}`,
          title: page.toUpperCase(),
          content: `Navigate to ${page} page in ${category} section`,
          type: 'page',
          source: 'local',
          relevance: 1.0,
          url: `/${page}`,
          metadata: { category: category.toUpperCase() }
        });
      }
      // Starts with query
      else if (pageLower.startsWith(lowerQuery)) {
        results.push({
          id: `page-${page}`,
          title: page.toUpperCase(),
          content: `Navigate to ${page} page in ${category} section`,
          type: 'page',
          source: 'local',
          relevance: 0.9,
          url: `/${page}`,
          metadata: { category: category.toUpperCase() }
        });
      }
      // Contains query in page name
      else if (pageLower.includes(lowerQuery)) {
        results.push({
          id: `page-${page}`,
          title: page.toUpperCase(),
          content: `Navigate to ${page} page in ${category} section`,
          type: 'page',
          source: 'local',
          relevance: 0.7,
          url: `/${page}`,
          metadata: { category: category.toUpperCase() }
        });
      }
      // Category match
      else if (categoryLower.includes(lowerQuery)) {
        results.push({
          id: `page-${page}`,
          title: page.toUpperCase(),
          content: `Navigate to ${page} page in ${category} section`,
          type: 'page',
          source: 'local',
          relevance: 0.5,
          url: `/${page}`,
          metadata: { category: category.toUpperCase() }
        });
      }
    });
  });

  return results;
}

/**
 * Search published articles
 */
function searchArticles(query: string): SearchResult[] {
  const articles = getPublishedEditorialArticles();
  const lowerQuery = query.toLowerCase();
  const results: SearchResult[] = [];

  articles.forEach((article) => {
    const titleMatch = article.title.toLowerCase().includes(lowerQuery);
    const subtitleMatch = article.subtitle?.toLowerCase().includes(lowerQuery);
    const categoryMatch = article.category?.toLowerCase().includes(lowerQuery);
    const tagMatch = (article.tags || []).some(tag => tag.toLowerCase().includes(lowerQuery));

    // Extract text content from sections for full-text search
    const contentText = article.sections
      .map(section => section.content || '')
      .join(' ')
      .toLowerCase();
    const contentMatch = contentText.includes(lowerQuery);

    if (titleMatch || subtitleMatch || categoryMatch || tagMatch || contentMatch) {
      // Calculate relevance
      let relevance = 0.5;
      if (titleMatch) relevance = 0.95;
      else if (subtitleMatch) relevance = 0.85;
      else if (tagMatch) relevance = 0.75;
      else if (categoryMatch) relevance = 0.7;
      else if (contentMatch) relevance = 0.6;

      // Create snippet
      const snippet = article.subtitle ||
        article.sections.find(s => s.type === 'paragraph')?.content?.substring(0, 150) ||
        'Article content';

      results.push({
        id: `article-${article.slug}`,
        title: article.title,
        content: snippet,
        type: 'article',
        source: 'local',
        relevance,
        url: `/article/${article.slug}`,
        metadata: {
          category: article.category,
          author: article.author,
          date: article.date,
          description: article.subtitle
        }
      });
    }
  });

  return results;
}

/**
 * Search published cover stories
 */
async function searchStories(query: string): Promise<SearchResult[]> {
  const stories = await StorySchema.getAllStories();
  const lowerQuery = query.toLowerCase();
  const results: SearchResult[] = [];

  stories.forEach((story) => {
    if (!story.metadata.published) return;

    const titleMatch    = story.metadata.title.toLowerCase().includes(lowerQuery);
    const subtitleMatch = story.metadata.subtitle?.toLowerCase().includes(lowerQuery);
    const categoryMatch = story.metadata.category?.toLowerCase().includes(lowerQuery);
    const authorMatch   = story.metadata.author.toLowerCase().includes(lowerQuery);
    const contentMatch  = story.content?.toLowerCase().includes(lowerQuery);

    if (titleMatch || subtitleMatch || categoryMatch || authorMatch || contentMatch) {
      const coverId  = story.id.replace('story-', 'cover-');
      const relevance = titleMatch ? 0.95 : subtitleMatch ? 0.85 : authorMatch ? 0.75
                      : categoryMatch ? 0.7 : 0.6;

      results.push({
        id: `story-${story.id}`,
        title: story.metadata.title,
        content: story.metadata.description || story.metadata.subtitle
          || story.content?.substring(0, 150) || '',
        type: 'story',
        source: 'local',
        relevance,
        url: `/story/${coverId}`,
        metadata: {
          category: story.metadata.category,
          author: story.metadata.author,
          date: story.metadata.date,
          description: story.metadata.description,
        },
      });
    }
  });

  return results;
}

/**
 * Search steps in database
 */
async function searchSteps(query: string): Promise<SearchResult[]> {
  try {
    const steps = await prisma.step.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } }
        ],
        // Only search publicly visible steps
        visibility: 'ALL_USERS'
      },
      take: 10,
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'asc' }
      ]
    });

    return steps.map(step => {
      const titleMatch = step.title.toLowerCase().includes(query.toLowerCase());
      const descMatch = step.description?.toLowerCase().includes(query.toLowerCase());

      return {
        id: `step-${step.id}`,
        title: step.title,
        content: step.description || 'No description available',
        type: 'step',
        source: 'local',
        relevance: titleMatch ? 0.9 : (descMatch ? 0.7 : 0.5),
        url: `/build`, // Steps are shown on build page
        metadata: {
          category: 'STEP',
          description: step.description || undefined
        }
      };
    });
  } catch (error) {
    console.error('Error searching steps:', error);
    return [];
  }
}

/**
 * Search the site owner's own knowledge base API, when SEARCH_API_URL names
 * one. It takes { messages } at /api/chat and answers in Markdown (see
 * /article/setup-search). Unset, search covers only the site's own content
 */
const SEARCH_API_URL = process.env.SEARCH_API_URL?.replace(/\/+$/, '') || null;

async function searchExternalAPI(apiUrl: string, query: string): Promise<SearchResult[]> {
  try {
    const response = await fetch(`${apiUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          { role: 'user', content: query }
        ]
      }),
      // 5 second timeout
      signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) {
      throw new Error(`search API returned ${response.status}`);
    }

    const data: ExternalSearchResponse = await response.json();

    // Parse markdown response to extract results
    return parseExternalAPIResponse(data.content);
  } catch (error) {
    console.error('External search API failed:', error);
    return [];
  }
}

/**
 * Parse the search API's Markdown response into SearchResults
 */
function parseExternalAPIResponse(content: string): SearchResult[] {
  const results: SearchResult[] = [];

  // If content indicates no results
  if (content.includes("couldn't find anything")) {
    return [];
  }

  // Try to extract structured information from markdown
  // Pattern 1: Full document response (starts with # Title)
  const titleMatch = content.match(/^#\s+(.+)$/m);
  if (titleMatch) {
    const title = titleMatch[1];

    // Extract relevance score if present
    const scoreMatch = content.match(/\*\*Relevance:\*\*\s+([\d.]+)/);
    const relevance = scoreMatch ? parseFloat(scoreMatch[1]) : 0.8;

    // Extract document URL
    const urlMatch = content.match(/\[View on Wiki\]\(([^)]+)\)/) ||
                     content.match(/\[View full document\]\(([^)]+)\)/);
    const url = urlMatch ? urlMatch[1] : '#';

    // Create snippet (first 200 chars of content, excluding title)
    const contentWithoutTitle = content.replace(/^#\s+.+$/m, '').trim();
    const snippet = contentWithoutTitle.substring(0, 200).replace(/\n/g, ' ');

    results.push({
      id: `wiki-${Date.now()}`,
      title,
      content: snippet,
      type: 'wiki',
      source: 'external',
      relevance,
      url,
      metadata: {
        category: 'WIKI',
        description: 'Knowledge base article'
      }
    });
  }

  // Pattern 2: Multiple results (numbered list)
  const resultMatches = content.matchAll(/\*\*(\d+)\.\s+(.+?)\*\*\s+\(relevance:\s+([\d.]+)\)/g);
  for (const match of resultMatches) {
    const [, index, title, scoreStr] = match;
    const relevance = parseFloat(scoreStr);

    // Extract snippet (content between this result and next, or end)
    const currentIndex = match.index || 0;
    const nextMatch = content.slice(currentIndex + 1).match(/\*\*\d+\./);
    const nextIndex = nextMatch ? currentIndex + 1 + (nextMatch.index || 0) : content.length;
    const chunk = content.slice(currentIndex, nextIndex);

    // Find URL in the chunk using the same patterns as the API response format
    const urlMatch = chunk.match(/\[View full document\]\(([^)]+)\)/) ||
                     chunk.match(/\[View on Wiki\]\(([^)]+)\)/);
    const url = urlMatch ? urlMatch[1] : '#';

    const snippet = chunk
      .replace(/\*\*\d+\.\s+.+?\*\*\s+\(relevance:\s+[\d.]+\)/, '')
      .replace(/\[.+?\]\(.+?\)/, '')
      .trim()
      .substring(0, 200);

    results.push({
      id: `wiki-${Date.now()}-${index}`,
      title,
      content: snippet || 'Knowledge base article',
      type: 'wiki',
      source: 'external',
      relevance,
      url,
      metadata: {
        category: 'WIKI',
        description: 'Knowledge base article'
      }
    });
  }

  return results;
}

/**
 * Merge and rank all search results
 */
function mergeAndRankResults(
  pages: SearchResult[],
  articles: SearchResult[],
  stories: SearchResult[],
  steps: SearchResult[],
  apiResults: SearchResult[]
): SearchResult[] {
  // Combine all results
  const allResults = [...pages, ...articles, ...stories, ...steps, ...apiResults];

  // Sort by relevance (descending)
  allResults.sort((a, b) => b.relevance - a.relevance);

  // Deduplicate by URL
  const seen = new Set<string>();
  const uniqueResults = allResults.filter(result => {
    if (seen.has(result.url)) return false;
    seen.add(result.url);
    return true;
  });

  // Limit to top 20 results
  return uniqueResults.slice(0, 20);
}

// ============================================================================
// API ROUTE
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query } = body;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    // Check cache first
    const cached = getCachedSearch(query);
    if (cached) {
      console.log(`🎯 [SEARCH] Cache hit for: "${query}"`);
      return NextResponse.json(cached);
    }

    console.log(`🔍 [SEARCH] Executing search for: "${query}"`);

    // Execute all searches in parallel
    const [pages, articles, stories, steps, apiResults] = await Promise.all([
      Promise.resolve(searchPages(query)),
      Promise.resolve(searchArticles(query)),
      searchStories(query),
      searchSteps(query),
      SEARCH_API_URL ? searchExternalAPI(SEARCH_API_URL, query) : Promise.resolve([])
    ]);

    console.log(`📊 [SEARCH] Results - Pages: ${pages.length}, Articles: ${articles.length}, Stories: ${stories.length}, Steps: ${steps.length}, API: ${apiResults.length}`);

    // Merge and rank results
    const results = mergeAndRankResults(pages, articles, stories, steps, apiResults);

    // Prepare response
    const response: SearchResponse = {
      results,
      query,
      cached: false,
      sources: {
        local: pages.length + articles.length + stories.length + steps.length,
        external: apiResults.length
      },
      externalEnabled: SEARCH_API_URL !== null,
      limitedResults: SEARCH_API_URL !== null && apiResults.length === 0 && (pages.length > 0 || articles.length > 0 || steps.length > 0)
    };

    // Cache the result
    cacheSearch(query, response);

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ [SEARCH] Error:', error);
    return NextResponse.json(
      { error: 'Search failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// GET method for testing/health check
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'hybrid-search',
    cacheSize: searchCache.size,
    cacheTTL: CACHE_TTL
  });
}
