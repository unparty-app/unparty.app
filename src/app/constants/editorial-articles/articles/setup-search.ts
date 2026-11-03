import type { EditorialArticle } from '../types';

// SETUP. curriculum, optional step `search` (prisma/setup-steps.ts, #1106). Search
// (src/app/api/search/route.ts, opened by the header's globe or Cmd/Ctrl+K) always
// matches the site's own content as plain text: the section pages, every published
// article, published stories, and steps visible to everyone. It adds a knowledge base
// only when SEARCH_API_URL is set (#1304): POST <url>/api/chat with { messages }, 5s
// timeout, answered with { role, content } where content is Markdown the route parses
// ("**1. Title** (relevance: 0.82)" + "[View full document](url)"). Results are cached
// per query for 5 minutes, top 20 shown. unparty's own API (theunpartyapi) is private,
// so part 2 describes the contract, not a copy to deploy.
export const SETUP_SEARCH_ARTICLE: EditorialArticle = {
  slug: 'setup-search',
  title: 'SEARCH.',
  seoTitle: 'SEARCH. what your site\'s search finds, and how to make it find more',
  subtitle: 'Your search already works. Learn what it finds, and how to make it find more.',
  description: 'How non-technical founders get search on their own Next.js site: what the built-in search covers, how to write so people find it, and how to connect a knowledge base API of your own.',
  category: 'SETUP.',
  date: '2026-10-05',
  published: true,
  author: 'justin-murry',
  readTime: '7 min',
  tags: ['Search', 'Knowledge Base', 'Setup', 'Non-Technical Founders', 'Software You Own'],
  sections: [
    {
      id: 'hero-search',
      type: 'hero',
      content: 'ask your site anything.',
      metadata: { style: 'highlight' }
    },
    {
      id: 'intro',
      type: 'paragraph',
      content: 'Search is already on. Press the globe in the header, or **Cmd+K** on a Mac (**Ctrl+K** on Windows), and type. Your site looks through everything you have published and lists what matches. There is nothing to sign up for and no key to add. This step shows you what it finds, how to help people find your work, and, only if you want it, how to connect a knowledge base of your own.',
      metadata: { dropCap: true }
    },
    {
      id: 'covers-table',
      type: 'table',
      metadata: {
        headers: ['It finds', 'It looks at'],
        rows: [
          ['Your articles', 'Title, subtitle, category and every paragraph of each published article'],
          ['Your stories', 'Title, subtitle, category, author and the full text of each published story'],
          ['Your main pages', 'The names of the ABOUT, BUILD and CONNECT pages, like about, founders and privacy'],
          ['Your steps', 'Title and description of steps visible to everyone']
        ]
      }
    },
    {
      id: 'stays-list',
      type: 'list',
      content: '**Searches stay on your site** — nothing anyone types is sent anywhere else, unless you connect a knowledge base in part 3|**Drafts stay hidden** — an article or story that is not published never shows up',
      metadata: { style: 'accent' }
    },
    {
      id: 'challenge-search',
      type: 'challenge',
      userPrompt: 'SEARCH.',
      label: 'BUILD.',
      pollEnabled: false,
      stepOne: { emoji: '1️⃣', action: 'Try it.', description: 'Search for your own work.' },
      stepTwo: { emoji: '2️⃣', action: 'Words.', description: 'Write so people find it.' },
      stepThree: { emoji: '3️⃣', action: 'Connect.', description: 'Optional: your knowledge base.' },
      successMetric: 'a search for your newest article finds it.'
    },
    {
      id: 'divider-try',
      type: 'divider'
    },
    {
      id: 'try-heading',
      type: 'heading',
      content: '1️⃣ Search for Your Own Work'
    },
    {
      id: 'try-steps',
      type: 'list',
      content: 'Open your site, on your computer or on the live address|Press the globe in the header, or **Cmd+K** (**Ctrl+K** on Windows)|Type one word from the title of your [first article](/article/setup-first-article). It shows up, marked ARTICLE|Type a word that only appears deep inside one of your [stories](/article/setup-first-story). It shows up too, marked STORY|Use the arrow keys and **Enter**, or click, to open a result',
      metadata: { numbered: true }
    },
    {
      id: 'try-meta',
      type: 'paragraph',
      content: 'Above the results, a short line counts them, like **7 thoughts • 7 APP**. APP means they came from your own site. Once you connect a knowledge base, a second number appears for it.'
    },
    {
      id: 'divider-words',
      type: 'divider'
    },
    {
      id: 'words-heading',
      type: 'heading',
      content: '2️⃣ Write So People Find It'
    },
    {
      id: 'words-para',
      type: 'paragraph',
      content: 'Your search matches the exact letters people type, anywhere in a word. It does not guess. Someone who types **launch** finds an article that says **launching**, but someone who types **start** does not. So the words you choose decide what people find.'
    },
    {
      id: 'ranking-table',
      type: 'table',
      metadata: {
        headers: ['Where the word is', 'How high it ranks'],
        rows: [
          ['A page name, exactly', 'First'],
          ['An article or story title', 'Near the top'],
          ['A subtitle', 'High'],
          ['A category, or only in the text', 'Lower']
        ]
      }
    },
    {
      id: 'words-list',
      type: 'list',
      content: '**Title it with the word people will type** — a title like **Launching Your Shop** is found by launch, launching and shop|**Say it in the subtitle too** — if people might call it something else, use that word in the subtitle|**One idea per article** — the 20 best matches are all anyone sees, so a short, focused article ranks better than one mention in a long one',
      metadata: { style: 'accent' }
    },
    {
      id: 'divider-connect',
      type: 'divider'
    },
    {
      id: 'connect-heading',
      type: 'heading',
      content: '3️⃣ Optional: Connect Your Knowledge Base'
    },
    {
      id: 'connect-para',
      type: 'paragraph',
      content: 'Most founders stop at step 2. This part is for you if you keep notes, docs or a wiki somewhere else and want your search to answer from them too. Your site can ask one more service, a **search API**, every time someone searches, and mix its answers in with your own.'
    },
    {
      id: 'connect-personal',
      type: 'personal',
      content: 'unparty.app does this with a service of its own that searches our docs and wiki. That service is not part of your copy, so this part tells you exactly what yours has to do. If you are not building one, you are done.'
    },
    {
      id: 'contract-heading',
      type: 'heading',
      content: '🔌 What Your Search API Has to Do'
    },
    {
      id: 'contract-steps',
      type: 'list',
      content: 'Answer at **/api/chat** on its own address, like **https://search.yourname.com/api/chat**|Accept a POST with the search in it, the way a chat message is sent|Answer within **5 seconds**. A slower answer is dropped and your own results show alone|Answer with a short list in Markdown: a numbered, bold title, its relevance from 0 to 1, a sentence or two, and a link',
      metadata: { numbered: true }
    },
    {
      id: 'contract-code',
      type: 'code',
      content: '# What your site sends\nPOST https://search.yourname.com/api/chat\n{ "messages": [{ "role": "user", "content": "pricing" }] }\n\n# What your search API answers\n{\n  "role": "assistant",\n  "content": "**1. How we price** (relevance: 0.82)\\nWhy every plan is one price.\\n[View full document](https://docs.yourname.com/pricing)\\n\\n**2. Refunds** (relevance: 0.61)\\nWhen and how to ask.\\n[View full document](https://docs.yourname.com/refunds)"\n}',
      metadata: { language: 'json', caption: 'Keep the bold, the (relevance: …) and View full document exactly as shown' }
    },
    {
      id: 'env-para',
      type: 'paragraph',
      content: 'Then tell your site where it is. Put the address in **.env**, without /api/chat on the end, and add the same line to Vercel\'s Environment Variables, then redeploy:'
    },
    {
      id: 'env-code',
      type: 'code',
      content: '# .env\nSEARCH_API_URL="https://search.yourname.com"',
      metadata: { language: 'bash', emphasis: true, caption: 'Restart npm run dev after changing .env. Remove the line to turn it off again' }
    },
    {
      id: 'connect-check',
      type: 'paragraph',
      content: 'Search for something only your knowledge base knows. The line above the results now ends in a second number, like **7 APP • 5 API**, and those results carry a small arrow: they open on the other site.'
    },
    {
      id: 'know-heading',
      type: 'heading',
      content: '⚠️ Good to Know'
    },
    {
      id: 'know-list',
      type: 'list',
      content: '**New work can take 5 minutes to show** — your site remembers each search for 5 minutes, so a search you just tried may not include an article you published since|**Searches leave your site once you connect** — your search API sees every word people type. Say so in your privacy policy, in **src/data/privacypolicy.json**|**Your site never waits long** — if your search API is down or slow, people still get your own results, with a small Limited results note',
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
      content: '**Your new article does not show up** — check it is published and registered: open its address. If it opens, wait 5 minutes and search again|**No API number above the results** — SEARCH_API_URL is missing where you tested. Restart npm run dev, or redeploy on Vercel after adding it|**Limited results (search API unavailable)** — your site reached the address but got nothing back. In the terminal running npm run dev (or your Vercel logs), look for a line starting with **External search API failed**|**API results go nowhere when clicked** — your answer has no View full document link, or the link is wrong'
    },
    {
      id: 'llm-heading',
      type: 'heading',
      content: '🤖 Ask Your LLM'
    },
    {
      id: 'llm-prompts',
      type: 'code',
      content: 'Here are the titles and subtitles of my articles: [paste them].\nPeople looking for them would type words like [list a few].\nSuggest a title and subtitle for each that uses the words people\nwould actually type, in my voice.\n\nI want a small search API for my notes in [say where they live].\nIt must answer POST /api/chat with { messages } in under 5\nseconds, in exactly this format: [paste the answer example from\nthis article]. What is the simplest way to build and host it?',
      metadata: { language: 'prompt', emphasis: true, caption: 'Never paste an API key into a chat' }
    },
    {
      id: 'done-heading',
      type: 'heading',
      content: '✅ You Are Done When'
    },
    {
      id: 'done-list',
      type: 'list',
      content: 'A search for a word in your newest article finds it|A search for a word deep in one of your stories finds it|Your titles use the words people will type|Only if you connected one: the line above your results shows an API number'
    },
    {
      id: 'closing-para',
      type: 'paragraph',
      content: 'Everything you publish is now one keystroke away, for anyone who visits. Next, see what your site keeps out of GitHub, in [What git leaves out](/article/setup-gitignore).'
    },
    {
      id: 'final-quote',
      type: 'quote',
      content: 'If they cannot find it, you did not ship it.',
      metadata: { author: 'unparty-app', style: 'minimal' }
    }
  ]
};
