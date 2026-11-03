#!/usr/bin/env node

/**
 * Sync Story Metadata to UnpppsConfig
 *
 * This script reads story markdown files from /public/covers/stories/
 * and syncs their metadata (title, subtitle, description) into UnpppsConfig.json
 * based on the cover field mapping (e.g., cover-033 → story-033)
 *
 * Usage: node scripts/sync-story-metadata.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// File paths
const STORIES_DIR = path.join(__dirname, '../public/covers/stories');
const UNPPPS_CONFIG_PATH = path.join(__dirname, '../src/data/UnpppsConfig.json');

/**
 * Parse frontmatter from markdown content
 */
function parseFrontmatter(content) {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return null;
  }

  const [, frontmatterStr] = match;
  const metadata = {};

  frontmatterStr.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split(':');
    if (key && valueParts.length > 0) {
      const trimmedKey = key.trim();
      let value = valueParts.join(':').trim().replace(/^["']|["']$/g, '');
      const parsedValue = value === 'true' ? true : value === 'false' ? false : value;
      metadata[trimmedKey] = parsedValue;
    }
  });

  return metadata;
}

/**
 * Load all story metadata from markdown files
 */
function loadAllStoryMetadata() {
  const storyMap = new Map();

  if (!fs.existsSync(STORIES_DIR)) {
    console.error(`Stories directory not found: ${STORIES_DIR}`);
    return storyMap;
  }

  const files = fs.readdirSync(STORIES_DIR);

  files.forEach(file => {
    if (!file.match(/^story-\d+\.md$/)) {
      return;
    }

    const storyId = file.replace('.md', '');
    const coverId = storyId.replace('story-', 'cover-');
    const filePath = path.join(STORIES_DIR, file);

    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const metadata = parseFrontmatter(content);

      if (metadata) {
        storyMap.set(coverId, {
          storyTitle: metadata.title || null,
          storySubtitle: metadata.subtitle || null,
          storyDescription: metadata.description || null,
          storyAuthor: metadata.author || null,
          storyBuilder: metadata.builder || null,
          storyCategory: metadata.category || null,
          storyPublished: metadata.published || false,
          storySong: metadata.song || null,
          storySongArtist: metadata['song-artist'] || null
        });
       
      }
    } catch (error) {
      console.warn(`⚠ Failed to parse ${file}:`, error.message);
    }
  });

  return storyMap;
}

/**
 * Sync story metadata into UnpppsConfig
 */
function syncStoryMetadata() {
  console.log('🔄 Syncing story metadata to UnpppsConfig.json...\n');

  // Load story metadata
  const storyMap = loadAllStoryMetadata();
  console.log(`\n📚 Loaded ${storyMap.size} story metadata entries\n`);

  // Load UnpppsConfig
  if (!fs.existsSync(UNPPPS_CONFIG_PATH)) {
    console.error(`❌ UnpppsConfig.json not found: ${UNPPPS_CONFIG_PATH}`);
    process.exit(1);
  }

  const unpppConfig = JSON.parse(fs.readFileSync(UNPPPS_CONFIG_PATH, 'utf-8'));
  const before = JSON.stringify(unpppConfig.unppps);
  let updatedCount = 0;
  let skippedCount = 0;

  // Update each unppp with story metadata if available
  unpppConfig.unppps = unpppConfig.unppps.map(unppp => {
    const coverId = unppp.cover;
    const storyData = storyMap.get(coverId);

    if (storyData) {
      updatedCount++;
      
      return {
        ...unppp,
        ...storyData
      };
    } else {
      skippedCount++;
      // Remove story fields if no story exists
      const {
        storyTitle,
        storySubtitle,
        storyDescription,
        storyAuthor,
        storyBuilder,
        storyCategory,
        storyPublished,
        storySong,
        storySongArtist,
        ...rest
      } = unppp;
      return rest;
    }
  });

  // Nothing changed, nothing written: a build leaves the tracked file alone
  if (JSON.stringify(unpppConfig.unppps) === before) {
    console.log(`\n✅ Already in sync (${updatedCount} with a story, ${skippedCount} without)`);
    return;
  }

  // Increment version
  unpppConfig.version = (unpppConfig.version || 10) + 1;

  // Write updated config
  fs.writeFileSync(
    UNPPPS_CONFIG_PATH,
    JSON.stringify(unpppConfig, null, 2) + '\n',
    'utf-8'
  );

  console.log(`\n✅ Sync complete!`);
  console.log(`   Updated: ${updatedCount} unppps`);
  console.log(`   Skipped: ${skippedCount} unppps (no story)`);
  console.log(`   Version: ${unpppConfig.version}`);
}

// Run the sync
syncStoryMetadata();
