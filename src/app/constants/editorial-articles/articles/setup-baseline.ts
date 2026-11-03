import type { EditorialArticle } from '../types';

// SETUP. curriculum, optional step "Know your baseline" (prisma/setup-steps.ts,
// #1310 4b): FoundersConfig `baseline`, what Goal Budget and Expensd price with
export const SETUP_BASELINE_ARTICLE: EditorialArticle = {
  slug: 'setup-baseline',
  title: 'KNOW YOUR BASELINE.',
  subtitle: 'Set what an hour of your work is worth, and the projects your next one gets priced against.',
  description: 'A step-by-step guide to the baseline in your copy of unparty-app: the market pay that sets your hourly rate, what an hour costs in an LLM, and the projects you have built with their real hours. Keep the one your copy ships with, set your own numbers, or have your LLM make one for your market. Goal Budget and Expensd price every build with it.',
  category: 'SETUP.',
  date: '2026-10-17',
  updated: '2026-10-18',
  published: true,
  author: 'justin-murry',
  readTime: '10 min',
  tags: ['Baseline', 'Goal Budget', 'Pricing', 'Setup', 'Non-Technical Founders', 'Software You Own'],
  sections: [
    {
      id: 'hero-worth',
      type: 'hero',
      content: 'what is the work worth?',
      metadata: { style: 'highlight' }
    },
    {
      id: 'intro',
      type: 'paragraph',
      content: 'Every build costs hours before it costs anything else. Your copy prices those hours with a **baseline**: what an hour of the work is worth, what an hour costs in an LLM, and real projects with the hours they took. Goal Budget uses it to say what a build is worth, and Expensd uses it to price the time you track. It ships with mine, measured from my own repos. This step makes it yours.',
      metadata: { dropCap: true }
    },
    {
      id: 'see-it',
      type: 'component',
      metadata: { componentName: 'GoalBudget' }
    },
    {
      id: 'see-it-note',
      type: 'personal',
      content: 'Open LIKE. and pick a project, or count your own hours. Everything it shows comes from the baseline you set here.'
    },
    {
      id: 'challenge-baseline',
      type: 'challenge',
      userPrompt: 'KNOW YOUR BASELINE.',
      label: 'BUILD.',
      pollEnabled: false,
      stepOne: { emoji: '1️⃣', action: 'Keep mine.', description: 'Start priced against real, measured work.' },
      stepTwo: { emoji: '2️⃣', action: 'Set pay.', description: 'What an hour of your work is worth.' },
      stepThree: { emoji: '3️⃣', action: 'Add yours.', description: 'Your projects, with the hours they took.' },
      successMetric: 'every build has a price you can stand behind.'
    },
    {
      id: 'divider-keep',
      type: 'divider'
    },
    {
      id: 'keep-heading',
      type: 'heading',
      content: '1️⃣ Keep Mine While You Start'
    },
    {
      id: 'keep-para',
      type: 'paragraph',
      content: 'The baseline your copy ships with is real: 44 of my projects, their hours measured from git (commits close together count as one work session), priced at the median of two market salaries over a full-time year, plus the LLM cost I measured across my own sessions. It is a fair place to start. **npm run check:identity** will remind you it is still mine until you change it.'
    },
    {
      id: 'divider-pay',
      type: 'divider'
    },
    {
      id: 'pay-heading',
      type: 'heading',
      content: '2️⃣ Set What an Hour Is Worth'
    },
    {
      id: 'pay-para',
      type: 'paragraph',
      content: 'Open **src/data/FoundersConfig.json**, the file from [Make it yours](/article/setup-identity). Near the bottom is **baseline**. The hourly rate is the middle of the **pay** you list, divided by **hoursPerYear**:'
    },
    {
      id: 'pay-code',
      type: 'code',
      content: '  "baseline": {\n    "source": "my own projects, hours from my time tracking",\n    "measured": "2026-10-17",\n    "pay": [\n      { "label": "freelance web designer", "yearly": 85000 },\n      { "label": "small agency developer", "yearly": 95000 }\n    ],\n    "hoursPerYear": 2080,\n    "llmPerHour": 0.92,\n    "projects": [\n      { "id": "soap-shop", "hours": 40 }\n    ]\n  }',
      metadata: { language: 'json', emphasis: true, caption: '(85,000 + 95,000) / 2 / 2,080 hours = $43.27 an hour' }
    },
    {
      id: 'pay-rules',
      type: 'list',
      content: '**pay** — one or more yearly salaries for work like yours, each with a label saying whose it is. Numbers only: no $ sign, commas or quotes|**hoursPerYear** — 2080 is 52 weeks of 40 hours. Use fewer if you build part time|**llmPerHour** — what an hour of building costs you in an LLM. Your Claude usage page divided by the hours you worked that month is a good first number|**source** and **measured** — a line on where the numbers come from, and the day you measured them',
      metadata: { style: 'accent' }
    },
    {
      id: 'divider-yours',
      type: 'divider'
    },
    {
      id: 'yours-heading',
      type: 'heading',
      content: '3️⃣ Add Your Own Projects'
    },
    {
      id: 'yours-para',
      type: 'paragraph',
      content: 'The **projects** list is what Goal Budget offers under LIKE.: things you have built, with the hours they really took. Use your project ids from **projects** when you have them, so their covers show. Three good ways to get the hours:'
    },
    {
      id: 'yours-list',
      type: 'list',
      content: '**Track them** — Expensd on the runway page keeps time as you work, and Goal Budget can follow it live|**Count them** — your calendar, invoices, or a rough honest guess. A guess you can defend beats a number you can not|**Measure them** — if your projects live on GitHub, your LLM can count work sessions from your commit history (prompt below)',
      metadata: { numbered: true }
    },
    {
      id: 'check-code',
      type: 'code',
      content: '# Check the file, then look at Goal Budget\nnpm run check:identity\nnpm run dev\n# open localhost:3000/goal-budget',
      metadata: { language: 'bash', caption: 'The checker catches a $ sign, commas, a written-out date, or the same id twice' }
    },
    {
      id: 'divider-rhythm',
      type: 'divider'
    },
    {
      id: 'rhythm-heading',
      type: 'heading',
      content: '4️⃣ Show When You Work'
    },
    {
      id: 'rhythm-para',
      type: 'paragraph',
      content: 'The last part of **baseline** is **rhythm**: when the hours happened, a year at a time. The one your copy ships with is mine, every commit I made from 2024 on, counted by the hour of the day and the day of the week. It is a record of what it took, so it never changes unless you change it. Measure your own from your commit history with one command, then have your LLM count it (prompt below), or delete **rhythm** to leave it out.'
    },
    {
      id: 'rhythm-code',
      type: 'code',
      content: '# In each project folder: one line per commit, as year, weekday (1 is Monday), hour\ngit log --all --no-merges --author="you@example.com" \\\n  --date=format:"%Y %u %H" --format="%ad" >> ~/rhythm.txt',
      metadata: { language: 'bash', caption: 'Use the email you commit with. Run it in every project, then hand ~/rhythm.txt to your LLM' }
    },
    {
      id: 'rhythm-shape',
      type: 'code',
      content: '    "rhythm": [\n      { "year": 2026, "commits": 120, "through": "2026-10-18",\n        "hours": [0, 0, 0, 0, 0, 0, 0, 0, 2, 6, 9, 11, 14, 12, 10, 9, 8, 7, 9, 10, 8, 4, 1, 0],\n        "days": [22, 25, 20, 24, 18, 6, 5] }\n    ]',
      metadata: { language: 'json', caption: 'hours: 24 numbers from midnight. days: 7 numbers, Monday first. through: only for a year that is not over' }
    },
    {
      id: 'divider-llm',
      type: 'divider'
    },
    {
      id: 'llm-heading',
      type: 'heading',
      content: '🤖 Ask Your LLM'
    },
    {
      id: 'llm-para',
      type: 'paragraph',
      content: 'If you do not know what work like yours pays, or how long your projects took, your LLM can draft a baseline for your market. Check its numbers against a source you trust before you keep them:'
    },
    {
      id: 'llm-prompts',
      type: 'code',
      content: 'I build [what you build] for [who you build for] in [your city or\ncountry]. Give me two yearly salaries for work like mine, each with a\nlabel and where the number comes from, and how many hours a year I\nshould count if I build [full time / about N hours a week].\n\nWrite them as this JSON, numbers without $ signs or commas:\n{ "pay": [{ "label": "...", "yearly": 0 }], "hoursPerYear": 0 }\n\nHere is my git log (git log --format="%an %ad" --date=iso). Group\ncommits less than 2 hours apart into work sessions, count 15 minutes\nfor a session with one commit, and tell me the total hours.\n\nHere is my rhythm.txt, one commit per line as year, weekday (1 is\nMonday) and hour. For each year, count the commits in each hour from\n0 to 23 and on each weekday from Monday to Sunday, and write them as\n{ "year": 0, "commits": 0, "hours": [24 numbers], "days": [7 numbers] }\nin a list named "rhythm", oldest year first.',
      metadata: { language: 'prompt', emphasis: true, caption: 'Copy any of these into Claude, or any LLM you use' }
    },
    {
      id: 'warning-list',
      type: 'list',
      content: 'An LLM\'s salary is an estimate. Ask where it comes from, and prefer a number you can look up|Price your hours honestly, not hopefully: the baseline is what the work is worth, not what you wish it were|Your baseline is public on your site through Goal Budget. Leave out anything you would not show a customer',
      metadata: { style: 'accent' }
    },
    {
      id: 'done-heading',
      type: 'heading',
      content: '✅ You Are Done When'
    },
    {
      id: 'done-list',
      type: 'list',
      content: '**npm run check:identity** passes, and no longer says the baseline is still mine (or you chose to keep it)|Goal Budget\'s BUILD. shows your hourly rate under the price|LIKE. lists your projects, with the hours they took|Expensd starts at your rate, and says it is from your baseline|**rhythm** holds your years, or you deleted it'
    },
    {
      id: 'next-para',
      type: 'paragraph',
      content: 'Next, if you want to sell what you build, [connect Polar](/article/setup-payments). Your baseline is a good place to start a price from.'
    },
    {
      id: 'closing-quote',
      type: 'quote',
      content: 'Know what the work is worth before anyone tells you.',
      metadata: { author: 'unparty-app', style: 'minimal' }
    }
  ]
};
