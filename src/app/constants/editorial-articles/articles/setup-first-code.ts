import type { EditorialArticle } from '../types';

// SETUP. optional step `first-code` (prisma/setup-steps.ts, #832). The file is
// the one /color downloads and UNCOLOR exports (colorSlotsToCss here,
// ExportManager.generateCSS in uncolor-ios), and the ColorPalette embed reads it
// back (parseColorsFromCss, parseBrandInfoFromCss), so what this says goes wrong
// is what those parsers do: a color they can't read leaves its line empty.
export const SETUP_FIRST_CODE_ARTICLE: EditorialArticle = {
  slug: 'setup-first-code',
  title: 'YOUR FIRST CODE.',
  subtitle: 'One small file. Change one line by hand, and watch your colors change.',
  description: 'Your first code: get a .css file of your five colors, read it line by line, change one color by hand in a text editor, and load it back to see the change. No install, no account.',
  category: 'SETUP.',
  date: '2026-11-02',
  updated: '2026-11-02',
  published: true,
  author: 'justin-murry',
  readTime: '5 min',
  tags: ['Code', 'CSS', 'Colors', 'UNCOLOR', 'Setup', 'Software You Own'],
  sections: [
    {
      id: 'hero-code',
      type: 'hero',
      content: 'one line.',
      metadata: { style: 'highlight' }
    },
    {
      id: 'intro',
      type: 'paragraph',
      content: 'Code is a text file that something else reads. This one is eight lines long, and all it holds is your five colors. You don\'t need to install anything or sign up for anything. You\'ll change one line by hand, and you\'ll see exactly what it did.',
      metadata: { dropCap: true }
    },
    {
      id: 'challenge-code',
      type: 'challenge',
      coverCaption: 'your first code.',
      stepOne: { icon: 'Palette', action: 'Make it.', description: 'Five colors, saved as a file.' },
      stepTwo: { icon: 'Edit3', action: 'Change it.', description: 'One line, by hand.' },
      stepThree: { icon: 'Upload', action: 'Load it.', description: 'See what you did.' },
      successMetric: 'you changed a file, and your colors changed.'
    },
    {
      id: 'make-heading',
      type: 'heading',
      content: 'make it.'
    },
    {
      id: 'make-para',
      type: 'paragraph',
      content: 'Go to [/color](/color) and pick five colors. Under **keep them.**, tap **take it**, and a .css file lands in your downloads. That works on any computer. On an iPhone, UNCOLOR makes the same kind of file from your palette, along with your brand\'s name and tagline.'
    },
    {
      id: 'read-heading',
      type: 'heading',
      content: 'read it.'
    },
    {
      id: 'read-para',
      type: 'paragraph',
      content: 'Open the file in a text editor: TextEdit on a Mac, Notepad on Windows. Double-clicking might open a browser instead, so right-click it and choose **Open With**. It looks something like this.'
    },
    {
      id: 'read-code',
      type: 'code',
      content: '/* my colors */\n:root {\n  --color-primary: #D62246;\n  --color-secondary: #4B1D3F;\n  --color-accent: #F2AF29;\n  --color-additional-1: #0E7C7B;\n  --color-additional-2: #17BEBB;\n}',
      metadata: { language: 'css', emphasis: true, caption: 'Yours has your colors. That\'s the whole file' }
    },
    {
      id: 'read-list',
      type: 'list',
      content: '`/* my colors */` is a note to yourself. Nothing reads it|`:root { }` holds everything between the braces|`--color-primary` is a name for a color|`#D62246` is the color. The # and six characters say how much red, green and blue|`;` ends the line',
      metadata: { style: 'accent' }
    },
    {
      id: 'change-heading',
      type: 'heading',
      content: 'change it.'
    },
    {
      id: 'change-para',
      type: 'paragraph',
      content: 'Find the line that says **--color-primary** and change its six characters. Try **#000000** for black, or any color you like. Keep the # and the ; exactly where they are. Then add one new line above the closing brace, with your name in the quotes, and save the file.'
    },
    {
      id: 'change-code',
      type: 'code',
      content: ':root {\n  --color-primary: #000000;\n  --color-secondary: #4B1D3F;\n  --color-accent: #F2AF29;\n  --color-additional-1: #0E7C7B;\n  --color-additional-2: #17BEBB;\n  --brand-name: "your name";\n}',
      metadata: { language: 'css', emphasis: true, caption: 'Two changes: one color, and one new line' }
    },
    {
      id: 'load-heading',
      type: 'heading',
      content: 'load it.'
    },
    {
      id: 'load-para',
      type: 'paragraph',
      content: 'Tap **import .css** here and choose your file. Look at the first line, and at the name above it. Nothing wrote those but you.'
    },
    {
      id: 'load-palette',
      type: 'component',
      metadata: { componentName: 'ColorPalette', componentProps: {} }
    },
    {
      id: 'owner-para',
      type: 'personal',
      content: 'Signed in to your own copy as its owner? The import also offers to use that name on your site, and shows you what would change first. Your five colors can become your site\'s in [your brand colors](/article/setup-brand).'
    },
    {
      id: 'trouble-heading',
      type: 'heading',
      content: 'if it looks wrong.'
    },
    {
      id: 'trouble-list',
      type: 'list',
      content: '**One line came up empty** — that color couldn\'t be read. It needs the #, then 3 or 6 characters from 0 to 9 and A to F, then the ;|**It says no colors were found** — the names changed. Each one has to stay spelled as it was, like --color-primary|**Your name didn\'t show** — it needs both quotes, and the ; after them|**TextEdit won\'t save it as .css** — choose Format, then Make Plain Text, and keep the name ending in .css|**Notepad saved it as .txt** — in Save As, choose All Files, and keep the name ending in .css'
    },
    {
      id: 'llm-heading',
      type: 'heading',
      content: 'ask your LLM.'
    },
    {
      id: 'llm-prompts',
      type: 'code',
      content: 'Here is my .css file. Explain each line in plain words.\nDon\'t change anything. I want to make the change myself.\n\nI changed a line and now it comes up empty. What did I break?',
      metadata: { language: 'prompt', emphasis: true, caption: 'Have it explain. Keep the typing for yourself' }
    },
    {
      id: 'done-heading',
      type: 'heading',
      content: 'you are done when.'
    },
    {
      id: 'done-list',
      type: 'list',
      content: 'You opened the file and could say what each line does|The color you typed is the one on the line|Your name sits above your colors'
    },
    {
      id: 'closing-para',
      type: 'paragraph',
      content: 'Every file in your copy is this same kind of thing: text, and something that reads it. Some are longer. When you want the next one, [your first article](/article/setup-first-article) is also a file you can read.'
    }
  ]
};
