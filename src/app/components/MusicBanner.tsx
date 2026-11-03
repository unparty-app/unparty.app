// src/app/components/MusicBanner.tsx
"use client";
import { useMusicKit } from "@/hooks/useMusicKit";
import { AppleMusicTrack } from "@/types/music";
import Badge from './Badge';

import { Play, Pause, SkipBack, SkipForward } from '@/app/components/icons';
import { getTrackById } from "@/utils/musicRegistry";
import { extractAppleTrackId } from "@/utils/musicUtils";
import { musicLogger } from "@/utils/musicLogger";
import Image from 'next/image';
import { useTheme } from '../contexts/ThemeContext';
import { inkOn } from './build-yours/BuildYours';


type MusicBannerProps = {
  tracks?: AppleMusicTrack[];
  autoRotate?: boolean;
  // Single-row variant sized for the fixed banner bar: controls + track
  // badge + a smaller inline Apple Music badge, instead of stacked rows.
  compact?: boolean;
  // A card's song (StoryPreview): a play circle in the theme color, the
  // title and artist on two lines, and the Apple Music badge under them.
  // Sits above a card-wide link, so it raises itself to stay pressable
  card?: boolean;
};

export default function MusicBanner({ tracks, compact = false, card = false }: MusicBannerProps) {
  const mk = useMusicKit();
  const { colorValue } = useTheme();

  // If no tracks provided, use default track from registry
  const defaultTrack = getTrackById('badbunny-dtmf');
  const playlist = tracks && tracks.length > 0 ? tracks : (defaultTrack ? [defaultTrack] : []);
  const hasMultipleTracks = playlist.length > 1;

  // If no tracks available, don't render
  if (playlist.length === 0) {
    return null;
  }

  // Use MusicKit's queue position if available, otherwise track manually
  const currentPosition = mk.queuePosition ?? 0;
  const currentTrack = playlist[currentPosition] || playlist[0];
  const trackId = currentTrack.appleTrackId ?? extractAppleTrackId(currentTrack.appleUrl);

  // With no Apple Music to ask, a song knows only what its link says
  const artist = currentTrack.artist === 'Unknown Artist' ? '' : currentTrack.artist;
  const songLine = artist ? `${artist} - ${currentTrack.title}` : currentTrack.title;

  const isCurrentTrack = mk.currentTrackId === trackId;

  // For single track: check if THIS track is playing
  // For playlist: check if ANY track from this playlist is playing
  const isThisContentPlaying = hasMultipleTracks
    ? mk.isPlaying && playlist.some(t => {
        const tId = t.appleTrackId ?? extractAppleTrackId(t.appleUrl);
        return mk.currentTrackId === tId;
      })
    : mk.isPlaying && isCurrentTrack;

  const handlePlayPause = async () => {
    musicLogger.debug('[MusicBanner] Play/Pause clicked', {
      hasMultipleTracks,
      isThisContentPlaying,
      currentTrackId: mk.currentTrackId,
      trackId,
      isCurrentTrack,
      isReady: mk.ready,
      isAuthorized: mk.isAuthorized
    });

    try {
      if (hasMultipleTracks) {
        // Playing entire playlist
        const trackIds = playlist.map(t => t.appleTrackId ?? extractAppleTrackId(t.appleUrl));
        musicLogger.debug('[MusicBanner] Playlist track IDs:', trackIds);

        if (isThisContentPlaying) {
          musicLogger.debug('[MusicBanner] Pausing playlist');
          await mk.pause();
        } else if (mk.currentTrackId && playlist.some(t => {
          const tId = t.appleTrackId ?? extractAppleTrackId(t.appleUrl);
          return mk.currentTrackId === tId;
        })) {
          // Resume if a track from this playlist is already in queue
          musicLogger.debug('[MusicBanner] Resuming playlist');
          await mk.resume();
        } else {
          // Start playlist from beginning
          musicLogger.debug('[MusicBanner] Starting playlist from beginning');
          await mk.playPlaylist(trackIds);
        }
      } else {
        // Single track behavior
        musicLogger.debug('[MusicBanner] Single track mode, trackId:', trackId);

        if (isThisContentPlaying) {
          musicLogger.debug('[MusicBanner] Pausing track');
          await mk.pause();
        } else if (isCurrentTrack) {
          musicLogger.debug('[MusicBanner] Resuming track');
          await mk.resume();
        } else {
          musicLogger.debug('[MusicBanner] Playing new track');
          await mk.playTrack(trackId);
        }
      }
    } catch (error) {
      musicLogger.error('[MusicBanner] handlePlayPause error:', error);
    }
  };

  const handlePrevious = async () => {
    musicLogger.debug('[MusicBanner] Previous button clicked');
    musicLogger.debug('[MusicBanner] Current position:', currentPosition);
    musicLogger.debug('[MusicBanner] Queue position from MusicKit:', mk.queuePosition);

    try {
      await mk.skipToPrevious();
      musicLogger.debug('[MusicBanner] Previous track completed');
    } catch (error) {
      musicLogger.error('[MusicBanner] Previous track error:', error);
    }
  };

  const handleNext = async () => {
    musicLogger.debug('[MusicBanner] Next button clicked');
    musicLogger.debug('[MusicBanner] Current position:', currentPosition);
    musicLogger.debug('[MusicBanner] Queue position from MusicKit:', mk.queuePosition);
    musicLogger.debug('[MusicBanner] Playlist length:', playlist.length);

    try {
      await mk.skipToNext();
      musicLogger.debug('[MusicBanner] Next track completed');
    } catch (error) {
      musicLogger.error('[MusicBanner] Next track error:', error);
    }
  };

  // Apple Music isn't connected to this copy: the song and a way to go hear it
  const listenOnApple = (width: number, height: number) => (
    <a href={currentTrack.appleUrl} target="_blank" rel="noopener noreferrer" aria-label={`Listen to ${currentTrack.title} on Apple Music`} className="relative z-10 inline-flex">
      <Image src="/appleMusic/US-UK_Apple_Music_Listen_on_Badge_RGB_072720.svg" alt="" width={width} height={height} className="opacity-90" />
    </a>
  );

  if (card) {
    const ink = inkOn(colorValue);
    return (
      <div className="relative z-10 flex flex-col gap-2">
        <div className="flex min-w-0 items-center gap-3">
          {!mk.off && (
          <button
            type="button"
            onClick={handlePlayPause}
            disabled={!mk.ready}
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-full shadow-md transition-transform duration-200 hover:scale-105 disabled:opacity-50 motion-reduce:transition-none"
            style={{ backgroundColor: colorValue }}
            aria-label={isThisContentPlaying ? `Pause ${currentTrack.title}` : `Play ${currentTrack.title} by ${currentTrack.artist}`}
          >
            {isThisContentPlaying ? <Pause className="size-4" style={{ color: ink }} /> : <Play className="ml-0.5 size-4" style={{ color: ink }} />}
          </button>
          )}
          <div className="min-w-0">
            <p className="truncate font-space-grotesk text-sm leading-tight text-[var(--foreground)]">{currentTrack.title}</p>
            {artist && <p className="truncate font-google-sans-code text-[10px] uppercase tracking-wide text-[var(--text-muted)]">{artist}</p>}
          </div>
        </div>
        {mk.off ? listenOnApple(83, 21) : (
        <Image
          src="/appleMusic/US-UK_Apple_Music_Listen_on_Badge_RGB_072720.svg"
          alt="Listen on Apple Music"
          width={83}
          height={21}
          className="opacity-90"
        />
        )}
      </div>
    );
  }

  return (
    <div className={compact ? 'flex items-center gap-2' : 'flex flex-col gap-1'}>


      {/* Controls Row */}
      <div className={compact ? 'flex items-center gap-2' : 'flex items-center gap-3 pt-0.5'}>
        {/* Previous Track Button (only show if multiple tracks) */}
        {mk.ready && hasMultipleTracks && (
          <button
            onClick={handlePrevious}
            disabled={currentPosition === 0}
            className="inline-flex size-6 items-center justify-center rounded-full transition-all duration-200 hover:bg-[#F9C22E]/10 disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Previous track"
          >
            <SkipBack className="size-3" style={{ color: '#F9C22E' }} />
          </button>
        )}

        {/* Play/Pause Button */}
        {mk.ready && (
          <button
            onClick={handlePlayPause}
            disabled={!mk.ready}
            className="inline-flex size-6 items-center justify-center rounded-full transition-all duration-200 hover:bg-[#F9C22E]/10"
            aria-label={isThisContentPlaying ? "Pause track" : "Play track"}
          >
            {isThisContentPlaying ? (
              <Pause className="size-3" style={{ color: '#F9C22E' }} />
            ) : (
              <Play className="size-3 ml-0.5" style={{ color: '#F9C22E' }} />
            )}
          </button>
        )}

        {/* Next Track Button (only show if multiple tracks) */}
        {mk.ready && hasMultipleTracks && (
          <button
            onClick={handleNext}
            disabled={currentPosition >= playlist.length - 1}
            className="inline-flex size-6 items-center justify-center rounded-full transition-all duration-200 hover:bg-[#F9C22E]/10 disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Next track"
          >
            <SkipForward className="size-3" style={{ color: '#F9C22E' }} />
          </button>
        )}

        {/* Track Info using Badge component with smart scrolling text */}
        <div className="overflow-hidden max-w-[120px] sm:max-w-[180px]">
          <Badge variant="header" size="sm" className="whitespace-nowrap !px-0 !py-0">
            {(() => {
              // Show error message if present
              if (mk.error) {
                return (
                  <div className="text-red-500" title={`Error ${mk.error.code}: ${mk.error.developerMessage}`}>
                    {mk.error.message}
                  </div>
                );
              }

              const trackInfo = hasMultipleTracks
                ? `${currentPosition + 1}/${playlist.length} • ${songLine}`
                : songLine;

              const content = mk.off ? trackInfo : mk.ready ? (
                isThisContentPlaying ? (
                  `▶ ${trackInfo}`
                ) : (
                  trackInfo
                )
              ) : (
                'Loading...'
              );

              // Only animate if content is long
              const isLong = content.length > 15;

              return (
                <div className={isLong ? "animate-scroll" : ""}>
                  {content}
                </div>
              );
            })()}
          </Badge>
        </div>
      </div>

      {/* Apple Music Attribution - inline and smaller in compact mode, its own row otherwise (badge height: 40px, clear space: 10px) */}
      <div className={compact ? 'flex shrink-0 items-center' : 'flex items-center justify-start pt-2.5'}>
        {mk.off ? listenOnApple(compact ? 83 : 119, compact ? 21 : 30) : (
        <Image
          src="/appleMusic/US-UK_Apple_Music_Listen_on_Badge_RGB_072720.svg"
          alt="Listen on Apple Music"
          width={compact ? 83 : 119}
          height={compact ? 21 : 30}
          className="opacity-90"
          aria-hidden="true"
        />
        )}
      </div>
    </div>
  );
}
