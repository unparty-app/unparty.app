#!/usr/bin/env node

/**
 * Analyze Story Repository Mentions - Build-time script
 * Pre-analyzes all stories to find repository mentions and creates a static mapping
 * This prevents runtime analysis that was causing crashes when clicking type buttons
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Import repository data
const unpppScoresPath = path.join(__dirname, '../public/data/unppp-scores.json')
let unpppScores
try {
  unpppScores = JSON.parse(fs.readFileSync(unpppScoresPath, 'utf-8'))
} catch (error) {
  console.error('Failed to load UNPPP scores:', error)
  process.exit(1)
}

// Get all theunparty repositories grouped by type
function getRepositoriesByType() {
  const grouped = {
    app: [],
    agent: [],
    service: [],
    assistant: [],
    library: [],
    framework: [],
    tool: [],
    bot: [],
  }

  unpppScores.scores.forEach((repo) => {
    // Filter: only include repos that start with "theunparty"
    if (!repo.id.startsWith('theunparty')) {
      return
    }
    
    const type = repo.type
    if (grouped[type]) {
      grouped[type].push(repo)
    }
  })

  return grouped
}

// Parse frontmatter from markdown content
function parseFrontmatter(content) {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/
  const match = content.match(frontmatterRegex)
  
  if (!match) {
    throw new Error('Invalid markdown format: missing frontmatter')
  }

  const [, frontmatterStr, markdownContent] = match
  
  // Parse YAML frontmatter
  const metadata = {}
  frontmatterStr.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split(':')
    if (key && valueParts.length > 0) {
      const trimmedKey = key.trim()
      let value = valueParts.join(':').trim().replace(/^["']|["']$/g, '')
      const parsedValue = value === 'true' ? true : value === 'false' ? false : value
      metadata[trimmedKey] = parsedValue
    }
  })

  return {
    metadata,
    content: markdownContent.trim()
  }
}

// Analyze story repository mentions
function analyzeStoryRepoMentions() {
  const storiesDir = path.join(__dirname, '../public/covers/stories')
  const outputPath = path.join(__dirname, '../public/data/story-repo-mappings.json')
  
  console.log('🔍 Analyzing story repository mentions...')
  
  if (!fs.existsSync(storiesDir)) {
    console.log('📁 Stories directory not found, creating empty mapping')
    const emptyMapping = {
      generated_at: new Date().toISOString(),
      mappings: {}
    }
    
    fs.writeFileSync(outputPath, JSON.stringify(emptyMapping, null, 2))
    return emptyMapping
  }

  // Get all repository names grouped by type
  const repositoriesByType = getRepositoriesByType()
  const allRepos = Object.values(repositoriesByType).flat()
  const repoNames = allRepos.map(repo => repo.id.toLowerCase())
  
  // Get all story files
  const storyFiles = fs.readdirSync(storiesDir)
    .filter(file => file.match(/^story-\d+\.md$/))
    .sort()

  console.log(`📚 Found ${storyFiles.length} story files`)
  console.log(`🏢 Analyzing mentions of ${repoNames.length} repositories`)

  const mappings = {}
  let processedCount = 0
  let mentionsFound = 0

  // Analyze each story
  for (const filename of storyFiles) {
    const storyId = filename.replace('.md', '')
    const filePath = path.join(storiesDir, filename)
    
    try {
      const rawContent = fs.readFileSync(filePath, 'utf-8')
      const { metadata, content } = parseFrontmatter(rawContent)
      
      // Skip unpublished stories
      if (!metadata.published) {
        continue
      }
      
      // Find repository mentions in content
      const contentLower = content.toLowerCase()
      const mentionedRepos = repoNames.filter(repoName => 
        contentLower.includes(repoName)
      )
      
      if (mentionedRepos.length > 0) {
        // Group mentions by repository type
        const mentionsByType = {}
        
        for (const repoName of mentionedRepos) {
          // Find which type this repo belongs to
          for (const [type, repos] of Object.entries(repositoriesByType)) {
            if (repos.some(repo => repo.id.toLowerCase() === repoName)) {
              if (!mentionsByType[type]) {
                mentionsByType[type] = []
              }
              mentionsByType[type].push(repoName)
              break
            }
          }
        }
        
        mappings[storyId] = {
          title: metadata.title,
          author: metadata.author,
          category: metadata.category,
          mentionedRepositories: mentionedRepos,
          mentionsByType,
          totalMentions: mentionedRepos.length
        }
        
        mentionsFound += mentionedRepos.length
        
        
      }
      
      processedCount++
      
    } catch (error) {
      console.warn(`⚠️  Failed to process ${filename}:`, error.message)
    }
  }

  const result = {
    generated_at: new Date().toISOString(),
    stats: {
      total_stories_processed: processedCount,
      stories_with_mentions: Object.keys(mappings).length,
      total_mentions_found: mentionsFound,
      repositories_analyzed: repoNames.length
    },
    mappings
  }

  // Write the result
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2))
  
  console.log('✅ Story repository analysis complete!')
  console.log(`📊 Stats:`)
  console.log(`   • ${result.stats.total_stories_processed} stories processed`)
  console.log(`   • ${result.stats.stories_with_mentions} stories have repository mentions`)
  console.log(`   • ${result.stats.total_mentions_found} total mentions found`)
  console.log(`📁 Saved to: ${outputPath}`)
  
  return result
}

// Run the analysis
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    analyzeStoryRepoMentions()
  } catch (error) {
    console.error('❌ Analysis failed:', error)
    process.exit(1)
  }
}