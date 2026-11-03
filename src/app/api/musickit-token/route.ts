// src/app/api/musickit-token/route.ts
import { NextResponse } from "next/server";
import { createAppleMusicDeveloperToken } from "@/lib/apple-music-token";
import { MUSICKIT_ERRORS } from "@/app/constants/musickit-errors";

/**
 * Developer token for MusicKit JS in the browser (useMusicKit).
 * Env and signing: src/lib/apple-music-token.ts. Never expose the key itself.
 */

const TOKEN_LIFETIME_SECONDS = 4 * 60 * 60; // 4 hours

export async function GET() {
  try {
    const result = await createAppleMusicDeveloperToken(TOKEN_LIFETIME_SECONDS);

    // Not connected is a setting, not a failure: the page shows its songs as
    // links to Apple Music instead of a player (useMusicKit)
    if (!result) {
      const error = MUSICKIT_ERRORS.CONFIG_MISSING;
      return NextResponse.json({ token: null, error: error.user, code: error.code, developer: error.developer });
    }

    return NextResponse.json(result);
  } catch (err: unknown) {
    const error = MUSICKIT_ERRORS.TOKEN_GENERATION_FAILED;
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error(`[MusicKit API] ${error.code}: ${error.developer}`, errorMessage);
    return NextResponse.json(
      { 
        error: error.user, 
        code: error.code,
        developer: error.developer,
        detail: errorMessage 
      },
      { status: 500 }
    );
  }
}
