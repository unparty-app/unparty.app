import type { EditorialArticle } from '../types';

// SETUP. curriculum step 2, optional (prisma/setup-steps.ts `add-an-llm`, #1094).
// Plans, install, auth and credits checked on 2026-09-28 against claude.com/pricing,
// code.claude.com/docs/en/{setup,authentication,costs}, and support.claude.com
// article 8977456 (paying for API usage). Recheck prices and commands when editing.
export const SETUP_GET_YOUR_CLAUDE_ARTICLE: EditorialArticle = {
  slug: 'setup-get-your-claude',
  title: 'GET YOUR CLAUDE.',
  subtitle: 'An optional step worth taking early: a partner who can read your errors, explain your files, and walk you through every setup screen after this one.',
  description: 'How non-technical founders and small business owners set up Claude as a building partner: create a Claude account, choose between the Free plan, Pro, and pay-as-you-go API credits, install Claude Code, turn on Claude in GitHub, and keep safe habits with an LLM in your own codebase.',
  category: 'SETUP.',
  date: '2026-09-28',
  updated: '2026-11-03',
  published: true,
  author: 'justin-murry',
  readTime: '8 min',
  tags: ['Claude', 'Claude Code', 'Claude API', 'LLM', 'Setup', 'Non-Technical Founders', 'AI Builders'],
  sections: [
    {
      id: 'hero-partner',
      type: 'hero',
      content: 'you do not have to build alone.',
      metadata: { style: 'highlight' }
    },
    {
      id: 'intro',
      type: 'paragraph',
      content: 'This step is optional. unparty works without a large language model, and it always will. But the next few steps (installing tools, creating a database, deploying your site) are where most people get stuck, usually on one confusing error message. A partner that can read that error, explain it in plain words, and tell you the next click changes how those steps feel. That partner is what this step sets up, and we recommend Claude.',
      metadata: { dropCap: true }
    },
    {
      id: 'built-with-note',
      type: 'personal',
      content: 'unparty-app was built with Claude, mostly through the API in a terminal, one session at a time. You stay in control: Claude suggests, you decide. More on that in KNOW YOUR LLM.',
      metadata: { avatar: true }
    },
    {
      id: 'two-ways-heading',
      type: 'heading',
      content: '🧭 Two Ways to Use Claude'
    },
    {
      id: 'two-ways-table',
      type: 'table',
      metadata: {
        headers: ['', 'Claude (chat)', 'Claude Code'],
        rows: [
          ['What it is', 'A conversation in your browser or the desktop app', 'Claude working directly inside your copy of the code'],
          ['Good for', 'Explaining errors, screenshots, and setup screens', 'Finding, explaining, and changing files in your project'],
          ['How you pay', 'Free works', 'Pro or higher, or API credits'],
          ['When to set it up', 'Now', 'Now, or after you get your copy']
        ]
      }
    },
    {
      id: 'challenge-claude',
      type: 'challenge',
      userPrompt: 'GET YOUR CLAUDE.',
      label: 'BUILD.',
      pollEnabled: false,
      stepOne: { emoji: '1️⃣', action: 'Sign up.', description: 'Create your Claude account.' },
      stepTwo: { emoji: '2️⃣', action: 'Pick a plan.', description: 'Free, Pro, or pay as you go.' },
      stepThree: { emoji: '3️⃣', action: 'Say hello.', description: 'Ask your first question.' },
      successMetric: 'you have a partner.'
    },
    {
      id: 'divider-account',
      type: 'divider'
    },
    {
      id: 'account-heading',
      type: 'heading',
      content: '1️⃣ Create Your Account'
    },
    {
      id: 'account-para',
      type: 'paragraph',
      content: 'Go to [claude.ai](https://claude.ai) and sign up with your email or Google account. Use the same business email you used for GitHub so everything about your build lives in one place. Then get the desktop app from [claude.com/download](https://claude.com/download). It keeps Claude one click away while you work, and it can run Claude Code without a terminal.'
    },
    {
      id: 'plan-heading',
      type: 'heading',
      content: '2️⃣ Choose How You Pay'
    },
    {
      id: 'plan-para',
      type: 'paragraph',
      content: 'There are three ways in, and you can switch any time. **Claude Code is not included in the Free plan.** Prices below are as of September 2026. Check [claude.com/pricing](https://claude.com/pricing) for current ones.'
    },
    {
      id: 'plan-table',
      type: 'table',
      metadata: {
        headers: ['', 'Free', 'Pro', 'API credits'],
        rows: [
          ['Cost', '$0', '$20 a month, or $17 a month billed yearly', 'Pay for what you use, from prepaid credits'],
          ['Chat', 'Yes', 'Yes', 'Playground only (in the Console)'],
          ['Claude Code', 'No', 'Yes, within your plan\'s usage limits', 'Yes, billed per use'],
          ['Claude in GitHub, as your copy ships', 'No', 'No', 'Yes (see below)'],
          ['Best for', 'Getting explanations while you click', 'Steady weekly building at a fixed price', 'Building in bursts, and automations']
        ]
      }
    },
    {
      id: 'plan-list',
      type: 'list',
      content: '**Start on Free** if you mostly want someone to explain things while you do the clicking. Upgrade when you want Claude inside your code|**Choose Pro** for a predictable monthly price. Usage resets on a schedule, so a heavy day can hit a limit, and it resets|**Choose API credits** if your building comes in bursts. Sign up at [platform.claude.com](https://platform.claude.com), then **Settings → Billing → Buy credits**. Credits are non-refundable and expire one year after purchase, so start small|**Were you given a guest pass?** Redeem it when you sign up, and note when its trial ends',
      metadata: { style: 'accent' }
    },
    {
      id: 'both-note',
      type: 'personal',
      content: 'You can have both. I use Pro and API credits side by side. Just know which one a session is billing (see the tip under step 3).',
      metadata: { avatar: true }
    },
    {
      id: 'code-heading',
      type: 'heading',
      content: '3️⃣ Install Claude Code'
    },
    {
      id: 'code-para',
      type: 'paragraph',
      content: 'Skip this if you are staying on Free. The easiest way is the desktop app you just installed, which runs Claude Code without a terminal. If you would rather use the terminal (you will be in it for the next steps anyway), paste the command for your computer:'
    },
    {
      id: 'code-install',
      type: 'code',
      content: '# Mac (Terminal app)\ncurl -fsSL https://claude.ai/install.sh | bash\n\n# Windows (PowerShell)\nirm https://claude.ai/install.ps1 | iex',
      metadata: { language: 'bash', caption: 'From Anthropic\'s setup guide at code.claude.com/docs/en/setup' }
    },
    {
      id: 'code-verify-para',
      type: 'paragraph',
      content: 'Close the terminal, open a new one, and check that it worked. A version number means you are set. The first time you run **claude**, it opens your browser to sign in: choose your **Claude account** for Pro, or your **Anthropic Console account** for API credits.'
    },
    {
      id: 'code-verify',
      type: 'code',
      content: '# Prints a version number if the install worked\nclaude --version\n\n# Start Claude Code inside a project folder\ncd ~/Projects/your-project\nclaude',
      metadata: { language: 'bash', caption: 'You get your copy of unparty-app in the next step. Run claude inside it once it arrives' }
    },
    {
      id: 'billing-tips',
      type: 'list',
      content: '**See which account you are billing** — type **/status** inside Claude Code|**See what a session cost (API credits)** — type **/usage**, or check [platform.claude.com/usage](https://platform.claude.com/usage)|**Cap your spend (API credits)** — your first Console sign-in creates a workspace called "Claude Code". Set a spend limit on it in the Console|**Watch for ANTHROPIC_API_KEY** — if that variable is set in your terminal and you approve it, Claude Code bills your API credits instead of Pro. Run **unset ANTHROPIC_API_KEY** to go back to your plan',
      metadata: { style: 'accent' }
    },
    {
      id: 'divider-github',
      type: 'divider'
    },
    {
      id: 'github-heading',
      type: 'heading',
      content: '🐙 Claude in Your GitHub (Optional, API Credits)'
    },
    {
      id: 'github-para',
      type: 'paragraph',
      content: 'Your copy of unparty-app comes with Claude wired into GitHub. Two workflows are already in your repository, and neither does anything until you ask:'
    },
    {
      id: 'github-list',
      type: 'list',
      content: '**Mention @claude** in an issue or a pull request comment, and Claude answers there, reading your code and your CI results|**Add the LLM. label** to a pull request, and Claude reviews it for bugs, security, and performance'
    },
    {
      id: 'github-setup-para',
      type: 'paragraph',
      content: 'As they ship, they run on API credits, so they need an API key saved in GitHub. Once your repository arrives in the next step:'
    },
    {
      id: 'github-setup-steps',
      type: 'list',
      content: 'In the Console at [platform.claude.com](https://platform.claude.com), create an API key and copy it|In your repository on GitHub, open **Settings → Secrets and variables → Actions**|Click **New repository secret**, name it **ANTHROPIC_API_KEY**, and paste the key|Test it: comment **@claude what does this repository do?** on any issue',
      metadata: { numbered: true }
    },
    {
      id: 'divider-site',
      type: 'divider'
    },
    {
      id: 'site-heading',
      type: 'heading',
      content: '🧠 Claude in Your Site (Optional, API Credits)'
    },
    {
      id: 'site-para',
      type: 'paragraph',
      content: 'Your site can use a model too, for two things: a short reply under a thought someone leaves on an article, and "where are you starting from?" on your founder page understanding someone\'s own words, not just the choices. Without a model, both still work, just without the model\'s part. To turn it on with your own Anthropic key:'
    },
    {
      id: 'site-steps',
      type: 'list',
      content: 'In the Console at [platform.claude.com](https://platform.claude.com), open a **workspace** (or create one, like "my site") and create an API key inside it. A key made outside a workspace also needs that workspace\'s ID as **ANTHROPIC_WORKSPACE_ID**|Set a **spend limit** on that workspace, so a busy day can\'t surprise you: [SET A SPEND LIMIT.](/article/set-a-claude-spend-limit) walks through it|Add the key to **.env** in your copy (below), then restart **npm run dev**|Add the same key to Vercel: **Settings → Environment Variables**, or from the terminal with **vercel env add ANTHROPIC_API_KEY production**. Then redeploy',
      metadata: { numbered: true }
    },
    {
      id: 'site-env',
      type: 'code',
      content: '# .env\nANTHROPIC_API_KEY="sk-ant-..."\n# Optional: a different Claude model (defaults to claude-haiku-5-5)\n# ANTHROPIC_MODEL="claude-haiku-5-5"\n# Only for a key made outside a workspace\n# ANTHROPIC_WORKSPACE_ID="wrkspc_..."',
      metadata: { language: 'bash', caption: 'Your .env stays on your computer and out of git. Vercel keeps its own copy' }
    },
    {
      id: 'site-notes',
      type: 'list',
      content: '**Replies are limited per person** on your key, so one visitor can\'t run up your bill|**Visitors can bring their own key** — "use your own key" lets someone paste their Anthropic key. It stays in their browser tab and goes straight to Anthropic, so it never costs you anything|**Prefer other models?** Use Vercel AI Gateway instead: set **AI_GATEWAY_MODEL** (from [the model list](https://ai-gateway.vercel.sh/v1/models)) and **AI_GATEWAY_API_KEY**, and cap spend with Gateway budgets. If both are set, your Anthropic key is used first|**This key is not your terminal\'s** — it lives in **.env**, which your site reads and your terminal does not, so it doesn\'t switch Claude Code to API credits (see the tip under step 3)'
    },
    {
      id: 'divider-habits',
      type: 'divider'
    },
    {
      id: 'habits-heading',
      type: 'heading',
      content: '🔑 Safe Habits With Any LLM'
    },
    {
      id: 'habits-list',
      type: 'list',
      content: '**Never paste your keys** — your API key goes in GitHub secrets, and the values in your .env file (database, sign-in, payments) stay out of every chat. Describe a key instead: "my Clerk secret key"|**Ask before it changes anything** — start with "explain, don\'t change anything yet," then approve changes one at a time|**Read what you approve** — Claude Code asks before editing files or running commands. That pause is for you, so use it|**Check its work** — Claude can be confidently wrong. If an answer does not match what you see on screen, say so and ask again|**Clear between tasks** — type **/clear** when you switch to something unrelated. Long conversations cost more on every message',
      metadata: { style: 'accent' }
    },
    {
      id: 'prompts-heading',
      type: 'heading',
      content: '🤖 Your First Prompts'
    },
    {
      id: 'prompts-para',
      type: 'paragraph',
      content: 'Start with the setup itself. These work in the chat and in Claude Code:'
    },
    {
      id: 'prompts',
      type: 'code',
      content: 'I am a non-technical founder setting up a Next.js website from a\ncodebase I own. I will go step by step and paste errors as I hit\nthem. Explain each one in plain words before suggesting a fix.\n\nHere is a screenshot of the screen I am stuck on. What does it want\nfrom me, and what should I click next?\n\n(In Claude Code, inside your copy)\nGive me a tour of this project. Which folders matter for changing\nwhat my homepage says? Explain, don\'t change anything.',
      metadata: { language: 'prompt', emphasis: true, caption: 'Copy any of these and swap in your own details' }
    },
    {
      id: 'done-heading',
      type: 'heading',
      content: '✅ You Are Done When'
    },
    {
      id: 'done-list',
      type: 'list',
      content: 'You can open Claude and get an answer to a question|You know how you are paying: Free, Pro, or API credits|If you chose Pro or API credits: **claude --version** prints a version number, and **/status** shows the account you expect'
    },
    {
      id: 'closing-para',
      type: 'paragraph',
      content: 'Keep Claude open for the rest of setup. Next up is **Get your copy**: one button puts your repository in the GitHub account you set up in [the last step](/article/setup-github), and then Claude Code has something to work in.'
    },
    {
      id: 'final-quote',
      type: 'quote',
      content: 'Ask for the explanation before the answer.',
      metadata: { author: 'unparty-app', style: 'minimal' }
    }
  ]
};
