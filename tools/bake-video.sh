#!/usr/bin/env bash
set -euo pipefail

# tools/bake-video.sh — Bake raw Veo/Gemini clips into web-ready video/audio assets

if ! command -v ffmpeg &>/dev/null; then
  echo "Error: ffmpeg is required to bake video assets." >&2
  exit 1
fi

SRC_DIR="assets-src/video"
OUT_VIDEO="public/video"
OUT_AUDIO="public/audio"

mkdir -p "$OUT_VIDEO" "$OUT_AUDIO"

if [ ! -d "$SRC_DIR" ]; then
  echo "Notice: $SRC_DIR does not exist yet. Create it and place raw .mp4 files to bake."
  exit 0
fi

shopt -s nullglob
RAW_FILES=("$SRC_DIR"/*.mp4)

if [ ${#RAW_FILES[@]} -eq 0 ]; then
  echo "No .mp4 files found in $SRC_DIR."
  exit 0
fi

echo "Baking ${#RAW_FILES[@]} video clip(s)..."

for filepath in "${RAW_FILES[@]}"; do
  filename=$(basename "$filepath")
  id="${filename%.*}"
  echo "==> Processing $id..."

  # Determine if loop or cinematic based on id naming or manifest convention
  is_loop=0
  if [[ "$id" == *"loop"* ]] || [[ "$id" == *"vess_transmission"* ]] || [[ "$id" == *"guild_"* ]]; then
    is_loop=1
  fi

  # 1. Poster JPEG at 0s
  ffmpeg -y -ss 00:00:00 -i "$filepath" -frames:v 1 -vf "scale=960:540:force_original_aspect_ratio=decrease,pad=960:540:(ow-iw)/2:(oh-ih)/2" "$OUT_VIDEO/${id}.jpg"

  # 2. VP9 WebM (CRF 36)
  if [ $is_loop -eq 1 ]; then
    ffmpeg -y -i "$filepath" -vf "scale=960:540:force_original_aspect_ratio=decrease,pad=960:540:(ow-iw)/2:(oh-ih)/2" -c:v libvpx-vp9 -b:v 0 -crf 36 -deadline good -cpu-used 2 -an "$OUT_VIDEO/${id}.webm"
  else
    ffmpeg -y -i "$filepath" -vf "scale=960:540:force_original_aspect_ratio=decrease,pad=960:540:(ow-iw)/2:(oh-ih)/2" -c:v libvpx-vp9 -b:v 0 -crf 36 -deadline good -cpu-used 2 -c:a libopus -b:a 96k "$OUT_VIDEO/${id}.webm"
  fi

  # 3. H.264 MP4 (Safari fallback)
  if [ $is_loop -eq 1 ]; then
    ffmpeg -y -i "$filepath" -vf "scale=960:540:force_original_aspect_ratio=decrease,pad=960:540:(ow-iw)/2:(oh-ih)/2" -c:v libx264 -crf 27 -pix_fmt yuv420p -an "$OUT_VIDEO/${id}.mp4"
  else
    ffmpeg -y -i "$filepath" -vf "scale=960:540:force_original_aspect_ratio=decrease,pad=960:540:(ow-iw)/2:(oh-ih)/2" -c:v libx264 -crf 27 -pix_fmt yuv420p -c:a aac -b:a 128k "$OUT_VIDEO/${id}.mp4"
  fi

  # 4. Extracted audio (for cinematics or ambience)
  if [ $is_loop -eq 0 ]; then
    ffmpeg -y -i "$filepath" -vn -c:a libopus -b:a 96k "$OUT_AUDIO/${id}.webm" 2>/dev/null || true
  fi
done

echo "Video baking complete."
