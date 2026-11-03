/**
 * Signing in to the site owner's GitHub, shared by the build's generators
 * (generate-releases, generate-focus).
 *
 * Signs in as the owner's GitHub App (GITHUB_APP_ID, GITHUB_APP_INSTALLATION_ID,
 * GITHUB_APP_PRIVATE_KEY, as on Vercel), else with GITHUB_TOKEN (locally:
 * GITHUB_TOKEN=$(gh auth token) npm run …). Null with neither.
 */

export async function client() {
  const { GITHUB_APP_ID, GITHUB_APP_INSTALLATION_ID, GITHUB_APP_PRIVATE_KEY, GITHUB_TOKEN } = process.env;
  if (GITHUB_APP_ID && GITHUB_APP_INSTALLATION_ID && GITHUB_APP_PRIVATE_KEY) {
    // The App's installation token, used through the same REST client as a
    // GITHUB_TOKEN (it has paginate; the App's own client doesn't)
    const { createAppAuth } = await import('@octokit/auth-app');
    const auth = createAppAuth({
      appId: GITHUB_APP_ID,
      privateKey: GITHUB_APP_PRIVATE_KEY.replace(/\\n/g, '\n'),
      installationId: Number(GITHUB_APP_INSTALLATION_ID),
    });
    const { token } = await auth({ type: 'installation' });
    const { Octokit } = await import('@octokit/rest');
    return { octokit: new Octokit({ auth: token }), as: 'app' };
  }
  if (GITHUB_TOKEN) {
    const { Octokit } = await import('@octokit/rest');
    return { octokit: new Octokit({ auth: GITHUB_TOKEN }), as: 'token' };
  }
  return null;
}

// The owner's repos this sign-in can read, not archived: the App's
// installation, or with a token the organization's (or the user's) repos
export async function ownerRepoList(octokit, as, owner) {
  const live = (repos) => repos.filter((r) => !r.archived);
  if (as === 'app') {
    const repos = await octokit.paginate('GET /installation/repositories', { per_page: 100 });
    return live(repos.filter((r) => r.owner.login.toLowerCase() === owner.toLowerCase()));
  }
  try {
    return live(await octokit.paginate('GET /orgs/{org}/repos', { org: owner, per_page: 100, type: 'all' }));
  } catch {
    return live(await octokit.paginate('GET /users/{username}/repos', { username: owner, per_page: 100 }));
  }
}
