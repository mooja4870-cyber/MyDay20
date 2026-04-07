#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

SMALI_PROJECT="${SMALI_PROJECT:-recovery/MyDayWriter_v2.8_recovered_smali_project}"
JS_FILE="$(ls "$SMALI_PROJECT"/assets/public/assets/index-*.js | head -n 1)"
CAP_CONFIG="$SMALI_PROJECT/assets/capacitor.config.json"
STRINGS_XML="$SMALI_PROJECT/res/values/strings.xml"

if [[ ! -f "$JS_FILE" || ! -f "$CAP_CONFIG" || ! -f "$STRINGS_XML" ]]; then
  echo "[ERROR] version target files are missing" >&2
  exit 1
fi

CURRENT_VERSION="$(sed -n 's/.*"appName": "MyDay\\nv \([0-9]\+\.[0-9]\+\)".*/\1/p' "$CAP_CONFIG" | head -n 1)"

if [[ -z "$CURRENT_VERSION" ]]; then
  echo "[ERROR] failed to detect current version" >&2
  exit 1
fi

IFS='.' read -r major minor <<< "$CURRENT_VERSION"
major="${major:-0}"
minor="${minor:-0}"
minor=$((10#$minor + 1))

if (( minor >= 10 )); then
  major=$((10#$major + 1))
  minor=0
fi

NEXT_VERSION="${major}.${minor}"

NEXT_VERSION="$NEXT_VERSION" perl -0pi -e 's/(="v )[0-9]+\.[0-9]+(")/$1$ENV{NEXT_VERSION}$2/g' "$JS_FILE"
NEXT_VERSION="$NEXT_VERSION" perl -0pi -e 's/("appName": "MyDay\\nv )[0-9]+\.[0-9]+(")/$1$ENV{NEXT_VERSION}$2/g' "$CAP_CONFIG"
NEXT_VERSION="$NEXT_VERSION" perl -0pi -e 's/(<string name="app_name">"MyDay\s*v )[0-9]+\.[0-9]+(")/$1$ENV{NEXT_VERSION}$2/s; s/(<string name="title_activity_main">"MyDay\s*v )[0-9]+\.[0-9]+(")/$1$ENV{NEXT_VERSION}$2/s;' "$STRINGS_XML"

echo "$NEXT_VERSION"
