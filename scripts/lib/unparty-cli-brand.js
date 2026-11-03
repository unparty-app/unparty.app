// Node port of theunpartyrunway's unparty_styles.sh logo animation
// (show_unparty_logo / show_unparty_compact / show_unparty_minimal).
//
// util.styleText only exposes the basic 16 ANSI colors, so the exact brand
// yellow (#f9c22e) needs a raw truecolor escape — same approach the bash
// version uses (`\033[38;2;249;194;46m`).
const BRAND = '\x1b[38;2;249;194;46m';
const RESET = '\x1b[0m';

const LOGO_LINES = [
  '██╗   ██╗███╗   ██╗██████╗  █████╗ ██████╗ ████████╗██╗   ██╗',
  '██║   ██║████╗  ██║██╔══██╗██╔══██╗██╔══██╗╚══██╔══╝╚██╗ ██╔╝',
  '██║   ██║██╔██╗ ██║██████╔╝███████║██████╔╝   ██║    ╚████╔╝ ',
  '██║   ██║██║╚██╗██║██╔═══╝ ██╔══██║██╔══██╗   ██║     ╚██╔╝  ',
  '╚██████╔╝██║ ╚████║██║     ██║  ██║██║  ██║   ██║      ██║   ',
  ' ╚═════╝ ╚═╝  ╚═══╝╚═╝     ╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝      ╚═╝   ',
];

// The line-by-line reveal is for someone watching a terminal. Piped output or
// CI (Vercel, GitHub Actions) prints the same banner without the pauses, which
// would add ~1s to every build there for nobody to see (#980)
const animate = Boolean(process.stdout.isTTY) && !process.env.CI;

const sleep = (seconds) =>
  animate ? new Promise((resolve) => setTimeout(resolve, seconds * 1000)) : Promise.resolve();

export async function showUnpartyLogo(timing = 0.1) {
  for (const line of LOGO_LINES) {
    console.log(`${BRAND}${line}${RESET}`);
    await sleep(timing);
  }
}

export function showUnpartyCompact() {
  console.log(`${BRAND}[ UNPARTY ]${RESET}`);
}

export function showUnpartyMinimal() {
  console.log(`${BRAND}unparty${RESET}`);
}

export async function showUnpartyHeader({ title, subtitle, timing = 0.1 } = {}) {
  await showUnpartyLogo(timing);
  await sleep(0.2);

  if (title) {
    console.log(`\x1b[1;37m${title}${RESET}`);
    await sleep(0.1);
  }

  console.log(`\x1b[0;36m${subtitle ?? 'YOU BUILD. AI HALLUCINATES. INNOVATE THE DIFFERENCE.'}${RESET}`);
  console.log('');
}
