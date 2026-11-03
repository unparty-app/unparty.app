import { createArticleBranch, commitJsonFile, openArticlePR, readJsonFile } from '@/lib/github';

/**
 * Shared orchestration for the scheduled snapshot cron routes (pageviews,
 * build-priority, connect, about). Each pillar keeps two files:
 *
 *  - `<pillar>-current.json` — refreshed every run, always reflects the
 *    latest computed value.
 *  - `<pillar>-baseline.json` — written once, on the first run that finds
 *    no baseline file yet, and never touched again. This is the fixed
 *    reference point a future "score vs baseline" delta compares against.
 *    There is deliberately no code path here that ever overwrites an
 *    existing baseline — resetting one is a manual action (delete the file
 *    and let the next run re-seed it), not something a schedule should do
 *    silently.
 *
 * Both files go through a real PR + auto-merge via the GitHub App client
 * (src/lib/github.ts), called from a Vercel Cron route rather than a GitHub
 * Actions workflow — see src/app/api/cron/snapshot-unppp-pageviews/route.ts's
 * doc comment for why: an App token minted inside an Actions run for this
 * same repo doesn't reliably trigger the validate-articles check that
 * gates the merge.
 */

export interface SnapshotRunResult {
  changed: boolean;
  baselineSeeded: boolean;
  prUrl?: string;
  prNumber?: number;
  autoMergeEnabled?: boolean;
}

export interface SnapshotConfig<T> {
  /** e.g. "build-priority" — used to derive file paths and branch/PR naming. */
  pillar: string;
  currentPath: string;
  baselinePath: string;
  /** Deep-equality check on the meaningful fields only (exclude generated_at/timestamp noise). */
  isEqual: (a: T, b: T) => boolean;
  prBodySummary: (data: T) => string;
}

export async function runSnapshotPr<T>(config: SnapshotConfig<T>, data: T): Promise<SnapshotRunResult> {
  const { pillar, currentPath, baselinePath, isEqual, prBodySummary } = config;

  const committedCurrent = await readJsonFile<T>(currentPath, 'main');
  const existingBaseline = await readJsonFile<T>(baselinePath, 'main');
  const needsBaseline = existingBaseline === null;
  const currentChanged = committedCurrent === null || !isEqual(committedCurrent, data);

  if (!currentChanged && !needsBaseline) {
    return { changed: false, baselineSeeded: false };
  }

  const content = JSON.stringify(data, null, 2) + '\n';
  const branch = `bot/${pillar}-snapshot-${Date.now()}`;

  await createArticleBranch(branch);

  if (currentChanged) {
    await commitJsonFile(currentPath, content, `chore: snapshot ${pillar} current`, branch);
  }
  if (needsBaseline) {
    await commitJsonFile(baselinePath, content, `chore: seed ${pillar} baseline`, branch);
  }

  const title = needsBaseline
    ? `chore: snapshot ${pillar} (seeds baseline)`
    : `chore: snapshot ${pillar}`;
  const body = [
    `Automated ${pillar} snapshot.`,
    prBodySummary(data),
    needsBaseline ? '\n**Seeds the baseline file** — this is the reference point future runs diff against.' : '',
    '\nAuto-merges once validate-articles passes.',
  ].filter(Boolean).join('\n');

  const { prUrl, prNumber, autoMergeEnabled } = await openArticlePR(branch, title, body);

  return { changed: currentChanged, baselineSeeded: needsBaseline, prUrl, prNumber, autoMergeEnabled };
}
