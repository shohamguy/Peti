#!/usr/bin/env bash
# מכין קליף של Peti לאפליקציה: חיתוך 5:4 סביב המרכז, 800x640, בלי סאונד, קובץ קל.
# loop (ברירת מחדל): לולאה חלקה — הסוף נמזג לתחילה, כך שאין "קפיצה" בחזרה להתחלה.
# once: קליף חד־פעמי (למשל תגובה לליטוף) בלי מיזוג.
# שימוש: scripts/make-clip.sh <input.mp4> <name> [loop|once] [crossfade_seconds=0.6]
set -euo pipefail
IN="$1"
NAME="$2"
MODE="${3:-loop}"
X="${4:-0.6}"
OUT_DIR="public/peti"
mkdir -p "$OUT_DIR"
read -r W H < <(ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0:s=' ' "$IN")
CW=$(python3 -c "print(min($W, round($H*1.25/2)*2))")
CX=$(python3 -c "print(($W-$CW)//2)")
CROP="crop=$CW:$H:$CX:0,scale=800:640:flags=lanczos,format=yuv420p"
if [ "$MODE" = "loop" ]; then
  DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$IN")
  OFF=$(python3 -c "print(round($DUR-2*$X,4))")
  FILTER="[0:v]split[a][b];[a]trim=start=$X,setpts=PTS-STARTPTS[main];[b]trim=0:$X,setpts=PTS-STARTPTS[head];[main][head]xfade=transition=fade:duration=$X:offset=$OFF,$CROP[v]"
else
  FILTER="[0:v]$CROP[v]"
fi
ffmpeg -v error -y -i "$IN" -filter_complex "$FILTER" -map "[v]" -an -c:v libx264 -crf 25 -preset slow -profile:v high -movflags +faststart -r 24 "$OUT_DIR/$NAME.mp4"
ffmpeg -v error -y -ss 0.2 -i "$OUT_DIR/$NAME.mp4" -frames:v 1 -q:v 3 "$OUT_DIR/$NAME.jpg"
ls -la "$OUT_DIR/$NAME.mp4" "$OUT_DIR/$NAME.jpg"
