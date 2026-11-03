#!/usr/bin/env bash
#
# Turns a photo of a handwritten poem into its ink alone: a transparent .webp
# that a ```poem fence (ink=...) or a poem section's `ink` shows in the
# theme's ink color, so the poem reads in its writer's hand on light and dark
# pages. The same pipeline that made public/cover-motion/love-gathers-ink.webp.
#
# Usage: scripts/poem-ink.sh <photo> [output.webp] [options]
#   - photo can be anything ImageMagick reads, including iPhone .HEIC
#   - output defaults to public/poems/<photo-basename>-ink.webp
#   - EXIF orientation is applied and metadata stripped
#   - options:
#       --crop WxH+X+Y     ImageMagick crop geometry (on the upright photo), to
#                          keep only the poem. Find it in Preview: Tools → Show
#                          Inspector shows a selection's size and position
#       --max-dimension N  Long-edge cap in px, shrink-only (default: 2000)
#
# Works best with dark pen on plain, evenly lit paper. Uneven light is
# flattened first; specks and paper texture are dropped.

set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: $0 <photo> [output.webp] [--crop WxH+X+Y] [--max-dimension N]" >&2
  exit 1
fi

input="$1"
shift

if [ ! -f "$input" ]; then
  echo "Error: photo not found: $input" >&2
  exit 1
fi

if ! command -v magick >/dev/null 2>&1; then
  echo "Error: magick not found on PATH (install via: brew install imagemagick)" >&2
  exit 1
fi

output=""
crop=""
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
  output="public/poems/${base%.*}-ink.webp"
fi

mkdir -p "$(dirname "$output")"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

# 1. Upright, gray, cropped to the poem
gray_args=("$input" -auto-orient -colorspace gray)
if [ -n "$crop" ]; then
  gray_args+=(-crop "$crop" +repage)
fi
magick "${gray_args[@]}" "$work/gray.png"

# 2. The ink as an alpha mask: divide by a blurred copy with the ink closed
#    over (the paper's own light), so shadows and vignetting flatten out, then
#    keep only what is darker than the paper, with the marker's soft edges
magick "$work/gray.png" \( +clone -morphology close disk:25 -blur 0x20 \) \
  -compose divide_src -composite -level 50%,88% -negate -alpha off \
  -black-threshold 12% "$work/alpha.png"

# 3. Drop specks: anything smaller than a pen dot for this photo's size
area=$(magick "$work/alpha.png" -format '%[fx:int(w*h*0.00002)]' info:)
magick "$work/alpha.png" -threshold 50% \
  -define connected-components:area-threshold="$area" \
  -define connected-components:mean-color=true \
  -connected-components 8 "$work/keep.png"
magick "$work/alpha.png" "$work/keep.png" -compose multiply -composite "$work/clean.png"

# 4. Black ink through that mask, trimmed to the writing with a little room
size=$(magick "$work/clean.png" -format '%wx%h' info:)
magick -size "$size" xc:black "$work/clean.png" -alpha off -compose copy_opacity -composite \
  -trim +repage -bordercolor none -border 40 \
  -resize "${max_dimension}x${max_dimension}>" -strip \
  -quality 85 -define webp:alpha-quality=90 "$output"

echo "Done."
echo "  photo:  $input ($(du -h "$input" | cut -f1))"
echo "  ink:    $output ($(du -h "$output" | cut -f1)) $(magick identify -format '%wx%h' "$output")"
echo "  use it: \`\`\`poem ink=/${output#public/}"
