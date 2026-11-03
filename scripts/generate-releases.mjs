#!/usr/bin/env node

/**
 * The site owner's releases, published on the site (#1033, #1310 4c).
 *
 * Reads every release of the owner's repos (FoundersConfig `site.github`),
 * private ones included, and writes the ones whose tag reads
 * `<prefix>-v<version>` (`colors-v1.0.4`) to public/releases.json: name,
 * version, date, the notes as written, and for each prefix's latest release
 * its files, copied to public/releases/<prefix>/<version>/. Other tags
 * (`v30.0.0`, `UNPPP.198`) are left out: a release is listed only when its
 * prefix names what it ships.
 *
 * The site pairs a prefix with the component that shows what it does
 * (src/lib/releases.ts), so a person tries the component and an agent reads
 * the notes and fetches the files. The release isn't paired with the repo it
 * came from.
 *
 * Signs in through scripts/lib/owner-github.mjs (the owner's GitHub App, or
 * locally GITHUB_TOKEN=$(gh auth token) npm run generate-releases). With neither, or
 * if GitHub can't be reached, it keeps the last releases it wrote (an empty
 * list on a fresh copy) and never fails the build.
 */

import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { client, ownerRepoList } from './lib/owner-github.mjs';

// .env, when there is one (Node 24 reads it; on Vercel the env is already set)
try {
  process.loadEnvFile();
} catch {
  // no .env
}

const ROOT = process.cwd();
const OUT_JSON = path.join(ROOT, 'public', 'releases.json');
const OUT_FILES = path.join(ROOT, 'public', 'releases');
const CONFIG = path.join(ROOT, 'src', 'data', 'FoundersConfig.json');

// <prefix>-v<version>: a lowercase, dash-joined prefix, then the version
const TAG = /^([a-z][a-z0-9]*(?:-[a-z0-9]+)*?)-v(\d[\w.+-]*)$/;
// A copied file's name: no folders, nothing a URL has to escape
const safeName = (name) => path.basename(name).replace(/[^\w.@+-]/g, '-');

function keepLast(reason) {
  const fresh = !fs.existsSync(OUT_JSON);
  if (fresh) fs.writeFileSync(OUT_JSON, `${JSON.stringify({ generatedAt: null, owner: null, releases: [] }, null, 2)}\n`);
  console.log(`📦 releases: ${reason}; ${fresh ? 'wrote an empty list' : 'kept the last releases'} (${path.relative(ROOT, OUT_JSON)})`);
}

export async function generateReleases() {
  const owner = JSON.parse(fs.readFileSync(CONFIG, 'utf8')).site?.github;
  if (!owner) return keepLast('no site.github in FoundersConfig');

  let signedIn;
  try {
    signedIn = await client();
  } catch (error) {
    return keepLast(`couldn't sign in to GitHub (${error.message})`);
  }
  if (!signedIn) return keepLast('no GitHub App or GITHUB_TOKEN');
  const { octokit, as } = signedIn;

  let releases = [];
  const files = [];
  try {
    for (const { name: repo } of await ownerRepoList(octokit, as, owner)) {
      const found = await octokit.paginate('GET /repos/{owner}/{repo}/releases', { owner, repo, per_page: 100 });
      for (const release of found) {
        const match = TAG.exec(release.tag_name);
        if (!match || release.draft || release.prerelease) continue;
        releases.push({
          prefix: match[1],
          version: match[2],
          tag: release.tag_name,
          name: release.name || release.tag_name,
          repo,
          publishedAt: release.published_at,
          notes: release.body ?? '',
          files: [],
          // Kept only while choosing which files to copy
          _assets: release.assets.map((a) => ({ id: a.id, name: a.name, size: a.size })),
        });
      }
    }

    // Newest first; each prefix's newest release carries its files
    releases.sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''));
    const seen = new Set();
    for (const release of releases) {
      release.latest = !seen.has(release.prefix);
      seen.add(release.prefix);
      if (!release.latest) continue;
      for (const asset of release._assets) {
        const name = safeName(asset.name);
        const { data } = await octokit.request('GET /repos/{owner}/{repo}/releases/assets/{asset_id}', {
          owner,
          repo: release.repo,
          asset_id: asset.id,
          headers: { accept: 'application/octet-stream' },
        });
        files.push({ dir: path.join(OUT_FILES, release.prefix, release.version), name, data: Buffer.from(data) });
        release.files.push({ name, size: asset.size, url: `/releases/${release.prefix}/${release.version}/${name}` });
      }
    }
    releases = releases.map(({ _assets, ...release }) => release);
  } catch (error) {
    return keepLast(`GitHub didn't answer (${error.status ?? ''} ${error.message})`.replace(/\s+/g, ' '));
  }

  // Everything fetched: replace the last run's files whole
  fs.rmSync(OUT_FILES, { recursive: true, force: true });
  for (const file of files) {
    fs.mkdirSync(file.dir, { recursive: true });
    fs.writeFileSync(path.join(file.dir, file.name), file.data);
  }
  fs.writeFileSync(OUT_JSON, `${JSON.stringify({ generatedAt: new Date().toISOString(), owner, releases }, null, 2)}\n`);

  const prefixes = [...new Set(releases.map((r) => r.prefix))];
  console.log(`📦 releases: ${releases.length} from ${owner} (${prefixes.join(', ') || 'none'}), ${files.length} files`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  generateReleases().catch((error) => keepLast(error.message));
}
