/**
 * Story Repository Mappings - Static data loader
 * Loads pre-computed story-repository mappings generated at build time
 * Replaces expensive runtime story content analysis
 */

import type { NavCategory } from '../constants/unpppNav'

export interface StoryRepoMapping {
  title: string
  author: string
  category: string
  mentionedRepositories: string[]
  mentionsByType: Record<NavCategory, string[]>
  totalMentions: number
}

export interface StoryRepoMappingsData {
  generated_at: string
  stats: {
    total_stories_processed: number
    stories_with_mentions: number
    total_mentions_found: number
    repositories_analyzed: number
  }
  mappings: Record<string, StoryRepoMapping>
}

// Cache the loaded data
let cachedMappings: StoryRepoMappingsData | null = null

/**
 * Load story repository mappings from pre-computed data
 * Uses build-time generated mappings to avoid runtime story content analysis
 */
export async function loadStoryRepoMappings(): Promise<StoryRepoMappingsData> {
  if (cachedMappings) {
    return cachedMappings
  }

  try {
    if (typeof window === 'undefined') {
      // Server-side: read from file system
      const fs = await import('fs')
      const path = await import('path')
      const filePath = path.join(process.cwd(), 'public', 'data', 'story-repo-mappings.json')
      
      if (!fs.existsSync(filePath)) {
        console.warn('Story repository mappings not found, returning empty data')
        return getEmptyMappings()
      }
      
      const content = fs.readFileSync(filePath, 'utf-8')
      cachedMappings = JSON.parse(content)
      
    } else {
      // Client-side: fetch from public URL
      const response = await fetch('/data/story-repo-mappings.json')
      
      if (!response.ok) {
        console.warn('Story repository mappings not found, returning empty data')
        return getEmptyMappings()
      }
      
      cachedMappings = await response.json()
    }
    
    return cachedMappings!
    
  } catch (error) {
    console.error('Failed to load story repository mappings:', error)
    return getEmptyMappings()
  }
}

/**
 * Get stories that mention repositories of a specific type
 * Uses pre-computed mappings for instant results
 */
export async function getStoriesByType(type: NavCategory): Promise<string[]> {
  const data = await loadStoryRepoMappings()
  
  const storyIds = Object.entries(data.mappings)
    .filter(([, mapping]) => {
      return mapping.mentionsByType[type] && mapping.mentionsByType[type].length > 0
    })
    .map(([storyId]) => storyId)
    .sort()
  
  return storyIds
}

/**
 * Get stories that mention a specific repository
 */
export async function getStoriesByRepo(repoName: string): Promise<string[]> {
  const data = await loadStoryRepoMappings()

  return Object.entries(data.mappings)
    .filter(([, mapping]) => mapping.mentionedRepositories.includes(repoName))
    .map(([storyId]) => storyId)
    .sort()
}

/**
 * Get all stories with repository mentions
 */
export async function getAllStoriesWithMentions(): Promise<string[]> {
  const data = await loadStoryRepoMappings()
  
  return Object.keys(data.mappings).sort()
}

/**
 * Get mapping stats
 */
export async function getMappingStats() {
  const data = await loadStoryRepoMappings()
  return data.stats
}

/**
 * Check if mappings were generated recently (within last 24 hours)
 */
export async function areMappingsFresh(): Promise<boolean> {
  const data = await loadStoryRepoMappings()
  const generatedAt = new Date(data.generated_at)
  const now = new Date()
  const hoursDiff = (now.getTime() - generatedAt.getTime()) / (1000 * 60 * 60)
  
  return hoursDiff < 24
}

/**
 * Get empty mappings fallback
 */
function getEmptyMappings(): StoryRepoMappingsData {
  return {
    generated_at: new Date().toISOString(),
    stats: {
      total_stories_processed: 0,
      stories_with_mentions: 0,
      total_mentions_found: 0,
      repositories_analyzed: 0
    },
    mappings: {}
  }
}