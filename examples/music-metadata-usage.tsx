// Example usage of the new createTrackFromUrlAsync function
// This file demonstrates how to use the enhanced metadata fetching

import { useState, useEffect } from 'react';
import { createTrackFromUrlAsync, createTrackFromUrl } from '@/utils/musicUtils';
import { AppleMusicTrack } from '@/types/music';

// Example 1: Old way (still works, but artist is "Unknown Artist")
export async function exampleOldWay() {
  const url = 'https://music.apple.com/us/song/step-by-step-remix/267930619';
  const track = createTrackFromUrl(url);
  
  console.log('Old way:');
  console.log('Artist:', track?.artist); // "Unknown Artist"
  console.log('Title:', track?.title);   // "Step By Step Remix"
  console.log('Album:', track?.album);   // undefined
  
  return track;
}

// Example 2: New way (gets real metadata from Apple Music API)
export async function exampleNewWay() {
  const url = 'https://music.apple.com/us/song/step-by-step-remix/267930619';
  const track = await createTrackFromUrlAsync(url);
  
  console.log('New way:');
  console.log('Artist:', track?.artist);   // "Whitney Houston"
  console.log('Title:', track?.title);     // "Step by Step (Remix)"
  console.log('Album:', track?.album);     // "I Look to You"
  console.log('Artwork:', track?.artwork); // URL to artwork image
  console.log('Duration:', track?.durationMs); // Track length in ms
  
  return track;
}

// Example 3: Using in a React component
export function ExampleComponent() {
  const [track, setTrack] = useState<AppleMusicTrack | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchTrack = async () => {
      const url = 'https://music.apple.com/us/song/step-by-step-remix/267930619';
      const trackData = await createTrackFromUrlAsync(url);
      setTrack(trackData);
      setLoading(false);
    };
    
    fetchTrack();
  }, []);
  
  if (loading) {
    return <div>Loading track metadata...</div>;
  }
  
  if (!track) {
    return <div>Track not found</div>;
  }
  
  return (
    <div>
      <h3>{track.title}</h3>
      <p>by {track.artist}</p>
      {track.album && <p>Album: {track.album}</p>}
      {/* eslint-disable-next-line @next/next/no-img-element -- Apple artwork host isn't in next.config remotePatterns; kept minimal for the example */}
      {track.artwork && <img src={track.artwork} alt={track.title} />}
    </div>
  );
}

// Example 4: Direct API call (if you need just the metadata)
export async function exampleDirectAPI() {
  const trackId = '267930619';
  const response = await fetch(`/api/music/metadata?trackId=${trackId}`);
  const metadata = await response.json();
  
  console.log('Direct API call:');
  console.log(metadata);
  // {
  //   id: "267930619",
  //   artist: "Whitney Houston",
  //   title: "Step by Step (Remix)",
  //   album: "I Look to You",
  //   artwork: "https://...",
  //   durationMs: 258000,
  //   ...
  // }
  
  return metadata;
}

// Example 5: Using with multiple tracks
export async function exampleMultipleTracks() {
  const urls = [
    'https://music.apple.com/us/song/step-by-step-remix/267930619',
    'https://music.apple.com/us/album/guess-what/304798687',
    'https://music.apple.com/us/album/charlene/298424131',
  ];
  
  // Fetch all tracks in parallel
  const tracks = await Promise.all(
    urls.map(url => createTrackFromUrlAsync(url))
  );
  
  // Filter out any null results
  const validTracks = tracks.filter(track => track !== null);
  
  console.log('Fetched tracks:', validTracks.length);
  validTracks.forEach(track => {
    console.log(`${track.artist} - ${track.title}`);
  });
  
  return validTracks;
}

// Example 6: Error handling
export async function exampleWithErrorHandling() {
  const url = 'https://music.apple.com/us/song/invalid-track/99999999';
  
  try {
    const track = await createTrackFromUrlAsync(url);
    
    if (!track) {
      console.log('Track not found, but no error thrown');
      // Function gracefully returns null and falls back to URL parsing
      return null;
    }
    
    return track;
  } catch (error) {
    console.error('Unexpected error:', error);
    return null;
  }
}
