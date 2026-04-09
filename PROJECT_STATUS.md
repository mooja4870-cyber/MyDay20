# PROJECT_STATUS

- Last Updated: 2026-04-10 00:50:20
- Policy: 작업 시작 전 이 파일을 먼저 확인하고, 없으면 생성 후 유지
- Harness Mode: ENABLED
- Deploy Rule: 코드 수정 후 `빌드 -> 푸시 -> 백엔드 배포 -> E2E smoke test -> 설치 -> 실행` 필수
- Status Rule: 코드 변경/기능 추가/수정/삭제 후 반드시 이 파일 갱신 (필수)

## Current Target
- App Label: `MyDay\n2.9`
- App Id: `com.mooja.myday20`
- Android Package: `com.mooja.myday20`
- Launch Component: `com.mooja.myday20/com.mooja.autopost.MainActivity`
- Current Version: 2.9

## Structure
- `app/` : Android(smali/apktool) project
- `scripts/` : harness/build scripts
- `docs/` : 운영 문서

## Change Log
| 날짜 | 버전 | 변경 내용 |
|------|------|-----------|
| 2026-04-08 | 2.2 | 챗봇 기능 추가 (chatbot.js, chatbot.css, knowledge.md) — Gemini 기반 앱 사용 가이드 도우미 |
| 2026-04-08 | 2.2 | 불필요 파일 정리 (recovery/, app/build/, harness/, app/original/ 삭제) |
| 2026-04-08 | 2.2 | 하네스 스크립트 수정 (chatbot 파일 포함, 버전 감지 regex 수정) |
| 2026-04-09 | 2.3 | 리퍼럴+공유카드 시스템 추가 (referral-share.js, bottom-nav.css) — 하단 고정메뉴 1/3 |
| 2026-04-08 | 2.3 | 하단 고정메뉴 2/3·3/3 완료 (포스팅 기록, 빠른도움) + 공유/복사/성공감지 안정화 |
| 2026-04-08 | 2.4 | 기존 챗봇 아이콘/로딩 제거 후 빠른도움 내 RAG FAQ 챗봇(100 Intent, 500 Q/A)으로 교체 |
| 2026-04-08 | 2.5 | 하네스 배포 완료 (빌드/푸시/설치/실행) |
| 2026-04-09 | 2.6 | 공유·초대 콘텐츠 전면 교체: 직전 블로그 본문(제목~해시태그) 긴 세로 이미지 생성 + 클릭/버튼 이미지 복사 |
| 2026-04-09 | 2.6 | 챗봇 대화체 개선: 시스템 프롬프트 페르소나/말투 규칙 강화, temperature 0.7→0.9, 설명서체→재치있는 대화체 |
| 2026-04-09 | 2.8 | RAG FAQ 챗봇 대화체 전면 개선: RAG_FACTS 22개(앱소개 추가), 답변/앵글 전체 대화체로, fallback·환영메시지 개선, 기존 chatbot.js 대화기능 제거 |
| 2026-04-09 | 2.8 | 서버사이드 RAG 챗봇 구축: chatRagService.ts(벡터 인덱스+코사인유사도+Gemini Flash), /api/chat 엔드포인트, 클라이언트 fallback→서버 RAG 연동 |
| 2026-04-09 | 2.8 | 용어 질문 라우팅 개선: "~이 뭐니/뭐야/이란" 패턴 감지 → 서버 RAG 직행, intro fact 키워드 중복 제거 |
| 2026-04-10 | 2.9 | 릴리스 게이트 강화: backend_deploy_and_smoke.sh 추가, Railway 배포 후 /api/publish-sample 기반 2계정 E2E smoke test 통과 전 adb install/run 차단 |
| 2026-04-10 | 2.9 | 서버 발행기 격리 강화: naverPublisher.ts에서 strict request isolation, 세션 소유 메타데이터, 프레임 포함 타깃 블로그 검증 추가 |

## Next Rule
- 코드 수정 후 이 파일의 `Last Updated`와 `Change Log`를 갱신
