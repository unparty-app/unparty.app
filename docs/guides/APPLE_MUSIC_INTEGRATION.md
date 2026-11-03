# Apple Music Integration

The step-by-step guide lives in the **[MUSIC.](/article/setup-music)** article (source: `src/app/constants/editorial-articles/articles/setup-music.ts`). It walks through registering a Media ID, creating a MusicKit key, filling in `.env`, and giving an article a theme song. Start there.

This page is the quick reference that sits next to it.

---

## Environment variables

All three come from the site owner's Apple Developer account and go in `.env` (and in Vercel's Environment Variables). The private key can be pasted with real line breaks or with literal `\n`.

```bash
APPLE_MUSIC_TEAM_ID="ABC123DEFG"   # Membership → Team ID
APPLE_MUSIC_KEY_ID="XYZ987WVUT"    # Keys → the key's identifier
APPLE_MUSIC_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
...
-----END PRIVATE KEY-----"         # the downloaded AuthKey_<KEY_ID>.p8
```

## Where the code lives

| Piece | File |
|---|---|
| Developer token signing (ES256, shared) | `src/lib/apple-music-token.ts` |
| Token for MusicKit JS in the browser (4 hours) | `src/app/api/musickit-token/route.ts` |
| Track details from the Apple Music API | `src/app/api/music/metadata/route.ts` |
| MusicKit JS loader, player state and controls | `src/hooks/useMusicKit.ts` |
| Theme song lookup (registry, link, or API) | `src/hooks/useMusicTrackMetadata.ts`, `src/utils/musicUtils.ts` |
| Player with the Listen on Apple Music badge | `src/app/components/MusicBanner.tsx` |
| Reusable songs, referenced by `musicTrackId` | `src/data/musicTracks.json` |
| unparty-only: match MOOD. commits to songs | `src/app/api/music/mood-enrich/route.ts` (needs `UNPARTY_TOKEN`) |

## Picking a song

- **Article theme song** (the bar at the top): `appleMusicUrl` or `musicTrackId` on the article.
- **Song inside an article**: a section with `type: 'music'` and the same field in `metadata`.
- **Links**: an album link with the song in `?i=`, or a song link (`/song/<name>/<id>`). An album link without `?i=` is ignored.

## Apple's rules (keep these)

Playback starts only when a reader presses play; the Listen on Apple Music badge stays next to every player; the footer keeps the Apple trademark line and `src/data/privacypolicy.json` keeps its Apple MusicKit section; access to the music is never paid for. Full playback needs the reader's own Apple Music subscription.
