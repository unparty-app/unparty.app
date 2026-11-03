import { NextResponse } from 'next/server';
import { adminGuard } from '@/lib/admin';
import { CAN_CHANGE_CONFIG, LOCAL, writeFoundersConfig, writeRepoFile, type ConfigWriteResult } from '@/lib/founders-config-write';
import { saveDate, stampForSave } from '@/lib/stamp-on-save';
import storiesManifest from '@/data/storiesManifest.json';
import { manifestWith, slugFor, splitStory, withField, type StoriesManifest } from '@/lib/story-file';

// The story writer's save (#229): the owner writes a story in /admin/stories
// and it's saved as public/covers/stories/story-NNN.md. Locally the file
// itself (the dev server shows it at once; the pre-commit hook dates it when
// it's committed); deployed, a self-merging pull request through the owner's
// GitHub App, dated here the way the iOS app's saves are (/api/stories/[id]).
// A published story gets its address the way npm run get-stories gives it
// (a slug in its frontmatter, its line in src/data/storiesManifest.json, in
// the same pull request), so it has a page without anyone running a command.
// `why` also points FoundersConfig founder.why at it: the story answering
// "why build your own?", which /build opens with (#589)

/** founder.why set in the config text, keeping the file's own formatting */
function withWhy(text: string, storyId: string): string {
  if (/"why":\s*"[^"]*"/.test(text)) return text.replace(/"why":\s*"[^"]*"/, `"why": "${storyId}"`);
  return text.replace(/"founder":\s*{/, `"founder": {\n    "why": "${storyId}",`);
}

export async function PUT(request: Request, { params }: { params: Promise<{ storyId: string }> }) {
  const denied = await adminGuard();
  if (denied) return denied;

  const { storyId } = await params;
  if (!/^story-\d+$/.test(storyId)) return NextResponse.json({ error: 'A story id looks like story-001' }, { status: 400 });

  const { content, why, localDate } = (await request.json().catch(() => ({}))) as { content?: unknown; why?: unknown; localDate?: unknown };
  if (typeof content !== 'string' || !content.trim()) return NextResponse.json({ error: 'The story is empty' }, { status: 400 });
  const { fields } = splitStory(content);
  if (!fields.title) return NextResponse.json({ error: 'Give the story a title' }, { status: 400 });

  if (!CAN_CHANGE_CONFIG) {
    return NextResponse.json({ error: 'Connect your GitHub App to save stories from here (/article/setup-github-app)' }, { status: 409 });
  }

  const path = `public/covers/stories/${storyId}.md`;
  const published = fields.published === 'true';
  const coverId = storyId.replace('story-', 'cover-');
  const listed = coverId in storiesManifest.coverIdToSlug;
  // Its address: the one it has, else its title's (decided against the
  // deployed manifest; the manifest edit below applies it to the latest)
  const slug = slugFor(storiesManifest as StoriesManifest, storyId, fields);
  const withSlug = published && !fields.slug ? withField(content, 'slug', slug) : content;
  try {
    const text = LOCAL ? withSlug : await stampForSave(path, withSlug, saveDate(localDate));
    const story: ConfigWriteResult = await writeRepoFile(
      path,
      () => text,
      { branch: `story-${storyId}`, title: `STORY. ${fields.title} (${storyId})`, body: 'Written in the story writer (/admin/stories).' },
      { create: true }
    );
    // Listed while published, taken off once it isn't; in the story's own
    // pull request when deployed (the same branch prefix joins it)
    if (published || listed) {
      await writeRepoFile(
        'src/data/storiesManifest.json',
        (manifest) => `${JSON.stringify(manifestWith(JSON.parse(manifest) as StoriesManifest, storyId, slug, published), null, 2)}`,
        { branch: `story-${storyId}`, title: `STORY. ${fields.title} (${storyId})`, body: 'Written in the story writer (/admin/stories).' }
      );
    }
    const pointer: ConfigWriteResult | null =
      why === true
        ? await writeFoundersConfig((config) => withWhy(config, storyId), {
            branch: 'founder-why',
            title: `SETUP. ${fields.title} answers why build your own`,
            body: 'From the story writer: /build opens with this story.',
          })
        : null;
    return NextResponse.json({ storyId, story, why: pointer });
  } catch (error) {
    console.error('Story save failed:', error);
    return NextResponse.json({ error: 'Could not save the story' }, { status: 500 });
  }
}
