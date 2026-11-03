import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.join(__dirname, '..');
const publicDir = path.join(projectRoot, 'public');
const outputPath = path.join(projectRoot, 'src/data/videoMetadata.json');
const VIDEO_EXTENSIONS = new Set(['.mp4', '.mov', '.webm', '.m4v']);

/**
 * Probes duration/uploadDate for every video file under public/ (#956's
 * "duration/uploadDate extraction" follow-up) — NOT just the ones already
 * in the video registry. Discovery is independent of what's registered on
 * purpose: scoping this to "whatever entries.ts already lists" is exactly
 * how 7 of the 16 real video files in public/ (a second theunpartycharette
 * video, a second theunpartyunppp video, two theunpartyapp videos, and
 * llm_baseline.mp4 at two different paths, referenced from real article
 * bodies/frontmatter, not the registry at all) went uncaptured the first
 * time. Output is committed like cover-colors.json/cover-extensions.json —
 * this script refreshes it when ffprobe/git are available (local dev), but
 * the committed JSON is what Vercel's build (no ffprobe) actually ships
 * with.
 *
 * Keyed by the public-relative asset path (e.g.
 * '/theunpartyrunway/llm_baseline.mp4'), NOT by registry slug or bare
 * filename — llm_baseline.mp4 exists at two different paths for two
 * different articles; a slug- or filename-keyed cache can't tell them
 * apart, which is exactly the class of confusion a bare filename caused
 * investigating this script's own uploadDate bug (see the FIX commit).
 * video-registry/entries.ts looks up by each entry's own `contentUrl`.
 *
 * duration: ffprobe's format.duration (seconds) -> ISO 8601 duration
 * (VideoObject JSON-LD's format, e.g. 'PT25S') - NOT the plain-seconds
 * format the video sitemap wants; site-routes.ts converts back for that.
 *
 * uploadDate: prefers the mp4 container's own creation_time tag when
 * present, but none of these assets have one (they were re-muxed by
 * ffmpeg/Lavf, which strips it) - falls back to the commit that first
 * added the file to the repo, which is a real, varying date per video and
 * actually reflects how these demos "evolved over time" rather than a
 * single placeholder date. Falls back to filesystem mtime as a last resort
 * for an untracked file.
 *
 * thumbnailUrl: a poster frame grabbed with ffmpeg (10% into the clip,
 * to skip a black/fade-in first frame) and written alongside the source
 * video as '<name>.thumb.jpg'. Generated for every video unconditionally,
 * same as duration/uploadDate — video-registry/entries.ts only actually
 * uses it as a fallback when an entry doesn't already set its own
 * thumbnailUrl (the 9 UNPPP entries have real curated cover photos and
 * keep those; this is for entries like llm_baseline.mp4 that don't).
 *
 * hasAudio: whether the file has an audio stream at all. CoverVideo hides its
 * unmute button for silent loops (motion covers, screen recordings without
 * sound), where it would do nothing.
 */

function secondsToIsoDuration(totalSeconds) {
  const rounded = Math.round(totalSeconds);
  const h = Math.floor(rounded / 3600);
  const m = Math.floor((rounded % 3600) / 60);
  const s = rounded % 60;
  let iso = 'PT';
  if (h) iso += `${h}H`;
  if (m) iso += `${m}M`;
  if (s || (!h && !m)) iso += `${s}S`;
  return iso;
}

/** Recursively finds every video file under public/, returning each as a
 * public-relative path (e.g. '/theunpartyrunway/llm_baseline.mp4'). */
function findVideoFiles(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findVideoFiles(fullPath));
    } else if (VIDEO_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      results.push('/' + path.relative(publicDir, fullPath).split(path.sep).join('/'));
    }
  }
  return results;
}

function probeDurationSeconds(filePath) {
  const raw = execFileSync(
    'ffprobe',
    ['-v', 'quiet', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', filePath],
    { encoding: 'utf-8' }
  ).trim();
  const seconds = Number(raw);
  return Number.isFinite(seconds) ? seconds : undefined;
}

/** Grabs a poster frame at 10% into the clip (floor 0.5s so very short
 * clips don't seek past their own end) and writes it next to the source
 * video. Returns the public-relative path, or undefined if ffmpeg is
 * unavailable or extraction fails (corrupt file, etc.) - never throws,
 * since a missing poster shouldn't block duration/uploadDate for the rest
 * of the run. */
function generatePoster(filePath, contentUrl, durationSeconds) {
  const posterPath = filePath.replace(/\.[^./]+$/, '.thumb.jpg');
  const seekSeconds = Math.max(0.5, (durationSeconds ?? 1) * 0.1);
  try {
    execFileSync(
      'ffmpeg',
      ['-y', '-ss', String(seekSeconds), '-i', filePath, '-vframes', '1', '-q:v', '3', posterPath],
      { stdio: 'ignore' }
    );
    return contentUrl.replace(/\.[^./]+$/, '.thumb.jpg');
  } catch {
    console.warn(`⚠️  Failed to generate poster for ${contentUrl}`);
    return undefined;
  }
}

function probeHasAudio(filePath) {
  try {
    const raw = execFileSync(
      'ffprobe',
      ['-v', 'quiet', '-select_streams', 'a', '-show_entries', 'stream=index', '-of', 'csv=p=0', filePath],
      { encoding: 'utf-8' }
    ).trim();
    return raw.length > 0;
  } catch {
    return undefined;
  }
}

function probeCreationTime(filePath) {
  try {
    const raw = execFileSync(
      'ffprobe',
      ['-v', 'quiet', '-show_entries', 'format_tags=creation_time', '-of', 'default=noprint_wrappers=1:nokey=1', filePath],
      { encoding: 'utf-8' }
    ).trim();
    return raw || undefined;
  } catch {
    return undefined;
  }
}

function getGitFirstAddedDate(filePath) {
  try {
    const relPath = path.relative(projectRoot, filePath);
    // Deliberately NOT --follow: git's rename/copy detection for --follow is
    // a content-similarity heuristic, and for binary media it produces false
    // positives - observed it chain this exact query through five unrelated
    // files (a PNG, several renames) via spurious "copy" matches, landing on
    // a different file's decade-old-relative date entirely. Plain
    // --diff-filter=A only tracks this literal path, which is what we want.
    const raw = execFileSync(
      'git',
      ['log', '--diff-filter=A', '--format=%aI', '--', relPath],
      { cwd: projectRoot, encoding: 'utf-8' }
    ).trim();
    const dates = raw.split('\n').filter(Boolean);
    return dates.length > 0 ? dates[dates.length - 1] : undefined;
  } catch {
    return undefined;
  }
}

function hasBinary(name) {
  try {
    execFileSync(name, ['-version'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function main() {
  const ffmpegAvailable = hasBinary('ffmpeg');
  if (!ffmpegAvailable) {
    console.warn('⚠️  ffmpeg not available, skipping poster generation (keeping any existing .thumb.jpg files)');
  }

  const videoPaths = findVideoFiles(publicDir).sort();
  const metadata = {};
  // A video keeps the date it has: a fresh copy's history is one commit, so
  // asking git again would make every video as new as the copy
  const existing = fs.existsSync(outputPath) ? JSON.parse(fs.readFileSync(outputPath, 'utf-8')) : {};

  for (const contentUrl of videoPaths) {
    const filePath = path.join(publicDir, contentUrl);
    const durationSeconds = probeDurationSeconds(filePath);
    const duration = durationSeconds !== undefined ? secondsToIsoDuration(durationSeconds) : undefined;
    const uploadDate = existing[contentUrl]?.uploadDate ?? probeCreationTime(filePath) ?? getGitFirstAddedDate(filePath) ?? fs.statSync(filePath).mtime.toISOString();
    const thumbnailUrl = ffmpegAvailable ? generatePoster(filePath, contentUrl, durationSeconds) : undefined;
    const hasAudio = probeHasAudio(filePath);

    metadata[contentUrl] = {
      ...(duration && { duration }),
      ...(uploadDate && { uploadDate }),
      ...(thumbnailUrl && { thumbnailUrl }),
      ...(hasAudio !== undefined && { hasAudio }),
    };
  }

  fs.writeFileSync(outputPath, JSON.stringify(metadata, null, 2) + '\n');
  console.log(`✅ Generated videoMetadata.json - ${videoPaths.length} video file(s) found under public/`);
}

if (hasBinary('ffprobe')) {
  main();
} else {
  console.log('ffprobe not available, keeping existing videoMetadata.json');
}
