import type { EditorialArticle } from '../types';

// SETUP. optional step `first-poem` (prisma/setup-steps.ts, #1106). A ```poem
// fence in a story or MD article becomes a poem section (src/app/utils/poem.ts):
// its icon walks the page (PoemWalker) and unfolds the poem in place. The fence
// line takes an icon, author="…" and ink=/…; a TS article sets the same three
// in the section's metadata. Ink images come from scripts/poem-ink.sh.
export const SETUP_FIRST_POEM_ARTICLE: EditorialArticle = {
  slug: 'setup-first-poem',
  title: 'YOUR FIRST POEM.',
  subtitle: 'Every line, indent and stanza as you wrote it. In your own hand, if you want, with your name under it.',
  description: 'How to add a poem to your own site: write it in a story, keep its lines and stanzas exactly as written, sign it with your name or a guest\'s, and show it in the poet\'s own handwriting from a phone photo.',
  category: 'SETUP.',
  date: '2026-10-30',
  updated: '2026-10-30',
  published: true,
  author: 'justin-murry',
  readTime: '5 min',
  tags: ['Poems', 'Stories', 'Writing', 'Handwriting', 'Setup', 'Software You Own'],
  sections: [
    {
      id: 'hero-poem',
      type: 'hero',
      content: 'as you wrote it.',
      metadata: { style: 'highlight' }
    },
    {
      id: 'intro',
      type: 'paragraph',
      content: 'Poems on your site keep every line, indent and stanza break exactly as you wrote them. A poem doesn\'t sit in the page as a block of text. Its icon walks your story, and a tap opens the poem right there, with your name under it. Bring a photo of the page you wrote it on, and it shows in your own handwriting.',
      metadata: { dropCap: true }
    },
    {
      id: 'challenge-poem',
      type: 'challenge',
      userPrompt: 'YOUR FIRST POEM.',
      label: 'BUILD.',
      pollEnabled: false,
      stepOne: { emoji: '1️⃣', action: 'Write it.', description: 'Three backticks and the word poem.' },
      stepTwo: { emoji: '2️⃣', action: 'Sign it.', description: 'Yours by default, or a guest\'s.' },
      stepThree: { emoji: '3️⃣', action: 'Ink it.', description: 'A photo of your handwriting.' },
      successMetric: 'your poem walks your story, in your hand.'
    },
    {
      id: 'divider-write',
      type: 'divider'
    },
    {
      id: 'write-heading',
      type: 'heading',
      content: '1️⃣ Write It'
    },
    {
      id: 'write-para',
      type: 'paragraph',
      content: 'A poem lives inside a story. Open one in **Stories** in [/admin](/admin/stories), or its **story-NNN.md** file in your editor ([your first story](/article/setup-first-story) shows how). Put a heading above the poem (that becomes its title), then the poem between two lines of three backticks, with the word **poem** after the first three:'
    },
    {
      id: 'write-code',
      type: 'code',
      content: '## where love gathers.\n\n```poem\nWHERE LOVE GATHERS\nHATE FOLLOWS\n\nLOVE SEEKS MORE LOVE\nHATE SEEKS LOVE\n```',
      metadata: { language: 'markdown', emphasis: true, caption: 'Empty lines are stanza breaks. Spaces at the start of a line stay' }
    },
    {
      id: 'write-icon',
      type: 'paragraph',
      content: 'Every poem walks with your poem icon. Pick it in [/admin](/admin#site), under **Your defaults**, and draw it in your own hand under **Your icons**. One poem can walk with a different icon: name it after the word poem, on the same line, like **poem Lightbulb**.'
    },
    {
      id: 'sign-heading',
      type: 'heading',
      content: '2️⃣ Sign It'
    },
    {
      id: 'sign-para',
      type: 'paragraph',
      content: 'A poem shows whose it is under its last line. Leave it alone and it is yours: your name and picture from **src/data/FoundersConfig.json**, linking to your **/founders** page. When the poem is someone else\'s, give it their name on the same line:'
    },
    {
      id: 'sign-code',
      type: 'code',
      content: '```poem author="Jane Doe"\nthe words, as Jane wrote them\n```',
      metadata: { language: 'markdown', emphasis: true, caption: 'Quote marks around a name with a space in it' }
    },
    {
      id: 'ink-heading',
      type: 'heading',
      content: '3️⃣ Ink It'
    },
    {
      id: 'ink-para',
      type: 'paragraph',
      content: 'Write the poem in dark pen on plain paper, and take a photo straight on in even light. Your copy turns that photo into the ink alone, with the paper taken out, so it reads on light and dark pages. In the terminal, inside your copy:'
    },
    {
      id: 'ink-code',
      type: 'code',
      content: '# The ink alone, as a see-through image\nscripts/poem-ink.sh ~/Downloads/IMG_0050.HEIC public/poems/where-love-gathers-ink.webp',
      metadata: { language: 'bash', emphasis: true, caption: 'Its last line prints the ink=... to copy into your poem' }
    },
    {
      id: 'ink-crop',
      type: 'paragraph',
      content: 'It trims to the writing for you. If the photo holds more than the poem (a second page, a coffee cup), add **--crop 2100x2150+360+1720**: the width and height of the part to keep, then how far it starts from the left and the top, in pixels of the photo. In Preview, **Tools → Show Inspector** shows those numbers for a selection.'
    },
    {
      id: 'ink-fence',
      type: 'paragraph',
      content: 'Then point the poem at it. Keep the typed words: screen readers and search engines read them, and people see your hand.'
    },
    {
      id: 'ink-fence-code',
      type: 'code',
      content: '```poem ink=/poems/where-love-gathers-ink.webp\nWHERE LOVE GATHERS\nHATE FOLLOWS\n```',
      metadata: { language: 'markdown', emphasis: true, caption: 'The path starts at public/, so leave that part off' }
    },
    {
      id: 'ts-heading',
      type: 'heading',
      content: '✍️ In an Article Instead'
    },
    {
      id: 'ts-para',
      type: 'paragraph',
      content: 'In an article you write in code ([your first article](/article/setup-first-article)), a poem is a paragraph section with the same three choices. The whole of this site\'s homepage poem:'
    },
    {
      id: 'ts-code',
      type: 'code',
      content: "{\n  id: 'poem-love-gathers',\n  type: 'paragraph',\n  content: 'WHERE LOVE GATHERS\\nHATE FOLLOWS\\n\\nLOVE SEEKS MORE LOVE\\nHATE SEEKS LOVE',\n  metadata: {\n    preserveWhitespace: true,\n    title: 'where love gathers.',\n    ink: '/cover-motion/love-gathers-ink.webp',\n    // icon: 'Lightbulb',\n  },\n},",
      metadata: { language: 'typescript', caption: 'preserveWhitespace: true is what makes it a poem. \\n is a new line' }
    },
    {
      id: 'publish-para',
      type: 'paragraph',
      content: 'Save the story (or run **npm run get-stories** if you wrote it in your editor), start your site with **npm run dev**, and open it. In GitHub Desktop, commit your story and the ink image together, then push.'
    },
    {
      id: 'divider-warn',
      type: 'divider'
    },
    {
      id: 'warn-heading',
      type: 'heading',
      content: '⚠️ Before You Push'
    },
    {
      id: 'warn-list',
      type: 'list',
      content: '**Three backticks, then poem, on one line** — everything for that poem (icon, author, ink) goes on that same line|**The heading above is the title** — without one the poem is just called a poem|**Keep the photo out of your copy** — only the ink image goes in public/. The original holds where and when you took it|**Someone else\'s poem is theirs** — ask before you put it on your site, and give it their name',
      metadata: { style: 'accent' }
    },
    {
      id: 'trouble-heading',
      type: 'heading',
      content: '🧯 If It Looks Wrong'
    },
    {
      id: 'trouble-list',
      type: 'list',
      content: '**It shows as code, not a poem** — the word after the backticks is not poem, or the closing three backticks are missing|**The handwriting does not show** — the ink path is wrong. It starts with a slash and leaves out public, like /poems/name-ink.webp|**Paper or shadows show around the ink** — retake the photo in even light, or crop closer with --crop|**Thin strokes are missing** — the pen was too light. Write it again in a darker pen or marker'
    },
    {
      id: 'llm-heading',
      type: 'heading',
      content: '🤖 Ask Your LLM'
    },
    {
      id: 'llm-prompts',
      type: 'code',
      content: '(In Claude Code, inside your copy)\nAdd my poem to public/covers/stories/story-052.md under a heading\n"where love gathers." as a ```poem fence. Keep my line breaks\nand indents exactly. Do not change a word.\n\nTurn ~/Downloads/IMG_0050.HEIC into poem ink with\nscripts/poem-ink.sh, then add its ink= to that poem.',
      metadata: { language: 'prompt', emphasis: true, caption: 'Your words stay yours. Let it place them, not write them' }
    },
    {
      id: 'done-heading',
      type: 'heading',
      content: '✅ You Are Done When'
    },
    {
      id: 'done-list',
      type: 'list',
      content: 'Your poem\'s icon walks your story, and a tap opens the poem right there|The lines, indents and stanza breaks are exactly as you wrote them|Your name (or your guest\'s) shows under the last line|With ink=, the poem shows in your handwriting on both a light and a dark page'
    },
    {
      id: 'closing-para',
      type: 'paragraph',
      content: 'The cover on this site\'s homepage is the same poem, written by hand and traced in motion. Your cover can be yours: start with [your first cover](/article/setup-first-cover).'
    },
    {
      id: 'final-quote',
      type: 'quote',
      content: 'Write it by hand. Let the site keep it that way.',
      metadata: { author: 'unparty-app', style: 'minimal' }
    }
  ]
};
