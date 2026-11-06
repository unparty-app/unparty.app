import { readFile, writeFile } from 'fs/promises'
import { join } from 'path'

// Settings the owner changes from /admin live in src/data/FoundersConfig.json,
// so changing one changes that file: on a local copy the file itself (the dev
// server picks it up at once), on a deployed one a pull request through the
// owner's GitHub App, set to merge itself (the change is on after it deploys).
// Without the App, a deployed site can only say which line to change.
export const CONFIG_PATH = 'src/data/FoundersConfig.json'
export const LOCAL = process.env.NODE_ENV === 'development'
export const CAN_COMMIT = Boolean(
  process.env.GITHUB_APP_ID && process.env.GITHUB_APP_INSTALLATION_ID && process.env.GITHUB_APP_PRIVATE_KEY
)
export const CAN_CHANGE_CONFIG = LOCAL || CAN_COMMIT

export type ConfigWriteResult =
  | { applied: 'now' }
  | { applied: 'after-deploy'; prUrl: string; autoMergeEnabled: boolean }

/**
 * Apply `edit` to a file in the site's repo (keep the file's own formatting:
 * change one value, never re-serialize what the edit doesn't touch): the file
 * itself locally, a self-merging pull request through the GitHub App when
 * deployed. Throws when this deployment can't (check CAN_CHANGE_CONFIG first).
 * `create` makes the file when it isn't there yet (a new story): `edit` gets ''.
 */
export async function writeRepoFile(
  path: string,
  edit: (text: string) => string,
  pr: { branch: string; title: string; body: string },
  { create = false }: { create?: boolean } = {}
): Promise<ConfigWriteResult> {
  if (LOCAL) {
    const file = join(process.cwd(), path)
    const text = await readFile(file, 'utf8').catch((error: NodeJS.ErrnoException) => {
      if (create && error.code === 'ENOENT') return ''
      throw error
    })
    await writeFile(file, edit(text))
    return { applied: 'now' }
  }

  if (!CAN_COMMIT) throw new Error(`No GitHub App: ${path} can only be changed in the repo`)

  const { readFileText, createArticleBranch, commitJsonFile, openArticlePR, findOpenPullByBranchPrefix } = await import('@/lib/github')

  // A change of the same kind already waiting (say, the last icon saved
  // minutes ago): add this one to it. Two pull requests that each rewrite the
  // whole file conflict, and resolving that by hand once broke drawn.json
  const open = await findOpenPullByBranchPrefix(`${pr.branch}-`)
  if (open) {
    const pending = await readFileText(path, open.branch)
    if (pending !== null) {
      await commitJsonFile(path, edit(pending), pr.title, open.branch)
      return { applied: 'after-deploy', prUrl: open.prUrl, autoMergeEnabled: true }
    }
  }

  const current = (await readFileText(path, 'main')) ?? (create ? '' : null)
  if (current === null) throw new Error(`${path} not found on main`)

  const branch = `${pr.branch}-${Date.now()}`
  await createArticleBranch(branch)
  await commitJsonFile(path, edit(current), pr.title, branch)
  const { prUrl, autoMergeEnabled } = await openArticlePR(branch, pr.title, pr.body)
  return { applied: 'after-deploy', prUrl, autoMergeEnabled }
}

/** writeRepoFile for FoundersConfig.json */
export function writeFoundersConfig(
  edit: (text: string) => string,
  pr: { branch: string; title: string; body: string }
): Promise<ConfigWriteResult> {
  return writeRepoFile(CONFIG_PATH, edit, pr)
}

/**
 * A new file next to a FoundersConfig change that points at it (the owner's
 * avatar: public/avatar-….png and founder.image), in one go: both written
 * locally, or both in one self-merging pull request when deployed. Files are
 * never overwritten, so a new name also skips any cached copy of the old one.
 */
export async function writeFileWithConfig(
  file: { path: string; data: Buffer },
  edit: (text: string) => string,
  pr: { branch: string; title: string; body: string }
): Promise<ConfigWriteResult> {
  if (LOCAL) {
    const config = join(process.cwd(), CONFIG_PATH)
    const next = edit(await readFile(config, 'utf8')) // a bad edit throws before anything is written
    await writeFile(join(process.cwd(), file.path), file.data)
    await writeFile(config, next)
    return { applied: 'now' }
  }

  if (!CAN_COMMIT) throw new Error(`No GitHub App: ${file.path} can only be added in the repo`)

  const { readFileText, createArticleBranch, commitJsonFile, openArticlePR, findOpenPullByBranchPrefix } = await import('@/lib/github')

  // One already waiting (an avatar picked minutes ago): this one joins it
  const open = await findOpenPullByBranchPrefix(`${pr.branch}-`)
  const branch = open?.branch ?? `${pr.branch}-${Date.now()}`
  if (!open) await createArticleBranch(branch)
  const current = await readFileText(CONFIG_PATH, branch)
  if (current === null) throw new Error(`${CONFIG_PATH} not found on ${branch}`)
  const next = edit(current)
  await commitJsonFile(file.path, file.data, pr.title, branch)
  await commitJsonFile(CONFIG_PATH, next, pr.title, branch)
  if (open) return { applied: 'after-deploy', prUrl: open.prUrl, autoMergeEnabled: true }
  const { prUrl, autoMergeEnabled } = await openArticlePR(branch, pr.title, pr.body)
  return { applied: 'after-deploy', prUrl, autoMergeEnabled }
}
