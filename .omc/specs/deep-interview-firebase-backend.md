# Deep Interview Spec: Firebase Backend + 구독 모델

## Metadata
- Interview ID: di-20260408-firebase-backend
- Rounds: 6
- Final Ambiguity Score: 16%
- Type: brownfield
- Generated: 2026-04-08
- Threshold: 20%
- Status: PASSED

## Clarity Breakdown
| Dimension | Score | Weight | Weighted |
|-----------|-------|--------|----------|
| Goal Clarity | 0.92 | 0.35 | 0.322 |
| Constraint Clarity | 0.80 | 0.25 | 0.20 |
| Success Criteria | 0.75 | 0.25 | 0.1875 |
| Context Clarity | 0.85 | 0.15 | 0.1275 |
| **Total Clarity** | | | **0.837** |
| **Ambiguity** | | | **16%** |

## Goal
기존 Daily English 앱의 로컬 API 키 방식을 Firebase 백엔드로 전환하여, 사용자가 API 키 없이 로그인만으로 앱을 사용할 수 있게 한다. Cloud Functions가 Google Cloud STT/Translate를 프록시하고, Firestore가 사용량을 추적하며, RevenueCat로 구독 결제를 관리한다.

## Architecture
```
[앱] ─── Firebase Auth (Apple/Google) ───> [인증된 사용자]
  │
  ├── Cloud Function: /processRecording
  │     ├── Firestore 사용량 체크 (무료 5회/월)
  │     ├── Google Cloud STT (서버 사이드 API 키)
  │     ├── Google Cloud Translate (서버 사이드)
  │     ├── 표현 추출 로직
  │     └── 결과 반환 → 앱 로컬 SQLite에 저장
  │
  ├── RevenueCat SDK ─── 구독 상태 확인
  │
  └── 로컬 SQLite (학습 데이터 유지, 동기화 없음)
```

## Constraints
- **인증**: Firebase Auth — Apple Sign In + Google Sign In (MVP). Kakao는 후속 버전.
- **백엔드**: Firebase Cloud Functions (Node.js/TypeScript)
- **DB**: Firestore — 사용자 프로필 + 월별 사용량 카운터만. 학습 데이터는 로컬 SQLite 유지.
- **결제**: RevenueCat — iOS/Android 인앱 구독 통합
- **데이터 동기화**: 없음. 학습 데이터(표현, SR 기록, 퀴즈)는 로컬 전용.
- **녹음 파일**: 처리 완료 후 로컬에서 자동 삭제 가능 (저장 공간 절약)
- **API 키**: 서버 사이드에서만 관리. 앱에 노출하지 않음.
- **Cloud Functions 리전**: asia-northeast3 (서울) 권장
- **기존 코드**: 최소 변경. STT/Translate 서비스 레이어만 교체, UI/학습 로직은 유지.

## Non-Goals
- Firestore 기반 학습 데이터 동기화 (후속 버전)
- Kakao 로그인 (후속 버전)
- 서버 사이드 표현 추출 AI 업그레이드 (후속 버전)
- 관리자 대시보드
- 웹 버전

## 요금 모델
| 플랜 | 가격 | 녹음 제한 | 학습 기능 |
|------|------|----------|----------|
| Free | 0원 | 월 5회 | 무제한 |
| Pro | ₩4,900/월 | 무제한 | 무제한 |
| Pro Annual | ₩39,000/년 | 무제한 | 무제한 |

## Paywall 전략
- 무료 5회까지 정상 처리. 6회차 녹음 시도 시 Paywall 표시.
- 학습 기능(플래시카드, 퀴즈)은 무료에서도 무제한 사용 가능.
- 홈 화면에 "이번 달 N회 남음" 잔여 횟수 표시.
- 사용자가 가치를 충분히 경험한 후 전환 유도.

## Acceptance Criteria
- [ ] AC1: Apple Sign In으로 로그인 → Firebase Auth 사용자 생성 확인
- [ ] AC2: Google Sign In으로 로그인 → Firebase Auth 사용자 생성 확인
- [ ] AC3: 로그인 후 녹음 → Cloud Function 경유 STT → 한국어 텍스트 반환
- [ ] AC4: Cloud Function 경유 Translate → 영어 번역 반환
- [ ] AC5: 전체 파이프라인: 로그인 → 녹음 → STT → 번역 → 표현 추출 → 플래시카드 학습 (API 키 입력 없이)
- [ ] AC6: Firestore에 월별 사용량 기록, 무료 사용자 5회 초과 시 녹음 차단 + Paywall 표시
- [ ] AC7: RevenueCat 구독 결제 → Pro 플랜 활성화 → 무제한 녹음 가능
- [ ] AC8: 구독 해지 후 → 다음 결제 주기에 무료 플랜으로 복귀, 기존 학습 데이터 유지
- [ ] AC9: 로그아웃 → 재로그인 시 Firestore 사용량/구독 상태 복원 (학습 데이터는 로컬이므로 기기 종속)
- [ ] AC10: Settings 화면에서 API 키 입력 제거, 로그인/로그아웃/구독 관리 UI로 교체
- [ ] AC11: 홈 화면에 "이번 달 N회 남음" 또는 "Pro" 배지 표시

## Technical Context (Brownfield)
### 변경 대상 파일
| 파일 | 변경 내용 |
|------|----------|
| `src/services/stt.ts` | Google Cloud 직접 호출 → Cloud Function 호출로 교체 |
| `src/services/translate.ts` | Google Cloud 직접 호출 → Cloud Function 호출로 교체 |
| `src/services/pipeline.ts` | Cloud Function 단일 호출로 단순화 가능 |
| `app/_layout.tsx` | SecureStore API 키 체크 → Firebase Auth 상태 체크 |
| `app/(tabs)/settings.tsx` | API 키 입력 → 로그인/구독 관리 UI |
| `app/(tabs)/index.tsx` | 잔여 횟수 표시 추가 |
| `app/record.tsx` | 녹음 전 사용량 체크 + Paywall 게이트 |
| `src/stores/useAppStore.ts` | apiKeyConfigured → user, subscription 상태 |

### 신규 파일
| 파일 | 내용 |
|------|------|
| `functions/` | Firebase Cloud Functions 프로젝트 (STT/Translate 프록시) |
| `src/services/firebase.ts` | Firebase 초기화 + Auth 헬퍼 |
| `src/services/subscription.ts` | RevenueCat SDK 래퍼 |
| `app/auth/login.tsx` | 로그인 화면 (Apple/Google) |
| `app/auth/paywall.tsx` | 구독 Paywall 화면 |

### 유지 파일 (변경 없음)
- `src/db/` 전체 (SQLite 스키마, CRUD, hooks)
- `src/lib/sm2.ts` (SR 알고리즘)
- `src/services/extract.ts` (표현 추출 — 로컬 유지 또는 Functions으로 이동)
- `src/components/` 전체 (UI 컴포넌트)
- 학습 관련 화면: flashcard.tsx, quiz/*.tsx, study.tsx

## Interview Transcript
<details>
<summary>Full Q&A (6 rounds)</summary>

### Round 1
**Q:** 현재 앱의 데이터(녹음, 표현, SR 복습 기록)는 로컬 SQLite에 있는데요. Firebase 전환 후 데이터를 어떻게 관리할까요?
**A:** 녹음 파일은 처리 후 삭제 가능. 학습 데이터가 핵심.
**Ambiguity:** 62%

### Round 2
**Q:** 학습 데이터를 기기 간 동기화할 필요가 있나요?
**A:** 로컬만 충분.
**Ambiguity:** 51%

### Round 3
**Q:** 로그인 방식 — MVP에서 Kakao까지 필요한가요?
**A:** Apple + Google만 (MVP).
**Ambiguity:** 42%

### Round 4
**Q:** 사용량 제한을 어디서 체크할까요?
**A:** Firestore에 월별 카운터.
**Ambiguity:** 33%

### Round 5
**Q:** 성공 기준이 뭘까요?
**A:** 로그인 → 녹음 → 학습 전체 플로우.
**Ambiguity:** 23%

### Round 6
**Q:** Paywall을 어느 시점에 보여줄까요?
**A:** 5회 다 쓴 후 6회차 녹음 시도 시. 학습 기능은 무제한.
**Ambiguity:** 16%

</details>
