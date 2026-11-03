// src/app/api/music/metadata/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createAppleMusicDeveloperToken } from '@/lib/apple-music-token';

// Server-side calls only; a fresh 1-hour token per uncached request
const TOKEN_LIFETIME_SECONDS = 60 * 60;

/**
 * Fetch track metadata from Apple Music Catalog API
 * GET /api/music/metadata?trackId=1234567890
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const trackId = searchParams.get('trackId');

    if (!trackId) {
      return NextResponse.json(
        { error: 'Missing trackId parameter' },
        { status: 400 }
      );
    }

    // Catalog song IDs are numeric (extractAppleTrackId only ever sends digits).
    // Anything else could walk the path (../search?...) on our developer token
    if (!/^\d{1,20}$/.test(trackId)) {
      return NextResponse.json(
        { error: 'Invalid trackId parameter' },
        { status: 400 }
      );
    }

    const developerToken = await createAppleMusicDeveloperToken(TOKEN_LIFETIME_SECONDS);
    if (!developerToken) {
      // Not connected: the song keeps what its link says (createTrackFromUrlAsync)
      return NextResponse.json({ configured: false });
    }
    const { token } = developerToken;

    // Fetch from Apple Music Catalog API
    const response = await fetch(
      `https://api.music.apple.com/v1/catalog/us/songs/${encodeURIComponent(trackId)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        next: { revalidate: 3600 }, // Cache for 1 hour
      }
    );

    if (!response.ok) {
      console.error('[Music Metadata API] Apple Music API error:', response.status, response.statusText);
      
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Track not found', trackId },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to fetch track metadata', status: response.status },
        { status: 502 }
      );
    }

    const data = await response.json();

    if (!data.data || data.data.length === 0) {
      return NextResponse.json(
        { error: 'No track data returned', trackId },
        { status: 404 }
      );
    }

    const track = data.data[0];
    const attributes = track.attributes;

    // Return simplified metadata
    return NextResponse.json({
      id: track.id,
      artist: attributes.artistName,
      title: attributes.name,
      album: attributes.albumName,
      artwork: attributes.artwork?.url.replace('{w}', '300').replace('{h}', '300'),
      durationMs: attributes.durationInMillis,
      releaseDate: attributes.releaseDate,
      genreNames: attributes.genreNames,
      url: attributes.url,
    });
  } catch (error) {
    console.error('[Music Metadata API] Error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
