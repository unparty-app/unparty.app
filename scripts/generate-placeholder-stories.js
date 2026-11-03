#!/usr/bin/env node

/**
 * Generate placeholder story markdown files for all covers
 * This prevents 404 errors when covers try to load story data
 */

import fs from 'fs';
import path from 'path';


const STORIES_DIR = path.join(process.cwd(), 'public', 'covers', 'stories');

// Ensure directory exists
if (!fs.existsSync(STORIES_DIR)) {
  fs.mkdirSync(STORIES_DIR, { recursive: true });
}

// Get all cover files
const COVERS_DIR = path.join(process.cwd(), 'public', 'covers');
const coverFiles = fs.readdirSync(COVERS_DIR)
  .filter(file => /^cover-\d+\.(png|jpg|JPG|svg)$/i.test(file))
  .map(file => file.replace(/\.(png|jpg|JPG|svg)$/i, ''));

// Get existing stories
const existingStories = fs.readdirSync(STORIES_DIR)
  .filter(file => file.endsWith('.md'))
  .map(file => file.replace('.md', ''));

console.log(`Found ${coverFiles.length} covers`);
console.log(`Found ${existingStories.length} existing stories`);

// Generate story template
function generateStoryTemplate(coverId) {
  const number = coverId.replace('cover-', '');
  const currentDate = new Date().toISOString().split('T')[0];
  
  return `---
title: "Story ${number}"
subtitle: "This story is coming soon"
description: "A story inspired by cover ${number}"
author: "unparty"
date: "${currentDate}"
category: "STORIES"
published: false
---

# Coming Soon

This story is currently being written.

Check back soon for updates!
`;
}

// Create missing stories
let created = 0;
coverFiles.forEach(coverId => {
  const storyId = coverId.replace('cover-', 'story-');
  const storyPath = path.join(STORIES_DIR, `${storyId}.md`);
  
  if (!existingStories.includes(storyId)) {
    fs.writeFileSync(storyPath, generateStoryTemplate(coverId), 'utf-8');
   
    created++;
  }
});

console.log(`\n✅ Created ${created} placeholder stories`);
console.log(`📝 Total stories: ${existingStories.length + created}`);
