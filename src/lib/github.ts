import { App } from '@octokit/app';
import type { Octokit } from '@octokit/rest';
import fs from 'fs';
import path from 'path';


interface DiscussionCategory {
  id: string;
  name: string;
}

interface DiscussionCategoriesResponse {
  repository: {
    discussionCategories: {
      nodes: DiscussionCategory[];
    };
  };
}

interface CreateDiscussionResponse {
  createDiscussion: {
    discussion: {
      id: string;
      url: string;
    };
  };
}

// GitHub App configuration from environment
const GITHUB_APP_ID = process.env.GITHUB_APP_ID!;
const GITHUB_APP_PRIVATE_KEY_PATH = process.env.GITHUB_APP_PRIVATE_KEY_PATH!;
const WAITLIST_REPO_OWNER = process.env.WAITLIST_REPO_OWNER!;
const WAITLIST_REPO_NAME = process.env.WAITLIST_REPO_NAME!;

// The repository this site's own code lives in, where story edits, articles and
// snapshot PRs are committed. On Vercel it is the deployed repo; STORIES_REPO_NAME
// overrides the name, and the owner falls back to WAITLIST_REPO_OWNER off Vercel
function siteRepo(): { owner: string; repo: string } {
  const owner = process.env.VERCEL_GIT_REPO_OWNER || WAITLIST_REPO_OWNER;
  const repo = process.env.STORIES_REPO_NAME || process.env.VERCEL_GIT_REPO_SLUG;
  if (!owner || !repo) {
    throw new Error('Site repository unknown: set STORIES_REPO_NAME and WAITLIST_REPO_OWNER, or deploy on Vercel');
  }
  return { owner, repo };
}

/**
 * Get authenticated GitHub App client
 * Returns an Octokit instance with installation access token
 */
export async function getGitHubAppClient(): Promise<Octokit> {
  // Prefer GITHUB_APP_PRIVATE_KEY env var (Vercel); fall back to file path for local dev
  let privateKey: string;
  if (process.env.GITHUB_APP_PRIVATE_KEY) {
    privateKey = process.env.GITHUB_APP_PRIVATE_KEY.replace(/\\n/g, '\n');
  } else {
    const privateKeyPath = path.join(/*turbopackIgnore: true*/ process.cwd(), GITHUB_APP_PRIVATE_KEY_PATH);
    privateKey = fs.readFileSync(privateKeyPath, 'utf8');
  }

  const app = new App({
    appId: GITHUB_APP_ID,
    privateKey: privateKey,
  });

  // Use the known installation ID directly — avoids an extra GET /app/installations roundtrip
  const installationId = parseInt(process.env.GITHUB_APP_INSTALLATION_ID!, 10);
  if (isNaN(installationId)) {
    throw new Error('GITHUB_APP_INSTALLATION_ID is not set or not a number');
  }

  const octokit = await app.getInstallationOctokit(installationId);
  return octokit as unknown as Octokit;
}

/**
 * Get discussion category ID by name
 */
export async function getCategoryId(categoryName: string): Promise<string> {
  const octokit = await getGitHubAppClient();

  // GraphQL query to get discussion categories
  const query = `
    query($owner: String!, $name: String!) {
      repository(owner: $owner, name: $name) {
        discussionCategories(first: 10) {
          nodes {
            id
            name
          }
        }
      }
    }
  `;

  const result = await octokit.graphql<DiscussionCategoriesResponse>(query, {
    owner: WAITLIST_REPO_OWNER,
    name: WAITLIST_REPO_NAME,
  });

  const category = result.repository.discussionCategories.nodes.find(
    (cat) => cat.name === categoryName
  );

  if (!category) {
    throw new Error(`Discussion category "${categoryName}" not found`);
  }

  return category.id;
}

interface ProblemSubmissionTicket {
  id: string;
  userId: string;
  email: string;
  name: string;
  ideaName: string;
  deadline: string;
}

/**
 * Create a problem-worksheet-submission discussion in GitHub for admin review.
 * The body embeds the UserSubmission id + Clerk userId so approval (moving the
 * discussion to the "Approve" category) can flip both records directly — see
 * parseProblemSubmissionFromDiscussion and src/app/api/github/webhook/route.ts.
 */
export async function createProblemSubmissionDiscussion(submission: ProblemSubmissionTicket): Promise<{ id: string; url: string }> {
  const octokit = await getGitHubAppClient();

  // Get the "Pending" category ID
  const categoryId = await getCategoryId('Pending');

  // Get repository ID
  const { data: repo } = await octokit.request('GET /repos/{owner}/{repo}', {
    owner: WAITLIST_REPO_OWNER,
    repo: WAITLIST_REPO_NAME,
  });

  // Format discussion body
  const body = formatProblemSubmissionBody(submission);
  const title = `Problem Worksheet - ${submission.name} (${submission.email})`;

  // GraphQL mutation to create discussion
  const mutation = `
    mutation($repositoryId: ID!, $categoryId: ID!, $title: String!, $body: String!) {
      createDiscussion(input: {
        repositoryId: $repositoryId
        categoryId: $categoryId
        title: $title
        body: $body
      }) {
        discussion {
          id
          url
        }
      }
    }
  `;

  const result = await octokit.graphql<CreateDiscussionResponse>(mutation, {
    repositoryId: repo.node_id,
    categoryId: categoryId,
    title: title,
    body: body,
  });

  return {
    id: result.createDiscussion.discussion.id,
    url: result.createDiscussion.discussion.url,
  };
}

interface UpdateDiscussionResponse {
  updateDiscussion: {
    discussion: {
      id: string;
      url: string;
    };
  };
}

/**
 * Move a discussion to a different category (e.g. "Approve") via GitHub's GraphQL API.
 * Used by the Slack "Approve" button so GitHub Discussions remains the single source of
 * truth for waitlist approval — this only moves the category; the actual approval side
 * effects (UserSubmission.status, Clerk metadata, Loops email) happen when GitHub's
 * discussion/category_changed webhook fires, handled by
 * src/app/api/github/webhook/route.ts — same code path as a manual GitHub-UI move.
 */
export async function updateDiscussionCategory(discussionId: string, categoryId: string): Promise<string> {
  const octokit = await getGitHubAppClient();

  const mutation = `
    mutation($discussionId: ID!, $categoryId: ID!) {
      updateDiscussion(input: {
        discussionId: $discussionId
        categoryId: $categoryId
      }) {
        discussion {
          id
          url
        }
      }
    }
  `;

  const result = await octokit.graphql<UpdateDiscussionResponse>(mutation, {
    discussionId,
    categoryId,
  });

  return result.updateDiscussion.discussion.url;
}

/**
 * Commit a story markdown file to a branch via the GitHub Contents API.
 * Creates the file if it doesn't exist on that branch; updates it (with current
 * SHA) if it does. Like commitArticleFile, it never targets main directly: the
 * story save opens a PR that auto-merges once checks pass (#1030).
 */
export async function commitStoryFile(
  storyId: string,
  content: string,
  message: string,
  branch: string
): Promise<void> {
  const octokit = await getGitHubAppClient();
  const { owner, repo } = siteRepo();
  const filePath = `public/covers/stories/${storyId}.md`;

  // Fetch current SHA so GitHub accepts the update (omit for new files)
  let sha: string | undefined;
  try {
    const { data } = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
      owner, repo, path: filePath, ref: branch,
    });
    if (!Array.isArray(data) && data.type === 'file') {
      sha = data.sha;
    }
  } catch {
    // File does not exist yet — create it without a SHA
  }

  await octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', {
    owner,
    repo,
    path: filePath,
    message,
    content: Buffer.from(content, 'utf8').toString('base64'),
    branch,
    ...(sha ? { sha } : {}),
  });
}

/**
 * Commit an article JSON file to a branch via the GitHub Contents API.
 * Creates the file if it doesn't exist on that branch; updates it (with current SHA) if it does.
 * Like commitStoryFile, this always targets a specific branch — never main directly —
 * since article edits go through a PR + auto-merge gate (see openArticlePR).
 */
export async function commitArticleFile(
  slug: string,
  content: string,
  message: string,
  branch: string
): Promise<void> {
  const octokit = await getGitHubAppClient();
  const { owner, repo } = siteRepo();
  const filePath = `content/articles/${slug}.json`;

  let sha: string | undefined;
  try {
    const { data } = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
      owner, repo, path: filePath, ref: branch,
    });
    if (!Array.isArray(data) && data.type === 'file') {
      sha = data.sha;
    }
  } catch {
    // File does not exist yet on this branch — create it without a SHA
  }

  await octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', {
    owner,
    repo,
    path: filePath,
    message,
    content: Buffer.from(content, 'utf8').toString('base64'),
    branch,
    ...(sha ? { sha } : {}),
  });
}

/**
 * Commit any JSON snapshot file to a branch via the GitHub Contents API.
 * Same shape as commitArticleFile — a real PR-authored write, not a direct
 * push to main, so it goes through the same validate-articles + auto-merge
 * gate. Used by the snapshot cron routes (src/lib/snapshot-pr.ts) — pageview,
 * build-priority, connect, and about baselines/current files all go through
 * this one function rather than each hand-rolling the Contents API dance.
 */
export async function commitJsonFile(
  filePath: string,
  // Text, or the bytes of a file that isn't (an image: /admin → Your avatar)
  content: string | Buffer,
  message: string,
  branch: string
): Promise<void> {
  const octokit = await getGitHubAppClient();
  const { owner, repo } = siteRepo();

  let sha: string | undefined;
  try {
    const { data } = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
      owner, repo, path: filePath, ref: branch,
    });
    if (!Array.isArray(data) && data.type === 'file') {
      sha = data.sha;
    }
  } catch {
    // File does not exist yet on this branch — create it without a SHA
  }

  await octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', {
    owner,
    repo,
    path: filePath,
    message,
    content: (Buffer.isBuffer(content) ? content : Buffer.from(content, 'utf8')).toString('base64'),
    branch,
    ...(sha ? { sha } : {}),
  });
}

/**
 * Read a JSON file from a given ref (branch/tag/sha), returning null if it
 * doesn't exist. Used by the snapshot cron routes to diff a freshly-computed
 * snapshot against what's already committed on main before opening a PR.
 */
export async function readJsonFile<T>(filePath: string, ref: string): Promise<T | null> {
  const text = await readFileText(filePath, ref);
  if (text === null) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

/**
 * Read a file's text from a given ref, returning null if it doesn't exist.
 * The save APIs read main's copy so stamp-on-save can tell what changed.
 */
export async function readFileText(filePath: string, ref: string): Promise<string | null> {
  const octokit = await getGitHubAppClient();
  const { owner, repo } = siteRepo();

  try {
    const { data } = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
      owner, repo, path: filePath, ref,
    });
    if (Array.isArray(data) || data.type !== 'file' || typeof data.content !== 'string') return null;
    return Buffer.from(data.content, 'base64').toString('utf8');
  } catch {
    return null;
  }
}

/**
 * Create a new branch off the current tip of main, for an article edit/creation PR.
 */
export async function createArticleBranch(branch: string): Promise<void> {
  const octokit = await getGitHubAppClient();
  const { owner, repo } = siteRepo();

  const { data: mainRef } = await octokit.request('GET /repos/{owner}/{repo}/git/ref/{ref}', {
    owner, repo, ref: 'heads/main',
  });

  await octokit.request('POST /repos/{owner}/{repo}/git/refs', {
    owner,
    repo,
    ref: `refs/heads/${branch}`,
    sha: mainRef.object.sha,
  });
}

/**
 * Open a PR from `branch` into main and try to enable GitHub's native auto-merge,
 * so it merges on its own once required status checks (validate-articles) pass.
 * Requires the repo to have "Allow auto-merge" enabled and main to have branch
 * protection requiring at least one status check — see repo settings prerequisite
 * in the article-editing plan.
 *
 * By the time this function is called, createArticleBranch + commitArticleFile have
 * already mutated real GitHub state (a branch and a commit exist), and the PR itself
 * is created a few lines below. If enabling auto-merge then fails (e.g. branch
 * protection briefly misconfigured, a transient API error), that must NOT be treated
 * as a fatal error for the whole request — the PR is still valid and just needs a
 * manual merge or a later retry of auto-merge. Throwing here previously caused the
 * caller to 500, which iOS surfaced as a failure inviting a from-scratch retry —
 * that retry created an entirely new branch+PR while the first one sat orphaned
 * (see PR #683 vs #684).
 */
/**
 * The newest open pull request whose branch starts with `prefix` (e.g. the
 * icon pad's "icon-defaults-"), so a save can add to it instead of opening a
 * second one that rewrites the same file and conflicts with it.
 */
export async function findOpenPullByBranchPrefix(prefix: string): Promise<{ branch: string; prUrl: string; prNumber: number } | null> {
  const octokit = await getGitHubAppClient();
  const { owner, repo } = siteRepo();
  const { data } = await octokit.request('GET /repos/{owner}/{repo}/pulls', {
    owner, repo, state: 'open', base: 'main', per_page: 50, sort: 'created', direction: 'desc',
  });
  const pr = data.find((p) => p.head.ref.startsWith(prefix) && p.head.repo?.full_name === `${owner}/${repo}`);
  return pr ? { branch: pr.head.ref, prUrl: pr.html_url, prNumber: pr.number } : null;
}

export async function openArticlePR(
  branch: string,
  title: string,
  body: string
): Promise<{ prUrl: string; prNumber: number; autoMergeEnabled: boolean }> {
  const octokit = await getGitHubAppClient();
  const { owner, repo } = siteRepo();

  const { data: pr } = await octokit.request('POST /repos/{owner}/{repo}/pulls', {
    owner,
    repo,
    head: branch,
    base: 'main',
    title,
    body,
  });

  const mutation = `
    mutation($pullRequestId: ID!) {
      enablePullRequestAutoMerge(input: {
        pullRequestId: $pullRequestId
        mergeMethod: SQUASH
      }) {
        pullRequest {
          id
        }
      }
    }
  `;

  let autoMergeEnabled = true;
  try {
    await octokit.graphql(mutation, { pullRequestId: pr.node_id });
  } catch (error) {
    autoMergeEnabled = false;
    console.error(`Failed to enable auto-merge on PR #${pr.number} (${pr.html_url}):`, error);
  }

  return { prUrl: pr.html_url, prNumber: pr.number, autoMergeEnabled };
}

/**
 * Format discussion body with problem worksheet submission information
 */
function formatProblemSubmissionBody(submission: ProblemSubmissionTicket): string {
  return `**Problem Worksheet Submission**

**Name:** ${submission.name}
**Email:** ${submission.email}
**Idea:** ${submission.ideaName}
**Target Completion:** ${submission.deadline}

---
**SubmissionId:** ${submission.id}
**UserId:** ${submission.userId}`;
}

/**
 * Parse a UserSubmission id + Clerk userId from a problem-worksheet discussion body
 */
export function parseProblemSubmissionFromDiscussion(body: string): { submissionId: string; userId: string } | null {
  const submissionIdMatch = body.match(/\*\*SubmissionId:\*\*\s+(\S+)/);
  const userIdMatch = body.match(/\*\*UserId:\*\*\s+(\S+)/);

  if (!submissionIdMatch || !userIdMatch) {
    return null;
  }

  return { submissionId: submissionIdMatch[1], userId: userIdMatch[1] };
}
