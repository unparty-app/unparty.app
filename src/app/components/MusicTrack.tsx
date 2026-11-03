// src/app/components/MusicTrack.tsx
"use client";
import { useMusicKit } from "@/hooks/useMusicKit";
import { extractAppleTrackId } from "@/utils/musicUtils";
import Image from 'next/image';

type Track = {
  id: string;
  artist: string;
  title: string;
  appleUrl: string;      // e.g. https://music.apple.com/us/album/...?...&i=1494848820
  appleTrackId?: string; // "1494848820"
};

export function MusicTrack({ track }: { track: Track }) {
  const mk = useMusicKit();
  const trackId = track.appleTrackId ?? extractAppleTrackId(track.appleUrl);

  const canEmbed = !mk.ready && !mk.error; // before SDK is ready and no error, show an embed for preview

  return (
    <article style={{ maxWidth: 520 }}>
      <h3 style={{ margin: 0 }}>{track.title}</h3>
      <p style={{ margin: "4px 0 8px" }}>{track.artist}</p>

      {mk.error ? (
        <div
          style={{
            padding: "12px",
            backgroundColor: "#fee",
            border: "1px solid #fcc",
            borderRadius: "4px",
            color: "#c33"
          }}
          title={`Error ${mk.error.code}: ${mk.error.developerMessage}`}
        >
          <strong>⚠️ {mk.error.message}</strong>
          <br />
          <small style={{ color: "#999" }}>Code: {mk.error.code}</small>
        </div>
      ) : canEmbed ? (
        <iframe
          title={`${track.artist} – ${track.title}`}
          allow="autoplay *; encrypted-media *"
          frameBorder="0"
          height="175"
          style={{ width: "100%", overflow: "hidden", background: "transparent" }}
          sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-top-navigation-by-user-activation"
          src={track.appleUrl.replace(
            "https://music.apple.com/",
            "https://embed.music.apple.com/"
          )}
        />
      ) : (
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => mk.playTrack(trackId)}
            disabled={!mk.ready}
            aria-label="Play track"
          >
            {mk.isPlaying && mk.currentTrackId === trackId ? "⏸ Pause in Player" : "▶︎ Play"}
          </button>
          {mk.isPlaying && mk.currentTrackId === trackId ? (
            <button onClick={() => mk.pause()}>Pause</button>
          ) : (
            <button onClick={() => mk.resume()} disabled={!mk.ready}>
              Resume
            </button>
          )}
          <a href={track.appleUrl} target="_blank" rel="noreferrer">
            Open in Apple Music
          </a>
        </div>
      )}

      {/* Apple Music Attribution */}
      <div style={{ marginTop: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
        <a
          href={track.appleUrl}
          target="_blank"
          rel="noreferrer"
          aria-label="Listen on Apple Music"
        >
          <Image
            src="/appleMusic/US-UK_Apple_Music_Listen_on_Badge_RGB_072720.svg"
            alt="Listen on Apple Music"
            width={119}
            height={40}
            style={{ display: "block" }}
          />
        </a>
      </div>
    </article>
  );
}