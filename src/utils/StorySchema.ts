/**
 * StorySchema - Utility for parsing and managing cover stories
 * Provides semantic matching between covers and stories (cover-001 ↔ story-001)
 */

export interface StoryMetadata {
  title: string;
  // The title in search results, when `title` matches another story's
  'seo-title'?: string;
  subtitle?: string;
  description?: string;
  author: string;
  authorImage?: string;
  builder?: string;
  builderImage?: string;
  date: string;
  category: string;
  cover?: string;  // Full-bleed hero cover override - bare coverId (e.g. 'cover-002') or absolute path, resolved via resolveCoverSrc(). Falls back to no full-bleed cover when unset.
  // A cover that is a color, like an article's coverColor: 'theme' (the
  // reader's theme color) or a hex, quoted to be safe for YAML tools
  // ("#F9C22E"). A `cover` image wins over it
  'cover-color'?: string;
  song?: string;
  'song-artist'?: string;
  appleMusicUrl?: string;  // The song, playable: an Apple Music song link (album ?i= or /song/). Same field articles use; the byline bar and StoryPreview play it
  'started-at'?: string;
  'updated-at'?: string;
  published: boolean;
}

export interface Story {
  id: string;
  metadata: StoryMetadata;
  content?: string;
}

class StorySchema {
  private static stories: Map<string, Story> = new Map();
  private static initialized = false;
  private static initializationPromise: Promise<void> | null = null;

  private static ensureInitialized(): Promise<void> {
    // In development the server re-reads the stories on every request, so a
    // saved story-*.md shows on the next reload instead of after a restart
    if (process.env.NODE_ENV === 'development' && typeof window === 'undefined' && this.initialized) {
      this.initialized = false;
      this.initializationPromise = null;
    }
    if (this.initialized) return Promise.resolve();
    if (!this.initializationPromise) {
      this.initializationPromise = this.initializeStories();
    }
    return this.initializationPromise;
  }

  /**
   * Get story by cover ID (semantic matching: cover-001 → story-001)
   */
  static async getStoryByCoverId(coverId: string): Promise<Story | null> {
    const storyId = coverId.replace('cover-', 'story-');
    return this.getStory(storyId);
  }

  /**
   * Get story by story ID
   */
  static async getStory(storyId: string): Promise<Story | null> {
    await this.ensureInitialized();
    return this.stories.get(storyId) || null;
  }

  /**
   * Get all available stories
   */
  static async getAllStories(): Promise<Story[]> {
    await this.ensureInitialized();
    return Array.from(this.stories.values());
  }

  /**
   * Check if a cover has an associated story
   */
  static async hasCoverStory(coverId: string): Promise<boolean> {
    const story = await this.getStoryByCoverId(coverId);
    return story !== null;
  }

  /**
   * Get story title by cover ID
   */
  static async getStoryTitle(coverId: string): Promise<string | null> {
    const story = await this.getStoryByCoverId(coverId);
    return story?.metadata.title || null;
  }

  /**
   * Get story author by cover ID
   */
  static async getStoryAuthor(coverId: string): Promise<string | null> {
    const story = await this.getStoryByCoverId(coverId);
    return story?.metadata.author || null;
  }

  /**
   * Get story description by cover ID
   */
  static async getStoryDescription(coverId: string): Promise<string | null> {
    const story = await this.getStoryByCoverId(coverId);
    return story?.metadata.description || null;
  }

  /**
   * Get story builder by cover ID
   */
  static async getStoryBuilder(coverId: string): Promise<string | null> {
    const story = await this.getStoryByCoverId(coverId);
    return story?.metadata.builder || null;
  }

  /**
   * Get story builder image by cover ID
   */
  static async getStoryBuilderImage(coverId: string): Promise<string | null> {
    const story = await this.getStoryByCoverId(coverId);
    return story?.metadata.builderImage || null;
  }

  /**
   * Initialize stories by loading metadata from markdown files
   */
  private static async initializeStories(): Promise<void> {
    // Filled here and swapped in at the end, so a re-read (development) never
    // shows another request a half-empty map
    const next = new Map<string, Story>();
    try {
      if (typeof window === 'undefined') {
        // Server-side: scan the file system directly, one read per file —
        // no network involved, so a fetch loop would only add overhead here.
        const fs = await import('fs');
        const path = await import('path');
        const storiesDir = path.join(process.cwd(), 'public', 'covers', 'stories');

        const files = fs.readdirSync(storiesDir);
        const storyIds = files
          .filter(file => file.match(/^story-\d+\.md$/))
          .map(file => file.replace('.md', ''));

        const storyPromises = storyIds.map(async (storyId) => {
          try {
            const rawContent = await this.loadStoryContent(storyId);
            if (rawContent) {
              const { metadata, content } = this.parseFrontmatter(rawContent);
              return { id: storyId, metadata, content };
            }
          } catch {
            // Silently skip stories that don't exist (not all covers have stories)
            return null;
          }
          return null;
        });

        const stories = await Promise.all(storyPromises);
        stories.forEach(story => {
          if (story) next.set(story.id, story);
        });
      } else {
        // Client-side: one batched request instead of one fetch per story
        // (this used to fire ~50+ individual GETs on first touch).
        const response = await fetch('/api/stories/all');
        if (response.ok) {
          const stories = (await response.json()) as Story[];
          stories.forEach(story => next.set(story.id, story));
        }
      }
    } catch (error) {
      console.error('Failed to initialize stories:', error);
      // Fallback to empty stories map
    }

    this.stories = next;
    this.initialized = true;
  }

  /**
   * Load story content from markdown file
   */
  static async loadStoryContent(storyId: string): Promise<string | null> {
    try {
      // Check if we're in a server environment
      if (typeof window === 'undefined') {
        // Server-side: use file system
        const fs = await import('fs');
        const path = await import('path');
        const filePath = path.join(process.cwd(), 'public', 'covers', 'stories', `${storyId}.md`);
        
        try {
          const content = fs.readFileSync(filePath, 'utf-8');
          return content;
        } catch {
          console.warn(`Story file not found: ${storyId}.md`);
          return null;
        }
      } else {
        // Client-side: use API route to fetch story content
        const response = await fetch(`/api/stories/${storyId}`);
        if (!response.ok) {
          console.warn(`Story file not found: ${storyId}.md`);
          return null;
        }
        const content = await response.text();
        return content;
      }
    } catch (error) {
      console.error(`Failed to load story content for ${storyId}:`, error);
      return null;
    }
  }

  /**
   * Parse frontmatter from markdown content
   */
  private static parseFrontmatter(content: string): { metadata: StoryMetadata; content: string } {
    const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
    // Stories written on Windows are often saved with CRLF line endings,
    // which the \n-anchored regex would reject (the story then 404s)
    const match = content.replace(/\r\n/g, '\n').match(frontmatterRegex);
    
    if (!match) {
      throw new Error('Invalid markdown format: missing frontmatter');
    }

    const [, frontmatterStr, markdownContent] = match;
    
    // Parse YAML frontmatter (simple key-value parsing)
    const metadata: Partial<StoryMetadata> = {};
    frontmatterStr.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split(':');
      if (key && valueParts.length > 0) {
        const trimmedKey = key.trim();
        let value = valueParts.join(':').trim().replace(/^["']|["']$/g, '');
        const parsedValue = value === 'true' ? true : value === 'false' ? false : value;
        
        // Ensure authorImage and builderImage have absolute paths
        if ((trimmedKey === 'authorImage' || trimmedKey === 'builderImage') && typeof parsedValue === 'string' && parsedValue && !parsedValue.startsWith('/') && !parsedValue.startsWith('http')) {
          value = '/' + parsedValue;
          (metadata as Record<string, unknown>)[trimmedKey] = value;
        } else {
          (metadata as Record<string, unknown>)[trimmedKey] = parsedValue;
        }
      }
    });

    return {
      metadata: metadata as StoryMetadata,
      content: markdownContent.trim()
    };
  }
}

export default StorySchema;