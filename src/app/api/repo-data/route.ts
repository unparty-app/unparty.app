import { NextResponse } from 'next/server';
import * as fs from 'fs';
import { Octokit } from '@octokit/rest';
import { createAppAuth } from '@octokit/auth-app';

const APP_ID = process.env.GITHUB_APP_ID;
const PRIVATE_KEY_PATH = process.env.GITHUB_APP_PRIVATE_KEY_PATH;
const PRIVATE_KEY_CONTENT = process.env.GITHUB_APP_PRIVATE_KEY?.replace(/\\n/g, '\n');
const INSTALLATION_ID = process.env.GITHUB_APP_INSTALLATION_ID;

// Get private key from either direct content or file path
function getPrivateKey(): string | undefined {
  if (PRIVATE_KEY_CONTENT) {
    return PRIVATE_KEY_CONTENT;
  }
  if (PRIVATE_KEY_PATH && fs.existsSync(PRIVATE_KEY_PATH)) {
    try {
      return fs.readFileSync(PRIVATE_KEY_PATH, 'utf-8');
    } catch (error) {
      console.error(`Failed to read private key from ${PRIVATE_KEY_PATH}:`, error);
      return undefined;
    }
  }
  return undefined;
}

const PRIVATE_KEY = getPrivateKey();

if (!APP_ID || !PRIVATE_KEY || !INSTALLATION_ID) {
  console.warn('GitHub App credentials are not fully configured. Please set GITHUB_APP_ID, GITHUB_APP_PRIVATE_KEY (or GITHUB_APP_PRIVATE_KEY_PATH), and GITHUB_APP_INSTALLATION_ID in your environment variables.');
}

// ============================================================================
// TYPES
// ============================================================================

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  clone_url: string;
  private: boolean;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  watchers_count: number;
  pushed_at: string;
  default_branch: string;
  owner: { login: string; type: string };
}

interface LanguageData {
  name: string;
  count: number;
  percentage: number;
  color: string;
}

interface ExtendedRepoData {
  id: number;
  repoName: string;
  fullName: string;
  description: string;
  language: string;
  languages: LanguageData[];
  branch: string;
  forks: number;
  watchers: number;
  stars: number;
  preview?: string;
  url: string;
  isPrivate: boolean;
  pushedAt: string;
}

interface CachedData {
  data: {
    repositories: ExtendedRepoData[];
    totalRepositories: number;
    overallLanguages: LanguageData[];
    summary: {
      totalRepos: number;
      privateRepos: number;
      publicRepos: number;
      totalStars: number;
      totalForks: number;
      primaryLanguages: string[];
    };
  };
  timestamp: number;
}

interface ReleaseData{
  id: number;
  tagName: string;
  name: string;
  publishedAt: string;
  createdAt: string;
  isDraft: boolean;
  isPrerelease: boolean;
  htmlUrl: string;
}

interface CustomProperty {
  propertyName: string;
  value: string; // GitHub returns these as strings, even for boolean-like values
}

interface GitHubCustomPropertyResponse {
  property_name: string;
  value: string;
}

interface ExtendedRepoData {
  id: number;
  repoName: string;
  fullName: string;
  description: string;
  language: string;
  languages: LanguageData[];
  branch: string;
  forks: number;
  watchers: number;
  stars: number;
  preview?: string;
  url: string;
  isPrivate: boolean;
  pushedAt: string;
  latestRelease?: ReleaseData;
  totalReleases: number;
  customProperties?: CustomProperty[];
}


// ============================================================================
// CACHE
// ============================================================================

// In-memory cache with 1-hour TTL
let cachedRepoData: CachedData | null = null;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

function isCacheValid(): boolean {
  if (!cachedRepoData) return false;
  const now = Date.now();
  const age = now - cachedRepoData.timestamp;
  return age < CACHE_TTL;
}

// ============================================================================
// GITHUB API FUNCTIONS
// ============================================================================

/**
 * Create authenticated Octokit instance
 */
function createOctokit(): Octokit | null {
  if (!APP_ID || !PRIVATE_KEY || !INSTALLATION_ID) {
    return null;
  }

  try {
    return new Octokit({
      authStrategy: createAppAuth,
      auth: {
        appId: APP_ID,
        privateKey: PRIVATE_KEY,
        installationId: parseInt(INSTALLATION_ID),
      },
    });
  } catch (error) {
    console.error('Failed to create Octokit instance:', error);
    return null;
  }
}

/**
 * Fetch every repository the GitHub App was installed on. Works for a personal
 * account and an organization alike, and lists only the repos the site owner
 * picked when installing the App (see /article/setup-github-app)
 */
async function fetchInstallationRepos(octokit: Octokit): Promise<GitHubRepo[]> {
  try {
    const repos = await octokit.paginate('GET /installation/repositories', { per_page: 100 }) as GitHubRepo[];

    // Most recently pushed first
    repos.sort((a, b) => Date.parse(b.pushed_at) - Date.parse(a.pushed_at));

    console.log(`✓ Fetched ${repos.length} repositories from the GitHub App installation`);
    return repos;
  } catch (error) {
    console.error('Error fetching installation repos:', error instanceof Error ? error.message : 'Unknown error');
    return [];
  }
}

/**
 * Fetch languages for a repository from GitHub API
 */
async function fetchRepoLanguages(
  octokit: Octokit,
  owner: string,
  repo: string
): Promise<LanguageData[]> {
  try {
    const { data } = await octokit.rest.repos.listLanguages({
      owner,
      repo,
    });

    // GitHub returns language bytes: { "TypeScript": 123456, "JavaScript": 67890 }
    const totalBytes = Object.values(data).reduce((sum, bytes) => sum + bytes, 0);

    if (totalBytes === 0) {
      return [];
    }

    const colorMap: Record<string, string> = {
      'TypeScript': '#3178c6',
      'JavaScript': '#f1e05a',
      'Python': '#3572A5',
      'Ruby': '#701516',
      'Go': '#00ADD8',
      'Rust': '#dea584',
      'Java': '#b07219',
      'PHP': '#4F5D95',
      'CSS': '#563d7c',
      'SCSS': '#c6538c',
      'HTML': '#e34c26',
      'JSON': '#292929',
      'Markdown': '#083fa1',
      'YAML': '#cb171e',
      'Swift': '#ffac45',
      'Kotlin': '#A97BFF',
      'C': '#555555',
      'C++': '#f34b7d',
      'C#': '#178600',
    };

    const languages = Object.entries(data)
      .sort(([, a], [, b]) => b - a)
      .map(([name, bytes]) => ({
        name,
        count: bytes,
        percentage: Math.round((bytes / totalBytes) * 100),
        color: colorMap[name] || '#888888',
      }))
      .filter(lang => lang.percentage > 0);

    return languages;
  } catch (error) {
    console.error(`Error fetching languages for ${owner}/${repo}:`, error instanceof Error ? error.message : 'Unknown error');
    return [];
  }
}

/**
 * Fetch README preview from GitHub API
 */
async function fetchReadmePreview(
  octokit: Octokit,
  owner: string,
  repo: string
): Promise<string> {
  try {
    const { data } = await octokit.rest.repos.getReadme({
      owner,
      repo,
      mediaType: {
        format: 'raw',
      },
    });

    // Return first 200 characters
    const content = data as unknown as string;
    return content.slice(0, 200) + '...';
  } catch {
    // README not found or other error
    return '';
  }
}



/**
 * Fetch latest release and total release count for a repository
 */
async function fetchLatestRelease(
  octokit: Octokit,
  owner: string,
  repo: string
): Promise<{ latest: ReleaseData | null; total: number }> {
  try {
    // Fetch all releases to get count and latest
    const { data: releases } = await octokit.rest.repos.listReleases({
      owner,
      repo,
      per_page: 1, // Only need the latest one
    });

    if (releases.length === 0) {
      return { latest: null, total: 0 };
    }

    const latestRelease = releases[0];

    // Get total release count (this is approximate from headers, but good enough)
    // For exact count we'd need to paginate through all releases
    const releaseData: ReleaseData = {
      id: latestRelease.id,
      tagName: latestRelease.tag_name,
      name: latestRelease.name || latestRelease.tag_name,
      publishedAt: latestRelease.published_at || '',
      createdAt: latestRelease.created_at,
      isDraft: latestRelease.draft,
      isPrerelease: latestRelease.prerelease,
      htmlUrl: latestRelease.html_url,
    };

    return { latest: releaseData, total: releases.length };
  } catch (error) {
    // Releases might not be available
    console.error(`Error fetching releases for ${owner}/${repo}:`, error instanceof Error ? error.message : 'Unknown error');
    return { latest: null, total: 0 };
  }
}

/**
 * Fetch custom properties for a repository
 */
async function fetchCustomProperties(
  octokit: Octokit,
  owner: string,
  repo: string
): Promise<CustomProperty[]> {
  try {
    // Custom properties API endpoint (confirmed working via gh CLI)
    // Returns: [{"property_name":"BRAND","value":"true"}, ...]
    const { data } = await octokit.request('GET /repos/{owner}/{repo}/properties/values', {
      owner,
      repo,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (!Array.isArray(data)) {
      return [];
    }

    return (data as GitHubCustomPropertyResponse[]).map((prop) => ({
      propertyName: prop.property_name,
      value: prop.value,
    }));
  } catch (error) {
    // Custom properties might not be available or require additional permissions
    console.error(`Error fetching custom properties for ${owner}/${repo}:`, error instanceof Error ? error.message : 'Unknown error');
    return [];
  }
}

/**
 * Process all repositories and fetch their metadata
 */
async function processRepositories(
  octokit: Octokit,
  repos: GitHubRepo[]
): Promise<ExtendedRepoData[]> {
  const processedRepos: ExtendedRepoData[] = [];

  console.log(`Processing ${repos.length} repositories...`);

  // Process repos in batches to avoid rate limits
  const BATCH_SIZE = 10;
  for (let i = 0; i < repos.length; i += BATCH_SIZE) {
    const batch = repos.slice(i, i + BATCH_SIZE);

    const batchPromises = batch.map(async (repo) => {
      const [owner, repoName] = repo.full_name.split('/');

      try {
        // Fetch languages, README, releases, and custom properties in parallel
        const [languages, preview, releaseData, customProperties] = await Promise.all([
          fetchRepoLanguages(octokit, owner, repoName),
          fetchReadmePreview(octokit, owner, repoName),
          fetchLatestRelease(octokit, owner, repoName),
          // Custom properties exist only on organization repos
          repo.owner.type === 'Organization'
            ? fetchCustomProperties(octokit, owner, repoName)
            : Promise.resolve([] as CustomProperty[]),
        ]);

        const primaryLanguage = languages[0]?.name || repo.language || 'Unknown';

        const repoData: ExtendedRepoData = {
          id: repo.id,
          repoName: repoName,
          fullName: repo.full_name,
          description: repo.description || 'No description available',
          language: primaryLanguage,
          languages: languages,
          branch: repo.default_branch,
          forks: repo.forks_count,
          watchers: repo.watchers_count,
          stars: repo.stargazers_count,
          preview: preview,
          url: repo.html_url,
          isPrivate: repo.private,
          pushedAt: repo.pushed_at,
          latestRelease: releaseData.latest || undefined,
          totalReleases: releaseData.total,
          customProperties: customProperties.length > 0 ? customProperties : undefined,
        };

        console.log(`  ✓ Processed ${repo.full_name}`);
        return repoData;
      } catch (error) {
        console.error(`  ✗ Error processing ${repo.full_name}:`, error instanceof Error ? error.message : 'Unknown error');
        // Return minimal data on error
        return {
          id: repo.id,
          repoName: repoName,
          fullName: repo.full_name,
          description: repo.description || 'No description available',
          language: repo.language || 'Unknown',
          languages: [],
          branch: repo.default_branch,
          forks: repo.forks_count,
          watchers: repo.watchers_count,
          stars: repo.stargazers_count,
          url: repo.html_url,
          isPrivate: repo.private,
          pushedAt: repo.pushed_at,
          totalReleases: 0,
        } as ExtendedRepoData;
      }
    });

    const batchResults = await Promise.all(batchPromises);
    processedRepos.push(...batchResults);

    // Small delay between batches to be nice to GitHub API
    if (i + BATCH_SIZE < repos.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log(`✓ Processed ${processedRepos.length} repositories`);
  return processedRepos;
}

// ============================================================================
// API ROUTE
// ============================================================================

export async function GET() {
  try {
    // Return cached data if valid
    if (isCacheValid() && cachedRepoData) {
      console.log('✓ Returning cached repository data');
      return NextResponse.json({
        ...cachedRepoData.data,
        cached: true,
        cacheAge: Math.round((Date.now() - cachedRepoData.timestamp) / 1000),
      });
    }

    // GitHub App not configured - return error
    const octokit = createOctokit();
    if (!octokit) {
      return NextResponse.json(
        {
          error: 'GitHub App not configured',
          message: 'Please set GITHUB_APP_ID, GITHUB_APP_PRIVATE_KEY (or GITHUB_APP_PRIVATE_KEY_PATH), and GITHUB_APP_INSTALLATION_ID'
        },
        { status: 503 }
      );
    }

    console.log('Fetching fresh repository data from GitHub...');

    // Fetch every repo the App can see
    const installationRepos = await fetchInstallationRepos(octokit);
    if (installationRepos.length === 0) {
      return NextResponse.json(
        { error: 'No repositories found or failed to fetch from GitHub' },
        { status: 404 }
      );
    }

    // Process all repos (fetch languages, READMEs, etc.)
    const allRepoData = await processRepositories(octokit, installationRepos);

    // Aggregate language data across all repos
    const allLanguages: Record<string, { count: number; percentage: number; color: string }> = {};
    let totalBytes = 0;

    allRepoData.forEach((repo) => {
      repo.languages.forEach((lang) => {
        if (!allLanguages[lang.name]) {
          allLanguages[lang.name] = { count: 0, percentage: 0, color: lang.color };
        }
        allLanguages[lang.name].count += lang.count;
        totalBytes += lang.count;
      });
    });

    // Calculate overall percentages
    const overallLanguages = Object.entries(allLanguages)
      .map(([name, data]) => ({
        name,
        count: data.count,
        percentage: totalBytes > 0 ? Math.round((data.count / totalBytes) * 100) : 0,
        color: data.color
      }))
      .sort((a, b) => b.count - a.count);

    // Build response
    const responseData = {
      repositories: allRepoData,
      totalRepositories: allRepoData.length,
      overallLanguages,
      summary: {
        totalRepos: allRepoData.length,
        privateRepos: allRepoData.filter((r) => r.isPrivate).length,
        publicRepos: allRepoData.filter((r) => !r.isPrivate).length,
        totalStars: allRepoData.reduce((sum, repo) => sum + repo.stars, 0),
        totalForks: allRepoData.reduce((sum, repo) => sum + repo.forks, 0),
        primaryLanguages: overallLanguages.slice(0, 5).map((l) => l.name)
      }
    };

    // Cache the data
    cachedRepoData = {
      data: responseData,
      timestamp: Date.now(),
    };

    console.log('✓ Repository data fetched and cached successfully');

    return NextResponse.json({
      ...responseData,
      cached: false,
    });

  } catch (err) {
    console.error('Error in repo-data API:', err instanceof Error ? err.message : 'Unknown error');
    return NextResponse.json(
      {
        error: 'Failed to fetch repository data',
        details: process.env.NODE_ENV === 'development' && err instanceof Error ? err.message : undefined
      },
      { status: 500 }
    );
  }
}

export async function HEAD() {
  return new NextResponse(null, { status: 405 });
}
