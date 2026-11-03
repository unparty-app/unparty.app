#!/usr/bin/env node

/**
 * Unused Imports Audit Script
 * 
 * Detects unused imports and variables using TypeScript compiler
 * Generates structured JSON and Markdown reports for manual review
 * 
 * Usage: npm run audit:imports [--json]
 * 
 * Options:
 *   --json    Output only JSON format
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname, relative } from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Output paths
const JSON_OUTPUT = join(rootDir, 'unused-imports-audit.json');
const MD_OUTPUT = join(rootDir, 'unused-imports-audit.md');

/**
 * Run TypeScript compiler and capture unused import/variable errors
 */
async function runTypeScriptCheck() {
  console.log('🔍 Running TypeScript compiler to detect unused imports...\n');
  
  try {
    // Run tsc --noEmit with combined output stream
    const result = await execAsync('npx tsc --noEmit 2>&1', { 
      cwd: rootDir, 
      maxBuffer: 10 * 1024 * 1024,
      shell: true
    });
    console.log('✅ No TypeScript errors detected!\n');
    return { output: result.stdout || '' };
  } catch (error) {
    // TypeScript exits with non-zero when there are errors
    // Capture the full output from both streams
    const output = (error.stdout || '') + (error.stderr || '');
    if (output.trim()) {
      console.log(`Found TypeScript errors (${output.split('\n').length} lines of output)\n`);
    }
    return { output };
  }
}

/**
 * Parse TypeScript compiler output to extract unused import/variable errors
 */
function parseTypeScriptErrors(output) {
  const lines = output.split('\n');
  const errors = [];
  
  // Regex to match TypeScript error format:
  // src/path/to/file.ts(line,col): error TS6133: 'symbol' is declared but its value is never read.
  // src/path/to/file.ts(line,col): error TS6133: 'symbol' is declared but never used.
  // src/path/to/file.ts(line,col): error TS6196: 'symbol' is declared but never used.
  const errorRegex = /^(.+?)\((\d+),(\d+)\):\s+error\s+(TS\d+):\s+'(.+?)'\s+is\s+(declared but (?:its value is )?never (?:read|used)|defined but never used)/;
  
  for (const line of lines) {
    const match = line.match(errorRegex);
    if (match) {
      const [, filePath, lineNum, colNum, errorCode, symbol, message] = match;
      
      // Only include TS6133 (unused variable/import), TS6192 (unused parameter), and TS6196
      if (errorCode === 'TS6133' || errorCode === 'TS6192' || errorCode === 'TS6196') {
        errors.push({
          filePath: filePath.trim(),
          line: parseInt(lineNum, 10),
          column: parseInt(colNum, 10),
          errorCode,
          symbol,
          message: `'${symbol}' is ${message}`,
          classification: null,
          notes: '',
          reviewedBy: null,
          reviewedAt: null
        });
      }
    }
  }
  
  return errors;
}

/**
 * Determine import source by reading the file
 */
function getImportSource(filePath, symbol, lineNum) {
  try {
    const fullPath = join(rootDir, filePath);
    if (!existsSync(fullPath)) return 'unknown';
    
    const content = readFileSync(fullPath, 'utf-8');
    const lines = content.split('\n');
    
    // Look around the error line for import statements
    const searchStart = Math.max(0, lineNum - 20);
    const searchEnd = Math.min(lines.length, lineNum + 5);
    
    for (let i = searchStart; i < searchEnd; i++) {
      const line = lines[i];
      
      // Check if this line imports the symbol
      if (line.includes(symbol) && (line.includes('import') || line.includes('from'))) {
        // Extract source
        if (line.includes('lucide-react')) return 'lucide-react';
        if (line.includes('react')) return 'react';
        if (line.includes('next/')) return 'next';
        if (line.includes('@/')) return 'local';
        if (line.includes('./') || line.includes('../')) return 'relative';
        
        const fromMatch = line.match(/from\s+['"]([^'"]+)['"]/);
        if (fromMatch) return fromMatch[1];
      }
    }
    
    return 'unknown';
  } catch {
    return 'unknown';
  }
}

/**
 * Group errors by file and enrich with metadata
 */
function groupErrorsByFile(errors) {
  const fileMap = new Map();
  
  for (const error of errors) {
    if (!fileMap.has(error.filePath)) {
      fileMap.set(error.filePath, {
        path: error.filePath,
        directory: dirname(error.filePath),
        unusedImports: []
      });
    }
    
    // Determine import source
    const source = getImportSource(error.filePath, error.symbol, error.line);
    
    fileMap.get(error.filePath).unusedImports.push({
      symbol: error.symbol,
      line: error.line,
      column: error.column,
      source,
      message: error.message,
      errorCode: error.errorCode,
      classification: null,
      notes: '',
      reviewedBy: null,
      reviewedAt: null,
      action: null
    });
  }
  
  return Array.from(fileMap.values()).sort((a, b) => a.path.localeCompare(b.path));
}

/**
 * Generate summary statistics
 */
function generateSummary(files) {
  const totalFiles = files.length;
  const totalUnusedImports = files.reduce((sum, f) => sum + f.unusedImports.length, 0);
  
  // Group by directory
  const byDirectory = files.reduce((acc, file) => {
    const dir = file.directory;
    if (!acc[dir]) acc[dir] = { count: 0, files: 0 };
    acc[dir].count += file.unusedImports.length;
    acc[dir].files += 1;
    return acc;
  }, {});
  
  // Group by import source
  const bySource = files.reduce((acc, file) => {
    file.unusedImports.forEach(imp => {
      if (!acc[imp.source]) acc[imp.source] = 0;
      acc[imp.source] += 1;
    });
    return acc;
  }, {});
  
  // Classification status
  const reviewed = files.reduce((sum, f) => 
    sum + f.unusedImports.filter(i => i.classification !== null).length, 0
  );
  
  return {
    totalFiles,
    totalUnusedImports,
    reviewed,
    remaining: totalUnusedImports - reviewed,
    byDirectory: Object.entries(byDirectory)
      .sort((a, b) => b[1].count - a[1].count)
      .reduce((acc, [dir, data]) => {
        acc[dir] = data;
        return acc;
      }, {}),
    bySource: Object.entries(bySource)
      .sort((a, b) => b[1] - a[1])
      .reduce((acc, [source, count]) => {
        acc[source] = count;
        return acc;
      }, {})
  };
}

/**
 * Load existing audit data if it exists
 */
function loadExistingAudit() {
  if (existsSync(JSON_OUTPUT)) {
    try {
      const data = JSON.parse(readFileSync(JSON_OUTPUT, 'utf-8'));
      return data;
    } catch {
      console.log('⚠️  Could not load existing audit data, starting fresh\n');
      return null;
    }
  }
  return null;
}

/**
 * Merge new findings with existing classifications
 */
function mergeWithExisting(newFiles, existingData) {
  if (!existingData || !existingData.files) return newFiles;
  
  const existingMap = new Map();
  existingData.files.forEach(file => {
    const key = `${file.path}`;
    existingMap.set(key, file);
  });
  
  // Merge classifications
  newFiles.forEach(newFile => {
    const existing = existingMap.get(newFile.path);
    if (existing) {
      newFile.unusedImports.forEach(newImport => {
        const existingImport = existing.unusedImports.find(
          ei => ei.symbol === newImport.symbol && ei.line === newImport.line
        );
        if (existingImport && existingImport.classification) {
          newImport.classification = existingImport.classification;
          newImport.notes = existingImport.notes || '';
          newImport.reviewedBy = existingImport.reviewedBy;
          newImport.reviewedAt = existingImport.reviewedAt;
          newImport.action = existingImport.action;
        }
      });
    }
  });
  
  return newFiles;
}

/**
 * Generate JSON output
 */
function generateJSONOutput(files, summary) {
  const output = {
    metadata: {
      generatedAt: new Date().toISOString(),
      version: '1.0.0',
      repository: 'theunpartyapp'
    },
    summary,
    files,
    classifications: {
      'removed-work': 'Feature/code was deleted, safe to remove import',
      'missing-functionality': 'Import should be used, indicates incomplete work',
      'investigate': 'Unclear, needs deeper review or context'
    }
  };
  
  writeFileSync(JSON_OUTPUT, JSON.stringify(output, null, 2));
  console.log(`📄 JSON report saved to: ${relative(rootDir, JSON_OUTPUT)}`);
}

/**
 * Generate Markdown output
 */
function generateMarkdownOutput(files, summary) {
  const lines = [];
  
  lines.push('# Unused Imports Audit Report\n');
  lines.push(`**Generated:** ${new Date().toISOString()}\n`);
  lines.push('---\n');
  
  // Summary
  lines.push('## Summary\n');
  lines.push(`- **Total Files with Unused Imports:** ${summary.totalFiles}`);
  lines.push(`- **Total Unused Imports/Variables:** ${summary.totalUnusedImports}`);
  lines.push(`- **Reviewed:** ${summary.reviewed}`);
  lines.push(`- **Remaining:** ${summary.remaining}\n`);
  
  // By Directory
  lines.push('### By Directory\n');
  lines.push('| Directory | Files | Unused Items |');
  lines.push('|-----------|-------|--------------|');
  Object.entries(summary.byDirectory).forEach(([dir, data]) => {
    lines.push(`| ${dir} | ${data.files} | ${data.count} |`);
  });
  lines.push('');
  
  // By Source
  lines.push('### By Import Source\n');
  lines.push('| Source | Count |');
  lines.push('|--------|-------|');
  Object.entries(summary.bySource).forEach(([source, count]) => {
    lines.push(`| ${source} | ${count} |`);
  });
  lines.push('');
  
  lines.push('---\n');
  
  // Detailed list
  lines.push('## Files with Unused Imports\n');
  
  files.forEach(file => {
    lines.push(`### [${file.path}](${file.path})\n`);
    lines.push(`**Directory:** ${file.directory}  `);
    lines.push(`**Unused Items:** ${file.unusedImports.length}\n`);
    
    file.unusedImports.forEach(imp => {
      const status = imp.classification ? `✅ ${imp.classification}` : '⏳ needs review';
      lines.push(`- **Line ${imp.line}:** \`${imp.symbol}\` (from \`${imp.source}\`) - ${status}`);
      if (imp.notes) {
        lines.push(`  - *Notes:* ${imp.notes}`);
      }
    });
    
    lines.push('');
  });
  
  lines.push('---\n');
  
  // Classification Guide
  lines.push('## Classification Guide\n');
  lines.push('When reviewing unused imports, classify each one as:\n');
  lines.push('- **`removed-work`** - Feature/code was deleted, safe to remove import');
  lines.push('- **`missing-functionality`** - Import should be used, indicates incomplete work');
  lines.push('- **`investigate`** - Unclear, needs deeper review or context\n');
  lines.push('Edit the `unused-imports-audit.json` file to add classifications.\n');
  
  writeFileSync(MD_OUTPUT, lines.join('\n'));
  console.log(`📄 Markdown report saved to: ${relative(rootDir, MD_OUTPUT)}`);
}

/**
 * Display summary to console
 */
function displaySummary(summary) {
  console.log('\n📊 AUDIT SUMMARY\n');
  console.log(`   Files with Issues    : ${summary.totalFiles}`);
  console.log(`   Total Unused Items   : ${summary.totalUnusedImports}`);
  console.log(`   Reviewed            : ${summary.reviewed}`);
  console.log(`   Remaining           : ${summary.remaining}\n`);
  
  console.log('📂 TOP DIRECTORIES:\n');
  Object.entries(summary.byDirectory).slice(0, 5).forEach(([dir, data]) => {
    console.log(`   ${dir.padEnd(40)} : ${data.count} unused items in ${data.files} files`);
  });
  
  console.log('\n📦 TOP IMPORT SOURCES:\n');
  Object.entries(summary.bySource).slice(0, 5).forEach(([source, count]) => {
    console.log(`   ${source.padEnd(30)} : ${count} unused imports`);
  });
  
  console.log('');
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  const jsonOnly = args.includes('--json');
  
  console.log('🔍 UNPARTY Unused Imports Audit\n');
  
  // Run TypeScript check
  const { output } = await runTypeScriptCheck();
  
  // Parse errors
  const errors = parseTypeScriptErrors(output);
  
  if (errors.length === 0) {
    console.log('✅ No unused imports or variables found!\n');
    
    // Clean up old audit files if they exist
    if (existsSync(JSON_OUTPUT)) {
      writeFileSync(JSON_OUTPUT, JSON.stringify({
        metadata: {
          generatedAt: new Date().toISOString(),
          version: '1.0.0',
          repository: 'theunpartyapp'
        },
        summary: { totalFiles: 0, totalUnusedImports: 0, reviewed: 0, remaining: 0 },
        files: []
      }, null, 2));
      console.log('🧹 Cleaned up audit files\n');
    }
    
    return;
  }
  
  console.log(`Found ${errors.length} unused import/variable errors\n`);
  
  // Group by file
  let files = groupErrorsByFile(errors);
  
  // Load and merge with existing audit data
  const existingData = loadExistingAudit();
  if (existingData) {
    console.log('📋 Merging with existing classifications...\n');
    files = mergeWithExisting(files, existingData);
  }
  
  // Generate summary
  const summary = generateSummary(files);
  
  // Generate outputs
  generateJSONOutput(files, summary);
  if (!jsonOnly) {
    generateMarkdownOutput(files, summary);
    displaySummary(summary);
  } else {
    console.log(JSON.stringify({ summary, files }, null, 2));
  }
  
  console.log('✅ Audit complete!\n');
  console.log('📝 Next steps:');
  console.log('   1. Review the generated reports');
  console.log('   2. Classify each unused import in unused-imports-audit.json');
  console.log('   3. Run audit again to update statistics');
  console.log('   4. Take action based on classifications\n');
}

main().catch(error => {
  console.error('❌ Error running audit:', error);
  process.exit(1);
});
