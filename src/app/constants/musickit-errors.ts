// src/app/constants/musickit-errors.ts

/**
 * Branded error messages for MusicKit
 * Each error includes:
 * - user: Branded, user-friendly message shown in UI
 * - developer: Technical details logged to console
 * - code: Unique error code for tracking/debugging
 */
export const MUSICKIT_ERRORS = {
  SDK_LOAD_FAILED: {
    user: "Music player unavailable. Please refresh the page.",
    developer: "Failed to load MusicKit SDK from Apple CDN",
    code: "SDK_LOAD_ERROR"
  },
  TOKEN_FETCH_FAILED: {
    user: "Unable to initialize music player.",
    developer: "Failed to fetch developer token from /api/musickit-token",
    code: "TOKEN_FETCH_ERROR"
  },
  CONFIG_MISSING: {
    user: "Music playback not configured.",
    developer: "Missing Apple Music ENV configuration (TEAM_ID, KEY_ID, or PRIVATE_KEY)",
    code: "ENV_CONFIG_ERROR"
  },
  TOKEN_GENERATION_FAILED: {
    user: "Music authentication failed.",
    developer: "Failed to generate JWT token with ES256",
    code: "TOKEN_GEN_ERROR"
  },
  SDK_NOT_LOADED: {
    user: "Music player failed to start.",
    developer: "MusicKit SDK failed to load after script insertion",
    code: "SDK_INIT_ERROR"
  },
  INSTANCE_FAILED: {
    user: "Music player initialization failed.",
    developer: "Failed to get MusicKit instance after configuration",
    code: "INSTANCE_ERROR"
  },
  PLAYBACK_FAILED: {
    user: "Unable to play this track.",
    developer: "Track failed to load/play - mediaPlaybackError event",
    code: "PLAYBACK_ERROR"
  },
  AUTHORIZATION_FAILED: {
    user: "Heads up! An Apple Music subscription is required to play tracks. Please sign in and authorize Apple Music to continue.",
    developer: "User authorization required but not granted",
    code: "AUTH_ERROR"
  }
} as const;

export type MusicKitErrorType = keyof typeof MUSICKIT_ERRORS;

/**
 * Helper to create a consistent error response
 */
export function createMusicKitError(type: MusicKitErrorType, detail?: string) {
  const error = MUSICKIT_ERRORS[type];
  return {
    message: error.user,
    code: error.code,
    developerMessage: error.developer,
    detail
  };
}
