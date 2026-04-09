# Daily English — Firebase Backend + 구독 모델 구현 계획 (Consensus v3 — APPROVED)

> Original source: `.omc/plans/firebase-backend-consensus-plan.md`
> Spec source: `.omc/specs/deep-interview-firebase-backend.md`
> Status: **COMPLETED** (2026-04-08)

## Requirements Summary

**Goal:** 로컬 API 키 방식 -> Firebase 백엔드 전환. 사용자가 API 키 없이 로그인만으로 사용.
**Scope:** Firebase Auth + Cloud Functions(프록시) + Firestore(사용량) + RevenueCat(구독)

---

## Architecture

```
[앱 (Expo RN)] --- Firebase Auth (Apple/Google) ---> [인증된 사용자]
  |
  +-- Cloud Functions 2nd gen (asia-northeast3)
  |     +-- processRecording: <60s base64 -> STT -> Translate -> 문장 페어링
  |     +-- processLongRecording: >=60s Cloud Storage -> longrunningrecognize
  |     +-- translate: 캐시된 STT 결과 번역
  |
  +-- Firestore: 사용자 프로필 + 월별 사용량 카운터
  +-- Cloud Storage: 긴 녹음 임시 업로드
  +-- RevenueCat: 인앱 구독 (Pro 4,900/월, Annual 39,000/년)
  |
  +-- 로컬 SQLite: 학습 데이터 (표현, SR 복습, 퀴즈 결과)
```

## Implementation Phases (7 Phases, 22 Steps)

### Phase 1: Firebase 프로젝트 설정 (Steps 1-3)
- Firebase 프로젝트 생성 + 앱 등록
- Firebase JS SDK + 의존성 설치
- Cloud Functions 2nd gen 프로젝트 초기화

### Phase 2: 인증 (Steps 4-7)
- Firebase Auth 서비스 (`src/services/firebase.ts`)
- Auth Store (`src/stores/useAppStore.ts`)
- 로그인 화면 (`app/auth/login.tsx`)
- Auth Guard (`app/_layout.tsx`)

### Phase 3: Cloud Functions (Steps 8-10)
- processRecording + processLongRecording Cloud Functions
- Firestore 스키마 + 보안 규칙
- Cloud Functions 배포

### Phase 4: 앱 서비스 레이어 교체 (Steps 11-13)
- STT/Translate 서비스 -> Cloud Function 호출로 교체
- Pipeline 수정 (상태 머신 유지, API 호출만 리다이렉트)
- 녹음 화면 사용량 게이트

### Phase 5: RevenueCat 구독 (Steps 14-17)
- RevenueCat 설정 + 상품 등록
- RevenueCat SDK 연동
- Paywall 화면
- RevenueCat <-> Firebase 사용자 연결

### Phase 6: UI 변경 (Steps 18-20)
- 홈 화면 잔여 횟수 배지
- Settings 화면 교체
- 녹음 목록 수정

### Phase 7: 정리 + 테스트 (Steps 21-22)
- 코드 정리 (직접 호출 코드 제거)
- E2E 테스트

## Key Decisions (ADR)
- **Firebase JS SDK** (not @react-native-firebase) — Expo managed workflow 유지
- **2nd gen Cloud Functions** — 32MB 페이로드, 60분 타임아웃
- **RevenueCat** — 모바일 인앱 구독 사실상 표준
- **로컬 SQLite 유지** — 학습 데이터 동기화 없음 (향후 과제)

## Risks
- Cloud Functions cold start (완화: min_instances=1)
- RevenueCat <-> Firestore 구독 상태 불일치 (완화: 이중 검증)
- Auth 토큰 만료 (완화: authenticatedFetch 자동 갱신 + 재시도)
