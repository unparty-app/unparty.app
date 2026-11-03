#!/usr/bin/env node

/**
 * Front Matter Generator for UNPPP Articles
 * 
 * Automatically generates YAML front matter for markdown files in theunparty* directories.
 * Extracts metadata from content and git history to create consistent article metadata.
 * 
 * Usage:
 *   node scripts/generate-frontmatter.js [files...]              # Add frontmatter to specific files
 *   node scripts/generate-frontmatter.js --check                 # List files missing frontmatter
 *   node scripts/generate-frontmatter.js --all                   # Process all UNPPP markdown files
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

// Front matter template schema
const FRONTMATTER_REGEX = /^---\s*\n([\s\S]*?)\n---\s*\n/;

/**
 * Check if a markdown file already has front matter
 */
function hasFrontmatter(content) {
  return FRONTMATTER_REGEX.test(content);
}

/**
 * Extract metadata from markdown content
 */
function extractMetadataFromMarkdown(content, filePath) {
  const lines = content.split('\n');
  let title = '';
  let description = '';
  
  // Extract title from first H1 heading
  for (const line of lines) {
    const h1Match = line.match(/^#\s+(.+)$/);
    if (h1Match) {
      title = h1Match[1].trim();
      break;
    }
  }
  
  // If no H1, try to extract from HTML or use filename
  if (!title) {
    const htmlTitleMatch = content.match(/<h1[^>]*>(.+?)<\/h1>/i);
    if (htmlTitleMatch) {
      title = htmlTitleMatch[1].replace(/<[^>]+>/g, '').trim();
    } else {
      const filename = path.basename(filePath, '.md');
      title = filename
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
    }
  }
  
  // Extract description from first paragraph or section
  const paragraphs = content
    .replace(/^---[\s\S]*?---\n/, '') // Remove frontmatter if exists
    .replace(/<[^>]+>/g, '') // Remove HTML tags
    .replace(/^#.+$/gm, '') // Remove headings
    .split('\n\n')
    .map((p) => p.trim())
    .filter((p) => p.length > 20 && !p.startsWith('```'));
  
  if (paragraphs.length > 0) {
    description = paragraphs[0]
      .replace(/\n/g, ' ')
      .substring(0, 200)
      .trim();
    
    // Clean up description
    if (description.length === 200) {
      description = description.substring(0, description.lastIndexOf(' ')) + '...';
    }
  }
  
  // Infer category from directory path
  const category = inferCategoryFromPath(filePath);
  
  // Generate tags from title and category
  const tags = generateTags(title, category, content);
  
  return {
    title,
    description: description || title,
    category,
    tags,
  };
}

/**
 * Infer category from file path (theunparty{category}/ pattern)
 */
function inferCategoryFromPath(filePath) {
  // Match theunparty{category} within src/app/ directory specifically
  const match = filePath.match(/src\/app\/theunparty([a-z]+)\//i);
  if (match) {
    return match[1].toLowerCase();
  }
  return 'uncategorized';
}

/**
 * Generate relevant tags from title, category, and content
 */
function generateTags(title, category, content) {
  const tags = new Set([category]);
  
  // Extract keywords from title
  const titleWords = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 3);
  
  titleWords.forEach((word) => {
    if (!['the', 'and', 'for', 'that', 'this', 'with'].includes(word)) {
      tags.add(word);
    }
  });
  
  // Look for common technical terms in content
  const technicalTerms = [
    'analytics', 'data', 'api', 'dashboard', 'metrics', 'scoring',
    'integration', 'automation', 'workflow', 'documentation',
    'technical', 'system', 'framework', 'architecture'
  ];
  
  const contentLower = content.toLowerCase();
  technicalTerms.forEach((term) => {
    if (contentLower.includes(term)) {
      tags.add(term);
    }
  });
  
  // Limit to 5 most relevant tags
  return Array.from(tags).slice(0, 5);
}

/**
 * Get file creation date from git history
 */
function getFileCreationDate(filePath) {
  try {
    const result = execSync(
      `git log --follow --format=%aI --reverse -- "${filePath}" | head -1`,
      { encoding: 'utf8', cwd: PROJECT_ROOT }
    ).trim();
    
    if (result) {
      // Convert ISO 8601 to YYYY-MM-DD
      return result.split('T')[0];
    }
  } catch {
    // File not in git history yet, use current date
  }
  
  // Fallback to current date
  const now = new Date();
  return now.toISOString().split('T')[0];
}

/**
 * Generate YAML frontmatter string
 */
function generateFrontmatter(metadata) {
  const { title, description, author, date, category, tags, published } = metadata;
  
  const lines = [
    '---',
    `title: "${title.replace(/"/g, '\\"')}"`,
    `description: "${description.replace(/"/g, '\\"')}"`,
    `author: "${author}"`,
    `date: "${date}"`,
    `category: "${category}"`,
  ];
  
  if (tags && tags.length > 0) {
    const tagsList = tags.map((t) => `"${t}"`).join(', ');
    lines.push(`tags: [${tagsList}]`);
  }
  
  lines.push(`published: ${published ? 'true' : 'false'}`);
  lines.push('---');
  
  return lines.join('\n') + '\n\n';
}

/**
 * Add frontmatter to a file
 */
function addFrontmatterToFile(filePath, options = {}) {
  const { checkOnly = false, author = 'unparty', published = true } = options;
  
  // Read file content
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check if frontmatter already exists
  if (hasFrontmatter(content)) {
    return { skipped: true, reason: 'already has frontmatter' };
  }
  
  if (checkOnly) {
    return { missing: true };
  }
  
  // Extract metadata
  const extracted = extractMetadataFromMarkdown(content, filePath);
  const date = getFileCreationDate(filePath);
  
  const metadata = {
    ...extracted,
    author,
    date,
    published,
  };
  
  // Generate frontmatter
  const frontmatter = generateFrontmatter(metadata);
  
  // Prepend frontmatter to content
  const newContent = frontmatter + content;
  
  // Write back to file
  fs.writeFileSync(filePath, newContent, 'utf8');
  
  return { success: true, metadata };
}

/**
 * Find all markdown files in theunparty* directories
 */
function findUnpppMarkdownFiles() {
  const srcAppDir = path.join(PROJECT_ROOT, 'src', 'app');
  const files = [];
  
  if (!fs.existsSync(srcAppDir)) {
    return files;
  }
  
  const entries = fs.readdirSync(srcAppDir, { withFileTypes: true });
  
  for (const entry of entries) {
    if (entry.isDirectory() && entry.name.startsWith('theunparty')) {
      const dirPath = path.join(srcAppDir, entry.name);
      const mdFiles = fs.readdirSync(dirPath)
        .filter((f) => f.endsWith('.md'))
        .map((f) => path.join(dirPath, f));
      
      files.push(...mdFiles);
    }
  }
  
  return files;
}

/**
 * Main CLI function
 */
function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Front Matter Generator for UNPPP Articles

Usage:
  node scripts/generate-frontmatter.js [files...]    Add frontmatter to specific files
  node scripts/generate-frontmatter.js --check       List files missing frontmatter
  node scripts/generate-frontmatter.js --all         Process all UNPPP markdown files

Options:
  --check          Dry-run mode, only list files without frontmatter
  --all            Process all markdown files in theunparty* directories
  --author <name>  Set author (default: "unparty")
  --help, -h       Show this help message
`);
    return;
  }
  
  const checkOnly = args.includes('--check');
  const processAll = args.includes('--all');
  const authorIndex = args.indexOf('--author');
  const author = authorIndex >= 0 ? args[authorIndex + 1] : 'unparty';
  
  // Determine files to process
  let filesToProcess = [];
  
  if (processAll) {
    filesToProcess = findUnpppMarkdownFiles();
  } else {
    // Filter out option flags
    filesToProcess = args.filter((arg) => !arg.startsWith('--') && arg !== author);
  }
  
  if (filesToProcess.length === 0) {
    console.error('No files specified. Use --all to process all UNPPP markdown files.');
    process.exit(1);
  }
  
  // Process files
  const results = {
    success: [],
    skipped: [],
    missing: [],
    errors: [],
  };
  
  for (const file of filesToProcess) {
    const absolutePath = path.isAbsolute(file) ? file : path.resolve(PROJECT_ROOT, file);
    
    if (!fs.existsSync(absolutePath)) {
      results.errors.push({ file, error: 'File not found' });
      continue;
    }
    
    try {
      const result = addFrontmatterToFile(absolutePath, { checkOnly, author });
      
      if (result.success) {
        results.success.push(file);
        console.log(`✓ Generated frontmatter for ${file}`);
      } else if (result.skipped) {
        results.skipped.push(file);
        if (!checkOnly) {
          console.log(`⊘ Skipped ${file} (${result.reason})`);
        }
      } else if (result.missing) {
        results.missing.push(file);
        console.log(`⚠ Missing frontmatter: ${file}`);
      }
    } catch (error) {
      results.errors.push({ file, error: error.message });
      console.error(`✗ Error processing ${file}: ${error.message}`);
    }
  }
  
  // Summary
  console.log('\n' + '─'.repeat(60));
  if (checkOnly) {
    console.log(`Found ${results.missing.length} file(s) missing frontmatter`);
  } else {
    console.log(`Processed: ${results.success.length} generated, ${results.skipped.length} skipped, ${results.errors.length} errors`);
  }
  
  process.exit(results.errors.length > 0 ? 1 : 0);
}

// Run if called directly
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}

export {
  hasFrontmatter,
  extractMetadataFromMarkdown,
  generateFrontmatter,
  addFrontmatterToFile,
  findUnpppMarkdownFiles,
};
