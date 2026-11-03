import type { EditorialArticle } from '../types';

// SETUP. curriculum, optional step `observability` (prisma/setup-steps.ts, #1106).
// Two Vercel Drains (Team Settings → Drains; Pro and Enterprise only, $0.50 per GB)
// copy data into the owner's database: Web Analytics → /api/analytics/vercel
// (VercelPageview / VercelEvent) and Traces → /api/drains/traces (VercelTrace /
// VercelTraceSpan), both JSON, both signed with one DRAIN_SECRET (HMAC-SHA1,
// src/lib/vercel-drain-security.ts; unset in production, both refuse writes).
// /admin/observability reads them; /api/cron/db-cleanup keeps 30 days (spans 7).
// instrumentation.ts keeps 1 in 10 traces. Vercel Analytics and Google Analytics
// only load after cookie consent (AnalyticsGate); GA needs NEXT_PUBLIC_GA_ID.
export const SETUP_OBSERVABILITY_ARTICLE: EditorialArticle = {
  slug: 'setup-observability',
  title: 'ANALYTICS.',
  subtitle: 'See which pages people read and which requests break, in a dashboard on your own site.',
  description: 'How non-technical founders copy their page views and traces into their own database with Vercel Drains: turn on Web Analytics, add two drains with one secret, and read it all in /admin/observability.',
  category: 'SETUP.',
  date: '2026-10-01',
  published: true,
  author: 'justin-murry',
  readTime: '9 min',
  tags: ['Analytics', 'Observability', 'Vercel Drains', 'Tracing', 'Google Analytics', 'Setup', 'Non-Technical Founders', 'Software You Own'],
  sections: [
    {
      id: 'hero-observability',
      type: 'hero',
      content: 'who came. what broke.',
      metadata: { style: 'highlight' }
    },
    {
      id: 'intro',
      type: 'paragraph',
      content: 'Vercel already counts your visitors, on Vercel\'s dashboard. This step copies two streams of that data into your own database instead: **page views**, which pages people read and where they came from, and **traces**, how long each request took and which ones failed. You read both at **/admin/observability** on your own site, and the data is yours to keep.',
      metadata: { dropCap: true }
    },
    {
      id: 'streams-table',
      type: 'table',
      metadata: {
        headers: ['Stream', 'Tells you', 'Arrives at'],
        rows: [
          ['Web Analytics drain', 'Pages, visitors, countries, browsers', '/api/analytics/vercel'],
          ['Traces drain', 'Speed, slow pages, errors', '/api/drains/traces'],
          ['Google Analytics (optional)', 'Google\'s own reports', 'Google, not your database']
        ]
      }
    },
    {
      id: 'honest-list',
      type: 'list',
      content: '**Drains need Vercel Pro** — the free Hobby plan cannot add them. On Pro, drained data costs **$0.50 per GB**. A small site sends very little|**Only visitors who say yes are counted** — analytics loads after someone accepts your cookie banner. People who reject it are never tracked|**30 days, then it is gone** — a daily job deletes page views and traces older than 30 days, and trace details after 7, so your database stays small',
      metadata: { style: 'accent' }
    },
    {
      id: 'challenge-observability',
      type: 'challenge',
      userPrompt: 'ANALYTICS.',
      label: 'BUILD.',
      pollEnabled: false,
      stepOne: { emoji: '1️⃣', action: 'Turn on.', description: 'Web Analytics and one secret.' },
      stepTwo: { emoji: '2️⃣', action: 'Drain 2.', description: 'Page views and traces.' },
      stepThree: { emoji: '3️⃣', action: 'Look.', description: 'Your visit, on your dashboard.' },
      successMetric: 'your own visit shows up in /admin/observability.'
    },
    {
      id: 'before-list',
      type: 'list',
      content: '**Your site live on your domain** — from [Deploy](/article/setup-deploy) and [Your domain](/article/setup-domain). The cleanup job uses the CRON_SECRET you made there|**You are an admin** — from [Make yourself admin](/article/setup-make-yourself-admin). /admin/observability is admin only|**A Vercel Pro team** — in Vercel, open **Settings → Billing** to upgrade',
      metadata: { style: 'accent' }
    },
    {
      id: 'divider-on',
      type: 'divider'
    },
    {
      id: 'on-heading',
      type: 'heading',
      content: '1️⃣ Web Analytics and One Secret'
    },
    {
      id: 'on-steps',
      type: 'list',
      content: 'In Vercel, open your project and click **Analytics** in the sidebar|Click **Enable**. It starts with your next deploy|Open **Terminal** and run **openssl rand -hex 32**. Copy the long line it prints: this is your drain secret',
      metadata: { numbered: true }
    },
    {
      id: 'secret-para',
      type: 'paragraph',
      content: 'Both drains sign everything they send with this secret, and your site throws away anything unsigned. Put it in **.env**, add it to Vercel\'s Environment Variables for **Production**, then redeploy:'
    },
    {
      id: 'secret-code',
      type: 'code',
      content: '# .env\nDRAIN_SECRET="the line openssl printed"',
      metadata: { language: 'bash', emphasis: true, caption: 'One secret, used by both drains' }
    },
    {
      id: 'divider-drains',
      type: 'divider'
    },
    {
      id: 'drains-heading',
      type: 'heading',
      content: '2️⃣ Page Views and Traces'
    },
    {
      id: 'drains-para',
      type: 'paragraph',
      content: 'A **drain** is Vercel sending a copy of your data to an address you choose. Each drain carries one kind of data, so you make two. Drains live in your team\'s settings, not the project\'s.'
    },
    {
      id: 'drain-analytics-steps',
      type: 'list',
      content: 'In Vercel, open **Team Settings → Drains** and click **Add Drain**|Choose **Web Analytics**. Name it **page views**, and under projects pick **only this site**. With all projects, every site on your team lands in this database|Leave the sampling rate at **100%**. A lower rate sends less, and your dashboard counts drop with it|Under the destination, choose **Custom Endpoint**. For the URL, type your domain followed by **/api/analytics/vercel**, like https://yourname.com/api/analytics/vercel|Set **Format** to **JSON**|In **Signature Verification Secret**, delete the one Vercel made and paste your DRAIN_SECRET|Click **Create Drain**. Vercel tests the address right away',
      metadata: { numbered: true }
    },
    {
      id: 'drain-traces-para',
      type: 'paragraph',
      content: 'Now the second one. Same steps, three differences:'
    },
    {
      id: 'drain-traces-list',
      type: 'list',
      content: '**Data type: Traces** — name it **traces**, and again pick only this site|**URL ends in /api/drains/traces** — like https://yourname.com/api/drains/traces|**Format: JSON, not Protobuf** — your site cannot read Protobuf, and quietly drops it. Leave the sampling rules empty: your site already keeps only 1 in 10 traces',
      metadata: { style: 'accent' }
    },
    {
      id: 'drains-quote',
      type: 'quote',
      content: 'Same secret in three places: .env, Vercel, and both drains.',
      metadata: { author: 'unparty-app', style: 'highlight' }
    },
    {
      id: 'divider-look',
      type: 'divider'
    },
    {
      id: 'look-heading',
      type: 'heading',
      content: '3️⃣ Your Visit, on Your Dashboard'
    },
    {
      id: 'look-steps',
      type: 'list',
      content: 'Open your live site in a private window and click **Accept** on the cookie banner|Read a few pages. Drains send data in batches, so give it a few minutes|Sign in as yourself and open **/admin/observability**|Under **Analytics**, your pages are listed. **Unique Visitors**, **Total Traces** and **Performance** fill in as data arrives',
      metadata: { numbered: true }
    },
    {
      id: 'ga-heading',
      type: 'heading',
      content: '📈 Google Analytics, If You Want It'
    },
    {
      id: 'ga-para',
      type: 'paragraph',
      content: 'Your site can also send visits to Google Analytics, which has its own reports and keeps data longer. It is off until you give your site your own ID. It asks for consent through the same cookie banner.'
    },
    {
      id: 'ga-steps',
      type: 'list',
      content: 'At **analytics.google.com**, create an account and a property for your site|Add a **Web** data stream with your domain|Copy the **Measurement ID**. It starts with G-|Put it in .env as NEXT_PUBLIC_GA_ID, add it to Vercel, and redeploy. It is built into your pages, so a restart is not enough',
      metadata: { numbered: true }
    },
    {
      id: 'ga-code',
      type: 'code',
      content: '# .env\nNEXT_PUBLIC_GA_ID="G-XXXXXXXXXX"',
      metadata: { language: 'bash', caption: 'Leave it out and Google Analytics never loads' }
    },
    {
      id: 'know-heading',
      type: 'heading',
      content: '⚠️ Good to Know'
    },
    {
      id: 'know-list',
      type: 'list',
      content: '**Your privacy policy mentions both** — Vercel Analytics and Google Analytics. Not using Google Analytics? Remove those lines in **src/data/privacypolicy.json**|**You can hide IP addresses** — in **Team Settings → Security & Privacy**, under **IP Address Visibility**. It applies to every drain|**Vercel emails you if a drain breaks** — when most deliveries in an hour fail, and the drain is marked with a warning|**Your computer is not counted** — drains only send what happens on Vercel, so local testing never shows up'
    },
    {
      id: 'trouble-heading',
      type: 'heading',
      content: '🧯 If Something Is Off'
    },
    {
      id: 'trouble-list',
      type: 'list',
      content: '**The drain test says 401** — the secret in the drain is not the same as DRAIN_SECRET in Vercel. Paste it again in both, then redeploy|**401 with Drain secret not configured** — DRAIN_SECRET is missing from Vercel\'s Production environment|**The test says 400** — the page views drain is set to NDJSON. Edit it and choose JSON|**Total Traces stays at zero** — the traces drain is set to Protobuf. Edit it and choose JSON|**Nothing in Analytics** — Web Analytics is not enabled in the project, or nobody has accepted the cookie banner yet. Check both, then visit again'
    },
    {
      id: 'llm-heading',
      type: 'heading',
      content: '🤖 Ask Your LLM'
    },
    {
      id: 'llm-prompts',
      type: 'code',
      content: 'Here is what /admin/observability shows for the last 7 days:\n[paste or describe it]. What should I write more of, and which\npage should I make faster first?\n\nMy drain says "[paste the error]". The receiving code is in\nsrc/app/api/analytics/vercel/route.ts and\nsrc/app/api/drains/traces/route.ts. What should I check?',
      metadata: { language: 'prompt', emphasis: true, caption: 'Never paste your DRAIN_SECRET into a chat' }
    },
    {
      id: 'done-heading',
      type: 'heading',
      content: '✅ You Are Done When'
    },
    {
      id: 'done-list',
      type: 'list',
      content: 'Web Analytics is enabled on your project|**.env** and Vercel have DRAIN_SECRET|Team Settings → Drains lists two drains, page views and traces, both JSON, both without a warning|Your own visit appears in /admin/observability|Optional: NEXT_PUBLIC_GA_ID is set, and Google Analytics shows you in its Realtime report'
    },
    {
      id: 'closing-para',
      type: 'paragraph',
      content: 'Now you can see what people actually read, not what you guessed they would. Let that pick your next article.'
    },
    {
      id: 'final-quote',
      type: 'quote',
      content: 'Count what matters. Then make more of it.',
      metadata: { author: 'unparty-app', style: 'minimal' }
    }
  ]
};
