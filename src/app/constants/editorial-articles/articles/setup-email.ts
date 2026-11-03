import type { EditorialArticle } from '../types';

// SETUP. curriculum, optional step `email` (prisma/setup-steps.ts, #1106). Loops sends
// three transactional emails to the person on the waitlist, each picked by a template
// ID from the owner's own Loops account in .env: LOOPS_IDEA_SUBMITTED_ID and
// LOOPS_IDEA_UPDATED_ID (/api/problem/send: name, ideaName, deadline, isUpdate; an
// update is a resubmission while a worksheet is still PENDING) and
// LOOPS_WAITLIST_APPROVED_ID (approveSubmission in src/lib/waitlist.ts: name, ideaName).
// Loops needs a verified sending domain and published templates; a template that uses
// a variable the site does not send fails with a 400, which is only logged.
export const SETUP_EMAIL_ARTICLE: EditorialArticle = {
  slug: 'setup-email',
  title: 'EMAIL.',
  subtitle: 'Tell the people on your waitlist that you heard them, and tell them again when you let them in.',
  description: 'How non-technical founders send email from their own Next.js site with Loops: verify a sending domain, write three short emails for the waitlist, connect them with one key each, and test every one.',
  category: 'SETUP.',
  date: '2026-09-30',
  published: true,
  author: 'justin-murry',
  readTime: '9 min',
  tags: ['Email', 'Loops', 'Waitlist', 'Transactional Email', 'Setup', 'Non-Technical Founders', 'Software You Own'],
  sections: [
    {
      id: 'hero-email',
      type: 'hero',
      content: 'we got it. you are in.',
      metadata: { style: 'highlight' }
    },
    {
      id: 'intro',
      type: 'paragraph',
      content: 'Someone fills in your waitlist worksheet and then hears nothing. Did it work? Are they in? This step makes your site answer them by email, three times: when their worksheet arrives, when they update it, and when you let them in. The emails come from **Loops**, an email service your site talks to, and they come from your own address.',
      metadata: { dropCap: true }
    },
    {
      id: 'emails-table',
      type: 'table',
      metadata: {
        headers: ['Email', 'Sent when', 'Key'],
        rows: [
          ['Worksheet received', 'Someone submits a worksheet', 'LOOPS_IDEA_SUBMITTED_ID'],
          ['Worksheet updated', 'They submit again while still waiting for you', 'LOOPS_IDEA_UPDATED_ID'],
          ['You are in', 'You approve them, in /admin/submissions or in Slack', 'LOOPS_WAITLIST_APPROVED_ID']
        ]
      }
    },
    {
      id: 'not-list',
      type: 'list',
      content: '**These go to them, not to you** — you hear about new worksheets through [Slack](/article/setup-slack) and in /admin/submissions|**Sign-in emails are not these** — the codes people get when they sign up or sign in come from Clerk, set up in [Add sign-in](/article/setup-sign-in). You change those in your Clerk dashboard|**Each one is optional** — leave a key out and that email is simply not sent',
      metadata: { style: 'accent' }
    },
    {
      id: 'challenge-email',
      type: 'challenge',
      userPrompt: 'EMAIL.',
      label: 'BUILD.',
      pollEnabled: false,
      stepOne: { emoji: '1️⃣', action: 'Domain.', description: 'Prove the address is yours.' },
      stepTwo: { emoji: '2️⃣', action: 'Write 3.', description: 'Three short emails in Loops.' },
      stepThree: { emoji: '3️⃣', action: 'Test 3.', description: 'Receive every one yourself.' },
      successMetric: 'your test account got all three emails.'
    },
    {
      id: 'before-list',
      type: 'list',
      content: '**Your own domain** — from [Your domain](/article/setup-domain). Loops will not send from an address ending in vercel.app|**The waitlist working** — from [Let people in](/article/setup-waitlist). These emails are about it',
      metadata: { style: 'accent' }
    },
    {
      id: 'divider-domain',
      type: 'divider'
    },
    {
      id: 'domain-heading',
      type: 'heading',
      content: '1️⃣ Prove the Address Is Yours'
    },
    {
      id: 'domain-para',
      type: 'paragraph',
      content: 'Email from a new address lands in spam unless the address can prove it is really yours. Loops handles the proof; you add a few lines to your domain\'s settings, the same place you connected your domain to Vercel.'
    },
    {
      id: 'domain-steps',
      type: 'list',
      content: 'Sign up at **loops.so**. When it asks for your sending domain, enter your domain, like **yourname.com**|In Loops, open **Settings → Domain** and click **View records**. It lists a few records, marked SPF, DKIM and MX|In your domain registrar, open the DNS settings for your domain and add each record exactly as shown|Back in Loops, click **Verify Records**',
      metadata: { numbered: true }
    },
    {
      id: 'domain-wait',
      type: 'personal',
      content: 'Verification is often done within a few hours and can take up to 72. Write your emails while you wait: Loops will not send any until the domain is verified.'
    },
    {
      id: 'divider-write',
      type: 'divider'
    },
    {
      id: 'write-heading',
      type: 'heading',
      content: '2️⃣ Write the Three Emails'
    },
    {
      id: 'write-para',
      type: 'paragraph',
      content: 'Loops calls these **transactional emails**: one email, sent to one person, because of something they did. You write each one once. Your site fills in the person\'s details every time it sends.'
    },
    {
      id: 'write-steps',
      type: 'list',
      content: 'In Loops, open **Transactional** and create a new email|Write it. Where a detail should go, type it between curly brackets, like **{name}**, and Loops turns it into a data variable|Click **Next**. Under **API Details**, check the data variables listed match the table below|Click **Publish**. An unpublished email never sends|Copy the **transactional ID** shown under API Details|Repeat for the other two',
      metadata: { numbered: true }
    },
    {
      id: 'vars-table',
      type: 'table',
      metadata: {
        headers: ['Email', 'Variables you can use'],
        rows: [
          ['Worksheet received', '{name}, {ideaName}, {deadline}'],
          ['Worksheet updated', '{name}, {ideaName}, {deadline}'],
          ['You are in', '{name}, {ideaName}']
        ]
      }
    },
    {
      id: 'vars-rules',
      type: 'list',
      content: '**Spell them exactly** — capitals count: **ideaName**, not **ideaname** or **idea_name**|**Use only these** — if an email uses a variable your site does not send, Loops refuses to send that email at all, and nobody is told|**Use fewer if you like** — an email that only says {name} is fine',
      metadata: { style: 'accent' }
    },
    {
      id: 'copy-heading',
      type: 'heading',
      content: '✍️ Words to Start From'
    },
    {
      id: 'copy-code',
      type: 'code',
      content: 'Worksheet received\n  Subject: we got it, {name}.\n  Thanks for telling us about {ideaName}. We read every worksheet\n  ourselves, and you will hear from us before {deadline}.\n\nWorksheet updated\n  Subject: your changes are in.\n  We saw your update to {ideaName}. Nothing else to do: you are\n  still on the list, and we will read the new version.\n\nYou are in\n  Subject: you are in, {name}.\n  We read about {ideaName} and we would love to have you. Sign in\n  and open /party to get started.',
      metadata: { language: 'text', caption: 'Make them sound like you. Short is better' }
    },
    {
      id: 'keys-para',
      type: 'paragraph',
      content: 'Last, your site needs a key to use Loops. In Loops, open **Settings → API** and create an API key. Put it and the three transactional IDs in **.env**, and add the same four to Vercel\'s Environment Variables, then redeploy:'
    },
    {
      id: 'keys-code',
      type: 'code',
      content: '# .env\nLOOPS_API_KEY="…"\nLOOPS_IDEA_SUBMITTED_ID="…"      # Worksheet received\nLOOPS_IDEA_UPDATED_ID="…"        # Worksheet updated\nLOOPS_WAITLIST_APPROVED_ID="…"   # You are in',
      metadata: { language: 'bash', emphasis: true, caption: 'Restart npm run dev after changing .env' }
    },
    {
      id: 'divider-test',
      type: 'divider'
    },
    {
      id: 'test-heading',
      type: 'heading',
      content: '3️⃣ Receive Every One Yourself'
    },
    {
      id: 'test-steps',
      type: 'list',
      content: 'In a private window, sign in with your test account. Use an email address you can read|Submit a worksheet at **/waitlist/apply**. **Worksheet received** arrives|Change something and submit it again. **Worksheet updated** arrives, because the first one is still waiting|As yourself, approve it in **/admin/submissions**, or with the button in Slack. **You are in** arrives',
      metadata: { numbered: true }
    },
    {
      id: 'test-quote',
      type: 'quote',
      content: 'Three emails. Each one says: a person read this.',
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
      content: '**The free plan sends 4,000 emails every 30 days** — marketing and transactional together, with Loops branding at the bottom. Upgrading removes the branding|**Each resubmission counts as an update** — while their worksheet waits, every change sends Worksheet updated, and adds a row to /admin/submissions. Approve either row|**After a decision, it starts over** — someone you rejected who submits again gets Worksheet received, as a new application|**Your computer sends real email** — with the keys in .env, testing on localhost emails real people. Test with your own addresses'
    },
    {
      id: 'trouble-heading',
      type: 'heading',
      content: '🧯 If Something Is Off'
    },
    {
      id: 'trouble-list',
      type: 'list',
      content: '**No email arrives** — check spam first. Then, in the terminal running npm run dev (or your Vercel logs), look for a line starting with **Loops** that says an email failed. It includes Loops\' reason|**Missing required data variable(s)** — the email uses a variable your site does not send, or spells one differently. Fix it in Loops, publish again|**Loops says the email is not found or not published** — the ID in .env is wrong, or you did not click Publish|**Nothing in the logs at all** — LOOPS_API_KEY or that email\'s ID is missing where you tested. Restart or redeploy after adding it|**Updated never arrives, only received** — the first worksheet was already approved or rejected, so the new one is a new application'
    },
    {
      id: 'llm-heading',
      type: 'heading',
      content: '🤖 Ask Your LLM'
    },
    {
      id: 'llm-prompts',
      type: 'code',
      content: 'My site is for [describe who it is for]. Rewrite these three\nwaitlist emails in my voice: [paste them]. Keep each under 60\nwords and keep {name}, {ideaName} and {deadline} exactly as they\nare.\n\nLoops shows these DNS records for my domain: [paste them]. My\nregistrar is [name it]. Walk me through adding them.',
      metadata: { language: 'prompt', emphasis: true, caption: 'Never paste your API key into a chat' }
    },
    {
      id: 'done-heading',
      type: 'heading',
      content: '✅ You Are Done When'
    },
    {
      id: 'done-list',
      type: 'list',
      content: 'Loops shows your domain as verified|Three transactional emails are published, each with the variables from the table|**.env** and Vercel both have LOOPS_API_KEY and the three IDs|Your test account received Worksheet received, Worksheet updated and You are in'
    },
    {
      id: 'closing-para',
      type: 'paragraph',
      content: 'Nobody on your waitlist has to wonder any more. They hear from you the moment they reach out, and again the moment you say yes.'
    },
    {
      id: 'final-quote',
      type: 'quote',
      content: 'Silence feels like no. Say we got it.',
      metadata: { author: 'unparty-app', style: 'minimal' }
    }
  ]
};
