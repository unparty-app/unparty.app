import type { EditorialArticle } from '../types';

// SETUP. curriculum, optional step `file-uploads`, titled Photo prompts
// (prisma/setup-steps.ts, #1106). A `photo-upload` Step made in /admin/steps with
// a bare `cover` id makes that cover clickable in any `covers` scrollRow and on
// /covers (/api/steps/by-cover; CoverPhotoCard links to /steps/<id> instead of the
// story). StepPhotoUpload posts to /api/steps/[stepId]/upload-photo → Vercel Blob
// (public store; @vercel/blob 2.x signs in with OIDC + BLOB_STORE_ID on Vercel, or
// BLOB_READ_WRITE_TOKEN, src/lib/blob-store.ts), images only, 4.5 MB max
// (src/lib/upload-limits.ts), and the blob URL completes the step in
// UserStepProgress. With no store, the prompt still opens: the owner gets this
// article's link, a visitor the site's "build yours" ask. Photos show in /admin (everyone), /party (mine, behind the
// owner's waitlist) and on the cover itself. /blobupload is admin-only (#1184).
export const SETUP_FILE_UPLOADS_ARTICLE: EditorialArticle = {
  slug: 'setup-file-uploads',
  title: 'PHOTO PROMPTS.',
  subtitle: 'Turn any picture on your site into a question. Visitors answer with a photo, and you collect them.',
  description: 'How non-technical founders collect photos from their visitors on their own Next.js site: connect a Vercel Blob store, make a photo prompt tied to a cover, show it in an article, and see every photo in one place.',
  category: 'SETUP.',
  date: '2026-09-30',
  updated: '2026-10-14',
  published: true,
  author: 'justin-murry',
  readTime: '8 min',
  tags: ['Photo Prompts', 'Uploads', 'Vercel Blob', 'Steps', 'Setup', 'Non-Technical Founders', 'Software You Own'],
  sections: [
    {
      id: 'hero-photos',
      type: 'hero',
      content: 'ask them to show you.',
      metadata: { style: 'highlight' }
    },
    {
      id: 'intro',
      type: 'paragraph',
      content: 'A photo prompt is a question your visitors answer with a picture. You choose a cover on your site and one word, like **home**. When someone clicks that cover, it asks them to upload a photo that represents home. Their photo takes the cover\'s place for them, the prompt counts as done, and you see every answer in one place.',
      metadata: { dropCap: true }
    },
    {
      id: 'how-table',
      type: 'table',
      metadata: {
        headers: ['A visitor', 'Your site'],
        rows: [
          ['Clicks a cover with a prompt on it', 'Opens the prompt: "upload a photo that represents home"'],
          ['Signs in and picks a photo', 'Stores the photo in your Vercel Blob store'],
          ['Sees their photo on the cover, marked completed', 'Marks the prompt done for them in your database'],
          ['Finds all their photos under MY PHOTOS.', 'Shows you everyone\'s under UPLOADED PHOTOS.']
        ]
      }
    },
    {
      id: 'challenge-photos',
      type: 'challenge',
      userPrompt: 'PHOTO PROMPTS.',
      label: 'BUILD.',
      pollEnabled: false,
      stepOne: { emoji: '1️⃣', action: 'Store it.', description: 'A place for the photos.' },
      stepTwo: { emoji: '2️⃣', action: 'Prompt.', description: 'One word on one cover.' },
      stepThree: { emoji: '3️⃣', action: 'Collect.', description: 'Answer it, then see it.' },
      successMetric: 'a visitor can answer your prompt with a photo.'
    },
    {
      id: 'before-list',
      type: 'list',
      content: '**Your own cover** — from [Your first cover](/article/setup-first-cover). The prompt sits on it|**An article** — from [Your first article](/article/setup-first-article), to show the cover in|**Your site deployed** — from [Deploy](/article/setup-deploy). The photos are stored with Vercel, next to your site',
      metadata: { style: 'accent' }
    },
    {
      id: 'divider-store',
      type: 'divider'
    },
    {
      id: 'store-heading',
      type: 'heading',
      content: '1️⃣ Give the Photos a Place to Live'
    },
    {
      id: 'store-para',
      type: 'paragraph',
      content: 'Your database remembers who answered which prompt. The photos themselves are files, and files go in **Vercel Blob**, a storage space that sits next to your site on Vercel. You create it once.'
    },
    {
      id: 'store-steps',
      type: 'list',
      content: 'In Vercel, open your project, then **Storage** in the sidebar|Click **Create Storage** and choose **Blob**, then **Continue**|Choose **Public**. Your site shows the photos with a plain link, which needs a public store, and a store cannot be switched later|Name it **photos** and create it|When it asks for environments, keep **Production** and **Preview**, and tick **Development** as well, so your computer can use it too',
      metadata: { numbered: true }
    },
    {
      id: 'token-para',
      type: 'paragraph',
      content: 'Your live site needs nothing more. Vercel connects it to the store by itself, and adds **BLOB_STORE_ID** to your project so the site knows which store is yours. Your computer needs a key of its own. In your project, open **Settings → Environment Variables**, find **BLOB_READ_WRITE_TOKEN**, reveal it, and copy it into **.env**:'
    },
    {
      id: 'token-code',
      type: 'code',
      content: '# .env\nBLOB_READ_WRITE_TOKEN="vercel_blob_rw_…"',
      metadata: { language: 'bash', caption: 'Then stop npm run dev and start it again, so your site reads the new key' }
    },
    {
      id: 'token-missing',
      type: 'personal',
      content: 'No **BLOB_READ_WRITE_TOKEN** in the list? Vercel adds it when you create a store from your project, but not always when you connect a store you made elsewhere. Your live site works either way. For your computer, run **vercel env pull** once in your project\'s folder: it writes **.env.local**, which your site reads next to .env, and keeps the store\'s sign-in fresh by itself.'
    },
    {
      id: 'limits-list',
      type: 'list',
      content: '**Photos only** — the prompt accepts pictures, nothing else|**4.5 MB each** — every photo passes through your site on its way to the store, and Vercel caps that at 4.5 MB. A bigger photo gets a message asking for a smaller one. Most phone photos fit; a very large one can be shared as a smaller copy|**Anyone with a photo\'s link can see it** — that is what Public means. Ask for photos you would be happy to show',
      metadata: { style: 'accent' }
    },
    {
      id: 'divider-prompt',
      type: 'divider'
    },
    {
      id: 'prompt-heading',
      type: 'heading',
      content: '2️⃣ Make a Prompt'
    },
    {
      id: 'prompt-para',
      type: 'paragraph',
      content: 'A prompt is a step, the same kind as the setup steps you have been ticking off, with one difference: it is completed by a photo. Start your site with **npm run dev**, then:'
    },
    {
      id: 'prompt-steps',
      type: 'list',
      content: 'Open **localhost:3000/admin/steps** and click **+ New Step**|**Title** and **Description**: what the prompt is about, like "Home" and "Show us where you feel at home"|**Step Type**: choose **Photo Upload**|**Upload Word**: the one word the prompt asks for, like **home**|**Cover (Optional)**: the name of your cover, bare, like **cover-052**. No folder, no ending|**Visibility**: leave it on **All Users**, so everyone who sees the cover can open the prompt|Click **Create Step**',
      metadata: { numbered: true }
    },
    {
      id: 'cover-rule',
      type: 'personal',
      content: '**cover-052** works. **/covers/cover-001.png** does not: the prompt matches the cover by its bare name only.'
    },
    {
      id: 'show-heading',
      type: 'heading',
      content: '🖼️ Put the Cover Where People Will See It'
    },
    {
      id: 'show-para',
      type: 'paragraph',
      content: 'The prompt appears wherever that cover appears in a row of covers. Your **/covers** page already has one: open **localhost:3000/covers**, and your cover now opens the prompt. To ask inside an article, open your article\'s file. In its menu of switched-off sections is a **SCROLL ROW** line. Delete the **//** in front of it and list your cover:'
    },
    {
      id: 'show-code',
      type: 'code',
      content: "    { id: 'row-1', type: 'scrollRow', metadata: { scrollRowType: 'covers', title: 'SHOW US HOME.', coverIds: ['cover-052'], maxItems: 5, moreLink: '/covers' } },",
      metadata: { language: 'typescript', emphasis: true, caption: 'coverIds holds bare cover names, the same as the prompt\'s Cover' }
    },
    {
      id: 'story-note',
      type: 'list',
      content: '**A prompt takes over its cover** — in rows of covers, clicking that cover opens the prompt instead of its story. Put prompts on covers whose story can wait, or on a cover made for the prompt|**One prompt per cover** — for a second question, use a second cover|**/covers shows five per row** — only the first five covers in each row appear there, which is why your first cover went at the top of the list',
      metadata: { style: 'accent' }
    },
    {
      id: 'divider-collect',
      type: 'divider'
    },
    {
      id: 'collect-heading',
      type: 'heading',
      content: '3️⃣ Answer It, Then Collect the Answers'
    },
    {
      id: 'answer-steps',
      type: 'list',
      content: 'Open the page with your cover and click it. The prompt opens with your word in large letters|Signed out, it offers **sign in to upload**. Sign in|Click **choose a photo** and pick one. A moment later your photo appears in a circle, marked **completed**|Close the prompt. The cover shows a completed mark, and for you it now shows your photo',
      metadata: { numbered: true }
    },
    {
      id: 'where-table',
      type: 'table',
      metadata: {
        headers: ['Where', 'Who sees what'],
        rows: [
          ['/admin, under UPLOADED PHOTOS.', 'You: every photo from every visitor, with who sent it'],
          ['/party, under MY PHOTOS.', 'Each visitor: only their own photos'],
          ['The cover itself', 'Each visitor who answered: their own photo'],
          ['Vercel, Storage, your store\'s Browser', 'You: the files themselves, to download or delete']
        ]
      }
    },
    {
      id: 'party-note',
      type: 'personal',
      content: '**/party** is behind your waitlist. You are an admin, so you get in. Your visitors see their MY PHOTOS. once you let them in, which the waitlist step covers. They can answer prompts before that; the photos wait for them.'
    },
    {
      id: 'push-para',
      type: 'paragraph',
      content: 'The prompt lives in your database, so your live site has it already. Push your article change in GitHub Desktop (a summary like "Ask for photos", then **Commit to main** and **Push origin**), and answer your prompt once on your live address to see it work there too.'
    },
    {
      id: 'collect-quote',
      type: 'quote',
      content: 'One word, one cover. The answers are pictures.',
      metadata: { author: 'unparty-app', style: 'highlight' }
    },
    {
      id: 'admin-heading',
      type: 'heading',
      content: '📎 For You: Put Any File Online'
    },
    {
      id: 'admin-para',
      type: 'paragraph',
      content: 'The same store can hold files you want to share: a PDF menu, a price list, a press photo. Open **localhost:3000/blobupload**, choose a file, and click **Upload**. You get a link you can put in any article. Only admins can use it, and the 4.5 MB limit applies here too.'
    },
    {
      id: 'trouble-heading',
      type: 'heading',
      content: '🧯 If Something Is Off'
    },
    {
      id: 'trouble-list',
      type: 'list',
      content: '**Clicking the cover opens its story, not the prompt** — the Cover on the step must be the bare name, like cover-052, and match the name in coverIds exactly. Also check that Step Type is Photo Upload and Visibility is All Users|**The prompt says photos need a place to live** — your site has no store yet. On your computer, BLOB_READ_WRITE_TOKEN is missing from .env, or npm run dev was not restarted after adding it. On your live site, check the store is connected to your project in Storage, then redeploy so the site picks it up. Visitors see your **build yours** link there instead, until a store is connected|**that photo didn\'t go through.** — the store is connected but the upload failed. Try again; if it keeps happening, open your project\'s **Logs** in Vercel and look for "Failed to upload step photo"|**your session ended while this was open** — the visitor\'s sign-in lapsed. **refresh to upload** signs them back in|**photos up to 4.5 MB.** — the photo is too large. Share a smaller copy|**only photos can be uploaded here.** — the file is not a picture|**/blobupload says Admin access required** — you are signed out, or your admin role is missing. See [Make yourself admin](/article/setup-make-yourself-admin)'
    },
    {
      id: 'llm-heading',
      type: 'heading',
      content: '🤖 Ask Your LLM'
    },
    {
      id: 'llm-prompts',
      type: 'code',
      content: 'My site is about [describe it]. Suggest five one-word photo\nprompts my visitors would enjoy answering, each with a one-line\ndescription that says what kind of photo to send.\n\n(In Claude Code, inside your copy)\nIn my article src/app/constants/editorial-articles/articles/[file].ts,\nswitch on the scroll row of covers and list cover-052 in it, then\nrun npx tsc --noEmit until it prints nothing.',
      metadata: { language: 'prompt', emphasis: true, caption: 'Let it suggest words. The question is yours to ask' }
    },
    {
      id: 'done-heading',
      type: 'heading',
      content: '✅ You Are Done When'
    },
    {
      id: 'done-list',
      type: 'list',
      content: 'Your Vercel project has a Public Blob store, and **.env** has its **BLOB_READ_WRITE_TOKEN** (or **.env.local** came from vercel env pull)|A Photo Upload step with your word and your cover is in **/admin/steps**|Clicking your cover opens the prompt, on /covers and in your article|Your own answer shows in **/admin** under **UPLOADED PHOTOS.**'
    },
    {
      id: 'closing-para',
      type: 'paragraph',
      content: 'Your site used to only show. Now it can ask. Every cover you own can hold a question, and every answer is a photo you did not have to take.'
    },
    {
      id: 'final-quote',
      type: 'quote',
      content: 'Ask a better question. Get a better picture.',
      metadata: { author: 'unparty-app', style: 'minimal' }
    }
  ]
};
