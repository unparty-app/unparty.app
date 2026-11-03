import type { EditorialArticle } from '../types';

// A step-by-step for capping what the site's own Anthropic key can spend
// (src/lib/llm.ts path 2). Linked from setup-get-your-claude's "Claude in
// Your Site". Console steps from Anthropic's "Creating and managing
// workspaces" (support.claude.com, updated June 30, 2026)
export const SET_A_CLAUDE_SPEND_LIMIT_ARTICLE: EditorialArticle = {
  slug: 'set-a-claude-spend-limit',
  title: 'SET A SPEND LIMIT.',
  subtitle: 'Give your site its own Anthropic workspace, its own key and a monthly cap, so a busy day can\'t surprise you.',
  description: 'Step by step: create an Anthropic workspace for your site, make its API key inside it, set a monthly spend limit and an email alert in the Claude Console, then connect the key to your site and Vercel.',
  category: 'APPS',
  date: '2026-10-12',
  updated: '2026-11-02',
  published: true,
  author: 'justin-murry',
  coverImage: '/covers/cover-001.png',
  readTime: '5 min',
  tags: ['Claude', 'Anthropic', 'Spend Limit', 'API Key', 'Vercel', 'Non-Technical Founders', 'AI Builders'],
  sections: [
    {
      id: 'hero',
      type: 'hero',
      content: 'know what it can cost.'
    },
    {
      id: 'intro',
      type: 'paragraph',
      content: 'When your site uses your own Anthropic key, every reply under a thought and every "say it in your own words" is a small charge to your account. It\'s fractions of a cent each, and your site already limits how many one person can ask for. A spend limit is the last line: a monthly number your site can\'t go past. It takes five minutes, and you do it once.',
      metadata: { size: 'large', dropCap: false }
    },
    {
      id: 'why',
      type: 'personal',
      content: 'I give my site its own workspace. Its key, its spending and its limit stay separate from everything else I use Claude for, so I always know what the site costs.',
      metadata: { avatar: true }
    },
    {
      id: 'workspace-heading',
      type: 'heading',
      content: '1️⃣ Make a workspace for your site'
    },
    {
      id: 'workspace-steps',
      type: 'list',
      content: 'Sign in to the Claude Console at [platform.claude.com](https://platform.claude.com)|Go to **Settings → Workspaces**|Click **Add Workspace**, near the top right|Name it after your site, pick a color, and click **Create**',
      metadata: { numbered: true }
    },
    {
      id: 'workspace-note',
      type: 'paragraph',
      content: 'Only an organization admin can create workspaces. If you made the account, that\'s you.'
    },
    {
      id: 'key-heading',
      type: 'heading',
      content: '2️⃣ Make your site\'s key inside it'
    },
    {
      id: 'key-steps',
      type: 'list',
      content: 'Open your new workspace from the **Workspaces** list|Click the **API Keys** tab|Click **Create Key**, give it a name that helps you easily identify where it is being used like "app-v1", then click **Create Key** again|Copy the key. It should start with **sk-ant-**, this key is secure so make sure you copy it because you will not be able to view it again',
      metadata: { numbered: true }
    },
    {
      id: 'key-note',
      type: 'paragraph',
      content: 'The key belongs to the workspace it was made in and can\'t move. This is why setting your limit is important: the workspace\'s limit is this key\'s limit.'
    },
    {
      id: 'limit-heading',
      type: 'heading',
      content: '3️⃣ Set the monthly limit'
    },
    {
      id: 'limit-steps',
      type: 'list',
      content: 'Still in your workspace, click the **Limits** tab|Next to the spend limit, choose **Change Limit**|Enter the most your site may spend in a month, and save',
      metadata: { numbered: true }
    },
    {
      id: 'limit-rules',
      type: 'list',
      content: '**It has to be lower than your organization\'s limit.** Until you set one, a workspace uses the organization\'s|**Back to the organization\'s limit?** Click the **Refresh** icon next to it|**Both limits always apply.** Anthropic checks the workspace\'s and the organization\'s on every request'
    },
    {
      id: 'alert-heading',
      type: 'heading',
      content: '4️⃣ Get an email before you reach it'
    },
    {
      id: 'alert-para',
      type: 'paragraph',
      content: 'On the same **Limits** tab, choose **Add notification** and pick an amount below your limit, like half of it. You\'ll get an email when your site gets there, while there\'s still room to decide.'
    },
    {
      id: 'connect-heading',
      type: 'heading',
      content: '5️⃣ Connect the key to your site'
    },
    {
      id: 'connect-env',
      type: 'code',
      content: '# .env in your copy\nANTHROPIC_API_KEY="sk-ant-..."',
      metadata: { language: 'bash', caption: 'Restart npm run dev after saving' }
    },
    {
      id: 'connect-vercel',
      type: 'paragraph',
      content: 'Then give Vercel its own copy, from your project folder. It asks you to paste the key, so it never lands in your terminal history. Redeploy afterwards so your live site picks it up:'
    },
    {
      id: 'connect-vercel-code',
      type: 'code',
      content: 'vercel env add ANTHROPIC_API_KEY production',
      metadata: { language: 'bash' }
    },
    {
      id: 'outside-note',
      type: 'personal',
      content: 'Using a key you made before you had a workspace? Anthropic rejects it unless it names one. Add the workspace\'s ID (it starts with wrkspc_) as **ANTHROPIC_WORKSPACE_ID** in both places, or make a new key inside the workspace (step 2).',
      metadata: { avatar: true }
    },
    {
      id: 'reached-heading',
      type: 'heading',
      content: 'when your site reaches it'
    },
    {
      id: 'reached-para',
      type: 'paragraph',
      content: 'Anthropic stops answering your key\'s requests and says when access comes back. Your site keeps working: thoughts still post, and "where are you starting from?" still takes a pick. They just go without the model\'s part until the month turns or you raise the limit. Visitors who use their own key aren\'t affected; they never touch yours.'
    },
    {
      id: 'next',
      type: 'personal',
      content: 'Back to GET YOUR CLAUDE., where this key turns on replies in your site.',
      metadata: { avatar: true, storyLink: '/article/setup-get-your-claude' }
    },
    {
      id: 'sources-heading',
      type: 'heading',
      content: 'sources.',
      metadata: { size: 'small' }
    },
    {
      id: 'sources-list',
      type: 'list',
      content: '[Creating and managing workspaces](https://support.claude.com/en/articles/9796807-creating-and-managing-workspaces), Anthropic, updated June 30, 2026'
    }
  ]
};
