import type { EditorialArticle } from '../types';

// SETUP. curriculum, optional step `music` (prisma/setup-steps.ts, #1106). Apple
// MusicKit plays an article's theme song in the byline bar (Banner → MusicBanner) and
// in `music` sections. The owner's Apple Developer account provides a Media ID and a
// Media Services key (.p8); src/lib/apple-music-token.ts signs developer tokens from
// APPLE_MUSIC_TEAM_ID / APPLE_MUSIC_KEY_ID / APPLE_MUSIC_PRIVATE_KEY for
// /api/musickit-token (browser) and /api/music/metadata (artist, title, artwork).
// Full playback needs the listener's own Apple Music subscription. A song is picked by
// appleMusicUrl (album ?i= link or song link) or by musicTrackId from
// src/data/musicTracks.json.
export const SETUP_MUSIC_ARTICLE: EditorialArticle = {
  slug: 'setup-music',
  title: 'MUSIC.',
  subtitle: 'Give every article a theme song your readers can play without leaving the page.',
  description: 'How non-technical founders add Apple Music to their own Next.js site: register a Media ID, create a MusicKit key, put three values in .env, and give an article a theme song.',
  category: 'SETUP.',
  date: '2026-09-30',
  updated: '2026-11-02',
  published: true,
  author: 'justin-murry',
  readTime: '8 min',
  tags: ['Music', 'Apple Music', 'MusicKit', 'Theme Song', 'Setup', 'Non-Technical Founders', 'Software You Own'],
  appleMusicUrl: 'https://music.apple.com/us/song/dtmf/1787023936',
  sections: [
    {
      id: 'hero-music',
      type: 'hero',
      content: 'every story has a song.',
      metadata: { style: 'highlight' }
    },
    {
      id: 'intro',
      type: 'paragraph',
      content: 'Writing has a mood, and music says it faster than a paragraph can. This step lets every article on your site carry a theme song: the artist and title sit in the bar at the top of the article, next to a play button. Readers with Apple Music hear the whole song right there. The song plays through **Apple MusicKit**, using a key from your own Apple Developer account.',
      metadata: { dropCap: true }
    },
    {
      id: 'where-table',
      type: 'table',
      metadata: {
        headers: ['Where', 'What readers see', 'How you add it'],
        rows: [
          ['The bar at the top of an article', 'Its theme song, with a play button', 'appleMusicUrl on the article'],
          ['Inside an article', 'A song player between paragraphs', 'A music section'],
          ['Next to every player', 'The Listen on Apple Music badge', 'Nothing. It is already there']
        ]
      }
    },
    {
      id: 'honest-list',
      type: 'list',
      content: '**It costs $99 a year** — MusicKit keys come with the Apple Developer Program. If you build an iPhone app later, it is the same membership|**Readers need Apple Music for the full song** — the first time someone presses play, Apple asks them to sign in. Your site never sees their account|**Each song is optional** — an article without a theme song shows no player. Skip this step, and leave theme songs off your articles',
      metadata: { style: 'accent' }
    },
    {
      id: 'challenge-music',
      type: 'challenge',
      userPrompt: 'MUSIC.',
      label: 'BUILD.',
      pollEnabled: false,
      stepOne: { emoji: '1️⃣', action: 'Media ID.', description: 'Tell Apple what will play music.' },
      stepTwo: { emoji: '2️⃣', action: 'Get key.', description: 'One key file, three values.' },
      stepThree: { emoji: '3️⃣', action: 'Add song.', description: 'Give one article a theme song.' },
      successMetric: 'you pressed play on your own article and heard the song.'
    },
    {
      id: 'before-list',
      type: 'list',
      content: '**An Apple Developer Program membership** — join at **developer.apple.com/programs**. Approval can take a day or two, so start early|**Your site name** — from [Your identity](/article/setup-identity). It is the name Apple shows readers when it asks them to allow access|**An article to try it on** — from [Your first article](/article/setup-first-article)',
      metadata: { style: 'accent' }
    },
    {
      id: 'divider-id',
      type: 'divider'
    },
    {
      id: 'id-heading',
      type: 'heading',
      content: '1️⃣ Tell Apple What Will Play Music'
    },
    {
      id: 'id-para',
      type: 'paragraph',
      content: 'Apple calls this a **Media ID**: a name for the thing that will use Apple Music, here your website. You make it once.'
    },
    {
      id: 'id-steps',
      type: 'list',
      content: 'Sign in at **developer.apple.com/account** and open **Certificates, Identifiers & Profiles**|Click **Identifiers** in the sidebar, then the **+** button|Choose **Media IDs** and click **Continue**|For the description, type your site name. For the identifier, type your domain backwards with **media.** in front, like **media.com.yourname**|Check **MusicKit**, click **Continue**, then **Register**',
      metadata: { numbered: true }
    },
    {
      id: 'divider-key',
      type: 'divider'
    },
    {
      id: 'key-heading',
      type: 'heading',
      content: '2️⃣ One Key File, Three Values'
    },
    {
      id: 'key-para',
      type: 'paragraph',
      content: 'Now make the key your site signs with. Apple gives you the file **once**, so have a safe place ready, like your password manager.'
    },
    {
      id: 'key-steps',
      type: 'list',
      content: 'Still in Certificates, Identifiers & Profiles, click **Keys** in the sidebar, then the **+** button|Name it after your site, like **yourname music**|Check **Media Services**. If you have more than one Media ID, click **Configure** and choose the one from step 1|Click **Continue**, then **Confirm**|Click **Download**. You get a file named like **AuthKey_ABC123DEFG.p8**. Save it now: Apple will not let you download it again|Click the key in the list. The 10 characters under its name are your **Key ID**|Click **Membership** in the sidebar. The 10 characters under your team name are your **Team ID**',
      metadata: { numbered: true }
    },
    {
      id: 'env-para',
      type: 'paragraph',
      content: 'Open the .p8 file in TextEdit (or Notepad). Copy all of it, including the BEGIN and END lines, and paste it into **.env** between the quotes. Add the same three to Vercel\'s Environment Variables, then redeploy:'
    },
    {
      id: 'env-code',
      type: 'code',
      content: '# .env\nAPPLE_MUSIC_TEAM_ID="ABC123DEFG"     # Membership\nAPPLE_MUSIC_KEY_ID="XYZ987WVUT"      # under the key name\nAPPLE_MUSIC_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIGTAgEAMBMGByqGSM49...\n-----END PRIVATE KEY-----"',
      metadata: { language: 'bash', emphasis: true, caption: 'Restart npm run dev after changing .env' }
    },
    {
      id: 'check-para',
      type: 'paragraph',
      content: 'Check it worked: open **/api/musickit-token** on your site, like localhost:3000/api/musickit-token. A long **token** means your site can talk to Apple Music. An **error** sends you to the list at the end.'
    },
    {
      id: 'divider-song',
      type: 'divider'
    },
    {
      id: 'song-heading',
      type: 'heading',
      content: '3️⃣ Give One Article a Theme Song'
    },
    {
      id: 'song-steps',
      type: 'list',
      content: 'In Apple Music, find the song. Click **•••** next to the **song** (not the album), then **Share → Copy Link**|Open your article file in **src/app/constants/editorial-articles/articles/**|Below the line with **date:**, add the link as **appleMusicUrl**, like the example below|Save and open the article. The bar at the top shows the artist and title, with a play button',
      metadata: { numbered: true }
    },
    {
      id: 'song-code',
      type: 'code',
      content: '// the theme song, in the bar at the top\n  date: \'2026-09-30\',\n  appleMusicUrl: \'https://music.apple.com/us/album/dtmf/1787022393?i=1787023936\',\n\n// a song inside the article, as one of its sections\n  {\n    id: \'mood\',\n    type: \'music\',\n    content: \'What I had on while writing this.\',\n    metadata: { appleMusicUrl: \'https://music.apple.com/us/song/dtmf/1787023936\' }\n  },',
      metadata: { language: 'typescript', caption: 'Either kind of link works: an album link ending in ?i=, or a song link' }
    },
    {
      id: 'song-quote',
      type: 'quote',
      content: 'The song says what the headline cannot.',
      metadata: { author: 'unparty-app', style: 'highlight' }
    },
    {
      id: 'rules-heading',
      type: 'heading',
      content: '⚖️ Apple\'s Rules, Already Followed'
    },
    {
      id: 'rules-para',
      type: 'paragraph',
      content: 'Apple lets you use Apple Music on your site if you play by a few rules. Your copy already does. Keep it that way:'
    },
    {
      id: 'rules-list',
      type: 'list',
      content: '**Readers press play** — music never starts by itself|**The badge stays** — the Listen on Apple Music badge appears next to every player. Do not remove or restyle it|**The fine print stays** — your footer credits Apple Music, and your privacy policy says how Apple Music sign-in works. Keep both when you edit those pages|**Never charge for the music** — you can sell your work, but not access to the songs'
    },
    {
      id: 'know-heading',
      type: 'heading',
      content: '⚠️ Good to Know'
    },
    {
      id: 'know-list',
      type: 'list',
      content: '**The key does not expire** — your site makes a fresh pass from it every few hours. If the .p8 file ever leaks, revoke the key in Keys and make a new one|**Readers without Apple Music** — they see the song and the badge. Pressing play asks them to sign in to Apple Music first|**The songs that came with your copy** — a few articles from the template use songs from **src/data/musicTracks.json**. Change those articles, or the list, to your own songs'
    },
    {
      id: 'trouble-heading',
      type: 'heading',
      content: '🧯 If Something Is Off'
    },
    {
      id: 'trouble-list',
      type: 'list',
      content: '**Unable to initialize music player.** — this is what readers see whenever your site cannot reach Apple Music. Open **/api/musickit-token** to see why|**Songs show with no play button.** — Apple Music isn\'t connected where you tested, so a song is only a link to it. **/api/musickit-token** says Music playback not configured when one of the three values is missing. Check the names, then restart npm run dev or redeploy|**It says Music authentication failed.** — the key did not paste whole. Copy the full .p8 file again, BEGIN and END lines included, between double quotes|**No theme song in the bar** — the link points to an album, not a song. Copy the link from the song itself|**Unknown Artist** — the link worked, but your site could not ask Apple for the details. Check the Key ID and Team ID|**Nothing happens on play** — your browser blocked Apple\'s sign-in window. Allow pop-ups for your site'
    },
    {
      id: 'llm-heading',
      type: 'heading',
      content: '🤖 Ask Your LLM'
    },
    {
      id: 'llm-prompts',
      type: 'code',
      content: 'Here is the opening of my article: [paste it]. Suggest five songs\nthat match its mood, with one line each on why.\n\nIn src/app/constants/editorial-articles/articles/[file].ts, add\nthis song as the theme song with appleMusicUrl: [paste link].\n\nMy site shows "[paste the message]" on the theme song. Using\nsrc/lib/apple-music-token.ts, tell me what to check.',
      metadata: { language: 'prompt', emphasis: true, caption: 'Never paste the .p8 file into a chat' }
    },
    {
      id: 'done-heading',
      type: 'heading',
      content: '✅ You Are Done When'
    },
    {
      id: 'done-list',
      type: 'list',
      content: 'Your Apple Developer account has a Media ID with MusicKit, and a key with Media Services|The .p8 file is saved somewhere safe|**.env** and Vercel both have APPLE_MUSIC_TEAM_ID, APPLE_MUSIC_KEY_ID and APPLE_MUSIC_PRIVATE_KEY|**/api/musickit-token** on your live site shows a token|One article shows its theme song, and you heard it play'
    },
    {
      id: 'closing-para',
      type: 'paragraph',
      content: 'Your articles have a sound now. Pick songs the way you pick words: on purpose.'
    },
    {
      id: 'final-quote',
      type: 'quote',
      content: 'Turn it up. Then write.',
      metadata: { author: 'unparty-app', style: 'minimal' }
    }
  ]
};
