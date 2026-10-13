#!/usr/bin/env bash
# Converts the original site photos into web-ready, metadata-free files in src/assets/photos/:
# High-quality AVIF at 640/1280/1920 px wide (plus 2880/3840 for full-bleed photos, so they stay
# sharp on high-DPI screens) and a 1920 px progressive JPEG fallback for browsers without AVIF.
# Browsers download only the size they need via srcset, so the large sizes cost nothing on phones.
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

# Only photos shown edge to edge (hero, banner, full-height auth panels) need the largest sizes.
full_bleed=" torii-fuji tokyo-skyline doves fuji-garden "

for n in "${!photos[@]}"; do
  name="${photos[$n]}"
  input="$src/$n.jpg"
  widths=(640 1280 1920)
  [[ "$full_bleed" == *" $name "* ]] && widths+=(2880 3840)
  for width in "${widths[@]}"; do
    base="$out/$name-$width"
    # vipsthumbnail applies EXIF rotation; keep=none drops all metadata.
    vipsthumbnail "$input" --size "${width}x" -o "$tmp/$name-$width.png[keep=none]"
    avifenc --speed 4 -q 56 -y 444 --ignore-exif --ignore-xmp "$tmp/$name-$width.png" "$base.avif" >/dev/null
  done
  vipsthumbnail "$input" --size 1920x -o "$out/$name-1920.jpg[Q=85,keep=none,interlace,optimize_coding]"
  echo "✓ $name"
done

# Belt and braces: fail if any metadata survived.
if exiftool -q -if '$GPSPosition or $Model or $DateTimeOriginal' -p '$FileName' "$out" | grep .; then
  echo "Metadata found in the files above" >&2
  exit 1
fi
du -ch "$out"/* | tail -1
