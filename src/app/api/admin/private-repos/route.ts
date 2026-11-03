import { NextResponse } from 'next/server';
import { adminGuard } from '@/lib/admin';
import { PRIVATE_REPOS_ON } from '@/app/constants/organization';
import { CAN_CHANGE_CONFIG, CONFIG_PATH, LOCAL, writeFoundersConfig } from '@/lib/founders-config-write';

// The private repos switch on /admin: whether RepoFocus shows private repos,
// their names and hours. What the site says about the owner's work is theirs
// to decide, so it lives in src/data/FoundersConfig.json (`privateRepos`), and
// flipping it changes that file (src/lib/founders-config-write.ts: at once
// locally, after a deploy otherwise). The next build measures with it

/** The config text with `privateRepos` set, keeping the file's own formatting */
function withPrivateRepos(text: string, on: boolean): string {
  if (/"privateRepos":\s*(true|false)/.test(text)) return text.replace(/"privateRepos":\s*(true|false)/, `"privateRepos": ${on}`);
  return text.replace(/\n}\s*$/, `,\n  "privateRepos": ${on}\n}\n`);
}

export async function GET() {
  const denied = await adminGuard();
  if (denied) return denied;
  return NextResponse.json({ on: PRIVATE_REPOS_ON, canChange: CAN_CHANGE_CONFIG, local: LOCAL });
}

export async function POST(request: Request) {
  const denied = await adminGuard();
  if (denied) return denied;

  const { on } = await request.json().catch(() => ({}));
  if (typeof on !== 'boolean') {
    return NextResponse.json({ error: 'on must be true or false' }, { status: 400 });
  }

  if (!CAN_CHANGE_CONFIG) {
    return NextResponse.json(
      { error: `Set "privateRepos": ${on} in ${CONFIG_PATH} and redeploy (connect your GitHub App to change it from here)` },
      { status: 409 }
    );
  }

  try {
    const result = await writeFoundersConfig((text) => withPrivateRepos(text, on), {
      branch: `private-repos-${on ? 'on' : 'off'}`,
      title: `SETUP. ${on ? 'Show' : 'Hide'} private repos in Repo Focus`,
      body: on
        ? "From /admin: Repo Focus shows your private repos' names and hours too, from the next build."
        : 'From /admin: Repo Focus leaves your private repos out, from the next build.',
    });
    return NextResponse.json({ on, ...result });
  } catch (error) {
    console.error('Private repos switch failed:', error);
    return NextResponse.json({ error: 'Could not change it' }, { status: 500 });
  }
}
