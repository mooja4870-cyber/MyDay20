# PROJECT_STATUS

- Last Updated: 2026-04-09 14:18:21
- Policy: 작업 시작 전 이 파일을 먼저 확인하고, 없으면 생성 후 유지
- Harness Mode: ENABLED
- Deploy Rule: 코드 수정 후 `빌드 -> 푸시 -> 설치 -> 실행` 필수
- Status Rule: 코드 변경/기능 추가/수정/삭제 후 반드시 이 파일 갱신 (필수)

## Current Target
- App Label: `MyDay\n2.18`
- App Id: `com.mooja.myday20`
- Android Package: `com.mooja.myday20`
- Launch Component: `com.mooja.myday20/com.mooja.autopost.MainActivity`
- Current Version: 2.18

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
| 2026-04-09 | 2.9 | 용어 RAG 강화: 앱 용어 사전 확장(40+), 조사/축약/물음표 형태 감지, 화면 텍스트 기반 용어 추출, 용어 질문 시 로컬 설명 우선 + 서버 RAG 연동 |
| 2026-04-09 | 2.10 | 용어 RAG 강화본 배포: 앱 버전 업그레이드, 상태 파일 갱신, 빌드/설치/실행 파이프라인 반영 |
| 2026-04-09 | 2.11 | 확장구간 임시 비노출: 공유초대·포스팅기록 클릭 시 준비중 팝업만 표시, 빠른도움은 기존 유지 |
| 2026-04-09 | 2.12 | 빠른도움 정리: 초대코드 복사도 준비중 팝업으로 전환, 내 블로그 열기는 저장값/최근 발행/기록/화면 URL fallback으로 연결 복구 |
| 2026-04-09 | 2.13 | 챗봇 가독성 조정: 빠른도움 챗봇 관련 모든 표시 텍스트를 기존 대비 133% 크기로 확대 |
| 2026-04-09 | 2.14 | 빠른도움 상단 정리: RAG FAQ 배지와 안내문 블록 제거, 챗봇 리스트부터 바로 표시 |
| 2026-04-09 | 2.14 | 빠른도움 블로그 열기 복구 강화: SecurePrefs/localStorage 동기화, `m.blog.naver.com`/`naver.me`/최근 응답/기록 fallback까지 포함해 내 블로그 열기 신뢰성 보강 |
| 2026-04-09 | 2.14 | 네이버 계정 전환 발행 안정화: 계정 fingerprint/version/sessionKey를 `/api/publish`·`/api/publish-async` 요청에 추가하고 `no-cache`/`forceFreshLogin`/`resetSession`/`clearCookies`/`clearStorage` 신호를 함께 보내 세션 재사용 누적을 최소화 |
| 2026-04-09 | 2.15 | 모바일 백엔드 복구 강화: `HTTP`·`localhost`·사설 IP 백엔드 주소를 모바일에서 자동으로 Railway HTTPS로 정규화하고, 생성/발행 네트워크 오류 시 production 주소로 1회 자동 복구 재시도 |
| 2026-04-09 | 2.15 | 네트워크 오류 안내 정정: 모바일 앱에서는 웹 브라우저용 mixed-content 안내 대신 백엔드 주소 점검/HTTPS 사용 가이드를 직접 표시 |
| 2026-04-09 | 2.16 | 포스팅 `Network Error` 원인 수정: `/api/publish` preflight에서 서버가 허용하지 않는 `X-MyDay-*`/cache 헤더를 제거하고 계정 분리 신호는 request body에만 유지해 CORS 차단 재발 방지 |
| 2026-04-09 | 2.17 | 포스팅 비동기 큐 전환: 메인 발행/미리보기 발행 모두 `/api/publish-async`만 사용하도록 변경하고 `jobId` 기반 `publish-status` 폴링에 연결해 `timeout of 180000ms exceeded` 재발 경로를 차단 |
| 2026-04-09 | 2.17 | 타임아웃 오인 팝업 보정: Axios timeout(`ECONNABORTED`/`ETIMEDOUT`)은 mixed-content/네트워크 차단 팝업으로 오인하지 않도록 분기해 잘못된 안내 재노출을 방지 |
| 2026-04-09 | 2.18 | 중복 발행 잠금 도입: 이전 포스팅이 `queued`/`working` 상태이면 같은 계정의 새 발행을 차단하고 안내문으로 대기 유도해 로그인·세션 준비 실패 재발 경로를 차단 |
| 2026-04-09 | 2.18 | 발행 상태 복구 강화: 활성 `jobId`와 상태를 로컬에 저장해 앱 재실행 후에도 기존 대기 작업을 복원하고 완료/실패 시 잠금을 자동 해제 |

## Next Rule
- 코드 수정 후 이 파일의 `Last Updated`와 `Change Log`를 갱신
