import type { EditorialArticle } from '../types';

// SETUP. curriculum, optional step `slack` (prisma/setup-steps.ts, #1106). Also the
// "how and why the app uses Slack" doc from #394. Incoming webhooks only, no bot token:
// SLACK_WEBHOOK_URL ← /api/problem/send (each worksheet), SLACK_WEBHOOK_URL_CHAT ←
// /api/chat/send (each chat box message). SLACK_SIGNING_SECRET adds Approve / Reject
// buttons (#728) handled by /api/slack/interactions: signature check
// (src/lib/slack-verify.ts), approveSubmission(id, 'slack'), then the message is
// rewritten through response_url. Only PENDING worksheets can be decided there.
export const SETUP_SLACK_ARTICLE: EditorialArticle = {
  slug: 'setup-slack',
  title: 'SLACK.',
  subtitle: 'Hear about every worksheet and every message where you already are, and approve people without leaving Slack.',
  description: 'How non-technical founders connect their own Next.js site to Slack: create a Slack app, add two incoming webhooks, see waitlist worksheets and chat messages arrive, and approve or reject people with buttons in Slack.',
  category: 'SETUP.',
  date: '2026-09-30',
  published: true,
  author: 'justin-murry',
  readTime: '8 min',
  tags: ['Slack', 'Notifications', 'Webhooks', 'Waitlist', 'Setup', 'Non-Technical Founders', 'Software You Own'],
  sections: [
    {
      id: 'hero-slack',
      type: 'hero',
      content: 'hear it where you already are.',
      metadata: { style: 'highlight' }
    },
    {
      id: 'intro',
      type: 'paragraph',
      content: 'Right now your site keeps its news to itself. A worksheet arrives on your waitlist, a visitor sends a message through the chat box, and you only find out when you open **/admin**. This step sends both to Slack the moment they happen, and adds two buttons to every worksheet so you can let someone in without opening your site at all.',
      metadata: { dropCap: true }
    },
    {
      id: 'what-table',
      type: 'table',
      metadata: {
        headers: ['When', 'Slack gets', 'Key'],
        rows: [
          ['Someone submits or updates a waitlist worksheet', 'Their name, email, idea, target date and answers', 'SLACK_WEBHOOK_URL'],
          ['A visitor sends a message through the chat box', 'Their first name, email and message, plus where they opened the chat from when the site knows it', 'SLACK_WEBHOOK_URL_CHAT'],
          ['You click Approve or Reject on a worksheet', 'The message updates to say who decided', 'SLACK_SIGNING_SECRET']
        ]
      }
    },
    {
      id: 'data-note',
      type: 'personal',
      content: 'These messages carry people\'s names and email addresses. Send them to channels only you and the people you trust can see. Slack keeps them like any other message in your workspace.'
    },
    {
      id: 'challenge-slack',
      type: 'challenge',
      userPrompt: 'SLACK.',
      label: 'BUILD.',
      pollEnabled: false,
      stepOne: { emoji: '1️⃣', action: 'Make app.', description: 'One Slack app for your site.' },
      stepTwo: { emoji: '2️⃣', action: 'Hear it.', description: 'Two channels, two links.' },
      stepThree: { emoji: '3️⃣', action: 'Buttons.', description: 'Approve without leaving.' },
      successMetric: 'a worksheet shows up in Slack, and you approve it there.'
    },
    {
      id: 'divider-app',
      type: 'divider'
    },
    {
      id: 'app-heading',
      type: 'heading',
      content: '1️⃣ Make a Slack App for Your Site'
    },
    {
      id: 'app-para',
      type: 'paragraph',
      content: 'A Slack app is how your site gets permission to post in your workspace. It takes a minute, and you only make one.'
    },
    {
      id: 'app-steps',
      type: 'list',
      content: 'Make two **private** channels in Slack, like **#waitlist** and **#chat**. Private, because the messages hold names and emails|Go to **api.slack.com/apps** and click **Create New App**, then **From scratch**|Name it after your site, pick your workspace, and click **Create App**',
      metadata: { numbered: true }
    },
    {
      id: 'divider-hear',
      type: 'divider'
    },
    {
      id: 'hear-heading',
      type: 'heading',
      content: '2️⃣ Give Each Channel a Link'
    },
    {
      id: 'hear-para',
      type: 'paragraph',
      content: 'Your site posts to Slack through **incoming webhooks**: one private link per channel. Anything sent to the link appears in that channel.'
    },
    {
      id: 'hear-steps',
      type: 'list',
      content: 'In your app\'s settings, open **Incoming Webhooks** and switch it **On**|Click **Add New Webhook to Workspace**, choose **#waitlist**, and click **Allow**|Copy the link it shows. It starts with **https://hooks.slack.com/services/**|Do it once more for **#chat**',
      metadata: { numbered: true }
    },
    {
      id: 'hear-code',
      type: 'code',
      content: '# .env\nSLACK_WEBHOOK_URL="https://hooks.slack.com/services/…"       # #waitlist\nSLACK_WEBHOOK_URL_CHAT="https://hooks.slack.com/services/…"  # #chat',
      metadata: { language: 'bash', emphasis: true, caption: 'Add the same two to Vercel\'s Environment Variables, then redeploy' }
    },
    {
      id: 'hear-secret',
      type: 'list',
      content: '**Treat each link like a password** — anyone who has it can post in that channel. Keep them in .env and Vercel only|**Leave one out if you do not want it** — without a link, that message is simply not sent',
      metadata: { style: 'accent' }
    },
    {
      id: 'hear-test',
      type: 'paragraph',
      content: 'Restart **npm run dev**, then try both from a private browser window with your test account: submit a worksheet at **/waitlist/apply**, and send a message through the chat box. Each one lands in its channel within seconds.'
    },
    {
      id: 'divider-buttons',
      type: 'divider'
    },
    {
      id: 'buttons-heading',
      type: 'heading',
      content: '3️⃣ Approve Right From Slack'
    },
    {
      id: 'buttons-para',
      type: 'paragraph',
      content: 'Every worksheet message can carry two buttons, **Approve** and **Reject**. Approve does exactly what the button in **/admin/submissions** does from [Let people in](/article/setup-waitlist): it lets the person into /party. Slack has to reach your site to deliver a click, so this part is set up against your live address:'
    },
    {
      id: 'buttons-steps',
      type: 'list',
      content: 'In your app\'s settings, open **Interactivity & Shortcuts** and switch it **On**|For **Request URL**, enter your live address followed by **/api/slack/interactions**, like **https://www.yourname.com/api/slack/interactions**. Click **Save Changes**|Open **Basic Information**. Under **App Credentials**, show the **Signing Secret** and copy it|Add it to **.env** and to Vercel as **SLACK_SIGNING_SECRET**, then redeploy',
      metadata: { numbered: true }
    },
    {
      id: 'buttons-code',
      type: 'code',
      content: '# .env\nSLACK_SIGNING_SECRET="the-signing-secret"',
      metadata: { language: 'bash', caption: 'It proves each click really came from your Slack app' }
    },
    {
      id: 'click-list',
      type: 'list',
      content: 'Submit another worksheet from your test account on your live site|In **#waitlist**, the message now ends with **Approve** and **Reject**|Click **Approve**. A moment later the buttons are replaced by **✅ Approved by** you|Your test account signs out and back in, and **/party** opens',
      metadata: { numbered: true }
    },
    {
      id: 'click-table',
      type: 'table',
      metadata: {
        headers: ['You click', 'What happens'],
        rows: [
          ['Approve', 'Same as Approve in /admin/submissions: they are let in, and emailed if you set up email'],
          ['Reject', 'Slack asks you to confirm first. They see Problem not compatible, and can update and resubmit'],
          ['A button on an old message', 'Nothing changes if the worksheet was already decided. The message says so']
        ]
      }
    },
    {
      id: 'buttons-quote',
      type: 'quote',
      content: 'Read it where it lands. Decide where you read it.',
      metadata: { author: 'unparty-app', style: 'highlight' }
    },
    {
      id: 'know-heading',
      type: 'heading',
      content: '⚠️ Good to Know'
    },
    {
      id: 'know-list',
      type: 'list',
      content: '**Anyone in #waitlist can approve** — the buttons work for everyone who can see the channel. Keep it to people you would let decide|**Buttons only work on your live site** — Slack cannot reach localhost. Worksheets sent from your computer still post to Slack, but a click on them goes to your live site, which may not have that worksheet if you tested against another database|**No bot, no token** — your site only posts through the links and answers button clicks. It cannot read your channels|**Your price updates are not here** — unparty\'s own copy also posts its Polar price changes to Slack. That part only runs in unparty\'s repository'
    },
    {
      id: 'trouble-heading',
      type: 'heading',
      content: '🧯 If Something Is Off'
    },
    {
      id: 'trouble-list',
      type: 'list',
      content: '**No message arrives** — check the link in .env (and in Vercel, for your live site) has no quotes inside and no spaces, then restart or redeploy. The terminal running npm run dev prints Slack webhook failed when Slack refuses it|**The buttons do not appear** — SLACK_SIGNING_SECRET is not set where that worksheet was sent from. Add it and redeploy; only messages sent after that have buttons|**Clicking a button shows a warning in Slack** — the Request URL is wrong, or your site is not deployed with the Signing Secret yet. Check the address ends in /api/slack/interactions|**The message says it did not go through** — try again, or decide in /admin/submissions. The terminal or Vercel logs show why'
    },
    {
      id: 'llm-heading',
      type: 'heading',
      content: '🤖 Ask Your LLM'
    },
    {
      id: 'llm-prompts',
      type: 'code',
      content: 'I am setting up a Slack app with incoming webhooks and\ninteractivity. I am on this screen: [describe it or paste it].\nWhat do I click next?\n\n(In Claude Code, inside your copy)\nRead src/app/api/problem/send/route.ts and tell me exactly which\nfields of a worksheet are sent to Slack, in plain words.',
      metadata: { language: 'prompt', emphasis: true, caption: 'Never paste your webhook links or Signing Secret into a chat' }
    },
    {
      id: 'done-heading',
      type: 'heading',
      content: '✅ You Are Done When'
    },
    {
      id: 'done-list',
      type: 'list',
      content: 'A worksheet from your test account appeared in **#waitlist**, and a chat message in **#chat**|Both links are in **.env** and in Vercel|On your live site, a worksheet message has **Approve** and **Reject**, and clicking **Approve** let your test account into **/party**'
    },
    {
      id: 'closing-para',
      type: 'paragraph',
      content: 'Your site now speaks up when something happens, in the place you already check all day. The waitlist, the chat box and the decision are one message apart.'
    },
    {
      id: 'final-quote',
      type: 'quote',
      content: 'The site does the telling. You do the deciding.',
      metadata: { author: 'unparty-app', style: 'minimal' }
    }
  ]
};
