#!/usr/bin/env bash
#
# Converts a video (e.g. .mov straight off an iPhone) into a web-ready
# H.264/AAC .mp4, plus a poster .thumb.jpg grabbed 10% into the clip
# (matches scripts/generate-video-metadata.js's poster convention).
#
# Usage: scripts/convert-video.sh <input-video> [output.mp4]
#   - output defaults to the input path with its extension swapped to .mp4
#   - poster is written alongside output as <name>.thumb.jpg

set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: $0 <input-video> [output.mp4]" >&2
  exit 1
fi

input="$1"
if [ ! -f "$input" ]; then
  echo "Error: input file not found: $input" >&2
  exit 1
fi

for bin in ffmpeg ffprobe; do
  if ! command -v "$bin" >/dev/null 2>&1; then
    echo "Error: $bin not found on PATH (install via: brew install ffmpeg)" >&2
    exit 1
  fi
done

output="${2:-${input%.*}.mp4}"
poster="${output%.*}.thumb.jpg"

mkdir -p "$(dirname "$output")"

echo "Converting $input -> $output"
ffmpeg -y -i "$input" \
  -c:v libx264 -preset slow -crf 23 -pix_fmt yuv420p \
  -vf "scale='min(1080,iw)':'-2'" \
  -c:a aac -b:a 128k \
  -movflags +faststart \
  "$output"

duration=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$output")
seek=$(awk -v d="$duration" 'BEGIN { s = d * 0.1; if (s < 0.5) s = 0.5; print s }')

echo "Extracting poster frame at ${seek}s -> $poster"
ffmpeg -y -ss "$seek" -i "$output" -update 1 -vframes 1 -q:v 3 "$poster"

echo "Done."
echo "  video:  $output ($(du -h "$output" | cut -f1))"
echo "  poster: $poster"
