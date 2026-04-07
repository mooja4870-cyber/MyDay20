#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [[ ! -f PROJECT_STATUS.md ]]; then
  echo "[ERROR] PROJECT_STATUS.md is missing"
  exit 1
fi

if ! command -v apktool >/dev/null 2>&1; then
  echo "[ERROR] apktool not found"
  exit 1
fi

if ! command -v adb >/dev/null 2>&1; then
  echo "[ERROR] adb not found"
  exit 1
fi

BUILD_TOOLS_DIR="${BUILD_TOOLS_DIR:-$HOME/Library/Android/sdk/build-tools/36.1.0}"
for t in zipalign apksigner; do
  if [[ ! -x "$BUILD_TOOLS_DIR/$t" ]]; then
    echo "[ERROR] $t not found in $BUILD_TOOLS_DIR"
    exit 1
  fi
done

echo "[OK] preflight passed"
