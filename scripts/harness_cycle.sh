#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

SMALI_PROJECT="${SMALI_PROJECT:-app}"
UNSIGNED_APK="${UNSIGNED_APK:-/tmp/myday20_latest_unsigned.apk}"
ALIGNED_APK="${ALIGNED_APK:-/tmp/myday20_latest_aligned.apk}"
SIGNED_APK="${SIGNED_APK:-/tmp/myday20_latest_signed.apk}"
BUILD_TOOLS_DIR="${BUILD_TOOLS_DIR:-$HOME/Library/Android/sdk/build-tools/36.1.0}"
PACKAGE_ACTIVITY="${PACKAGE_ACTIVITY:-com.mooja.myday20/com.mooja.autopost.MainActivity}"

"$ROOT_DIR/scripts/harness_preflight.sh"

echo "[1/7] Version Bump"
NEXT_VERSION="$($ROOT_DIR/scripts/bump_app_version.sh)"
echo "Version bumped to $NEXT_VERSION"

echo "[2/7] Build"
apktool b "$SMALI_PROJECT" -o "$UNSIGNED_APK"

echo "[3/7] Sign"
"$BUILD_TOOLS_DIR/zipalign" -f -p 4 "$UNSIGNED_APK" "$ALIGNED_APK"
"$BUILD_TOOLS_DIR/apksigner" sign   --ks "$HOME/.android/debug.keystore"   --ks-key-alias androiddebugkey   --ks-pass pass:android   --key-pass pass:android   --out "$SIGNED_APK"   "$ALIGNED_APK"
"$BUILD_TOOLS_DIR/apksigner" verify "$SIGNED_APK"

echo "[4/7] Push"
git add   "$SMALI_PROJECT/AndroidManifest.xml"   "$SMALI_PROJECT/apktool.yml"   "$SMALI_PROJECT/assets/public/index.html"   "$SMALI_PROJECT/assets/public/assets/index-*.js"   "$SMALI_PROJECT/assets/public/assets/chatbot.js"   "$SMALI_PROJECT/assets/public/assets/chatbot.css"   "$SMALI_PROJECT/assets/public/assets/knowledge.md"   "$SMALI_PROJECT/assets/public/assets/referral-share.js"   "$SMALI_PROJECT/assets/public/assets/bottom-nav.css"   "$SMALI_PROJECT/assets/capacitor.config.json"   "$SMALI_PROJECT/res/values/strings.xml"   PROJECT_STATUS.md   scripts/harness_cycle.sh   scripts/harness_preflight.sh   scripts/backend_publish_smoke.sh   scripts/backend_deploy_and_smoke.sh   scripts/system_checklist.sh
git commit -m "chore: bump MyDay 2.0 version to $NEXT_VERSION" || true
git push origin main

echo "[5/7] Backend Deploy + Smoke"
"$ROOT_DIR/scripts/backend_deploy_and_smoke.sh"

echo "[6/7] Install"
adb install -r "$SIGNED_APK"

echo "[7/7] Run"
adb shell am start -n "$PACKAGE_ACTIVITY"

echo "[DONE] harness cycle complete"
