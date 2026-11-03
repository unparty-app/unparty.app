// GET /api/music/mood-enrich
//
// Fetches MOOD commits from theunpartybuilder, searches Apple Music for each
// matched song, and returns results grouped by unppp ID. Use the output to
// update UnpppsConfig.json playlist fields for each unppp.
//
// Required env: UNPARTY_TOKEN, APPLE_MUSIC_TEAM_ID, APPLE_MUSIC_KEY_ID, APPLE_MUSIC_PRIVATE_KEY

import { NextResponse } from 'next/server';
import { createAppleMusicDeveloperToken, isAppleMusicConfigured } from '@/lib/apple-music-token';

const APPLE_CATALOG_BASE = 'https://api.music.apple.com/v1/catalog/us';

interface MoodSong {
  title: string;
  artist: string | null;
  repo: string;
  commit_date: string;
  matched: boolean;
}

interface AppleMusicSongResult {
  appleTrackId: string;
  albumName: string;
  artworkUrl: string;
}

interface AppleMusicSearchData {
  results: {
    songs?: {
      data: Array<{
        id: string;
        attributes: {
          name: string;
          artistName: string;
          albumName: string;
          artwork: { url: string; width: number; height: number };
        };
      }>;
    };
  };
}

async function searchAppleMusic(
  term: string,
  token: string
): Promise<AppleMusicSongResult | null> {
  const url = `${APPLE_CATALOG_BASE}/search?term=${encodeURIComponent(term)}&types=songs&limit=1`;
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;
    const data: AppleMusicSearchData = await res.json();
    const song = data.results.songs?.data?.[0];
    if (!song) return null;
    return {
      appleTrackId: song.id,
      albumName: song.attributes.albumName,
      artworkUrl: song.attributes.artwork.url
        .replace('{w}', '60')
        .replace('{h}', '60'),
    };
  } catch {
    return null;
  }
}

export async function GET() {
  const unpartyToken = process.env.UNPARTY_TOKEN;
  if (!unpartyToken) {
    return NextResponse.json({ error: 'UNPARTY_TOKEN not configured' }, { status: 503 });
  }
  if (!isAppleMusicConfigured()) {
    return NextResponse.json({ error: 'Apple Music credentials not configured' }, { status: 503 });
  }

  // 1. Fetch MOOD playlist from theunpartybuilder
  let songs: MoodSong[];
  try {
    const res = await fetch(
      'https://theunpartybuilder.unparty.app/api/mood/playlist',
      { headers: { Authorization: `Bearer ${unpartyToken}` }, next: { revalidate: 300 } }
    );
    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch MOOD playlist from theunpartybuilder' }, { status: 502 });
    }
    const data = await res.json();
    songs = (data.playlist as MoodSong[]).filter((s) => s.matched);
  } catch (err) {
    return NextResponse.json({ error: 'Network error fetching MOOD playlist', detail: String(err) }, { status: 502 });
  }

  // 2. Generate Apple Music developer token
  let appleToken: string;
  try {
    // Checked by isAppleMusicConfigured() above, so never null here
    appleToken = (await createAppleMusicDeveloperToken(60 * 60))!.token;
  } catch (err) {
    return NextResponse.json({ error: 'Failed to generate Apple Music token', detail: String(err) }, { status: 500 });
  }

  // 3. Search Apple Music per song (batched, 10 concurrent)
  type EnrichedSong = {
    title: string;
    artist: string | null;
    appleTrackId: string | null;
    albumName: string | null;
    artworkUrl: string | null;
    commitDate: string;
    repo: string;
  };

  const byUnppp: Record<string, EnrichedSong[]> = {};
  const BATCH = 10;

  for (let i = 0; i < songs.length; i += BATCH) {
    const batch = songs.slice(i, i + BATCH);
    const results = await Promise.all(
      batch.map(async (song) => {
        const term = song.artist ? `${song.title} ${song.artist}` : song.title;
        const apple = await searchAppleMusic(term, appleToken);
        const unpppId = song.repo.split('/').pop() ?? song.repo;
        return { song, apple, unpppId };
      })
    );
    for (const { song, apple, unpppId } of results) {
      if (!byUnppp[unpppId]) byUnppp[unpppId] = [];
      byUnppp[unpppId].push({
        title: song.title,
        artist: song.artist,
        appleTrackId: apple?.appleTrackId ?? null,
        albumName: apple?.albumName ?? null,
        artworkUrl: apple?.artworkUrl ?? null,
        commitDate: song.commit_date,
        repo: song.repo,
      });
    }
  }

  const resolved = Object.values(byUnppp).flat().filter((s) => s.appleTrackId !== null).length;

  return NextResponse.json({
    total: songs.length,
    resolved,
    unresolved: songs.length - resolved,
    unpppCount: Object.keys(byUnppp).length,
    byUnppp,
  });
}
