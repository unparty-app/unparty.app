import type { EditorialArticle } from '../types';

// SETUP. curriculum step 13 (prisma/setup-steps.ts, #1094)
// story-NNN.md pairs with cover-NNN (StorySchema). /story/[slug] resolves through
// src/data/storiesManifest.json, which only `npm run get-stories` writes (the build
// does not), so skipping it 404s the story. get-stories also writes a slug line derived
// from the title the first time; after that the address stays put. Readers reach
// stories from /covers (click a cover → preview → Read more); the homepage no
// longer lists them.
export const SETUP_FIRST_STORY_ARTICLE: EditorialArticle = {
  slug: 'setup-first-story',
  title: 'YOUR FIRST STORY.',
  subtitle: 'Your first story answers why build your own, in your own words. It opens your /build page.',
  description: 'How non-technical founders publish a story on their own Next.js site: create the story file that pairs with a cover, write it in Markdown, publish it with one command so it gets a readable address, and push it live with GitHub Desktop.',
  category: 'SETUP.',
  date: '2026-09-29',
  updated: '2026-10-21',
  published: true,
  author: 'justin-murry',
  readTime: '6 min',
  tags: ['Stories', 'Markdown', 'Writing', 'Setup', 'Non-Technical Founders', 'Software You Own'],
  sections: [
    {
      id: 'hero-why',
      type: 'hero',
      content: 'why build your own?',
      metadata: { style: 'highlight' }
    },
    {
      id: 'why-intro',
      type: 'paragraph',
      content: 'Your first story answers one question: why build your own? Write it in your own words, in **Stories** in [/admin](/admin/stories?story=new&why=1). It opens your **/build** page, the first thing someone reads about what you build, and the lines you start with **#** show big as its highlights. Save it, and your site lists it for you: no files, no commands. The rest of this page is how stories work underneath, if you want to write them in your editor instead.',
      metadata: { dropCap: true }
    },
    {
      id: 'hero-story',
      type: 'hero',
      content: 'same number. now with words.',
      metadata: { style: 'highlight' }
    },
    {
      id: 'intro',
      type: 'paragraph',
      content: 'Last step you added a picture. A story is what it is about. On your site, a story is a short piece of writing that belongs to one cover, and the two share a number: **cover-052** goes with **story-052**. You write it in a plain text file, flip one word to publish it, and run one command so your site can find it.',
      metadata: { dropCap: false }
    },
    {
      id: 'pair-table',
      type: 'table',
      metadata: {
        headers: ['File', 'Where it lives', 'What it does'],
        rows: [
          ['cover-052.jpg', 'public/covers/', 'The picture (last step)'],
          ['story-052.md', 'public/covers/stories/', 'The words (this step)'],
          ['storiesManifest.json', 'src/data/', 'Your site\'s list of published stories and their addresses']
        ]
      }
    },
    {
      id: 'challenge-story',
      type: 'challenge',
      userPrompt: 'YOUR FIRST STORY.',
      label: 'BUILD.',
      pollEnabled: false,
      stepOne: { emoji: '1️⃣', action: 'Start it.', description: 'One command makes the file.' },
      stepTwo: { emoji: '2️⃣', action: 'Write it.', description: 'A few details, then words.' },
      stepThree: { emoji: '3️⃣', action: 'Publish.', description: 'One word, one command, push.' },
      successMetric: 'your story has its own page.'
    },
    {
      id: 'divider-start',
      type: 'divider'
    },
    {
      id: 'start-heading',
      type: 'heading',
      content: '1️⃣ Start the File'
    },
    {
      id: 'start-para',
      type: 'paragraph',
      content: 'Your copy can make an empty story for every cover that does not have one yet. In the terminal, inside your copy:'
    },
    {
      id: 'start-code',
      type: 'code',
      content: '# Create a blank story for each cover without one\nnpm run generate-placeholder-stories',
      metadata: { language: 'bash', emphasis: true, caption: 'It should say "Created 1 placeholder stories"' }
    },
    {
      id: 'start-open',
      type: 'paragraph',
      content: 'Open **public/covers/stories/story-052.md** in your editor (use your own number). It already holds a draft that says "coming soon". Everything between the two **---** lines is the story\'s details. Everything below them is the story itself.'
    },
    {
      id: 'write-heading',
      type: 'heading',
      content: '2️⃣ Write It'
    },
    {
      id: 'write-para',
      type: 'paragraph',
      content: 'Replace the details at the top with yours. Keep the **---** lines, keep each detail on its own line, and keep the quote marks:'
    },
    {
      id: 'write-code',
      type: 'code',
      content: '---\ntitle: "Where It Started"\nsubtitle: "The first picture I added to my own site."\ndescription: "One sentence for search engines and link previews."\nauthor: "Your Name"\ncover: "cover-052"\ndate: "2026-09-29"\ncategory: "STORIES"\npublished: false\n---',
      metadata: { language: 'yaml', emphasis: true, caption: 'Leave published: false while you write. It is your draft switch' }
    },
    {
      id: 'fields-table',
      type: 'table',
      metadata: {
        headers: ['Detail', 'What it is for'],
        rows: [
          ['title', 'The headline, and the words your story\'s address is made from'],
          ['subtitle', 'One line under the headline'],
          ['description', 'What Google and link previews show'],
          ['author', 'Your name, shown as the byline'],
          ['cover', 'Your cover\'s name, shown across the top. Leave it out and the page has no picture'],
          ['published', 'false keeps it hidden; true puts it on your site']
        ]
      }
    },
    {
      id: 'body-para',
      type: 'paragraph',
      content: 'Now delete the "coming soon" text below the second **---** and write. The file uses **Markdown**, a few symbols that format plain text:'
    },
    {
      id: 'body-code',
      type: 'code',
      content: '# A big heading\n\nA paragraph is just lines of text.\nLeave an empty line between paragraphs.\n\n**Two stars** make text bold.\n\n- A dash starts a list item\n- Like this\n\n[Words to click](https://example.com) make a link.',
      metadata: { language: 'markdown', caption: 'That is all you need. The stories that came with your copy show fancier tricks' }
    },
    {
      id: 'publish-heading',
      type: 'heading',
      content: '3️⃣ Publish It'
    },
    {
      id: 'publish-para',
      type: 'paragraph',
      content: 'When you are happy with it, change **published: false** to **published: true** and save. Then run the one command that tells your site the story exists:'
    },
    {
      id: 'publish-code',
      type: 'code',
      content: '# Update your site\'s list of published stories\nnpm run get-stories',
      metadata: { language: 'bash', emphasis: true, caption: 'Its last line lists every published story. Yours should be near the end' }
    },
    {
      id: 'slug-para',
      type: 'paragraph',
      content: 'Look at your story file again. The command added a line at the top: **slug: where-it-started**. That is your story\'s address, made from its title. It stays even if you change the title later, so links people share keep working.'
    },
    {
      id: 'check-para',
      type: 'paragraph',
      content: 'Start your site with **npm run dev** and check:'
    },
    {
      id: 'check-list',
      type: 'list',
      content: '**localhost:3000/story/where-it-started** (your own slug) shows your story, with your cover|**localhost:3000/story/cover-052** takes you to the same page. Numbers work too|**localhost:3000/covers**: click your cover, and its preview offers **Read More**. This is how visitors find it',
      metadata: { numbered: true }
    },
    {
      id: 'push-para',
      type: 'paragraph',
      content: 'In GitHub Desktop, the **Changes** list should hold your story file and **storiesManifest.json**. Write a summary like "Publish my first story", click **Commit to main**, then **Push origin**.'
    },
    {
      id: 'publish-quote',
      type: 'quote',
      content: 'A picture and the words for it, at an address that is yours.',
      metadata: { author: 'unparty-app', style: 'highlight' }
    },
    {
      id: 'divider-warn',
      type: 'divider'
    },
    {
      id: 'warn-heading',
      type: 'heading',
      content: '⚠️ The Command You Cannot Skip'
    },
    {
      id: 'warn-list',
      type: 'list',
      content: '**No npm run get-stories, no story** — your site finds stories through **storiesManifest.json**, and publishing on Vercel does not rebuild that list. Forget the command and your live story says 404. Run it every time you publish a story or take one down|**Taking a story down works the same way** — set **published: false**, run the command, and push|**Changing the address** — edit the **slug** line yourself, then run the command. The old address stops working, so do it before you share the link|**Do not edit storiesManifest.json by hand** — the command rewrites it every time',
      metadata: { style: 'accent' }
    },
    {
      id: 'trouble-heading',
      type: 'heading',
      content: '🧯 If It Says 404'
    },
    {
      id: 'trouble-list',
      type: 'list',
      content: '**It is published: false** — drafts are hidden on purpose. Change it to true and run **npm run get-stories** again|**get-stories did not list your slug** — check that **published: true** is spelled exactly, with no quote marks around true, and that the file is named **story-** plus your cover\'s number|**It works on your computer but not live** — **storiesManifest.json** was not in your commit. Run the command, then commit and push again|**The title still says "Story 052"** — the file was not saved, or the details lost a **---** line'
    },
    {
      id: 'llm-heading',
      type: 'heading',
      content: '🤖 Ask Your LLM'
    },
    {
      id: 'llm-prompts',
      type: 'code',
      content: 'Here is a rough story I wrote for my website: [paste it].\nTighten it without changing my voice, and suggest a title,\na one-line subtitle, and a one-sentence description.\n\n(In Claude Code, inside your copy)\nPublish public/covers/stories/story-052.md: set published to\ntrue, run npm run get-stories, and tell me the address it got.',
      metadata: { language: 'prompt', emphasis: true, caption: 'Your words, your voice. Let it edit, not write' }
    },
    {
      id: 'done-heading',
      type: 'heading',
      content: '✅ You Are Done When'
    },
    {
      id: 'done-list',
      type: 'list',
      content: '**story-052.md** has your details, your words, and **published: true**|**npm run get-stories** listed your slug, and the file now has a **slug** line|Your story opens at **/story/your-slug** on your computer and on your live site|Clicking your cover at **/covers** offers **Read More**'
    },
    {
      id: 'divider-doubts',
      type: 'divider'
    },
    {
      id: 'doubts-heading',
      type: 'heading',
      content: '✍️ Before the Next One: Delete Your Doubts'
    },
    {
      id: 'doubts-para',
      type: 'paragraph',
      content: 'You just published your own words. The doubts show up right about now: too slow, not technical, who would read this. Give them two minutes, write each one down, then delete it. Keep them and your site watches your writing for you: on **/founders**, under **WORDS.**, only you see each doubt, sized by how often it turns up in your stories and articles. Tap one to jump to every place you wrote it. You can add or let go of one anytime in **/admin**, under **Your doubts**.'
    },
    {
      // The exercise itself (components/doubts/DeleteYourDoubts): signed in as
      // admin, "keep my doubts" saves them privately; for anyone else nothing
      // is saved or sent
      id: 'doubts-exercise',
      type: 'component',
      metadata: { componentName: 'DeleteYourDoubts' }
    },
    {
      id: 'closing-para',
      type: 'paragraph',
      content: 'Stories are short and pinned to a picture. Next is **Your first article**: longer writing, with sections, like the one you are reading now.'
    },
    {
      id: 'final-quote',
      type: 'quote',
      content: 'Write it plain. Publish it with one word.',
      metadata: { author: 'unparty-app', style: 'minimal' }
    }
  ]
};
