#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
PORT="${1:-8080}"

# If something is already serving this folder on the port, just point the user at it.
if curl -s -o /dev/null --max-time 2 "http://localhost:${PORT}/index.html" 2>/dev/null; then
  echo "Braai Master is already running: http://localhost:${PORT}"
  echo "(To restart it first:  fuser -k ${PORT}/tcp)"
  exit 0
fi

echo "Braai Master: http://localhost:${PORT}"
python3 -m http.server "${PORT}"
