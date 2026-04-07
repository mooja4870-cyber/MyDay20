# MyDay Harness Workflow

## Goal
하네스 기법으로 앱 수정/검증/배포를 일관되게 관리한다.

## Core Loop
1. `PROJECT_STATUS.md` 확인
2. 변경 범위 확정
3. 코드 수정
4. `scripts/harness_preflight.sh` 실행
5. 커밋
6. `scripts/harness_cycle.sh` 실행 (빌드 -> 푸시 -> 설치 -> 실행)
7. `PROJECT_STATUS.md` 업데이트

## Rules
- 코드 수정 후 배포 루프는 반드시 수행한다.
- 커밋은 변경 목적 1개 기준으로 작게 유지한다.
- 실패 로그는 숨기지 않고 다음 액션에 반영한다.

## Device Target
- Package: `com.mooja.autopost`
- Activity: `com.mooja.autopost/.MainActivity`

## Build Target
- Smali Project: `recovery/MyDayWriter_v2.8_recovered_smali_project`
- Output: `/tmp/myday_latest_signed.apk`
