
"use client";

import { useEffect, useState } from 'react';
import StorySchema, { Story } from '../../utils/StorySchema';
import { resolveCoverSrc } from '../utils/coverPath';
import RowTable from './RowTable';

// 'Oct 31, 2026' for a date; '' when undated
const shortDate = (date?: string) =>
  date ? new Date(`${date.slice(0, 10)}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

/**
 * StoryTable - every published story, newest first, as the house table
 * (RowTable, #572): its cover, title and subtitle, and its date, category and
 * author as columns that sort (narrow, the labels pick which one shows). Each
 * row opens its story.
 */
const StoryTable = () => {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStories = async () => {
      try {
        const allStories = await StorySchema.getAllStories();
        // Sort by story ID and only show published stories that can be navigated to
        const sorted = allStories
          .filter(story => story.metadata.published)
          .sort((a, b) => a.id.localeCompare(b.id));
        setStories(sorted);
      } catch (error) {
        console.error('Failed to load stories:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStories();
  }, []);

  if (loading) {
    return (
      <div className="w-full py-8 text-left">
        <span className="font-google-sans-code text-sm" style={{ color: 'var(--text-muted)' }}>
          thinking...
        </span>
      </div>
    );
  }

  return (
    <RowTable
      rows={stories}
      rowKey={(s) => s.id}
      label="story"
      name={(s) => s.metadata.title}
      nameSort={(s) => s.metadata.title.toLowerCase()}
      meta={(s) => s.metadata.subtitle || s.metadata.author}
      circle={(s) => ({ src: resolveCoverSrc(s.metadata.cover || s.id.replace('story-', 'cover-')) })}
      columns={[
        { id: 'date', label: 'date', value: (s) => shortDate(s.metadata.date), sort: (s) => s.metadata.date || undefined },
        { id: 'category', label: 'category', value: (s) => s.metadata.category, sort: (s) => s.metadata.category.toLowerCase(), dir: 'asc' },
        { id: 'by', label: 'by', value: (s) => s.metadata.author, sort: (s) => s.metadata.author.toLowerCase(), dir: 'asc' },
      ]}
      sort={{ by: 'date', dir: 'desc' }}
      href={(s) => `/story/${s.id.replace('story-', 'cover-')}`}
      search={(s, q) => s.metadata.title.toLowerCase().includes(q) || (s.metadata.subtitle ?? '').toLowerCase().includes(q)}
      searchLabel="search stories"
      empty="no stories match."
    />
  );
};

export default StoryTable;
