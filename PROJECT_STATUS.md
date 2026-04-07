# PROJECT_STATUS

- Last Updated: 2026-04-07 17:11:49
- Policy: 작업 시작 전 이 파일을 먼저 확인하고, 없으면 생성 후 유지
- Harness Mode: ENABLED
- Deploy Rule: 코드 수정 후 `빌드 -> 푸시 -> 설치 -> 실행` 필수

## Code Update Commits (current)
- 25ccaca Force setup screen for new users (reset stored credentials key)
- c07f95b Set app label to MyDay v1.0 and align version display
- 4a38840 Rename app text from MyDay Writer to MyDay
- a264dc5 Add PROJECT_STATUS tracking file
- (working) Move viral UI to fixed bottom bar and store last-1-month post history for 1/2/5

## Harness Files
- `harness/HARNESS.md`
- `scripts/harness_preflight.sh`
- `scripts/harness_cycle.sh`

## Next Rule
- 코드 수정 후 이 파일의 `Last Updated`와 변경 내역을 항상 갱신
