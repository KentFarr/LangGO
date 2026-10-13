#!/usr/bin/env bash
# Converts the original site photos into web-ready, metadata-free files in src/assets/photos/:
# AVIF at 640/1280 px wide (and 1920 for full-bleed photos), plus a 1280 px progressive JPEG
# fallback for the few browsers without AVIF support.
#
# Usage: scripts/optimize-photos.sh <directory with the original N.jpg photos>
# Requires: vipsthumbnail (libvips), avifenc (libavif), exiftool.
# The originals are not committed; rerun this only when adding or replacing photos.
set -euo pipefail

src="${1:?usage: $0 <source-dir>}"
out="$(cd "$(dirname "$0")/.." && pwd)/src/assets/photos"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
mkdir -p "$out"

# Original file number -> published name.
declare -A photos=(
  [2]=doves [3]=fuji-roofs [4]=torii-fuji [5]=kanji-shutters [6]=pagoda
  [7]=shinjuku-neon [8]=tokyo-skyline [9]=fuji-garden [10]=pond-reader
)

# Only photos shown edge to edge need the largest size.
full_bleed=" torii-fuji tokyo-skyline "

for n in "${!photos[@]}"; do
  name="${photos[$n]}"
  input="$src/$n.jpg"
  widths=(640 1280)
  [[ "$full_bleed" == *" $name "* ]] && widths+=(1920)
  for width in "${widths[@]}"; do
    base="$out/$name-$width"
    # vipsthumbnail applies EXIF rotation; keep=none drops all metadata.
    vipsthumbnail "$input" --size "${width}x" -o "$tmp/$name-$width.png[keep=none]"
    avifenc --speed 6 -q 42 -y 420 --ignore-exif --ignore-xmp "$tmp/$name-$width.png" "$base.avif" >/dev/null
  done
  vipsthumbnail "$input" --size 1280x -o "$out/$name-1280.jpg[Q=72,keep=none,interlace,optimize_coding]"
  echo "✓ $name"
done

# Belt and braces: fail if any metadata survived.
if exiftool -q -if '$GPSPosition or $Model or $DateTimeOriginal' -p '$FileName' "$out" | grep .; then
  echo "Metadata found in the files above" >&2
  exit 1
fi
du -ch "$out"/* | tail -1
