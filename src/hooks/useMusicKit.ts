// src/hooks/useMusicKit.ts
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createMusicKitError } from "@/app/constants/musickit-errors";
import { musicLogger } from "@/utils/musicLogger";
import { SITE_NAME } from "@/app/constants/organization";

// MusicKit playback states
const PlaybackState = {
  NONE: 0,
  LOADING: 1,
  PLAYING: 2,
  PAUSED: 3,
  STOPPED: 4,
  ENDED: 5,
  SEEKING: 6,
  WAITING: 8,
  STALLED: 9,
  COMPLETED: 10
} as const;

declare global {
  interface Window {
    MusicKit?: {
      configure: (config: Record<string, unknown>) => Promise<void>;
      getInstance: () => MusicKitInstance | null;
    };
  }
}

export interface MusicKitInstance {
  isAuthorized: boolean;
  playbackState: number;
  nowPlayingItem?: { id: string };
  queue?: {
    items: Array<{ id: string }>;
    position: number;
    length: number;
  };
  currentPlaybackTime?: number;
  currentPlaybackDuration?: number;
  api: { 
    storefront: () => Promise<Array<{ id: string }>>;
    music: (path: string, params?: Record<string, unknown>) => Promise<{
      data: Array<{
        id: string;
        attributes: {
          name: string;
          artistName: string;
          albumName: string;
          artwork?: { url: string };
          durationInMillis: number;
          releaseDate?: string;
          genreNames?: string[];
          url?: string;
        };
      }>;
    }>;
  };
  addEventListener: (event: string, handler: () => void) => void;
  removeEventListener: (event: string, handler: () => void) => void;
  authorize: () => Promise<void>;
  setQueue: (queue: {
    songs?: string[];
    song?: string;
    items?: unknown[];
    startPlaying?: boolean;
  }) => Promise<void>;
  play: () => Promise<void>;
  pause: () => Promise<void>;
  skipToNextItem?: () => Promise<void>;
  skipToPreviousItem?: () => Promise<void>;
  changeToMediaAtIndex?: (index: number) => Promise<void>;
}

type MusicKitState = {
  ready: boolean;
  isAuthorized: boolean;
  isPlaying: boolean;
  currentTrackId?: string;
  storefront?: string;
  queuePosition?: number;
  queueLength?: number;
  currentTime?: number;
  duration?: number;
  // Apple Music isn't connected to this copy: songs are links, not a player
  off?: boolean;
  error?: {
    message: string;
    code: string;
    developerMessage: string;
    detail?: string;
  } | null;
};

// appName is what Apple shows when it asks a listener to allow access
export function useMusicKit(appName = SITE_NAME, appBuild = "1.0.0") {
  const [state, setState] = useState<MusicKitState>({
    ready: false,
    isAuthorized: false,
    isPlaying: false,
    error: null,
  });

  const musicRef = useRef<MusicKitInstance | null>(null);

  // Lazy-load the MusicKit JS SDK
  const loadSDK = useCallback(async () => {
    if (window.MusicKit) return;
    await new Promise<void>((resolve, reject) => {
      const onError = () => {
        const error = createMusicKitError('SDK_LOAD_FAILED');
        musicLogger.error(`[MusicKit] ${error.code}: ${error.developerMessage}`);
        reject(new Error(error.developerMessage));
      };

      // Another player (or Strict Mode's second mount) already added the
      // script: wait for it to finish instead of assuming MusicKit is there
      const id = "musickit-sdk";
      const existing = document.getElementById(id) as HTMLScriptElement | null;
      if (existing) {
        if (existing.dataset.failed) return onError();
        existing.addEventListener("load", () => resolve(), { once: true });
        existing.addEventListener("error", onError, { once: true });
        return;
      }

      const s = document.createElement("script");
      s.id = id;
      s.src = "https://js-cdn.music.apple.com/musickit/v3/musickit.js";
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => {
        s.dataset.failed = "true";
        onError();
      };
      document.head.appendChild(s);
    });
  }, []);

  // Fetch a developer token from your API
  const fetchDevToken = useCallback(async () => {
    const res = await fetch("/api/musickit-token", { cache: "no-store" });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      const error = createMusicKitError('TOKEN_FETCH_FAILED', errorData.detail);
      musicLogger.error(`[MusicKit] ${error.code}: ${error.developerMessage}`, errorData);
      throw error;
    }
    const { token } = await res.json();
    return (token ?? null) as string | null;
  }, []);

  // Initialize MusicKit
  // Load the SDK, fetch a developer token, and configure MusicKit. Resolves
  // to the instance; state is only updated by the effect below.
  const configureMusicKit = useCallback(async (): Promise<MusicKitInstance | null> => {
    musicLogger.debug("[MusicKit] Starting initialization...");
    const token = await fetchDevToken();
    // Apple Music isn't connected to this copy: no player, and no need for Apple's script
    if (!token) return null;
    musicLogger.debug("[MusicKit] Developer token fetched successfully");

    await loadSDK();
    musicLogger.debug("[MusicKit] SDK loaded successfully");

    if (!window.MusicKit) {
      const error = createMusicKitError('SDK_NOT_LOADED');
      musicLogger.error(`[MusicKit] ${error.code}: ${error.developerMessage}`);
      throw error;
    }

    // Configure MusicKit
    musicLogger.debug("[MusicKit] Configuring with token...");
    await window.MusicKit.configure({
      developerToken: token,
      app: { name: appName, build: appBuild },
    });
    musicLogger.debug("[MusicKit] Configuration complete");

    const music = window.MusicKit.getInstance();
    
    if (!music) {
      const error = createMusicKitError('INSTANCE_FAILED');
      musicLogger.error(`[MusicKit] ${error.code}: ${error.developerMessage}`);
      throw error;
    }

    musicLogger.debug("[MusicKit] Instance obtained successfully");
    return music;
  }, [loadSDK, fetchDevToken, appName, appBuild]);

  // Configure once, then subscribe to player events; setState only runs in
  // the async continuation and event callbacks. Listeners are removed on
  // unmount (or when the configuration inputs change).
  useEffect(() => {
    let cancelled = false;
    const unsubscribers: Array<() => void> = [];

    configureMusicKit()
      .then(async (music) => {
        if (cancelled) return;
        if (!music) {
          setState((s) => ({ ...s, off: true }));
          return;
        }
        musicRef.current = music;

        const listen = (event: string, handler: () => void) => {
          music.addEventListener(event, handler);
          unsubscribers.push(() => music.removeEventListener(event, handler));
        };

        // Subscribe to all events with error handling
        try {
          // Authorization changes
          listen("authorizationStatusDidChange", () => {
            setState((s) => ({ ...s, isAuthorized: music.isAuthorized }));
          });

          // Playback state changes (playing, paused, stopped, etc.)
          listen("playbackStateDidChange", () => {
            const isPlaying = music.playbackState === PlaybackState.PLAYING;
            musicLogger.debug('[MusicKit] playbackStateDidChange:', {
              state: music.playbackState,
              stateName: ['none', 'loading', 'playing', 'paused', 'stopped', 'ended', 'seeking', '?', 'waiting', 'stalled', 'completed'][music.playbackState] || 'unknown',
              currentTrack: music.nowPlayingItem?.id
            });
            setState((s) => ({ ...s, isPlaying }));
          });

          // Current track changes
          listen("mediaItemDidChange", () => {
            const id = music.nowPlayingItem?.id as string | undefined;
            const duration = music.currentPlaybackDuration;
            musicLogger.debug('[MusicKit] mediaItemDidChange event:', {
              trackId: id,
              duration,
              playbackState: music.playbackState
            });
            setState((s) => ({
              ...s,
              currentTrackId: id,
              duration,
              currentTime: 0 // Reset time when track changes
            }));
          });

          // Queue changes (items added/removed)
          listen("queueItemsDidChange", () => {
            const queueLength = music.queue?.length ?? 0;
            setState((s) => ({ ...s, queueLength }));
          });

          // Queue position changes (track navigation)
          listen("queuePositionDidChange", () => {
            const queuePosition = music.queue?.position ?? 0;
            setState((s) => ({ ...s, queuePosition }));
          });

          // Playback time updates (for progress bars)
          listen("playbackTimeDidChange", () => {
            const currentTime = music.currentPlaybackTime;
            setState((s) => ({ ...s, currentTime }));
          });

          // Error events
          listen("mediaPlaybackError", () => {
            const error = createMusicKitError('PLAYBACK_FAILED');
            musicLogger.error(`[MusicKit] ${error.code}: ${error.developerMessage}`);
            setState((s) => ({ ...s, error }));
          });

          listen("queueItemForStartPosition", () => {
            musicLogger.debug('[MusicKit] queueItemForStartPosition - New track loading');
          });

          musicLogger.debug("[MusicKit] All event listeners registered successfully");
        } catch (eventError) {
          musicLogger.debug("[MusicKit] Event listener setup failed:", eventError);
        }

        // Storefront (country) useful for catalog/search
        try {
          const storefront = await music.api.storefront();
          if (!cancelled) {
            setState((s) => ({
              ...s,
              storefront: storefront?.[0]?.id ?? s.storefront,
            }));
          }
        } catch {
          /* no-op */
        }
        if (cancelled) return;

        musicLogger.debug("[MusicKit] Setting ready state, isAuthorized:", music.isAuthorized);
        setState((s) => ({ ...s, ready: true, isAuthorized: music.isAuthorized, error: null }));
      })
      .catch((error) => {
        musicLogger.error("[MusicKit] Initialization failed:", error);
        if (cancelled) return;
        const mkError = error && typeof error === 'object' && 'code' in error
          ? error as ReturnType<typeof createMusicKitError>
          : createMusicKitError('SDK_NOT_LOADED');
        setState((s) => ({ ...s, ready: false, error: mkError }));
      });

    return () => {
      cancelled = true;
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [configureMusicKit]);

  // Public controls
  const authorize = useCallback(async () => {
    const music = musicRef.current;
    if (!music) {
      musicLogger.error('[MusicKit] authorize: MusicKit instance not available');
      return false;
    }

    musicLogger.debug('[MusicKit] authorize: Current isAuthorized:', music.isAuthorized);

    if (!music.isAuthorized) {
      try {
        musicLogger.debug('[MusicKit] authorize: Calling music.authorize()...');
        await music.authorize();
        musicLogger.debug('[MusicKit] authorize: Authorization completed, isAuthorized:', music.isAuthorized);
      } catch (error) {
        const mkError = createMusicKitError('AUTHORIZATION_FAILED');
        musicLogger.error(`[MusicKit] ${mkError.code}: ${mkError.developerMessage}`, error);
        setState((s) => ({ ...s, isAuthorized: false, error: mkError }));
        return false;
      }
    }

    setState((s) => ({ ...s, isAuthorized: music.isAuthorized }));
    return music.isAuthorized;
  }, []);

  const playTrack = useCallback(
    async (appleTrackId: string) => {
      const music = musicRef.current;
      if (!music) {
        musicLogger.error('[MusicKit] playTrack: MusicKit instance not available');
        return;
      }

      musicLogger.debug('[MusicKit] playTrack called with trackId:', appleTrackId);
      musicLogger.debug('[MusicKit] isAuthorized:', music.isAuthorized);

      try {
        // For full playback, user must be authorized subscriber
        if (!music.isAuthorized) {
          musicLogger.debug('[MusicKit] Not authorized, requesting authorization...');
          const authorized = await authorize();
          if (!authorized) {
            musicLogger.error('[MusicKit] Authorization failed or was denied');
            return;
          }
          musicLogger.debug('[MusicKit] Authorization successful');
        }

        musicLogger.debug('[MusicKit] Setting queue with track:', appleTrackId);
        musicLogger.debug('[MusicKit] Track ID type:', typeof appleTrackId);

        // Optimistic state update for immediate UI feedback
        setState((s) => ({ 
          ...s, 
          isPlaying: true,
          currentTrackId: appleTrackId
        }));

        const queueOptions = {
          songs: [appleTrackId],
          startPlaying: true // Auto-play so track starts immediately
        };

        await music.setQueue(queueOptions);

        // Give it a moment to update
        await new Promise(resolve => setTimeout(resolve, 100));

        musicLogger.debug('[MusicKit] Queue set successfully with startPlaying: true');
        musicLogger.debug('[MusicKit] Queue length:', music.queue?.length);
        musicLogger.debug('[MusicKit] Queue items:', music.queue?.items);
        musicLogger.debug('[MusicKit] Should be auto-playing now...');
      } catch (error) {
        musicLogger.error('[MusicKit] playTrack error:', error);
        // Rollback optimistic update on error
        setState((s) => ({ 
          ...s, 
          isPlaying: music.playbackState === PlaybackState.PLAYING,
          currentTrackId: music.nowPlayingItem?.id
        }));
        throw error;
      }
    },
    [authorize]
  );

  const playPlaylist = useCallback(
    async (appleTrackIds: string[]) => {
      const music = musicRef.current;
      if (!music) {
        musicLogger.error('[MusicKit] playPlaylist: MusicKit instance not available');
        return;
      }
      if (appleTrackIds.length === 0) {
        musicLogger.error('[MusicKit] playPlaylist: No track IDs provided');
        return;
      }

      musicLogger.debug('[MusicKit] playPlaylist called with tracks:', appleTrackIds);
      musicLogger.debug('[MusicKit] isAuthorized:', music.isAuthorized);

      try {
        // For full playback, user must be authorized subscriber
        if (!music.isAuthorized) {
          musicLogger.debug('[MusicKit] Not authorized, requesting authorization...');
          const authorized = await authorize();
          if (!authorized) {
            musicLogger.error('[MusicKit] Authorization failed or was denied');
            return;
          }
          musicLogger.debug('[MusicKit] Authorization successful');
        }

        musicLogger.debug('[MusicKit] Setting queue with tracks:', appleTrackIds);
        musicLogger.debug('[MusicKit] Number of tracks to add:', appleTrackIds.length);
        musicLogger.debug('[MusicKit] Track IDs type:', typeof appleTrackIds[0]);

        // Optimistic state update for immediate UI feedback
        setState((s) => ({ 
          ...s, 
          isPlaying: true,
          currentTrackId: appleTrackIds[0],
          queueLength: appleTrackIds.length,
          queuePosition: 0
        }));

        const queueOptions = {
          songs: appleTrackIds,
          startPlaying: true // Auto-play so tracks continue when skipping
        };
        musicLogger.debug('[MusicKit] Queue options:', queueOptions);

        await music.setQueue(queueOptions);

        // Give it a moment to update
        await new Promise(resolve => setTimeout(resolve, 100));

        musicLogger.debug('[MusicKit] Queue set successfully with startPlaying: true');
        musicLogger.debug('[MusicKit] Queue items:', music.queue?.items);
        musicLogger.debug('[MusicKit] Queue length:', music.queue?.length);
        musicLogger.debug('[MusicKit] Queue position:', music.queue?.position);
        musicLogger.debug('[MusicKit] Queue items count:', music.queue?.items?.length);
        musicLogger.debug('[MusicKit] Should be auto-playing now...');
      } catch (error) {
        musicLogger.error('[MusicKit] playPlaylist error:', error);
        // Rollback optimistic update on error
        setState((s) => ({ 
          ...s, 
          isPlaying: music.playbackState === PlaybackState.PLAYING,
          currentTrackId: music.nowPlayingItem?.id,
          queueLength: music.queue?.length,
          queuePosition: music.queue?.position
        }));
        throw error;
      }
    },
    [authorize]
  );

  const pause = useCallback(async () => {
    const music = musicRef.current;
    if (!music) return;
    
    // Defensive check: only pause if actually playing
    if (music.playbackState !== PlaybackState.PLAYING) {
      musicLogger.debug('[MusicKit] pause: Not currently playing (state:', music.playbackState, '), skipping');
      return;
    }
    
    // Optimistic state update for immediate UI feedback
    setState((s) => ({ ...s, isPlaying: false }));
    
    try {
      musicLogger.debug('[MusicKit] pause: Pausing playback');
      await music.pause();
    } catch (error) {
      musicLogger.error('[MusicKit] pause error:', error);
      // Rollback on error
      setState((s) => ({ ...s, isPlaying: music.playbackState === PlaybackState.PLAYING }));
      throw error;
    }
  }, []);

  const resume = useCallback(async () => {
    const music = musicRef.current;
    if (!music) return;
    
    // Defensive check: only resume if paused or stopped
    if (music.playbackState !== PlaybackState.PAUSED && music.playbackState !== PlaybackState.STOPPED) {
      musicLogger.debug('[MusicKit] resume: Not paused/stopped (state:', music.playbackState, '), skipping');
      return;
    }
    
    // Optimistic state update for immediate UI feedback
    setState((s) => ({ ...s, isPlaying: true }));
    
    try {
      musicLogger.debug('[MusicKit] resume: Resuming playback');
      await music.play();
    } catch (error) {
      musicLogger.error('[MusicKit] resume error:', error);
      // Rollback on error
      setState((s) => ({ ...s, isPlaying: music.playbackState === PlaybackState.PLAYING }));
      throw error;
    }
  }, []);

  const skipToNext = useCallback(async () => {
    const music = musicRef.current;
    if (!music) {
      musicLogger.error('[MusicKit] skipToNext: MusicKit instance not available');
      return;
    }
    if (!music.skipToNextItem) {
      musicLogger.error('[MusicKit] skipToNext: skipToNextItem method not available');
      return;
    }

    musicLogger.debug('[MusicKit] skipToNext called');
    musicLogger.debug('[MusicKit] Current queue position:', music.queue?.position);
    musicLogger.debug('[MusicKit] Queue length:', music.queue?.length);

    try {
      await music.skipToNextItem();
      musicLogger.debug('[MusicKit] skipToNext completed, new position:', music.queue?.position);
    } catch (error) {
      musicLogger.error("[MusicKit] Skip to next failed:", error);
    }
  }, []);

  const skipToPrevious = useCallback(async () => {
    const music = musicRef.current;
    if (!music) {
      musicLogger.error('[MusicKit] skipToPrevious: MusicKit instance not available');
      return;
    }
    if (!music.skipToPreviousItem) {
      musicLogger.error('[MusicKit] skipToPrevious: skipToPreviousItem method not available');
      return;
    }

    musicLogger.debug('[MusicKit] skipToPrevious called');
    musicLogger.debug('[MusicKit] Current queue position:', music.queue?.position);
    musicLogger.debug('[MusicKit] Queue length:', music.queue?.length);

    try {
      await music.skipToPreviousItem();
      musicLogger.debug('[MusicKit] skipToPrevious completed, new position:', music.queue?.position);
    } catch (error) {
      musicLogger.error("[MusicKit] Skip to previous failed:", error);
    }
  }, []);

  const api = useMemo(
    () => ({
      ready: state.ready,
      off: state.off,
      isAuthorized: state.isAuthorized,
      isPlaying: state.isPlaying,
      currentTrackId: state.currentTrackId,
      storefront: state.storefront,
      queuePosition: state.queuePosition,
      queueLength: state.queueLength,
      currentTime: state.currentTime,
      duration: state.duration,
      error: state.error,
      authorize,
      playTrack,
      playPlaylist,
      pause,
      resume,
      skipToNext,
      skipToPrevious,
      instance: () => musicRef.current,
    }),
    [state, authorize, playTrack, playPlaylist, pause, resume, skipToNext, skipToPrevious]
  );

  return api;
}