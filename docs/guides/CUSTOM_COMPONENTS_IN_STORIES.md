# Custom Components in Stories - Usage Guide

## Overview

You can now embed custom React components and interactive badges directly in your story markdown files! This extends the ScrollRow system to support any custom component.

## Quick Start - Badges

### Simple Badge

Add a clickable badge to your story:

```markdown
:::badge[text=Visit Dashboard,variant=primary,size=lg,link=/theunpartydashboard]:::
```

**Parameters:**
- `text` - Badge text content (required)
- `variant` - Style: `primary`, `secondary`, or `header` (default: `primary`)
- `size` - Size: `sm`, `md`, or `lg` (default: `md`)
- `link` - Optional URL to link to (if omitted, badge is non-clickable)

**Examples:**

```markdown
# Clickable Badge
:::badge[text=Get Started,variant=primary,size=lg,link=/signup]:::

# Non-Clickable Badge (Info Display)
:::badge[text=Coming Soon,variant=secondary,size=md]:::

# Header Style Badge
:::badge[text=Beta Feature,variant=header,size=sm,link=/beta]:::
```

## Quick Start - Components

### 1. Add Component to Story

In your story markdown (e.g., `story-039.md`):

```markdown
---
title: "STORY. make connection"
subtitle: "SHARE. your runway when requesting a connection."
author: "jmm"
authorImage: "founder.png"
date: "2026-02-24"
category: "STORIES"
published: true
---

# request to CONNECT. 

## Play the Color Game

Test your memory with colors!

:::component[name=ColorMatchingGame]:::

More story content here...
```

### 2. Register Your Component

Open `src/app/components/editorial/EditorialSection.tsx` and add your component to the registry (around line 590):

```typescript
const componentRegistry: Record<string, React.ComponentType<unknown>> = {
  ColorMatchingGame: React.lazy(() => import('../ColorMatchingGame')),
  // Add your components here:
  // MyCalculator: React.lazy(() => import('../MyCalculator')),
  // InteractiveChart: React.lazy(() => import('../InteractiveChart')),
};
```

That's it! Your component will now render in the story.

## Syntax

```markdown
:::component[name=ComponentName,prop1=value1,prop2=value2]:::
```

### Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `name` | string | ✅ Yes | Component name (must match registry) | `name=ColorMatchingGame` |
| `prop1,prop2,...` | any | No | Props to pass to component | `maxScore=10` |

## Examples

### 1. Simple Component (No Props)

```markdown
:::component[name=ColorMatchingGame]:::
```

### 2. Component with Props

```markdown
:::component[name=FilmCalculator,budget=50000,crewSize=5]:::
```

### 3. Component with Complex Props

For boolean, number, or JSON values:

```markdown
:::component[name=MyComponent,enabled=true,count=42,config={"theme":"dark"}]:::
```

## Complete Story Example

```markdown
---
title: "Interactive Learning"
subtitle: "Learn by doing"
author: "jmm"
authorImage: "founder.png"
date: "2026-02-26"
category: "STORIES"
published: true
---

# Learn Colors Through Play

Color theory can be boring. Let's make it fun!

## The Challenge

Can you remember a sequence of colors? It gets harder as you progress.

:::component[name=ColorMatchingGame]:::

## What You Learned

- Color recognition improves with practice
- Memory games strengthen cognitive function
- Fun beats boring every time

More content here...
```

## Available Components

### Database Calculator

Interactive cost calculator for Neon PostgreSQL (via Vercel) plan comparison. Adjust storage, compute size, and active hours per month to see a real-time breakdown across Free, Launch, and Scale plans. Designed to grow — future providers (Supabase, Railway) can be added to the component.

**Syntax:**
```markdown
:::component[name=DatabaseCalculator]:::
```

**Parameters:** None required — all inputs are interactive sliders within the component.

**Examples:**
```markdown
# Standalone calculator (typical use)
:::component[name=DatabaseCalculator]:::
```

**What you can adjust:**
- **Usage Scenario** — quick presets: Dev/Personal, Small App, Production
- **Storage (GB)** — 0 to 200 GB slider
- **Compute Size (CU)** — discrete preset sizes: 0.25, 0.5, 1, 2, 4, 8, 16, 32, 56 CU
- **Active Hours/Month** — 0 to 744 hours (full month = 24/7)

**What it shows:**
- CU-hours computed from size × active hours
- Side-by-side cost breakdown (Free / Launch / Scale)
- Per-plan: base fee, storage cost, compute overage
- Annual cost comparison
- Best-fit recommendation
- Neon via Vercel rate reference card

**Location:** `src/app/components/DatabaseCalculator.tsx`

---

### Books

Display dynamic book quotes from the database with author, title, page, and publisher details.

**Syntax:**
```markdown
:::book[id=bookId,showBookDetails=true]:::
```

**Parameters:**
- `id` - Book ID from database (required) - Find IDs in [/admin/books](../src/app/admin/books/books.md)
- `showBookDetails` - Show book metadata (title, page, publisher) (optional, default: `true`)

**Examples:**
```markdown
# Full Book Quote Display (with metadata)
:::book[id=cmkmyw2wz000bvx6tzfz6ojvs]:::
# Displays: Quote + "— Michael Bungay Stanier, THE COACHING HABIT (pg. 141)"

# Quote Only (minimal)
:::book[id=cmkmyw2wz000bvx6tzfz6ojvs,showBookDetails=false]:::
# Displays: Quote + "— Michael Bungay Stanier"
```

**Finding Book IDs:**

1. View available books: [src/app/admin/books/books.md](../src/app/admin/books/books.md)
2. Or visit: `/admin/books` (in development)
3. Copy the book ID (e.g., `cmkmyw2wz000bvx6tzfz6ojvs`)

**Benefits:**
- Quote data stays synced with database
- Update once, reflects everywhere
- Automatic formatting and styling
- Publisher links included

---

### Badges

Use badges for call-to-action links, status indicators, or navigation elements.

**Syntax:**
```markdown
:::badge[text=Text,variant=primary|secondary|header,size=sm|md|lg,link=/optional-path]:::
```

**Examples:**
```markdown
# Call to Action
:::badge[text=Start Building,variant=primary,size=lg,link=/build]:::

# Status Indicator
:::badge[text=Beta,variant=secondary,size=sm]:::
```

---

### YouTube Video Embeds

Embed YouTube videos directly in your stories with privacy-enhanced embedding, theme-aware styling, and responsive aspect ratios.

**Syntax:**
```markdown
:::component[name=YouTubeEmbed,videoId=VIDEO_ID]:::
```

**Parameters:**
- `videoId` - YouTube video ID or full URL (required)
- `title` - Optional caption text displayed below the video (optional)
- `aspectRatio` - Video aspect ratio: `16:9`, `4:3`, `1:1`, or `9:16` (optional, default: `16:9`)

**Examples:**
```markdown
# Video ID Only
:::component[name=YouTubeEmbed,videoId=nMN22KblIbc]:::

# With Custom Title
:::component[name=YouTubeEmbed,videoId=nMN22KblIbc,title=SYNESTHESIA - Seeing COLOR]:::

# Different Aspect Ratio
:::component[name=YouTubeEmbed,videoId=nMN22KblIbc,aspectRatio=4:3]:::

# Full YouTube URL (automatically extracts ID)
:::component[name=YouTubeEmbed,videoId=https://www.youtube.com/watch?v=nMN22KblIbc]:::
```

**Supported URL Formats:**
- Standard: `https://www.youtube.com/watch?v=VIDEO_ID`
- Short: `https://youtu.be/VIDEO_ID`
- Embed: `https://www.youtube.com/embed/VIDEO_ID`
- Plain ID: `VIDEO_ID`

**Features:**
- 🔒 **Privacy-Enhanced** - Uses `youtube-nocookie.com` domain (no tracking cookies until video plays)
- 🎨 **Theme Integration** - Border accent matches current theme color
- 📱 **Mobile-First** - Fully responsive with proper aspect ratios
- ⚡ **Lazy Loading** - Videos load only when needed
- 🌙 **Dark Mode** - Automatic dark mode support
- 🎯 **Accessibility** - Proper iframe titles and keyboard navigation

**Benefits:**
- No tracking cookies until user interacts with video
- Automatic theme color integration
- Works seamlessly on all devices
- Consistent styling with other story components
- Clean, minimalist design

---

### TikTok Video Embeds

Embed TikTok videos directly in your stories with theme-aware styling, responsive aspect ratios, and support for multiple URL formats.

**Syntax:**
```markdown
:::component[name=TikTokEmbed,videoUrl=VIDEO_URL]:::
```

**Parameters:**
- `videoUrl` - TikTok video URL or direct format (required)
- `title` - Optional caption text displayed below the video (optional)
- `aspectRatio` - Video aspect ratio: `9:16`, `1:1`, or `16:9` (optional, default: `9:16`)

**Examples:**
```markdown
# Standard TikTok URL
:::component[name=TikTokEmbed,videoUrl=https://www.tiktok.com/@username/video/1234567890]:::

# With Custom Title
:::component[name=TikTokEmbed,videoUrl=https://www.tiktok.com/@cristienorman_somm/video/7626250481697950990,title=Cost of Goods Formula]:::

# Short URL Format
:::component[name=TikTokEmbed,videoUrl=https://vm.tiktok.com/ZMhKqP9Tr]:::

# Different Aspect Ratio
:::component[name=TikTokEmbed,videoUrl=https://www.tiktok.com/@username/video/1234567890,aspectRatio=1:1]:::

# Direct Format
:::component[name=TikTokEmbed,videoUrl=@username/video/1234567890]:::
```

**Supported URL Formats:**
- Standard: `https://www.tiktok.com/@username/video/VIDEO_ID`
- Short: `https://vm.tiktok.com/SHORT_CODE`
- Alt Short: `https://www.tiktok.com/t/SHORT_CODE`
- Direct: `@username/video/VIDEO_ID`

**Features:**
- 🎬 **Official Embed** - Uses TikTok's official embed script
- 🎨 **Theme Integration** - Border accent matches current theme color
- 📱 **Mobile-First** - Fully responsive with proper aspect ratios (default 9:16 for vertical)
- ⚡ **Lazy Loading** - Videos load only when needed
- 🌙 **Dark Mode** - Automatic dark mode support
- 🎯 **Accessibility** - Proper fallback links and keyboard navigation
- 🔗 **Flexible URLs** - Supports all TikTok URL formats

**Benefits:**
- Uses TikTok's official embed for best compatibility
- Automatic theme color integration
- Works seamlessly on all devices
- Consistent styling with other story components
- Clean, minimalist design
- Native vertical video format (9:16)

---

### Instagram Embeds

Embed Instagram posts, Reels, and IGTV videos directly in your stories using Instagram's official embed script.

**Syntax:**
```markdown
:::component[name=InstagramEmbed,postUrl=INSTAGRAM_URL]:::
```

**Parameters:**
- `postUrl` - Full Instagram URL (required)
- `title` - Optional caption text below the embed (optional)
- `aspectRatio` - `1:1`, `4:5`, or `9:16` (optional, default: `1:1`)

**Examples:**
```markdown
# Standard post (square)
:::component[name=InstagramEmbed,postUrl=https://www.instagram.com/p/POST_ID/]:::

# With caption
:::component[name=InstagramEmbed,postUrl=https://www.instagram.com/p/POST_ID/,title=ig. josephinej.smith]:::

# Reel (vertical)
:::component[name=InstagramEmbed,postUrl=https://www.instagram.com/reel/REEL_ID/,aspectRatio=9:16]:::

# Portrait post
:::component[name=InstagramEmbed,postUrl=https://www.instagram.com/p/POST_ID/,aspectRatio=4:5]:::
```

**Supported URL Formats:**
- Post: `https://www.instagram.com/p/POST_ID/`
- Reel: `https://www.instagram.com/reel/REEL_ID/`
- IGTV: `https://www.instagram.com/tv/TV_ID/`

**Features:**
- 🎨 **Theme Integration** - Border accent matches current theme color
- ⚡ **Lazy Loading** - Script loads only when component mounts
- 🌙 **Dark Mode** - Automatic dark mode support
- 📱 **Responsive** - Adapts to container width

**Location:** `src/app/components/InstagramEmbed.tsx`

---

### Math Formula Display

Display business formulas and calculations in an approachable, readable format. Designed to make math expressions less intimidating for non-technical founders, entrepreneurs, and small business owners.

**Syntax:**
```markdown
:::formula[steps=STEP1|+ STEP2|- STEP3|/ STEP4,result=RESULT NAME]:::
```

**Parameters:**
- `steps` - Pipe-separated formula steps (required). Each step can start with an operator (+, -, *, /) for visual clarity.
- `result` - The result label showing what the formula calculates (optional)
- `title` - Optional title displayed above the formula (optional)
- `align` - Alignment: `left`, `center`, or `right` (optional, default: `left`)

**Examples:**
```markdown
# Cost of Goods Formula
:::formula[steps=STARTING INVENTORY|+ PURCHASES|- ENDING INVENTORY|/ BY SALES,result=COGS (Cost of Goods)]:::

# Simple Addition
:::formula[steps=REVENUE|- EXPENSES,result=PROFIT]:::

# With Title
:::formula[steps=TIME TO SOLVE|+ EFFORT TO LEARN|+ COST TO BUILD,result=TOTAL DEBT,title=DEBT Calculator]:::

# Centered Alignment
:::formula[steps=HOURS|* RATE,result=EARNINGS,align=center]:::
```

**Operator Support:**
| Operator | Meaning |
|----------|---------|
| `+` | Addition |
| `-` | Subtraction |
| `*` | Multiplication |
| `/` | Division |
| `=` | Equals (auto-added for result) |

**Features:**
- 🎨 **Theme Integration** - Accent colors from themeContext
- 📝 **Typography** - font-rounded (Nunito) for labels, font-vt323 for operators
- 🌙 **Dark Mode** - Full dark mode support
- ♿ **Accessible** - Proper ARIA labels and semantic HTML
- 📱 **Responsive** - Adapts to all screen sizes
- 🎯 **Minimalist** - Clean, sleek design following unparty-app standards

**Benefits:**
- Makes business math approachable
- Consistent styling across all stories
- Non-intimidating visual presentation
- Perfect for financial formulas, KPIs, and calculations

---

### Founder Questions

Embed interactive questions from the founders_questions system directly into stories. Questions are visible to all users, but answering requires authentication. Supports all question types: text, multipleChoice, ranking, and scale.

**Persistence:** Answers are currently saved to browser localStorage, making responses persist across sessions on the same device. Future enhancement will sync to database for cross-device access.

**Syntax:**
```markdown
:::question[questionId=question_id,categoryId=category]:::
```

**Parameters:**
- `questionId` - Question ID from founders_questions.json (required)
- `categoryId` - Question category: `core`, `budget`, `brand`, `product`, `risk`, `grow` (required)

**Examples:**
```markdown
# Scale Question (0-100 slider)
:::question[questionId=brand_q3,categoryId=brand]:::

# Text Question (open-ended)
:::question[questionId=brand_text,categoryId=brand]:::

# Multiple Choice Question  
:::question[questionId=core_q2,categoryId=core]:::

# Ranking Question (drag-to-rank)
:::question[questionId=core_q3,categoryId=core]:::
```

**Features:**
- 🔓 **Public Questions** - All users see the question text
- 🔐 **Authenticated Answers** - Login required to submit responses
- 💾 **LocalStorage Persistence** - Answers saved in browser, survive page reloads
- ✅ **Submitted State** - Shows "already answered" after submission
- ✏️ **Edit Capability** - Users can update their answers anytime
- 🎨 **Theme Integration** - Dynamic colors and dark mode support

**Finding Question IDs:**
1. View questions file: [src/app/founders/foundersquestions.json](../src/app/founders/foundersquestions.json)
2. Each question has a unique `id` field (e.g., `brand_q3`)
3. Note which category the question belongs to

**Storage Details:**
- Storage Key Format: `founders_question_${questionId}`
- Data Stored: `{ questionId, categoryId, responseData, completedAt }`
- Authentication: Must be signed in to save/view answers
- Future: Will sync to database for cross-device access and admin visibility

**Benefits:**
- Makes stories interactive and engaging
- Zero backend setup required - works immediately
- Fast response time (no API calls)
- Consistent UI/UX with BusinessWorksheet
- Supports all question types automatically

---

### Problem Worksheet

Embed the "what are you solving?" problem worksheet form directly in a story. Lets a signed-in reader submit or update their idea (email, name, idea name, deadline, problem statement, role) without leaving the story. Requires sign-in — shows a "Please sign in" prompt otherwise.

**Syntax:**
```markdown
:::component[name=ProblemWorksheet]:::
```

**Parameters:** None — the component is self-contained (fetches/saves the signed-in user's own entry via `/api/problem/send`).

**Examples:**
```markdown
# Standalone embed
:::component[name=ProblemWorksheet]:::
```

**Location:** `src/app/components/ProblemWorksheet.tsx`

---

### Strike

Display strikethrough text with vt323 font and customizable visual effects. Perfect for showing corrections, crossed-out ideas, or deprecated content with style.

**Syntax:**
```markdown
:::component[name=Strike,text=YOUR TEXT,font=vt323,variant=standard,color=theme]:::
```

**Parameters:**
- `text` - The text to strike through (required)
- `font` - Font family: `vt323`, `mono`, or `default` (optional, default: `vt323`)
- `variant` - Visual style: `standard`, `bold`, `double`, `animated`, or `glitch` (optional, default: `standard`)
- `color` - Strike color: hex value or `theme` to use current theme color (optional, default: `theme`)
- `animate` - Enable animation effect (optional, default: `false`)
- `thickness` - Line thickness in pixels (optional, default: `2`)

**Examples:**
```markdown
# Simple strikethrough with vt323 (default)
:::component[name=Strike,text=excitement never converted to support]:::

# Animated strikethrough
:::component[name=Strike,text=old way of thinking,variant=animated]:::

# Bold strikethrough with custom color
:::component[name=Strike,text=gave up,variant=bold,color=#FF0000]:::

# Double line strikethrough
:::component[name=Strike,text=impossible,variant=double,font=vt323]:::

# Glitch effect (retro aesthetic)
:::component[name=Strike,text=limitations,variant=glitch,color=theme]:::

# Custom thickness
:::component[name=Strike,text=barriers,thickness=4,font=vt323]:::
```

**Variant Details:**
| Variant | Description |
|---------|-------------|
| `standard` | Single clean line through text |
| `bold` | Thicker strikethrough line (2x thickness) |
| `double` | Double-line strikethrough effect |
| `animated` | Line draws from left to right on load |
| `glitch` | Subtle glitch animation (3s loop) |

**Features:**
- 🎨 **Theme Integration** - Uses ThemeContext color when `color=theme`
- 🔤 **VT323 Font** - Default retro monospace font
- ✨ **Animations** - Smooth draw and glitch effects
- 🌙 **Dark Mode** - Automatic dark mode support
- ♿ **Accessible** - Proper semantic HTML
- 📱 **Responsive** - Works on all screen sizes

**Benefits:**
- Express corrections or revisions visually
- Add personality to your writing
- Show the evolution of ideas
- Retro terminal aesthetic with vt323 font
- Consistent styling with theme colors

---

### Five Things Challenge

Interactive fill-in challenge where users build a personal list of 5 items (quotes, lyrics, passages, Bible verses, anything that lifts them up). Users fill all 5 inputs, click "UNPARTY", and the inputs transform into their displayed list. Persists to localStorage.

**Syntax:**
```markdown
:::component[name=FiveThingsChallenge,prompt=YOUR CHALLENGE PROMPT HERE.]:::
```

**Parameters:**
- `prompt` - The challenge heading text (optional, has default)

**Examples:**
```markdown
# With custom prompt
:::component[name=FiveThingsChallenge,prompt=CREATE YOUR OWN LIST OF 5 THINGS TO REMEMBER WHEN THE HATERS TRY TO BLOCK YOUR SHINE.]:::

# Default prompt
:::component[name=FiveThingsChallenge]:::
```

**Features:**
- 5 text inputs, each accepting a quote, lyric, passage, or any personal reminder
- UNPARTY button activates only when all 5 are filled
- On submit: inputs transform into a styled numbered list
- localStorage persistence — list survives page refreshes
- EDIT button to clear and start over
- Theme color integration + dark mode

**Location:** `src/app/components/FiveThingsChallenge.tsx`

---

### Components

Generic custom React components with props support.

**Syntax:**
```markdown
:::component[name=ComponentName,prop1=value1,prop2=value2]:::
```

**Examples:**
```markdown
# Color Matching Game
:::component[name=ColorMatchingGame]:::

# Resilience Builder Activity
:::component[name=ResilienceBuildActivity]:::

# Custom Component with Props
:::component[name=FilmCalculator,budget=50000,crewSize=5]:::
```

---

### Status Indicator
:::badge[text=New Feature,variant=header,size=sm]:::

# Navigation Link
:::badge[text=View All Stories,variant=secondary,size=md,link=/covers]:::
```

**Style Guide:**
- `variant=primary` - Yellow brand color (#F9C22E), bold uppercase, hover effects
- `variant=secondary` - Gray border, subdued appearance
- `variant=header` - Muted text, monospace font, minimal styling
- All badges support dark mode automatically

### ColorMatchingGame
- **Description**: Memory game testing color sequence recall
- **Props**: None required (uses user's selected colors if available)
- **Location**: `src/app/components/ColorMatchingGame.tsx`

```markdown
:::component[name=ColorMatchingGame]:::
```

---

### StoryPreview

Embed specific sections from any story into your editorial articles. Perfect for showcasing related content, previewing featured stories, or creating curated reading experiences.

**Syntax:**
```markdown
:::component[name=StoryPreview,coverId=cover-001,sectionIds=hero|about-me|why,showMetadata=true]:::
```

**Parameters:**
- `coverId` - Story cover ID (required, e.g., `cover-001`)
- `sectionIds` - Pipe-separated list of section IDs to display (optional, e.g., `hero|about-me|why`)
- `sectionRange` - Section index range as `start-end` (optional, e.g., `0-3` shows first 3 sections)
- `maxSections` - Maximum number of sections to show (optional, e.g., `5`)
- `showMetadata` - Display story title, author, category header (optional, default: `true`)

**Examples:**
```markdown
# Show Specific Sections
:::component[name=StoryPreview,coverId=cover-001,sectionIds=hero|about-me|why,showMetadata=true]:::

# Show First 3 Sections
:::component[name=StoryPreview,coverId=cover-002,sectionRange=0-3,showMetadata=true]:::

# Limit to 5 Sections (No Metadata Header)
:::component[name=StoryPreview,coverId=cover-003,maxSections=5,showMetadata=false]:::

# Show Full Story Preview (First 10 Sections)
:::component[name=StoryPreview,coverId=cover-004,maxSections=10]:::
```

**Features:**
- 🎯 **Section Filtering** - Choose exact sections by ID or range
- 🎨 **Theme Integration** - Border accent matches current theme color
- 📝 **Story Metadata** - Optional header with title, author, category
- 🔗 **Full Story Link** - "Read Full Story →" button at bottom
- ⚡ **Lazy Loading** - Sections load on demand
- 🌙 **Dark Mode** - Full dark mode support
- 🛡️ **Error Handling** - Graceful fallbacks for missing stories/sections
- 🧩 **Editorial Sections** - Renders using full EditorialSection component

**Section ID Discovery:**

In development mode, section IDs are visible as small numbered indicators on the left side of each section. To find section IDs:

1. Navigate to the story page (e.g., `/story/cover-001`)
2. Open browser DevTools and inspect the section elements
3. Look for `data-section-id` attributes
4. Common section IDs: `hero`, `about-me`, `why`, `intro`, `challenge`, etc.

**Use Cases:**
- Preview featured stories within articles
- Create curated collections of story excerpts
- Highlight specific story sections (e.g., challenges, quotes)
- Build "related stories" sections with inline previews
- Showcase founder stories in about pages

**Technical Notes:**
- Uses `StorySchema.getStoryByCoverId()` to fetch story data
- Parses markdown with `parseMarkdownToSections()` utility
- Renders sections using `EditorialSection` component
- Supports all 26 editorial section types
- Respects story `published` status (unpublished stories show error)

**Location:** `src/app/components/StoryPreview.tsx`

## Adding Your Own Component

### Step 1: Create Component

Create your component in `src/app/components/`:

```typescript
// src/app/components/MyAwesomeWidget.tsx
'use client';
import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface MyAwesomeWidgetProps {
  title?: string;
  maxValue?: number;
}

const MyAwesomeWidget: React.FC<MyAwesomeWidgetProps> = ({ 
  title = 'Default Title',
  maxValue = 100 
}) => {
  const { colorValue } = useTheme();
  
  return (
    <div className="p-4 rounded-lg border" style={{ borderColor: colorValue }}>
      <h3 style={{ color: colorValue }}>{title}</h3>
      <p>Max Value: {maxValue}</p>
      {/* Your component logic here */}
    </div>
  );
};

export default MyAwesomeWidget;
```

### Step 2: Register Component

Add to `EditorialSection.tsx`:

```typescript
const componentRegistry: Record<string, React.ComponentType<unknown>> = {
  ColorMatchingGame: React.lazy(() => import('../ColorMatchingGame')),
  MyAwesomeWidget: React.lazy(() => import('../MyAwesomeWidget')),
};
```

### Step 3: Use in Story

```markdown
:::component[name=MyAwesomeWidget,title=Hello World,maxValue=500]:::
```

## Component Best Practices

### 1. Use 'use client' Directive

All components must be client components:

```typescript
'use client';
import React from 'react';
```

### 2. Leverage Theme Context

Access the current color theme:

```typescript
import { useTheme } from '../contexts/ThemeContext';

const MyComponent = () => {
  const { colorValue } = useTheme();
  
  return <div style={{ color: colorValue }}>Themed!</div>;
};
```

### 3. Make Components Responsive

```typescript
<div className="w-full max-w-md mx-auto">
  {/* Mobile-friendly content */}
</div>
```

### 4. Handle Loading States

Components are lazy-loaded, so users see a loading message automatically.

### 5. Provide Fallbacks

Handle errors gracefully:

```typescript
const MyComponent = () => {
  const [error, setError] = React.useState(false);
  
  if (error) {
    return <div>Something went wrong. Please refresh.</div>;
  }
  
  return <div>Your component</div>;
};
```

## Prop Types

Props are parsed from the markdown directive:

| TyBadge Not Rendering?

**Check syntax:**
- Must start with `:::badge[` and end with `]:::`
- Parameters are comma-separated: `text=Text,variant=primary,size=md,link=/path`
- Text parameter is required
- No spaces around commas or equals signs

**Badge not clickable?**
- Verify `link` parameter is included: `link=/path`
- Check that path starts with `/` for internal routes
- External links not supported (use internal routes only)

**Badge styling issues?**
- Variant must be exactly: `primary`, `secondary`, or `header`
- Size must be exactly: `sm`, `md`, or `lg`
- Check browser console for warnings

### pe | Example | Parsed As |
|------|---------|-----------|
| String | `title=Hello` | `"Hello"` |
| Number | `count=42` | `42` |
| Boolean | `enabled=true` | `true` |
| JSON | `config={"key":"value"}` | `{key: "value"}` |
| Array | `items=[1,2,3]` | `[1,2,3]` |

### Complex Props Example

```markdown
:::component[name=DataViz,data=[10,20,30],config={"theme":"dark","animated":true}]:::
```

Results in:

```typescript
{
  data: [10, 20, 30],
  config: { theme: "dark", animated: true }
}
```

## Troubleshooting

### Component Not Rendering?

**Check syntax:**
- Must start with `:::component[` and end with `]:::`
- Component name is case-sensitive
- Parameters are comma-separated

**Check registration:**
```typescript
// Verify component is in registry
const componentRegistry = {
  YourComponent: React.lazy(() => import('../YourComponent')),
};
```

**Check console:**
- Look for `Component "X" not found in registry` warning
- Check browser console for import errors

### Props Not Working?

**String props don't need quotes:**
```markdown
✅ :::component[name=MyComponent,title=Hello]:::
❌ :::component[name=MyComponent,title="Hello"]:::
```

**Numbers and booleans:**
```markdown
✅ :::component[name=MyComponent,count=42,enabled=true]:::
❌ :::component[name=MyComponent,count="42",enabled="true"]:::
```

**Complex types need JSON:**
```markdown
✅ :::component[name=MyComponent,items=[1,2,3]]:::
❌ :::component[name=MyComponent,items=1,2,3]:::
```

### Component Shows Loading Forever?

Check that:
1. Component file exists at the import path
2. Component has a default export
3. Component uses `'use client'` directive
4. No syntax errors in component code

### Theme Colors Not Applying?

Make sure component imports and uses `useTheme`:

```typescript
import { useTheme } from '../contexts/ThemeContext';

const MyComponent = () => {
  const { colorValue } = useTheme();
  return <div style={{ color: colorValue }}>Themed!</div>;
};
```

## Advanced: Context-Aware Components

Components can access all app contexts:

```typescript
'use client';
import { useTheme } from '../contexts/ThemeContext';
import { useColorSelection } from '../contexts/ColorSelectionContext';
import { useCover } from '../contexts/CoverContext';

const AdvancedComponent = () => {
  const { colorValue } = useTheme();
  const { allColors } = useColorSelection();
  const { coverData } = useCover();
  
  // Component has access to current theme, user colors, and cover context
  return <div>Context-aware content</div>;
};
```

## Performance Considerations

### Lazy Loading

Components are lazy-loaded by default:

```typescript
React.lazy(() => import('../MyComponent'))
```

This means:
- Components load only when needed
- Bundle size stays small
- Loading states are handled automatically

### Heavy Components

For compute-intensive components:

```typescript
const HeavyComponent = () => {
  const [data, setData] = React.useState(null);
  
  React.useEffect(() => {
    // Expensive operation
    const result = performHeavyCalculation();
    setData(result);
  }, []);
  
  if (!data) return <div>Processing...</div>;
  return <div>{data}</div>;
};
```

## Future Enhancements

Coming soon:
- Component aliasing (short names for common components)
- Props validation and type checking
- Component marketplace/library
- Visual component picker in editor
- Hot reload in development

---

Happy building! 🎨✨

## Questions?

- Check existing components in `src/app/components/`
- See `ColorMatchingGame.tsx` for a complete example
- Review `EditorialSection.tsx` for the renderer implementation
