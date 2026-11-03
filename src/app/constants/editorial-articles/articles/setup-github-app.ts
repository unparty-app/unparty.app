import type { EditorialArticle } from '../types';

// SETUP. curriculum, optional step `github-app` (prisma/setup-steps.ts, #1106). The
// buyer's own GitHub App, never unparty's (#1193, closed: software you own means no
// dependency on unparty). /api/repo-data lists GET /installation/repositories, so it
// works for a personal account or an organization and shows only the repos picked at
// install. /founders no longer shows repos (it is the founder's resume, computed
// from the site); the reader-facing "founders page" lines below are still to update. Keys: GITHUB_APP_ID, GITHUB_APP_INSTALLATION_ID, and the private key as
// GITHUB_APP_PRIVATE_KEY (Vercel: the .pem as is; .env: \n on one line) or
// GITHUB_APP_PRIVATE_KEY_PATH locally (*.pem is gitignored). Write permissions are only
// for the optional extras: Discussions (waitlist review, setup-waitlist) and Contents +
// Pull requests on the site's own repo (daily snapshot PRs, siteRepo() in src/lib/github.ts).
export const SETUP_GITHUB_APP_ARTICLE: EditorialArticle = {
  slug: 'setup-github-app',
  title: 'GITHUB APP.',
  subtitle: 'Show the work behind your site, live from GitHub, with an app you own.',
  description: 'How non-technical founders connect their own Next.js site to GitHub with a GitHub App of their own: create it with read-only access, install it on the repositories you choose, and add its three keys.',
  category: 'SETUP.',
  date: '2026-10-05',
  published: true,
  author: 'justin-murry',
  readTime: '9 min',
  tags: ['GitHub', 'GitHub App', 'Repositories', 'Setup', 'Non-Technical Founders', 'Software You Own'],
  sections: [
    {
      id: 'hero-github-app',
      type: 'hero',
      content: 'your work, shown live.',
      metadata: { style: 'highlight' }
    },
    {
      id: 'intro',
      type: 'paragraph',
      content: 'Your [founders page](/founders) can show the repositories behind your work: their stars, the languages they are written in, a preview of each README and the latest release, updated every time someone visits. For that, your site needs permission to read your GitHub. You give it with a **GitHub App**: a small app that you create in your own GitHub account, that only reads the repositories you choose, and that you can remove at any time.',
      metadata: { dropCap: true }
    },
    {
      id: 'shows-table',
      type: 'table',
      metadata: {
        headers: ['Your site shows', 'Read from'],
        rows: [
          ['Stars, forks and watchers', 'Each repository you install the app on'],
          ['Languages', 'What GitHub counts in each repository'],
          ['A README preview', 'The start of each README'],
          ['The latest release', 'Each repository\'s releases']
        ]
      }
    },
    {
      id: 'own-list',
      type: 'list',
      content: '**It is your app** — you create it, it lives in your GitHub account, and nobody else has its keys|**It can only read** — this step gives it no permission to change anything|**It sees only what you pick** — repositories you do not choose stay invisible to it|**Without it, nothing breaks** — your founders page still shows everything else',
      metadata: { style: 'accent' }
    },
    {
      id: 'challenge-github-app',
      type: 'challenge',
      userPrompt: 'GITHUB APP.',
      label: 'BUILD.',
      pollEnabled: false,
      stepOne: { emoji: '1️⃣', action: 'Create.', description: 'A read-only app of your own.' },
      stepTwo: { emoji: '2️⃣', action: 'Install.', description: 'On the repos you choose.' },
      stepThree: { emoji: '3️⃣', action: 'Keys.', description: 'Three of them, in two places.' },
      successMetric: 'your founders page shows live stars and languages.'
    },
    {
      id: 'before-list',
      type: 'list',
      content: '**Your GitHub account** — from [GitHub](/article/setup-github)|**Your GitHub name in your identity** — the **github** line from [Your identity](/article/setup-identity) must be the account or organization you install the app on. Your founders page only shows repositories it owns|**Your site on Vercel** — from [Deploy](/article/setup-deploy)',
      metadata: { style: 'accent' }
    },
    {
      id: 'divider-create',
      type: 'divider'
    },
    {
      id: 'create-heading',
      type: 'heading',
      content: '1️⃣ Create Your App'
    },
    {
      id: 'create-where',
      type: 'paragraph',
      content: 'Create it where your repositories live. For your own account, click your picture in GitHub, then **Settings → Developer settings → GitHub Apps → New GitHub App**. For an organization, open the organization\'s **Settings**, then **Developer settings → GitHub Apps → New GitHub App**.'
    },
    {
      id: 'create-steps',
      type: 'list',
      content: '**GitHub App name**: anything no one else on GitHub has used, like **yourname-site**|**Homepage URL**: your site\'s address|Under **Webhook**, uncheck **Active**. This step does not need one|Under **Permissions → Repository permissions**, set **Contents** to **Read-only**. **Metadata** turns to Read-only by itself|Under **Where can this GitHub App be installed?**, choose **Only on this account**|Click **Create GitHub App**',
      metadata: { numbered: true }
    },
    {
      id: 'create-key',
      type: 'paragraph',
      content: 'You land on your app\'s settings page. Write down the **App ID** near the top. Then scroll to **Private keys** and click **Generate a private key**. Your browser downloads a file ending in **.pem**. It is the app\'s password: keep it safe, and never send it to anyone.'
    },
    {
      id: 'divider-install',
      type: 'divider'
    },
    {
      id: 'install-heading',
      type: 'heading',
      content: '2️⃣ Install It on the Repos You Choose'
    },
    {
      id: 'install-steps',
      type: 'list',
      content: 'On your app\'s settings page, click **Install App** in the left menu|Click **Install** next to your account or organization|Choose **Only select repositories** and pick the ones you want on your founders page|Click **Install**|Look at the address bar. It ends in a number, like **/installations/12345678**. That number is your **installation ID**',
      metadata: { numbered: true }
    },
    {
      id: 'install-later',
      type: 'personal',
      content: 'To show another repository later, open the same installation page, add it, and save. You do not need new keys.'
    },
    {
      id: 'divider-keys',
      type: 'divider'
    },
    {
      id: 'keys-heading',
      type: 'heading',
      content: '3️⃣ Add the Three Keys'
    },
    {
      id: 'keys-local',
      type: 'paragraph',
      content: 'On your computer, move the .pem file into your project folder. Git leaves every .pem file out, so it never reaches GitHub. Then add three lines to **.env**:'
    },
    {
      id: 'keys-local-code',
      type: 'code',
      content: '# .env\nGITHUB_APP_ID="123456"\nGITHUB_APP_INSTALLATION_ID="12345678"\nGITHUB_APP_PRIVATE_KEY_PATH="./yourname-site.2026-10-05.private-key.pem"',
      metadata: { language: 'bash', emphasis: true, caption: 'Use your own numbers and file name. Restart npm run dev after changing .env' }
    },
    {
      id: 'keys-vercel',
      type: 'paragraph',
      content: 'Your live site has no file, so on Vercel the key goes in as text. Open your project\'s **Settings → Environment Variables** and add **GITHUB_APP_ID** and **GITHUB_APP_INSTALLATION_ID** with the same numbers. Then add **GITHUB_APP_PRIVATE_KEY**: open the .pem file in your editor, copy everything in it, from the first dash to the last, and paste it as the value. Redeploy.'
    },
    {
      id: 'keys-cli',
      type: 'paragraph',
      content: 'If you use the Vercel command line, it can read the key straight from the file, so nothing gets lost in copying:'
    },
    {
      id: 'keys-cli-code',
      type: 'code',
      content: 'vercel env add GITHUB_APP_ID production\nvercel env add GITHUB_APP_INSTALLATION_ID production\nvercel env add GITHUB_APP_PRIVATE_KEY production < yourname-site.2026-10-05.private-key.pem',
      metadata: { language: 'bash', caption: 'The first two ask you to type the number. Run vercel link once first, in your project folder' }
    },
    {
      id: 'keys-check',
      type: 'paragraph',
      content: 'Open your founders page. Your repositories now show their stars, languages and README previews. The first visit takes a little longer while your site reads GitHub; after that it remembers what it read for an hour.'
    },
    {
      id: 'later-heading',
      type: 'heading',
      content: '🐙 Later: More Your App Can Do'
    },
    {
      id: 'later-para',
      type: 'paragraph',
      content: 'The same app can do two more things, each only if you give it one more permission. Change permissions on your app\'s settings page under **Permissions & events**, then accept the change on the installation page.'
    },
    {
      id: 'later-table',
      type: 'table',
      metadata: {
        headers: ['To', 'Add', 'Then'],
        rows: [
          ['Review your waitlist in GitHub', 'Discussions: Read and write', 'Follow the GitHub part of [Let people in](/article/setup-waitlist)'],
          ['Save your site\'s daily snapshots', 'Contents and Pull requests: Read and write', 'Install the app on your site\'s own repository too']
        ]
      }
    },
    {
      id: 'later-snapshots',
      type: 'paragraph',
      content: 'Daily snapshots are small data files your site saves to its own repository every morning, each as a pull request. Without write access, those daily jobs log an error and stop there. Nothing on your site changes.'
    },
    {
      id: 'know-heading',
      type: 'heading',
      content: '⚠️ Good to Know'
    },
    {
      id: 'know-list',
      type: 'list',
      content: '**The private key is the app** — anyone with the .pem file can act as your app. If you ever share it by mistake, delete it under **Private keys**, generate a new one and replace it in .env and Vercel|**Private repositories stay private** — the app reads them, and your founders page shows what you installed it on, so pick only what you are happy to show|**You can switch it off any time** — uninstall the app, or delete it, and your site goes back to how it was',
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
      content: '**Founders page shows no live numbers** — check the github line in FoundersConfig.json matches the account you installed on|**GitHub App not configured** — one of the three keys is missing where you tested. Restart npm run dev, or redeploy after adding it on Vercel|**No repositories found** — the app is installed on no repositories, or the installation ID belongs to a different installation. Open the installation page and check both|**A key error in your logs** — the key lost its line breaks. On Vercel, paste the .pem contents again exactly, or use the command line above|**A repository is missing** — add it on the installation page. Your site remembers its list for an hour, so give it time'
    },
    {
      id: 'llm-heading',
      type: 'heading',
      content: '🤖 Ask Your LLM'
    },
    {
      id: 'llm-prompts',
      type: 'code',
      content: 'I am creating a GitHub App so my website can read my repositories.\nI am on this GitHub screen: [describe it or paste the text].\nWalk me through what to fill in. It should only be able to read.\n\nWhich of my repositories should I show on my founders page? Here\nis what each one is: [list them]. I want to show [say what].',
      metadata: { language: 'prompt', emphasis: true, caption: 'Never paste your private key into a chat' }
    },
    {
      id: 'done-heading',
      type: 'heading',
      content: '✅ You Are Done When'
    },
    {
      id: 'done-list',
      type: 'list',
      content: 'A GitHub App of your own exists, with Contents set to Read-only|It is installed on the repositories you want to show|**.env** and Vercel both have GITHUB_APP_ID, GITHUB_APP_INSTALLATION_ID and the private key|Your founders page shows live stars and languages for those repositories'
    },
    {
      id: 'closing-para',
      type: 'paragraph',
      content: 'Your founders page now shows the real work, as it changes, from an app only you control. Next, a Slack message for every worksheet, with [Slack](/article/setup-slack).'
    },
    {
      id: 'final-quote',
      type: 'quote',
      content: 'Show the work. Keep the keys.',
      metadata: { author: 'unparty-app', style: 'minimal' }
    }
  ]
};
