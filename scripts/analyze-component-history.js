#!/usr/bin/env node

/**
 * Component History Analyzer
 * Analyzes git history for each component to find first and last commits
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

const COMPONENTS_DIR = 'src/app/components';

/**
 * Get all component files in the components directory
 */
function getComponentFiles() {
  const componentsPath = path.join(process.cwd(), COMPONENTS_DIR);
  
  if (!fs.existsSync(componentsPath)) {
    console.error(`Components directory not found: ${componentsPath}`);
    process.exit(1);
  }

  const files = [];
  
  function scanDirectory(dir, relativePath = '') {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const relativeItemPath = relativePath ? `${relativePath}/${item}` : item;
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        scanDirectory(fullPath, relativeItemPath);
      } else if (item.endsWith('.tsx') || item.endsWith('.ts') || item.endsWith('.mdx')) {
        files.push({
          name: item,
          relativePath: `${COMPONENTS_DIR}/${relativeItemPath}`,
          baseName: path.basename(item, path.extname(item))
        });
      }
    }
  }
  
  scanDirectory(componentsPath);
  return files;
}

/**
 * Get git history for a specific file
 */
function getFileGitHistory(filePath) {
  try {
    // Get first commit (oldest)
    const firstCommitCmd = `git log --reverse --format="%H|%s|%ad" --date=iso -- "${filePath}" | head -1`;
    const firstCommitOutput = execSync(firstCommitCmd, { encoding: 'utf8' }).trim();
    
    // Get last commit (most recent)
    const lastCommitCmd = `git log --format="%H|%s|%ad" --date=iso -- "${filePath}" | head -1`;
    const lastCommitOutput = execSync(lastCommitCmd, { encoding: 'utf8' }).trim();
    
    function parseCommitOutput(output) {
      if (!output) return null;
      const [hash, subject, date] = output.split('|');
      return { hash, subject, date };
    }
    
    const firstCommit = parseCommitOutput(firstCommitOutput);
    const lastCommit = parseCommitOutput(lastCommitOutput);
    
    // Get total number of commits for this file
    const commitCountCmd = `git log --oneline -- "${filePath}" | wc -l`;
    const commitCount = parseInt(execSync(commitCountCmd, { encoding: 'utf8' }).trim()) || 0;
    
    return {
      firstCommit,
      lastCommit,
      commitCount
    };
  } catch (error) {
    console.warn(`Error getting git history for ${filePath}:`, error.message);
    return {
      firstCommit: null,
      lastCommit: null,
      commitCount: 0
    };
  }
}

/**
 * Generate component ID from file name
 */
function generateComponentId(fileName) {
  const baseName = path.basename(fileName, path.extname(fileName));
  return baseName.toLowerCase().replace(/[^a-z0-9]/g, '-');
}

/**
 * Main analysis function
 */
async function analyzeComponents() {
  console.log('🔍 Analyzing component history...');
  
  const componentFiles = getComponentFiles();
  console.log(`Found ${componentFiles.length} component files`);
  
  const components = [];
  
  for (const file of componentFiles) {
    console.log(`Analyzing ${file.relativePath}...`);
    
    const history = getFileGitHistory(file.relativePath);
    const componentId = generateComponentId(file.name);
    
    components.push({
      id: componentId,
      name: file.baseName,
      path: file.relativePath,
      firstCommit: history.firstCommit?.hash || null,
      firstCommitDate: history.firstCommit?.date || null,
      firstCommitSubject: history.firstCommit?.subject || null,
      lastCommit: history.lastCommit?.hash || null,
      lastCommitDate: history.lastCommit?.date || null,
      lastCommitSubject: history.lastCommit?.subject || null,
      commitCount: history.commitCount
    });
  }
  
  // Sort by creation date (first commit date)
  components.sort((a, b) => {
    if (!a.firstCommitDate && !b.firstCommitDate) return 0;
    if (!a.firstCommitDate) return 1;
    if (!b.firstCommitDate) return -1;
    return new Date(a.firstCommitDate) - new Date(b.firstCommitDate);
  });
  
  return components;
}

/**
 * Export results for use by other scripts
 */
export { analyzeComponents, getComponentFiles, getFileGitHistory };

/**
 * CLI execution
 */
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  analyzeComponents()
    .then(components => {
      console.log('\n📊 Component History Analysis Complete');
      console.log(`Total components: ${components.length}`);
      console.log('\nOldest components:');
      components.slice(0, 5).forEach(comp => {
        console.log(`  ${comp.name} (${comp.firstCommitDate ? new Date(comp.firstCommitDate).toLocaleDateString() : 'unknown'})`);
      });
      console.log('\nNewest components:');
      components.slice(-5).reverse().forEach(comp => {
        console.log(`  ${comp.name} (${comp.firstCommitDate ? new Date(comp.firstCommitDate).toLocaleDateString() : 'unknown'})`);
      });
      
      // Write to temporary file for inspection
      const outputPath = 'component-history-temp.json';
      fs.writeFileSync(outputPath, JSON.stringify(components, null, 2));
      console.log(`\n💾 Results written to ${outputPath}`);
    })
    .catch(error => {
      console.error('❌ Error analyzing components:', error);
      process.exit(1);
    });
}