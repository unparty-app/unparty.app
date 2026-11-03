import type { EditorialArticle } from '../types';

// SETUP. curriculum, optional step `payments` (prisma/setup-steps.ts, #1106)
// A project in src/data/FoundersConfig.json `projects` with a polarProductId gets a
// buy pill at the bottom of its page (BuyPill via StatsLayoutWrapper; unparty's own
// unppps come from UnpppsConfig.json through the same src/lib/projects.ts). Checkout
// needs products:read + checkouts:write; /api/webhook/polar records order.paid in the
// buyer's Clerk publicMetadata.purchasedProductIds, which turns the pill into YOURS.
// The npm package @polar-sh/cli is a placeholder, and install.sh supports macOS and
// Linux only. Tested end to end in the sandbox with `polar listen` (#1179).
export const SETUP_PAYMENTS_ARTICLE: EditorialArticle = {
  slug: 'setup-payments',
  title: 'SELL SOMETHING.',
  subtitle: 'Put a price on a project page. Polar takes the payment, your site remembers who bought it.',
  description: 'How non-technical founders sell from their own Next.js site with Polar: create a product, test a purchase in the sandbox with a test card, connect it to a project page with one config entry, and go live with production keys and a webhook.',
  category: 'SETUP.',
  date: '2026-09-30',
  updated: '2026-10-16',
  published: true,
  author: 'justin-murry',
  readTime: '10 min',
  tags: ['Payments', 'Polar', 'Checkout', 'Webhooks', 'Setup', 'Non-Technical Founders', 'Software You Own'],
  sections: [
    {
      id: 'hero-payments',
      type: 'hero',
      content: 'get paid for what you made.',
      metadata: { style: 'highlight' }
    },
    {
      id: 'intro',
      type: 'paragraph',
      content: 'Your project page already tells people what you made. This step lets them buy it without leaving the page. You set the price and what the customer gets in **Polar**, a payments service for people who sell software and digital products. Your site shows the price at the bottom of the project page, opens Polar\'s checkout on top of it, and remembers who paid.',
      metadata: { dropCap: true }
    },
    {
      id: 'who-table',
      type: 'table',
      metadata: {
        headers: ['Polar does', 'Your site does'],
        rows: [
          ['Holds your products and prices', 'Shows the price on the project\'s page'],
          ['Takes the card, sends the receipt', 'Opens the checkout without leaving your page'],
          ['Delivers what the customer bought: a file, a license key, access to a GitHub repository, a Discord invite', 'Remembers the purchase, so the button says YOURS. the next time they visit'],
          ['Pays you out', 'Nothing. The money never touches your code']
        ]
      }
    },
    {
      id: 'challenge-payments',
      type: 'challenge',
      userPrompt: 'SELL SOMETHING.',
      label: 'BUILD.',
      pollEnabled: false,
      stepOne: { emoji: '1️⃣', action: 'Test it.', description: 'A product in Polar\'s sandbox.' },
      stepTwo: { emoji: '2️⃣', action: 'Connect.', description: 'One entry on your project.' },
      stepThree: { emoji: '3️⃣', action: 'Go live.', description: 'Real keys, real money.' },
      successMetric: 'someone can buy your project from its page.'
    },
    {
      id: 'before-list',
      type: 'list',
      content: '**A project page** — from [Your first project page](/article/setup-first-project-page). Its name, like **soap-shop**, is how Polar\'s product finds its page|**Sign-in working** — from [Add sign-in](/article/setup-sign-in). Customers sign in before they buy, so your site knows who paid|**Your site deployed** — from [Deploy](/article/setup-deploy), for the last part',
      metadata: { style: 'accent' }
    },
    {
      id: 'divider-sandbox',
      type: 'divider'
    },
    {
      id: 'sandbox-heading',
      type: 'heading',
      content: '1️⃣ Make a Product in the Sandbox'
    },
    {
      id: 'sandbox-para',
      type: 'paragraph',
      content: 'Polar has two separate worlds. The **sandbox** takes test cards and moves no money. **Production** is the real one. They have separate accounts, separate keys and separate product IDs, so you set everything up twice: once to practice, once to sell. Start in the sandbox.'
    },
    {
      id: 'sandbox-steps',
      type: 'list',
      content: 'Go to **sandbox.polar.sh/start**, create an account, and create an organization for your business|Open **Products**, click **New product**, give it a name and a price|Under **Benefits**, attach what the customer gets: a file to download, a license key, access to a private GitHub repository, or a Discord invite. Polar delivers it the moment they pay|Open **Settings → Preferences → Embedding** and add **localhost:3000**. Without it, the checkout cannot open on top of your page|Open **Settings → Developers** and click **New Token**. Name it "my site sandbox", set an expiry, and tick only **products:read** and **checkouts:write**|Copy the token. It starts with **polar_oat_** and is only shown once',
      metadata: { numbered: true }
    },
    {
      id: 'scopes-table',
      type: 'table',
      metadata: {
        headers: ['Permission', 'Why your site needs it'],
        rows: [
          ['products:read', 'To read the price it shows on your page'],
          ['checkouts:write', 'To open a checkout when someone clicks the price'],
          ['Everything else', 'Leave it off. A token that can do less can leak less']
        ]
      }
    },
    {
      id: 'product-id-para',
      type: 'paragraph',
      content: 'Last, copy your product\'s ID. Open the product in **Products**; the ID is the long code with dashes in its address and on its page, like **1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d**.'
    },
    {
      id: 'divider-connect',
      type: 'divider'
    },
    {
      id: 'connect-heading',
      type: 'heading',
      content: '2️⃣ Connect It to Your Project Page'
    },
    {
      id: 'env-para',
      type: 'paragraph',
      content: 'Add the sandbox token to **.env**, and tell your site which Polar it belongs to:'
    },
    {
      id: 'env-code',
      type: 'code',
      content: '# .env\nPOLAR_SERVER="sandbox"\nPOLAR_ACCESS_TOKEN="polar_oat_…"',
      metadata: { language: 'bash', caption: 'POLAR_SERVER is sandbox for test money, production for real money' }
    },
    {
      id: 'config-para',
      type: 'paragraph',
      content: 'Then open **src/data/FoundersConfig.json**, the file from [Make it yours](/article/setup-identity). Turn selling on with **checkout**, which a copy starts with off. At the bottom is **projects**, an empty list. Add one entry for your project page:'
    },
    {
      id: 'config-code',
      type: 'code',
      content: '  "checkout": true,\n  "brandColors": ["#C8553D", "#F2D0A4", "", "", ""],\n  "projects": [\n    {\n      "id": "soap-shop",\n      "name": "Soap Shop",\n      "polarProductId": "1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d"\n    }\n  ]\n}',
      metadata: { language: 'json', emphasis: true, caption: 'The id is your project page\'s name, exactly as it appears in its address: /soap-shop' }
    },
    {
      id: 'config-rules',
      type: 'list',
      content: '**Inside the list, not next to it** — the entry goes between the square brackets of **projects**. A **polarProductId** anywhere else is ignored|**id matches the page** — lowercase, words joined by dashes, the same as the folder in **src/app**|**One entry per project** — sell more projects by adding more entries, with a comma between them|**checkout is true** — off, every project page shows **build yours** where the price would be, and no checkout opens',
      metadata: { style: 'accent' }
    },
    {
      id: 'check-code',
      type: 'code',
      content: '# Check the file, then start your site\nnpm run check:identity\nnpm run dev',
      metadata: { language: 'bash', caption: 'The checker catches a bad id, a repeated id, and a product ID with a typo' }
    },
    {
      id: 'see-para',
      type: 'paragraph',
      content: 'Open **localhost:3000/soap-shop** and scroll to the bottom. Above the footer is your price, in a pill:'
    },
    {
      id: 'see-table',
      type: 'table',
      metadata: {
        headers: ['Who is looking', 'What they see'],
        rows: [
          ['Signed out', 'The price, outlined. It shows what it costs'],
          ['Signed in', 'The price, filled, with an arrow. Clicking it opens the checkout'],
          ['Signed in, already bought it', '✓ YOURS.']
        ]
      }
    },
    {
      id: 'listen-heading',
      type: 'heading',
      content: '🔔 Let Polar Tell Your Site About the Sale'
    },
    {
      id: 'listen-para',
      type: 'paragraph',
      content: 'When someone pays, Polar sends your site a message called a **webhook**. That is how your site learns who bought what. On your live site, Polar sends it straight there. On your computer, Polar cannot reach **localhost**, so its command-line tool passes the messages along. On a Mac or Linux:'
    },
    {
      id: 'listen-code',
      type: 'code',
      content: '# Install the Polar CLI (not with npm: that package is only a placeholder)\ncurl -fsSL https://polar.sh/install.sh | bash\n\n# Sign in, and choose Sandbox when it asks\npolar login\n\n# Pass sales along to your site. Leave this running in its own window\npolar listen http://localhost:3000/api/webhook/polar',
      metadata: { language: 'bash', emphasis: true, caption: 'It asks for your computer\'s password if it needs to install into /usr/local/bin' }
    },
    {
      id: 'secret-para',
      type: 'paragraph',
      content: '**polar listen** prints a line starting with **Secret**. It proves to your site that a message really came from Polar. Copy it into **.env**, then stop **npm run dev** and start it again, because your site reads it only when it starts:'
    },
    {
      id: 'secret-code',
      type: 'code',
      content: '# .env\nPOLAR_WEBHOOK_SECRET="the-secret-polar-listen-printed"',
      metadata: { language: 'bash' }
    },
    {
      id: 'windows-note',
      type: 'personal',
      content: 'On Windows, Polar\'s installer does not run. Skip the listening part here: your test purchase still works, and the button still says YOURS. until you reload. You will see the full round trip on your live site in the last part.'
    },
    {
      id: 'buy-heading',
      type: 'heading',
      content: '🧪 Buy It Yourself'
    },
    {
      id: 'buy-steps',
      type: 'list',
      content: 'Sign in on **localhost:3000** and open your project page|Click the price. Polar\'s checkout opens on top of your page|Pay with the test card **4242 4242 4242 4242**, any future date, any three digits|The checkout confirms, and the pill turns into **✓ YOURS.**|Reload the page. It still says **YOURS.** That is your site remembering the sale',
      metadata: { numbered: true }
    },
    {
      id: 'proof-list',
      type: 'list',
      content: '**The polar listen window** shows **order.paid** passed along with a **200**|**Your dev server** prints **recorded purchase** with your product\'s ID|**Clerk** shows it too: open your Clerk dashboard, **Users**, your user, **Metadata**, and under Public you will see **purchasedProductIds**|**Polar\'s sandbox** lists the order, with your benefit granted'
    },
    {
      id: 'buy-quote',
      type: 'quote',
      content: 'Test money first. The same steps with real money are only a key away.',
      metadata: { author: 'unparty-app', style: 'highlight' }
    },
    {
      id: 'divider-live',
      type: 'divider'
    },
    {
      id: 'live-heading',
      type: 'heading',
      content: '3️⃣ Go Live'
    },
    {
      id: 'live-para',
      type: 'paragraph',
      content: 'Now repeat the setup in the real Polar, at **polar.sh**. Nothing from the sandbox carries over, so the product, the token and the IDs are all new.'
    },
    {
      id: 'live-steps',
      type: 'list',
      content: 'Create your organization on **polar.sh**, and finish Polar\'s payout setup so it can pay you|Create the same product with the same benefits, and copy its new ID|In **Settings → Preferences → Embedding**, add your address, like **www.soapshop.com**|Create a token with **products:read** and **checkouts:write** again|Open **Settings → Webhooks**, click **Add Endpoint**, and enter **https://www.soapshop.com/api/webhook/polar**. Keep the format on **Raw**, generate a secret and copy it, and choose the event **order.paid**',
      metadata: { numbered: true }
    },
    {
      id: 'vercel-para',
      type: 'paragraph',
      content: 'Give the real keys to your live site. In Vercel, open your project, then **Settings → Environment Variables**, and add these for the **Production** environment:'
    },
    {
      id: 'vercel-table',
      type: 'table',
      metadata: {
        headers: ['Key', 'Value'],
        rows: [
          ['POLAR_SERVER', 'production'],
          ['POLAR_ACCESS_TOKEN', 'The token from polar.sh'],
          ['POLAR_WEBHOOK_SECRET', 'The secret from the webhook endpoint you just added, not the one polar listen printed']
        ]
      }
    },
    {
      id: 'switch-para',
      type: 'paragraph',
      content: 'Last, put the real product\'s ID into **FoundersConfig.json** in place of the sandbox one. In GitHub Desktop, the **Changes** list should hold **FoundersConfig.json**. Write a summary like "Start selling", click **Commit to main**, then **Push origin**. Pushing redeploys your site with the new keys too.'
    },
    {
      id: 'live-check',
      type: 'list',
      content: 'Open your project page on your live address and scroll down: the real price is there|Sign in and click it: the checkout opens on top of your page|If you want to see a real sale, buy it yourself, then refund the order in Polar\'s dashboard',
      metadata: { numbered: true }
    },
    {
      id: 'divider-know',
      type: 'divider'
    },
    {
      id: 'know-heading',
      type: 'heading',
      content: '⚠️ Good to Know'
    },
    {
      id: 'know-list',
      type: 'list',
      content: '**Customers sign in to buy** — that is how your site knows who paid. Visitors who are signed out see the price, not the button|**Your computer now shows the real product** — once FoundersConfig.json has the production ID, your local site needs production keys to show its price. To practice again, swap the sandbox ID and keys back in, then swap them out before you push|**Sandbox emails only reach you** — the sandbox sends receipts only to members of your Polar organization|**Previews use real keys unless you say otherwise** — Vercel preview sites count as production. Add sandbox keys for the **Preview** environment if you want previews to take test cards|**Prices live in Polar** — change a price in Polar\'s dashboard and your page shows the new one within the hour. There is nothing to redeploy',
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
      content: '**No price at the bottom of the page** — check that the entry is inside **projects**, that its id matches the page\'s address, and that **POLAR_SERVER** matches where the product lives. A sandbox product with production keys, or the other way round, shows nothing|**Clicking the price takes you to a Polar page instead** — your address is missing from **Embedding** in Polar\'s settings. The purchase still works; add it to keep people on your page|**YOURS. disappears when you reload** — the webhook did not reach your site. Check that polar listen is running, that **POLAR_WEBHOOK_SECRET** matches what it printed, and that you restarted npm run dev|**polar listen shows 403** — the secret in .env is not the one it printed. Copy it again and restart|**polar listen shows 503** — **POLAR_WEBHOOK_SECRET** is missing from .env|**command not found: polar** — it was installed with npm. Run **npm uninstall -g @polar-sh/cli**, then the curl line above'
    },
    {
      id: 'llm-heading',
      type: 'heading',
      content: '🤖 Ask Your LLM'
    },
    {
      id: 'llm-prompts',
      type: 'code',
      content: 'I am selling [describe what you made] to [who buys it]. Suggest\na price, what the customer should get when they pay (a download,\na license key, repository access), and a one-line description for\nthe product in Polar.\n\n(In Claude Code, inside your copy)\nAdd my project page soap-shop to the projects list in\nsrc/data/FoundersConfig.json with Polar product ID [paste it],\nthen run npm run check:identity and fix anything it reports.\n\nMy polar listen window shows [paste the line]. What does it mean,\nand what should I check first?',
      metadata: { language: 'prompt', emphasis: true, caption: 'Let it help you price. The price you charge is your call' }
    },
    {
      id: 'done-heading',
      type: 'heading',
      content: '✅ You Are Done When'
    },
    {
      id: 'done-list',
      type: 'list',
      content: 'A test purchase in the sandbox turned your price into **✓ YOURS.**, and it stayed after a reload|Your live site shows the real price on your project page|Vercel has **POLAR_SERVER**, **POLAR_ACCESS_TOKEN** and **POLAR_WEBHOOK_SECRET** for Production|Polar\'s webhook endpoint points at your live address with **order.paid** turned on'
    },
    {
      id: 'closing-para',
      type: 'paragraph',
      content: 'Your project page now does more than describe what you made. It sells it, delivers it, and knows who owns it. To sell another project, make its page, create its product, and add one more entry to **projects**.'
    },
    {
      id: 'final-quote',
      type: 'quote',
      content: 'You made it. Now it can pay you back.',
      metadata: { author: 'unparty-app', style: 'minimal' }
    }
  ]
};
