#!/usr/bin/env bash
#
# Converts a camera-original image (e.g. a multi-MB iPhone photo) into a
# web-ready .webp cover, with an optional crop pass. Wraps the same
# crop -> resize -> re-encode pipeline used ad hoc when prepping
# hope-unparty-outline.webp, and validates the result against the same
# 1MB/2000px rule scripts/check-cover-sizes.js enforces everywhere else
# (see #819 for why that limit exists) rather than re-declaring it here.
#
# Usage: scripts/convert-cover.sh <input-image> [output.webp] [options]
#   - input can be anything ImageMagick reads, including iPhone .HEIC
#   - output defaults to public/covers/<input-basename>.webp
#   - EXIF orientation is applied and metadata stripped (see magick_args below)
#   - options:
#       --crop WxH+X+Y   ImageMagick crop geometry, applied before resize
#       --quality N      WebP quality, 0-100 (default: 82)
#       --max-dimension N  Long-edge cap in px, shrink-only (default: 2000)

set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: $0 <input-image> [output.webp] [--crop WxH+X+Y] [--quality N] [--max-dimension N]" >&2
  exit 1
fi

input="$1"
shift

if [ ! -f "$input" ]; then
  echo "Error: input file not found: $input" >&2
  exit 1
fi

if ! command -v magick >/dev/null 2>&1; then
  echo "Error: magick not found on PATH (install via: brew install imagemagick)" >&2
  exit 1
fi

output=""
crop=""
quality=82
max_dimension=2000

if [ $# -gt 0 ] && [[ "$1" != --* ]]; then
  output="$1"
  shift
fi

while [ $# -gt 0 ]; do
  case "$1" in
    --crop)
      crop="$2"
      shift 2
      ;;
    --quality)
      quality="$2"
      shift 2
      ;;
    --max-dimension)
      max_dimension="$2"
      shift 2
      ;;
    *)
      echo "Error: unknown option: $1" >&2
      exit 1
      ;;
  esac
done

if [ -z "$output" ]; then
  base="$(basename "$input")"
  output="public/covers/${base%.*}.webp"
fi

mkdir -p "$(dirname "$output")"

# -auto-orient first, so a phone photo's EXIF rotation is baked into the pixels
# before --crop geometry is applied (and before -strip drops the EXIF tag that
# would otherwise be the only record of it). -strip also removes device/GPS
# metadata, which shouldn't ship in a public asset.
magick_args=("$input" -auto-orient)
if [ -n "$crop" ]; then
  magick_args+=(-crop "$crop" +repage)
fi
magick_args+=(-resize "${max_dimension}x${max_dimension}>" -strip -quality "$quality" "$output")

echo "Converting $input -> $output"
magick "${magick_args[@]}"

echo "Checking against the cover size limit..."
node scripts/check-cover-sizes.js "$output"

echo "Done."
echo "  input:  $input ($(du -h "$input" | cut -f1))"
echo "  output: $output ($(du -h "$output" | cut -f1)) $(identify -format '%wx%h' "$output")"
