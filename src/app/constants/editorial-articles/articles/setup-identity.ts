import type { EditorialArticle } from '../types';

// SETUP. curriculum step 16, the last required one (prisma/setup-steps.ts, #1094)
// src/data/FoundersConfig.json feeds src/app/constants/organization.ts (tab titles,
// footer, link previews, structured data, sitemap, /founders). /founders is the
// founder's resume (src/app/founders/resume-data.ts): it counts only content
// credited to founder.name or site.name, so a new owner never presents unparty's
// work as theirs, and founder.resume picks what it shows first. `npm run check:identity`
// (scripts/check-founders-config.mjs) catches what tsc misses in hand-edited JSON.
export const SETUP_IDENTITY_ARTICLE: EditorialArticle = {
  slug: 'setup-identity',
  title: 'MAKE IT YOURS.',
  seoTitle: 'MAKE IT YOURS. put your name on your site',
  subtitle: 'One file says who your site is and who built it. Fill it in, and your name replaces unparty\'s everywhere it counts.',
  description: 'How non-technical founders put their own name on their Next.js site: fill in one config file with the site name, description, legal name, founder profile, photo and links, check it with one command, and see it on every page, in the footer, and on the founder page.',
  category: 'SETUP.',
  date: '2026-09-29',
  updated: '2026-11-02',
  published: true,
  author: 'justin-murry',
  readTime: '8 min',
  tags: ['Identity', 'Branding', 'Brand Colors', 'Founder Page', 'Config', 'Setup', 'Non-Technical Founders', 'Software You Own'],
  // Home of the brand color setup in the component portfolio (#1433); saving
  // from a deployed site goes through the owner's GitHub App
  presents: { component: 'BrandColors', needs: ['github'] },
  sections: [
    {
      id: 'hero-identity',
      type: 'hero',
      content: 'your name on the door.',
      metadata: { style: 'highlight' }
    },
    {
      id: 'intro',
      type: 'paragraph',
      content: 'Everything so far has been about making your copy run. This step is about making it say who it belongs to. Your site\'s name, its description, the name in the footer, the founder on the founder page: all of it comes from one file, **FoundersConfig.json**. Right now it holds unparty\'s details. By the end of this step it holds yours.',
      metadata: { dropCap: true }
    },
    {
      id: 'where-table',
      type: 'table',
      metadata: {
        headers: ['You fill in', 'Where it shows up'],
        rows: [
          ['Site name, title, headline', 'Browser tabs, the homepage title, search results'],
          ['Description and tagline', 'Search results and link previews'],
          ['Legal name', 'The copyright line in every page\'s footer'],
          ['Founder name, photo, bio, links', 'Your founder page at /founders'],
          ['Address (from Your domain)', 'Sitemap, link previews, search engines']
        ]
      }
    },
    {
      id: 'challenge-identity',
      type: 'challenge',
      userPrompt: 'MAKE IT YOURS.',
      label: 'BUILD.',
      pollEnabled: false,
      stepOne: { emoji: '1️⃣', action: 'Fill it.', description: 'One file: your site and you.' },
      stepTwo: { emoji: '2️⃣', action: 'Check it.', description: 'One command finds mistakes.' },
      stepThree: { emoji: '3️⃣', action: 'Ship it.', description: 'See your name, then push.' },
      successMetric: 'your site says it is yours.'
    },
    {
      id: 'divider-fill',
      type: 'divider'
    },
    {
      id: 'fill-heading',
      type: 'heading',
      content: '1️⃣ Fill In Your Details'
    },
    {
      id: 'fill-para',
      type: 'paragraph',
      content: 'Open **src/data/FoundersConfig.json** in your editor. It has three parts: **site** (your business), **founder** (you), and **brandColors**. Replace each value between the quote marks with your own. Here is what a small bakery might write:'
    },
    {
      id: 'fill-code',
      type: 'code',
      content: '{\n  "site": {\n    "name": "bakery",\n    "title": "bakery.com",\n    "tagline": "fresh every morning.",\n    "headline": "Neighborhood Bread and Pastry",\n    "description": "A neighborhood bakery sharing what we bake and how.",\n    "url": "https://www.bakery.com",\n    "legalName": "Sam\'s Bakery LLC",\n    "github": "",\n    "logo": { "path": "/bakery-logo.png", "width": 1200, "height": 1200 }\n  },\n  "founder": {\n    "name": "Sam Rivera",\n    "role": "owner",\n    "title": "baker.",\n    "image": "sam-rivera.jpg",\n    "initials": "SR",\n    "cover": "cover-052",\n    "bio": "Bread before sunrise, for twelve years.",\n    "summary": "Sam Rivera, owner of bakery.com, a neighborhood bakery.",\n    "links": [\n      { "label": "Instagram", "url": "https://instagram.com/bakery" }\n    ]\n  },\n  "brandColors": ["#C8553D", "#F2D0A4", "", "", ""]\n}',
      metadata: { language: 'json', emphasis: true, caption: 'Keep every name on the left exactly as it is. Change only the values on the right' }
    },
    {
      id: 'site-heading',
      type: 'heading',
      content: '🏷️ The site Part'
    },
    {
      id: 'site-table',
      type: 'table',
      metadata: {
        headers: ['Field', 'What to write'],
        rows: [
          ['name', 'Your site\'s short name, the one that comes first in the homepage title'],
          ['title', 'The name shown in browser tabs on pages without their own title. Often your domain'],
          ['tagline', 'A few words under that title in search results'],
          ['headline', 'What your site is, after its name on the homepage: "bakery — Neighborhood Bread and Pastry"'],
          ['description', 'Two sentences for search results and link previews'],
          ['url', 'Your address from Your domain. Starts with https://, no slash at the end'],
          ['legalName', 'Your business\'s legal name, for the copyright line'],
          ['github', 'The GitHub user or organization that owns your projects\' code. Leave "" if you do not have one'],
          ['logo', 'A PNG or JPG in your public folder, and its real width and height in pixels']
        ]
      }
    },
    {
      id: 'logo-para',
      type: 'paragraph',
      content: 'To find a picture\'s size in pixels: on a Mac, open it in **Preview** and press **⌘ + I**. On Windows, right-click it, choose **Properties**, then **Details**. Google asks for a logo\'s real size, so copy both numbers exactly.'
    },
    {
      id: 'founder-heading',
      type: 'heading',
      content: '🙋 The founder Part'
    },
    {
      id: 'founder-table',
      type: 'table',
      metadata: {
        headers: ['Field', 'What to write'],
        rows: [
          ['name, role', 'Your name and what you are: "owner", "founder", "chef"'],
          ['title', 'One or two words in large letters on your founder page: "baker."'],
          ['image', 'A square photo of you in your public folder, by file name. Or "" to show your initials'],
          ['initials', 'Two letters, shown when there is no photo'],
          ['cover', 'The picture across your founder page. Use your cover from Your first cover'],
          ['bio', 'One or two sentences under your title. Two stars around a word make it bold'],
          ['summary', 'One sentence about you for search results and link previews'],
          ['links', 'Anywhere people can find you. Add as many as you like, each with a label and an address'],
          ['cta', 'Optional. The one thing your founder page asks visitors to do: a label ("work with me"), where it goes (a page on your site, a link, or mailto:), and a sentence of yours that links there. Leave it out and your first link is used']
        ]
      }
    },
    {
      id: 'photo-para',
      type: 'paragraph',
      content: 'Put your photo and logo in the **public** folder at the top of your copy, the same way you added your cover, then write their file names in.'
    },
    {
      id: 'colors-heading',
      type: 'heading',
      content: '🎨 Your Colors'
    },
    {
      id: 'colors-para',
      type: 'paragraph',
      content: 'Five colors, and the first one is your site\'s: buttons, borders and the bar at the top of a phone take it. All five lead the colors your visitors can pick from. You do not have to type them into the file. Tap a ring, then a color, and this page tries it on. A cover gives you all five at once.'
    },
    {
      id: 'colors-setup',
      type: 'component',
      metadata: {
        componentName: 'BrandColors'
      }
    },
    {
      id: 'colors-save',
      type: 'list',
      content: '**Without sign-in** — only an admin can save, so copy your colors into **brandColors** in **src/data/FoundersConfig.json** yourself|**On your computer** — signed in as admin, with npm run dev running, **save my colors** writes them into **src/data/FoundersConfig.json**, and your site reloads in them|**On your live site** — with your [GitHub App](/article/setup-github-app) connected, saving opens a change in your repository that merges itself. Your site wears the colors after its next deploy|**Without the GitHub App** — saving shows the one line to paste over **brandColors** in the file|**Anytime later** — the same rings are in **/admin**, under **your site.** Change one color or all five',
      metadata: { style: 'accent' }
    },
    {
      id: 'links-para',
      type: 'paragraph',
      content: 'Your colors travel. Every link to your site shares a card made from them, your words and your covers. Try a color above and watch the card change.'
    },
    {
      id: 'links-preview',
      type: 'component',
      metadata: {
        componentName: 'LinkPreview',
        componentProps: { followTheme: true }
      }
    },
    {
      id: 'rules-list',
      type: 'list',
      content: '**Keep the quote marks** — every value sits between straight double quotes|**A comma between lines, never after the last one** — the last line in a block or a list has no comma|**Numbers have no quotes** — the logo\'s width and height are plain numbers|**Apostrophes are fine here** — unlike articles, this file needs no backslash: **"Sam\'s Bakery LLC"**',
      metadata: { style: 'accent' }
    },
    {
      id: 'check-heading',
      type: 'heading',
      content: '2️⃣ Check It'
    },
    {
      id: 'check-para',
      type: 'paragraph',
      content: 'A missing comma in this file can take your whole site down, so your copy comes with a checker that reads it before you do anything else:'
    },
    {
      id: 'check-code',
      type: 'code',
      content: '# Check FoundersConfig.json\nnpm run check:identity',
      metadata: { language: 'bash', emphasis: true, caption: 'Aim for one line: ✅ FoundersConfig.json checks out' }
    },
    {
      id: 'check-read',
      type: 'list',
      content: '**❌ lines are problems** — each names the field and what is wrong, like a photo file that does not exist. A broken comma is reported with its line number|**⚠️ lines are values still set to unparty\'s** — they never stop your site, but each one is a place where unparty is still speaking for you|**✅ with nothing above it** — everything is yours'
    },
    {
      id: 'founders-para',
      type: 'paragraph',
      content: 'Now start your site with **npm run dev** and open **localhost:3000/founders**. It is your resume, read like any article on your site, and written for someone deciding whether to back you, hire you or buy from you. Every chapter is worked out from your own site, and a chapter with nothing to show yet stays hidden:'
    },
    {
      id: 'founders-table',
      type: 'table',
      metadata: {
        headers: ['Chapter of /founders', 'Shows when'],
        rows: [
          ['Your name, title, photo, bio and links: the header, byline and opening', 'Always, from this file'],
          ['Beside your bio: everything you published, month by month', 'Once you publish your first article or story'],
          ['WORK.: the articles and components you pick', 'Once **resume** lists them (below)'],
          ['Above your bio: your thesis, the one sentence your work makes the case for', 'Once **resume.thesis** has it'],
          ['BUILDER.: what your work shows about you, never a grade: what your hours are worth, then driven, focused, creative, visionary, ships and grows, each card linked to the chart behind it', 'Each card once it has something behind it: your **baseline** hours and rhythm, your builds\' focus and releases, and **projects** with **startsFrom** and **leadsTo**'],
          ['EFFORT.: where your work goes, one line per area', 'Once **resume.areas** names them and they have work in them'],
          ['WORDS.: the words you keep coming back to, in your stories, articles or both', 'Once you publish. Anyone can read the same list from /api/words'],
          ['BUILDING.: your projects by stage, and where each one leads', 'Once **projects** has one. Give each a **stage** and **leadsTo**, and a **need**: the gap it was built to close, in a line, said under it on the path'],
          ['MOMENTUM.: the SETUP. and MAKE. steps you finished', 'From your sixth finished step, with your database connected. Before that, one line under NEXT.'],
          ['STACK.: what your site costs to run a month', 'Once **stack** has your plans'],
          ['VIEWS.: visitors and the pages they read', 'Only when **resume.views** is true, with analytics connected'],
          ['NEXT.: what you updated last, and your ask', 'Always, from this file']
        ]
      }
    },
    {
      id: 'founders-resume',
      type: 'code',
      content: '"resume": {\n  "thesis": "the one sentence your work makes the case for",\n  "articles": ["your-best-article", "your-first-story"],\n  "components": ["GoalBudget"],\n  "areas": [\n    { "name": "writing", "match": ["story"] },\n    { "name": "guides", "match": ["setup."] }\n  ],\n  "labels": false,\n  "views": false\n}',
      metadata: { language: 'json', caption: 'Inside "founder" in FoundersConfig.json. Every line is optional' }
    },
    {
      id: 'founders-resume-list',
      type: 'list',
      content: '**thesis** — your case, in your words. The page never writes it for you|**articles** — the slugs of the articles and stories to show first, in order|**components** — components to show working, each from its home article (see [/build](/build))|**areas** — the kinds of work you do, each matching a category, a tag, or article, story or component|**labels** — each chapter opens with a hand-drawn icon; true adds its word beside it|**views** — your traffic is yours to share, so it stays off until you turn it on'
    },
    {
      id: 'founders-note',
      type: 'personal',
      content: 'Your copy came with unparty\'s articles and stories. Your resume never counts them as yours: it only counts what is credited to your name or your site\'s name.'
    },
    {
      id: 'ship-heading',
      type: 'heading',
      content: '3️⃣ See Your Name, Then Ship It'
    },
    {
      id: 'ship-list',
      type: 'list',
      content: '**The homepage tab** reads your name and headline|**The footer**, at the bottom of any page, says © and your legal name|**/founders** shows your profile, and only your profile|**npm run check:identity** still ends with ✅',
      metadata: { numbered: true }
    },
    {
      id: 'push-para',
      type: 'paragraph',
      content: 'In GitHub Desktop, the **Changes** list should hold **FoundersConfig.json**, plus your photo and logo if you added them. Write a summary like "Make it mine", click **Commit to main**, then **Push origin**.'
    },
    {
      id: 'ship-quote',
      type: 'quote',
      content: 'Same code, same pages. Your name on all of it.',
      metadata: { author: 'unparty-app', style: 'highlight' }
    },
    {
      id: 'divider-still',
      type: 'divider'
    },
    {
      id: 'still-heading',
      type: 'heading',
      content: '⚠️ What Still Says unparty'
    },
    {
      id: 'still-list',
      type: 'list',
      content: '**The example pages** — the /theunparty pages, stories, articles and covers that came with your copy are unparty\'s projects, kept as working examples next to yours|**These setup articles** — they stay signed by their author, as a manual would|**The words in the code** — file and folder names still say unparty in many places. None of it is shown to your visitors|**A list of every one is coming** — a later update adds a page that finds each remaining unparty reference, so you can replace or remove them one by one',
      metadata: { style: 'accent' }
    },
    {
      id: 'trouble-heading',
      type: 'heading',
      content: '🧯 If Something Is Off'
    },
    {
      id: 'trouble-list',
      type: 'list',
      content: '**"is not valid JSON (line 31, column 37)"** — open the file at that line. It is almost always a comma after the last item in a list, or a missing comma between two lines|**"points to a file that does not exist"** — the photo or logo is not in the public folder, or its name is spelled differently. Check capitals and the ending: .jpg is not .jpeg|**"has no matching file in public/covers/"** — use the name of a cover that exists, without its ending: cover-052, not cover-052.jpg|**Your photo shows as initials** — the image name is wrong or empty. Run the checker|**The site shows an error after you saved** — run **npm run check:identity**. A broken file stops the whole site until it is fixed'
    },
    {
      id: 'llm-heading',
      type: 'heading',
      content: '🤖 Ask Your LLM'
    },
    {
      id: 'llm-prompts',
      type: 'code',
      content: 'Here is what my business does: [describe it]. Write a two-sentence\ndescription for search results, a four-word tagline, and a short\nheadline that says what my site is. Keep it plain and specific.\n\n(In Claude Code, inside your copy)\nRun npm run check:identity and fix every problem it reports in\nsrc/data/FoundersConfig.json. Ask me before you change any wording.',
      metadata: { language: 'prompt', emphasis: true, caption: 'Let it suggest words. The words that go live should be yours' }
    },
    {
      id: 'done-heading',
      type: 'heading',
      content: '✅ You Are Done When'
    },
    {
      id: 'done-list',
      type: 'list',
      content: '**npm run check:identity** prints ✅ with no ⚠️ lines above it|Your homepage tab, footer and /founders show your name, on your computer and on your live site|Your photo, logo and cover are in your copy and pushed|The commit with **FoundersConfig.json** is live on Vercel'
    },
    {
      id: 'closing-para',
      type: 'paragraph',
      content: 'That is every required step. Your copy runs, it lives at your address, it knows you own it, it holds your first cover, story, article and project page, and now it says your name. The optional steps are there when you need them: payments, email, uploads and more, one at a time.'
    },
    {
      id: 'final-quote',
      type: 'quote',
      content: 'Your name on the door. What you build behind it is up to you.',
      metadata: { author: 'unparty-app', style: 'minimal' }
    }
  ]
};
