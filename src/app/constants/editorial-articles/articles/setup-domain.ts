import type { EditorialArticle } from '../types';

// SETUP. curriculum step 11 (prisma/setup-steps.ts, #1094)
// site.url in src/data/FoundersConfig.json (SITE_URL in organization.ts) feeds metadataBase, sitemap.xml,
// robots.txt, structured data and canonical/OG URLs. Clerk production instances need a
// domain you own and start with no users, so the founder signs up again, re-adds
// role: admin, and reseeds with the new FOUNDER_USER_ID (the old grant stays).
export const SETUP_DOMAIN_ARTICLE: EditorialArticle = {
  slug: 'setup-domain',
  title: 'YOUR DOMAIN.',
  subtitle: 'Trade .vercel.app for an address that is yours. If you added sign-in, switch it from practice keys to real ones.',
  description: 'How non-technical founders put their Next.js site on their own domain: add the domain in Vercel, update the site address in one config file so search engines and link previews use it, then, if you added sign-in, move Clerk sign-in to a production instance with its own DNS records and keys, and make yourself admin again.',
  category: 'SETUP.',
  date: '2026-09-29',
  updated: '2026-11-02',
  published: true,
  author: 'justin-murry',
  readTime: '8 min',
  tags: ['Domain', 'DNS', 'Vercel', 'Clerk', 'Production', 'Setup', 'Non-Technical Founders', 'Software You Own'],
  sections: [
    {
      id: 'hero-domain',
      type: 'hero',
      content: 'an address with your name on it.',
      metadata: { style: 'highlight' }
    },
    {
      id: 'intro',
      type: 'paragraph',
      content: 'Your site is live, but its address ends in **.vercel.app**. This step moves it to a domain you own. If you added sign-in, it says **Development mode** too, and this step moves it from Clerk\'s practice keys to real ones. The practice keys only work while you are testing. The real ones only work on a domain you own, which is why these happen together.',
      metadata: { dropCap: true }
    },
    {
      id: 'places-table',
      type: 'table',
      metadata: {
        headers: ['Where', 'What you change', 'Why'],
        rows: [
          ['Vercel', 'Add your domain', 'Visitors reach your site at your address'],
          ['FoundersConfig.json', 'One line: the site url', 'Search engines and link previews use your address'],
          ['Clerk, if you added sign-in', 'A production instance', 'Real sign-in, without the Development mode label']
        ]
      }
    },
    {
      id: 'challenge-domain',
      type: 'challenge',
      userPrompt: 'YOUR DOMAIN.',
      label: 'BUILD.',
      pollEnabled: false,
      stepOne: { emoji: '1️⃣', action: 'Point it.', description: 'Your domain, at Vercel.' },
      stepTwo: { emoji: '2️⃣', action: 'Name it.', description: 'Your address, in one file.' },
      stepThree: { emoji: '3️⃣', action: 'Lock it.', description: 'Real sign-in keys, if you have sign-in.' },
      successMetric: 'your site lives at your address.'
    },
    {
      id: 'divider-point',
      type: 'divider'
    },
    {
      id: 'point-heading',
      type: 'heading',
      content: '1️⃣ Point Your Domain at Vercel'
    },
    {
      id: 'point-para',
      type: 'paragraph',
      content: 'In Vercel, open your project, then **Settings → Domains**, and click **Add Domain**. Type the domain you want, like **yourname.com**:'
    },
    {
      id: 'point-list',
      type: 'list',
      content: '**You do not own it yet** — Vercel offers to buy it for you. This is the simplest path: Vercel sets up everything, and you can skip to step 2️⃣|**You already own it somewhere else** (GoDaddy, Namecheap, Squarespace, Cloudflare) — keep it there. Vercel shows you a few **DNS records** to add in that company\'s settings'
    },
    {
      id: 'dns-para',
      type: 'paragraph',
      content: 'A **DNS record** is a line in your domain\'s address book that says where to send visitors. If Vercel shows you records:'
    },
    {
      id: 'dns-steps',
      type: 'list',
      content: 'When Vercel asks, choose the option that adds **www.yourname.com** and redirects **yourname.com** to it. Both addresses then work|Sign in where you bought the domain and find its **DNS** settings (sometimes called **Manage DNS**)|Add each record exactly as Vercel shows it: the **Type**, the **Name**, and the **Value**. Copy and paste; never retype|Back in Vercel, wait for each domain to say **Valid Configuration**. It is often minutes, and occasionally a few hours',
      metadata: { numbered: true }
    },
    {
      id: 'point-note',
      type: 'personal',
      content: 'Your .vercel.app address keeps working. Nothing breaks while you wait for DNS.'
    },
    {
      id: 'name-heading',
      type: 'heading',
      content: '2️⃣ Tell Your Code Its Address'
    },
    {
      id: 'name-para',
      type: 'paragraph',
      content: 'Your site writes its own address into things you never see on the page: the map it gives search engines (**/sitemap.xml**), the note that points them to it (**/robots.txt**), and the links and preview images that appear when someone shares a page. All of them read one line. Until you change it, your site uses the address Vercel gives it, which can be a moment behind a new domain. Set it to the exact address people end up on. Open **src/data/FoundersConfig.json** in your editor, find **url** under **site**, and change it:'
    },
    {
      id: 'name-code',
      type: 'code',
      content: '// src/data/FoundersConfig.json, inside "site"\n"url": "https://www.yourname.com",',
      metadata: { language: 'json', emphasis: true, caption: 'Start with https://, use the www version, and end without a slash' }
    },
    {
      id: 'name-push',
      type: 'paragraph',
      content: 'Save the file. In GitHub Desktop, write a summary like "Use my domain", click **Commit to main**, then **Push origin**. Vercel rebuilds, and a few minutes later your site knows its name. The rest of **FoundersConfig.json**, like your name and your site\'s name, belongs to the identity step. Leave it for now.'
    },
    {
      id: 'lock-heading',
      type: 'heading',
      content: '3️⃣ Switch Sign-In to Real Keys, If You Added It'
    },
    {
      id: 'lock-para',
      type: 'paragraph',
      content: '**No sign-in on your site? You are done here.** Come back to this part if you add it. The keys you added in **Add sign-in** belong to Clerk\'s **development instance**: a practice copy of your sign-in that works anywhere and says so on screen. Now you create the **production instance**, which works only on your domain. In the [Clerk dashboard](https://dashboard.clerk.com):'
    },
    {
      id: 'lock-steps',
      type: 'list',
      content: 'Click the **Development** label at the top and choose **Create production instance**|Choose to copy your development settings, then enter your domain (**yourname.com**)|Open **Domains**. Clerk lists about five **CNAME** records. Add each one exactly as shown, in the same place as your Vercel records (in Vercel under **Domains** if you bought it there)|Wait until every record shows **Verified**, and Clerk has issued its certificates|Open **Sessions → Customize session token** and check the **metadata** claim from **Add sign-in** is there. If it is empty, paste it again and save',
      metadata: { numbered: true }
    },
    {
      id: 'google-note',
      type: 'personal',
      content: 'Turned on "Continue with Google"? In production, Clerk needs your own Google credentials for it, and walks you through making them under **SSO connections**. Or turn Google off for now and keep email.'
    },
    {
      id: 'keys-para',
      type: 'paragraph',
      content: 'Your production instance has its own keys, starting **pk_live_** and **sk_live_**. They go in Vercel, for your live site only. Your computer and Vercel\'s previews keep the practice keys, because real keys refuse to work anywhere except your domain. In Vercel, **Settings → Environment Variables**:'
    },
    {
      id: 'keys-steps',
      type: 'list',
      content: 'Click **Edit** on **NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY**, uncheck **Production**, and save. Do the same for **CLERK_SECRET_KEY**|Add both names again, this time with the **pk_live_** and **sk_live_** values, and only **Production** checked|Open **Deployments**, click **⋯** on the newest one, and choose **Redeploy**',
      metadata: { numbered: true }
    },
    {
      id: 'admin-heading',
      type: 'heading',
      content: '👑 Make Yourself Admin, Again'
    },
    {
      id: 'admin-para',
      type: 'paragraph',
      content: 'A production instance starts empty. Your practice account stayed behind in development, so on your real site you are a stranger again. Repeat **Make yourself admin**, this time on the real thing:'
    },
    {
      id: 'admin-steps',
      type: 'list',
      content: 'Open **www.yourname.com/sign-up** and create your account|In Clerk (production), open **Users**, click your account, and add **"role": "admin"** to its public metadata|Copy your new user ID (it starts **user_**, and it is different from your old one)|Replace **FOUNDER_USER_ID** with the new ID in **.env** and in Vercel, then redeploy|Run **npm run db:seed:setup** on your computer. Your old account keeps its access; the new one gets it too|Sign out of your live site and back in',
      metadata: { numbered: true }
    },
    {
      id: 'admin-quote',
      type: 'quote',
      content: 'Same site. Real address. Real keys.',
      metadata: { author: 'unparty-app', style: 'highlight' }
    },
    {
      id: 'divider-check',
      type: 'divider'
    },
    {
      id: 'check-heading',
      type: 'heading',
      content: '⚠️ If You Added Sign-In: Two Instances, One Database'
    },
    {
      id: 'check-list',
      type: 'list',
      content: '**On your computer you sign in with your practice account**, on your live site with your real one. They are separate accounts in two Clerk instances, and both are admin|**Both still share one database** — a step you edit on localhost changes on your live site too|**Changing your address again later** means another commit and push. Changing a key means another redeploy|**Vercel previews** keep the practice keys, so they show Development mode. That is expected',
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
      content: '**Vercel says Invalid Configuration for hours** — compare each record at your domain company with what Vercel shows, character by character. A common slip is typing the full domain into **Name** when the company adds it for you|**Sign-in is broken on the live site after the switch** — check that the **pk_live_** and **sk_live_** keys are checked for **Production** only, that Clerk shows every record **Verified**, and that you redeployed|**Signed in, but /party sends you to the waitlist** — the new account needs **"role": "admin"** in the production instance, then sign out and back in|**/robots.txt still shows the old address** — the push has not deployed yet. Check that the newest deployment in Vercel is **Ready**'
    },
    {
      id: 'llm-heading',
      type: 'heading',
      content: '🤖 Ask Your LLM'
    },
    {
      id: 'llm-prompts',
      type: 'code',
      content: 'I am connecting my domain [yourname.com] to Vercel. Vercel shows\nthese DNS records: [paste them]. My domain is registered with\n[company]. Walk me through adding them there, one screen at a time.\n\nI moved my Clerk sign-in to a production instance and now [describe\nwhat happens]. What should I check in Clerk and in Vercel? Do not\nask me for my secret key.',
      metadata: { language: 'prompt', emphasis: true, caption: 'DNS records are safe to paste. Secret keys never are' }
    },
    {
      id: 'done-heading',
      type: 'heading',
      content: '✅ You Are Done When'
    },
    {
      id: 'done-list',
      type: 'list',
      content: '**yourname.com** and **www.yourname.com** both open your site, with a padlock in the address bar|**/robots.txt** ends with your own address, and **/sitemap.xml** lists your pages under it|If you added sign-in, it no longer says **Development mode**, and your new account opens **/party** and **/admin/steps** on your live site'
    },
    {
      id: 'closing-para',
      type: 'paragraph',
      content: 'Your site has a real address. From here, the setup turns to what fills it: your first cover, story, article, and project page.'
    },
    {
      id: 'final-quote',
      type: 'quote',
      content: 'The address is yours now. So is the front door.',
      metadata: { author: 'unparty-app', style: 'minimal' }
    }
  ]
};
