#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

SMALI_PROJECT="${SMALI_PROJECT:-recovery/MyDayWriter_v2.8_recovered_smali_project}"
UNSIGNED_APK="${UNSIGNED_APK:-/tmp/myday_latest_unsigned.apk}"
ALIGNED_APK="${ALIGNED_APK:-/tmp/myday_latest_aligned.apk}"
SIGNED_APK="${SIGNED_APK:-/tmp/myday_latest_signed.apk}"
BUILD_TOOLS_DIR="${BUILD_TOOLS_DIR:-$HOME/Library/Android/sdk/build-tools/36.1.0}"
PACKAGE_ACTIVITY="${PACKAGE_ACTIVITY:-com.mooja.autopost/.MainActivity}"

"$ROOT_DIR/scripts/harness_preflight.sh"

echo "[1/6] Version Bump"
NEXT_VERSION="$("$ROOT_DIR/scripts/bump_app_version.sh")"
echo "Version bumped to v $NEXT_VERSION"

echo "[2/6] Build"
apktool b "$SMALI_PROJECT" -o "$UNSIGNED_APK"

echo "[3/6] Sign"
"$BUILD_TOOLS_DIR/zipalign" -f -p 4 "$UNSIGNED_APK" "$ALIGNED_APK"
"$BUILD_TOOLS_DIR/apksigner" sign \
  --ks "$HOME/.android/debug.keystore" \
  --ks-key-alias androiddebugkey \
  --ks-pass pass:android \
  --key-pass pass:android \
  --out "$SIGNED_APK" \
  "$ALIGNED_APK"
"$BUILD_TOOLS_DIR/apksigner" verify "$SIGNED_APK"

echo "[4/6] Push"
git add \
  "$SMALI_PROJECT"/assets/public/assets/index-*.js \
  "$SMALI_PROJECT/assets/capacitor.config.json" \
  "$SMALI_PROJECT/res/values/strings.xml"
git commit -m "chore: bump app version to v $NEXT_VERSION" || true
git push origin main

echo "[5/6] Install"
adb install -r "$SIGNED_APK"

echo "[6/6] Run"
adb shell am start -n "$PACKAGE_ACTIVITY"

echo "[DONE] harness cycle complete"
