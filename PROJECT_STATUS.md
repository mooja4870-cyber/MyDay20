# PROJECT_STATUS

- Last Updated: 2026-04-08 22:15:37
- Policy: 작업 시작 전 이 파일을 먼저 확인하고, 없으면 생성 후 유지
- Harness Mode: ENABLED
- Deploy Rule: 코드 수정 후 `빌드 -> 푸시 -> 설치 -> 실행` 필수

## Current Target
- App Label: `MyDay\n2.0`
- App Id: `com.mooja.myday20`
- Android Package: `com.mooja.myday20`
- Launch Component: `com.mooja.myday20/com.mooja.autopost.MainActivity`

## Structure
- `app/` : Android(smali/apktool) project
- `scripts/` : harness/build scripts
- `docs/` : 운영 문서

## Next Rule
- 코드 수정 후 이 파일의 `Last Updated`를 갱신
