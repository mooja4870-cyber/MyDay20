# PROJECT_STATUS

- Last Updated: 2026-04-08 11:51:59
- Policy: 작업 시작 전 이 파일을 먼저 확인하고, 없으면 생성 후 유지
- Harness Mode: ENABLED
- Deploy Rule: 코드 수정 후 `빌드 -> 푸시 -> 설치 -> 실행` 필수

## Code Update Commits (current)
- 25ccaca Force setup screen for new users (reset stored credentials key)
- c07f95b Set app label to MyDay v1.0 and align version display
- 4a38840 Rename app text from MyDay Writer to MyDay
- a264dc5 Add PROJECT_STATUS tracking file
- (working) Fix share card source to use latest posted full content (quote + all sections) reliably

## Harness Files
- `harness/HARNESS.md`
- `scripts/harness_preflight.sh`
- `scripts/harness_cycle.sh`

## Next Rule
- 코드 수정 후 이 파일의 `Last Updated`와 변경 내역을 항상 갱신

## Incident Hotfix (2026-04-08)
- 증상: 사용자별 계정 입력 후에도 개발자 블로그로 발행됨
- 원인: 배포 백엔드가 요청 계정(credentials)을 읽지 않고 서버 `.env` 계정만 사용
- 조치:
  - backend `server.ts`에서 `/api/publish`, `/api/publish-async`에 요청 계정 강제 검증 추가
  - backend `naverPublisher.ts`에서 요청 계정(credentials) 우선 사용하도록 수정
  - Railway 배포: `01bb931f-f9f6-4652-8f0f-ccef757ffb53` (SUCCESS)
  - 실서버 검증: credentials 없는 발행 요청이 `INVALID_CREDENTIALS` 400으로 차단됨
