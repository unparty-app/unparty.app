#!/usr/bin/env node

/**
 * Sprint Effort Analysis
 * THINK: ADD AUTO RUN to connect with theunpartybuilder for classification categories
 * Analyzes git commit history to calculate and visualize development effort metrics.
 * Provides insights for development focus and performance measurement.
 * 
 * Usage: node scripts/sprint-effort-analysis.js [options]
 * 
 * Options:
 *   --days N       Analysis period in days (default: 7)
 *   --author NAME  Filter by specific author
 *   --repo PATH    Path to a local git repo (default: this repo)
 *   --json         Output as JSON
 *   --weekly       Show weekly breakdown
 *   --help         Show help
 * 
 * Metrics calculated:
 *   - Total commits and lines changed
 *   - Commit velocity (commits/day)
 *   - Development effort score (weighted metric)
 *   - Author contribution distribution
 *   - File change patterns
 *   - Commit category breakdown (feat, fix, etc.)
 */

import { execSync } from 'child_process'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
let ROOT_DIR = resolve(__dirname, '..')

// ============================================================================
// CONFIGURATION
// ============================================================================

const EFFORT_WEIGHTS = {
  commit: 1,           // Base weight per commit
  lineAdded: 0.1,      // Weight per line added
  lineDeleted: 0.05,   // Weight per line deleted (less than added)
  fileChanged: 0.5,    // Weight per file changed
  issueRef: 2,         // Bonus for referencing an issue
  prMerge: 3,          // Bonus for PR merges
}

const COMMIT_CATEGORIES = {
  'FEAT.': { emoji: '✨', label: 'Feature', color: '#10b981' },
  'FIX.': { emoji: '🐛', label: 'Bug Fix', color: '#ef4444' },
  'THINK.': { emoji: '🤔', label: 'Research', color: '#8b5cf6' },
  'UX.': { emoji: '🎨', label: 'UX/Design', color: '#f59e0b' },
  'DEBT.': { emoji: '🔧', label: 'Tech Debt', color: '#6b7280' },
  'UNPARTY.': { emoji: '🪩', label: 'Platform', color: '#ec4899' },
  'WORKFLOW.': { emoji: '⚙️', label: 'Workflow', color: '#3b82f6' },
  'STAGE.': { emoji: '🚀', label: 'Staging', color: '#14b8a6' },
  'STORY.': { emoji: '📖', label: 'Story', color: '#a855f7' },
  'LLM.': { emoji: '🤖', label: 'LLM/AI', color: '#6366f1' },
  'DEPEND.': { emoji: '📦', label: 'Dependencies', color: '#78716c' },
  'MOOD.': { emoji: '🎵', label: 'Mood', color: '#f43f5e' },
  'DOC.': { emoji: '📝', label: 'Documentation', color: '#22c55e' },
  'LEARN.': { emoji: '📚', label: 'Learning', color: '#0ea5e9' },
  'fix:': { emoji: '🐛', label: 'Bug Fix', color: '#ef4444' },
  'feat:': { emoji: '✨', label: 'Feature', color: '#10b981' },
  'chore:': { emoji: '🔧', label: 'Chore', color: '#6b7280' },
  'refactor:': { emoji: '♻️', label: 'Refactor', color: '#f97316' },
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function parseArgs() {
  const args = process.argv.slice(2)
  const options = {
    days: 7,
    author: null,
    repo: null,
    json: false,
    weekly: false,
    help: false,
  }

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--days':
        options.days = parseInt(args[++i], 10) || 7
        break
      case '--author':
        options.author = args[++i]
        break
      case '--repo':
        options.repo = args[++i]
        break
      case '--json':
        options.json = true
        break
      case '--weekly':
        options.weekly = true
        break
      case '--help':
        options.help = true
        break
    }
  }

  return options
}

function execGit(command) {
  try {
    return execSync(command, { 
      cwd: ROOT_DIR, 
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024 // 10MB buffer
    }).trim()
  } catch {
    console.error(`Git command failed: ${command}`)
    return ''
  }
}

function formatNumber(num) {
  return num.toLocaleString()
}

function formatDate(date) {
  return date.toISOString().split('T')[0]
}

// ============================================================================
// EFFORT CALCULATION FUNCTIONS
// ============================================================================

function getCommitHistory(days, author = null) {
  const sinceDate = new Date()
  sinceDate.setDate(sinceDate.getDate() - days)
  
  let authorFilter = author ? `--author="${author}"` : ''
  
  // Get commit data with stats
  const logFormat = '%H|%an|%ae|%ad|%s'
  const command = `git --no-pager log --since="${formatDate(sinceDate)}" ${authorFilter} --format="${logFormat}" --date=short --numstat`
  
  const output = execGit(command)
  if (!output) return []

  const lines = output.split('\n')
  const commits = []
  let currentCommit = null

  for (const line of lines) {
    if (line.includes('|') && line.split('|').length >= 5) {
      // New commit line
      if (currentCommit) {
        commits.push(currentCommit)
      }
      const [hash, author, email, date, ...messageParts] = line.split('|')
      currentCommit = {
        hash: hash.substring(0, 7),
        fullHash: hash,
        author,
        email,
        date,
        message: messageParts.join('|'),
        additions: 0,
        deletions: 0,
        filesChanged: [],
        category: categorizeCommit(messageParts.join('|')),
      }
    } else if (line.trim() && currentCommit) {
      // File stat line: additions\tdeletions\tfilename
      const parts = line.split('\t')
      if (parts.length >= 3) {
        const additions = parseInt(parts[0], 10) || 0
        const deletions = parseInt(parts[1], 10) || 0
        const filename = parts[2]
        
        currentCommit.additions += additions
        currentCommit.deletions += deletions
        currentCommit.filesChanged.push({
          filename,
          additions,
          deletions,
        })
      }
    }
  }

  if (currentCommit) {
    commits.push(currentCommit)
  }

  return commits
}

function categorizeCommit(message) {
  const upperMessage = message.toUpperCase()
  
  for (const [prefix, meta] of Object.entries(COMMIT_CATEGORIES)) {
    if (message.startsWith(prefix) || upperMessage.startsWith(prefix.toUpperCase())) {
      return { prefix, ...meta }
    }
  }
  
  // Check for conventional commit prefixes
  const lowerMessage = message.toLowerCase()
  for (const [prefix, meta] of Object.entries(COMMIT_CATEGORIES)) {
    if (lowerMessage.startsWith(prefix.toLowerCase())) {
      return { prefix, ...meta }
    }
  }

  return { prefix: 'OTHER', emoji: '📝', label: 'Other', color: '#9ca3af' }
}

function calculateEffortScore(commit) {
  let score = EFFORT_WEIGHTS.commit
  
  score += commit.additions * EFFORT_WEIGHTS.lineAdded
  score += commit.deletions * EFFORT_WEIGHTS.lineDeleted
  score += commit.filesChanged.length * EFFORT_WEIGHTS.fileChanged
  
  // Bonus for issue references
  if (commit.message.match(/#\d+/)) {
    score += EFFORT_WEIGHTS.issueRef
  }
  
  // Bonus for PR merges
  if (commit.message.toLowerCase().includes('merge pull request')) {
    score += EFFORT_WEIGHTS.prMerge
  }
  
  return Math.round(score * 100) / 100
}

function calculateMetrics(commits, days) {
  const metrics = {
    period: {
      days,
      startDate: formatDate(new Date(Date.now() - days * 24 * 60 * 60 * 1000)),
      endDate: formatDate(new Date()),
    },
    summary: {
      totalCommits: commits.length,
      totalAdditions: 0,
      totalDeletions: 0,
      netChange: 0,
      totalFilesChanged: 0,
      uniqueFilesChanged: new Set(),
      commitVelocity: 0,
      effortScore: 0,
    },
    authors: {},
    categories: {},
    dailyActivity: {},
    filePatterns: {
      components: 0,
      pages: 0,
      api: 0,
      scripts: 0,
      tests: 0,
      styles: 0,
      config: 0,
      docs: 0,
      other: 0,
    },
    topFiles: [],
    direction: 'stable',
  }

  // Process commits
  for (const commit of commits) {
    const effortScore = calculateEffortScore(commit)
    
    // Summary totals
    metrics.summary.totalAdditions += commit.additions
    metrics.summary.totalDeletions += commit.deletions
    metrics.summary.totalFilesChanged += commit.filesChanged.length
    metrics.summary.effortScore += effortScore
    
    for (const file of commit.filesChanged) {
      metrics.summary.uniqueFilesChanged.add(file.filename)
    }
    
    // Author stats
    if (!metrics.authors[commit.author]) {
      metrics.authors[commit.author] = {
        commits: 0,
        additions: 0,
        deletions: 0,
        effortScore: 0,
        categories: {},
      }
    }
    metrics.authors[commit.author].commits++
    metrics.authors[commit.author].additions += commit.additions
    metrics.authors[commit.author].deletions += commit.deletions
    metrics.authors[commit.author].effortScore += effortScore
    
    const catLabel = commit.category.label
    metrics.authors[commit.author].categories[catLabel] = 
      (metrics.authors[commit.author].categories[catLabel] || 0) + 1
    
    // Category stats
    if (!metrics.categories[commit.category.label]) {
      metrics.categories[commit.category.label] = {
        ...commit.category,
        count: 0,
        additions: 0,
        deletions: 0,
        effortScore: 0,
      }
    }
    metrics.categories[commit.category.label].count++
    metrics.categories[commit.category.label].additions += commit.additions
    metrics.categories[commit.category.label].deletions += commit.deletions
    metrics.categories[commit.category.label].effortScore += effortScore
    
    // Daily activity
    if (!metrics.dailyActivity[commit.date]) {
      metrics.dailyActivity[commit.date] = {
        commits: 0,
        additions: 0,
        deletions: 0,
        effortScore: 0,
      }
    }
    metrics.dailyActivity[commit.date].commits++
    metrics.dailyActivity[commit.date].additions += commit.additions
    metrics.dailyActivity[commit.date].deletions += commit.deletions
    metrics.dailyActivity[commit.date].effortScore += effortScore
    
    // File patterns
    for (const file of commit.filesChanged) {
      const filename = file.filename.toLowerCase()
      if (filename.includes('/components/') || filename.endsWith('.tsx')) {
        metrics.filePatterns.components++
      } else if (filename.includes('/pages/') || filename.includes('/app/') && filename.endsWith('page.tsx')) {
        metrics.filePatterns.pages++
      } else if (filename.includes('/api/')) {
        metrics.filePatterns.api++
      } else if (filename.includes('/scripts/') || filename.endsWith('.sh')) {
        metrics.filePatterns.scripts++
      } else if (filename.includes('.test.') || filename.includes('.spec.')) {
        metrics.filePatterns.tests++
      } else if (filename.endsWith('.css') || filename.endsWith('.scss')) {
        metrics.filePatterns.styles++
      } else if (filename.includes('config') || filename.endsWith('.json') && !filename.includes('package')) {
        metrics.filePatterns.config++
      } else if (filename.endsWith('.md')) {
        metrics.filePatterns.docs++
      } else {
        metrics.filePatterns.other++
      }
    }
  }

  // Calculate derived metrics
  metrics.summary.netChange = metrics.summary.totalAdditions - metrics.summary.totalDeletions
  metrics.summary.uniqueFilesCount = metrics.summary.uniqueFilesChanged.size
  metrics.summary.commitVelocity = Math.round((metrics.summary.totalCommits / days) * 100) / 100
  metrics.summary.effortScore = Math.round(metrics.summary.effortScore * 100) / 100
  
  // Determine direction
  if (metrics.summary.netChange > 100) {
    metrics.direction = 'growth'
  } else if (metrics.summary.netChange < -100) {
    metrics.direction = 'reduction'
  } else {
    metrics.direction = 'stable'
  }
  
  // Convert Set to count (for JSON serialization)
  delete metrics.summary.uniqueFilesChanged

  // Sort authors by effort score
  metrics.authorsSorted = Object.entries(metrics.authors)
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.effortScore - a.effortScore)

  // Sort categories by count
  metrics.categoriesSorted = Object.values(metrics.categories)
    .sort((a, b) => b.count - a.count)

  return metrics
}

// ============================================================================
// OUTPUT FUNCTIONS
// ============================================================================

function printHelp() {
  console.log(`
🪩 UNPARTY Sprint Effort Analysis
${'━'.repeat(50)}

USAGE:
  node scripts/sprint-effort-analysis.js [options]

OPTIONS:
  --days N       Analysis period in days (default: 7)
  --author NAME  Filter by specific author
  --repo PATH    Path to a local git repo (default: this repo)
  --json         Output as JSON
  --weekly       Show weekly breakdown
  --help         Show this help message

EXAMPLES:
  # Analyze last 7 days
  node scripts/sprint-effort-analysis.js

  # Analyze last 30 days with JSON output
  node scripts/sprint-effort-analysis.js --days 30 --json

  # Filter by author
  node scripts/sprint-effort-analysis.js --author "unparty"

METRICS:
  • Commit Velocity  - Average commits per day
  • Effort Score     - Weighted score based on lines, files, and commit types
  • Net Change       - Lines added minus lines deleted
  • Category Split   - Breakdown by commit prefix (FEAT., FIX., etc.)
  • Focus Areas      - Distribution of changes across file patterns
`)
}

function printReport(metrics, commits) {
  const { summary, authorsSorted, categoriesSorted, dailyActivity, filePatterns, direction } = metrics
  
  console.log('\n🪩 UNPARTY SPRINT EFFORT ANALYSIS')
  console.log('━'.repeat(60))
  
  // Period
  console.log(`\n📅 PERIOD: ${metrics.period.startDate} to ${metrics.period.endDate} (${metrics.period.days} days)`)
  
  // Summary Stats
  console.log('\n' + '─'.repeat(60))
  console.log('📊 SUMMARY METRICS')
  console.log('─'.repeat(60))
  
  console.log(`
  Total Commits    : ${formatNumber(summary.totalCommits)}
  Lines Added      : +${formatNumber(summary.totalAdditions)}
  Lines Deleted    : -${formatNumber(summary.totalDeletions)}
  Net Change       : ${summary.netChange >= 0 ? '+' : ''}${formatNumber(summary.netChange)} (${direction})
  
  Files Changed    : ${formatNumber(summary.totalFilesChanged)} changes
  Unique Files     : ${formatNumber(summary.uniqueFilesCount)} files
  
  Commit Velocity  : ${summary.commitVelocity} commits/day
  Effort Score     : ${formatNumber(summary.effortScore)} points
`)

  // Effort Score Breakdown
  console.log('─'.repeat(60))
  console.log('🎯 EFFORT SCORE COMPOSITION')
  console.log('─'.repeat(60))
  
  const baseCommitScore = summary.totalCommits * EFFORT_WEIGHTS.commit
  const additionScore = summary.totalAdditions * EFFORT_WEIGHTS.lineAdded
  const deletionScore = summary.totalDeletions * EFFORT_WEIGHTS.lineDeleted
  const fileScore = summary.totalFilesChanged * EFFORT_WEIGHTS.fileChanged
  
  console.log(`
  Base Commits     : ${formatNumber(Math.round(baseCommitScore))} pts (${summary.totalCommits} × ${EFFORT_WEIGHTS.commit})
  Lines Added      : ${formatNumber(Math.round(additionScore))} pts (${summary.totalAdditions} × ${EFFORT_WEIGHTS.lineAdded})
  Lines Deleted    : ${formatNumber(Math.round(deletionScore))} pts (${summary.totalDeletions} × ${EFFORT_WEIGHTS.lineDeleted})
  Files Changed    : ${formatNumber(Math.round(fileScore))} pts (${summary.totalFilesChanged} × ${EFFORT_WEIGHTS.fileChanged})
  Bonuses          : ${formatNumber(Math.round(summary.effortScore - baseCommitScore - additionScore - deletionScore - fileScore))} pts (issues + PRs)
`)

  // Author Contributions
  if (authorsSorted.length > 0) {
    console.log('─'.repeat(60))
    console.log('👥 AUTHOR CONTRIBUTIONS')
    console.log('─'.repeat(60))
    
    const maxNameLen = Math.max(...authorsSorted.map(a => a.name.length), 15)
    console.log(`\n  ${'Author'.padEnd(maxNameLen)} | Commits |  Lines  | Effort`)
    console.log(`  ${'-'.repeat(maxNameLen)}-+---------+---------+--------`)
    
    for (const author of authorsSorted.slice(0, 10)) {
      const netLines = author.additions - author.deletions
      const netStr = netLines >= 0 ? `+${netLines}` : `${netLines}`
      console.log(`  ${author.name.padEnd(maxNameLen)} | ${String(author.commits).padStart(7)} | ${netStr.padStart(7)} | ${Math.round(author.effortScore).toString().padStart(6)}`)
    }
    console.log()
  }

  // Category Breakdown
  if (categoriesSorted.length > 0) {
    console.log('─'.repeat(60))
    console.log('🏷️ COMMIT CATEGORIES')
    console.log('─'.repeat(60))
    
    console.log(`\n  Category          | Count |  Lines  | Effort`)
    console.log(`  ------------------+-------+---------+--------`)
    
    for (const cat of categoriesSorted) {
      const netLines = cat.additions - cat.deletions
      const netStr = netLines >= 0 ? `+${netLines}` : `${netLines}`
      console.log(`  ${cat.emoji} ${cat.label.padEnd(14)} | ${String(cat.count).padStart(5)} | ${netStr.padStart(7)} | ${Math.round(cat.effortScore).toString().padStart(6)}`)
    }
    console.log()
  }

  // File Patterns
  console.log('─'.repeat(60))
  console.log('📁 FOCUS AREAS (File Changes by Type)')
  console.log('─'.repeat(60))
  
  const totalFileChanges = Object.values(filePatterns).reduce((a, b) => a + b, 0)
  const patternLabels = {
    components: '🧩 Components',
    pages: '📄 Pages',
    api: '🔌 API',
    scripts: '⚙️ Scripts',
    tests: '🧪 Tests',
    styles: '🎨 Styles',
    config: '⚡ Config',
    docs: '📝 Docs',
    other: '📦 Other',
  }
  
  console.log()
  for (const [key, count] of Object.entries(filePatterns).sort((a, b) => b[1] - a[1])) {
    if (count > 0) {
      const pct = totalFileChanges > 0 ? Math.round((count / totalFileChanges) * 100) : 0
      const bar = '█'.repeat(Math.round(pct / 5))
      console.log(`  ${patternLabels[key].padEnd(15)} : ${bar.padEnd(20)} ${pct}% (${count})`)
    }
  }
  console.log()

  // Daily Activity
  const dailyDates = Object.keys(dailyActivity).sort()
  if (dailyDates.length > 0) {
    console.log('─'.repeat(60))
    console.log('📈 DAILY ACTIVITY')
    console.log('─'.repeat(60))
    
    console.log(`\n  Date       | Commits | Net Lines | Effort`)
    console.log(`  -----------+---------+-----------+--------`)
    
    for (const date of dailyDates) {
      const day = dailyActivity[date]
      const netLines = day.additions - day.deletions
      const netStr = netLines >= 0 ? `+${netLines}` : `${netLines}`
      console.log(`  ${date}  | ${String(day.commits).padStart(7)} | ${netStr.padStart(9)} | ${Math.round(day.effortScore).toString().padStart(6)}`)
    }
    console.log()
  }

  // Recent Commits
  console.log('─'.repeat(60))
  console.log('📝 RECENT COMMITS (Last 10)')
  console.log('─'.repeat(60))
  console.log()
  
  for (const commit of commits.slice(0, 10)) {
    const netLines = commit.additions - commit.deletions
    const netStr = netLines >= 0 ? `+${netLines}` : `${netLines}`
    const truncatedMsg = commit.message.length > 50 
      ? commit.message.substring(0, 47) + '...'
      : commit.message
    console.log(`  ${commit.hash} | ${commit.date} | ${commit.author.substring(0, 15).padEnd(15)} | ${netStr.padStart(6)} | ${truncatedMsg}`)
  }
  console.log()

  // Footer
  console.log('━'.repeat(60))
  console.log(`Generated: ${new Date().toISOString()}`)
  console.log('━'.repeat(60))
}

function printJSON(metrics, commits) {
  const output = {
    ...metrics,
    commits: commits.map(c => ({
      hash: c.hash,
      author: c.author,
      date: c.date,
      message: c.message,
      additions: c.additions,
      deletions: c.deletions,
      filesCount: c.filesChanged.length,
      category: c.category.label,
      effortScore: calculateEffortScore(c),
    })),
    generatedAt: new Date().toISOString(),
  }
  
  console.log(JSON.stringify(output, null, 2))
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

function main() {
  const options = parseArgs()

  if (options.repo) {
    ROOT_DIR = resolve(options.repo)
  }

  if (options.help) {
    printHelp()
    process.exit(0)
  }

  console.log('🎯 Analyzing sprint effort...\n')
  
  const commits = getCommitHistory(options.days, options.author)
  
  if (commits.length === 0) {
    console.log(`No commits found in the last ${options.days} days.`)
    if (options.author) {
      console.log(`Author filter: ${options.author}`)
    }
    process.exit(0)
  }
  
  const metrics = calculateMetrics(commits, options.days)
  
  if (options.json) {
    printJSON(metrics, commits)
  } else {
    printReport(metrics, commits)
  }
}

main()
