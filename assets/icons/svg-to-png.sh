#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_SVG="${SCRIPT_DIR}/logo.svg"

if [[ ! -f "${SOURCE_SVG}" ]]; then
  echo "Missing source SVG: ${SOURCE_SVG}" >&2
  exit 1
fi

magick -background none "${SOURCE_SVG}" -resize 192x192 "${SCRIPT_DIR}/icon-192.png"
magick -background none "${SOURCE_SVG}" -resize 512x512 "${SCRIPT_DIR}/icon-512.png"
cp "${SCRIPT_DIR}/icon-192.png" "${SCRIPT_DIR}/icon-maskable-192.png"
cp "${SCRIPT_DIR}/icon-512.png" "${SCRIPT_DIR}/icon-maskable-512.png"

echo "Generated:"
echo "  icon-192.png"
echo "  icon-512.png"
echo "  icon-maskable-192.png"
echo "  icon-maskable-512.png"
