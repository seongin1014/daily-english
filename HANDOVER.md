# EchoLing — Handover Report & Project Status

## 프로젝트 개요
- **앱 이름:** EchoLing (에코링)
- **태그라인:** 일상이 영어로 돌아오다 / Your daily life, echoed in English
- **패키지:** `com.monik.echoling`
- **Repo:** https://github.com/seongin1014/daily-english
- **스택:** React Native (Expo SDK 54, managed + dev builds), TypeScript

---

## 아키텍처

```
[앱 (Expo RN)] ─── Firebase Auth (Apple/Google) ───> [인증된 사용자]
  │
  ├── Cloud Functions 2nd gen (asia-northeast3)
  │     ├── processRecording: <60s base64 → STT → Translate → 문장 페어링
  │     ├── processLongRecording: >=60s Cloud Storage → longrunningrecognize
  │     └── translate: 캐시된 STT 결과 번역
  │
  ├── Firestore: 사용자 프로필 + 월별 사용량 카운터
  ├── Cloud Storage: 긴 녹음 임시 업로드
  ├── RevenueCat: 인앱 구독 (Pro ₩4,900/월, Annual ₩39,000/년)
  │
  └── 로컬 SQLite: 학습 데이터 (표현, SR 복습, 퀴즈 결과)
```

## Firebase 프로젝트
- **Project ID:** `echoling-5b2ef`
- **Auth:** Apple Sign In + Google Sign In 활성화
- **Firestore:** asia-northeast3 (서울)
- **Cloud Functions:** 3개 배포 완료
  - `processRecording`: https://processrecording-h34urlpcya-du.a.run.app
  - `processLongRecording`: https://asia-northeast3-echoling-5b2ef.cloudfunctions.net/processLongRecording
  - `translate`: https://translate-h34urlpcya-du.a.run.app
- **Secrets:** `GOOGLE_CLOUD_API_KEY` 설정 완료

## 디자인 시스템
- **컨셉:** Academic Atelier
- **Primary:** `#121858` (Deep Navy)
- **Secondary:** `#ac3509` (Warm Coral)
- **Fonts:** Manrope (headline) + Pretendard (한글 본문) + Inter (영문 본문)
- **Rules:** No-Line Rule, Tonal Layering, Focus Plate (4px accent bar)

---

## 구현 완료 기능

### 화면 (14개)
| 화면 | 파일 | 상태 |
|------|------|------|
| 홈 대시보드 | `app/(tabs)/index.tsx` | ✅ |
| 녹음 목록 | `app/(tabs)/recordings.tsx` | ✅ |
| 학습 허브 | `app/(tabs)/study.tsx` | ✅ |
| 설정 | `app/(tabs)/settings.tsx` | ✅ |
| 녹음 화면 | `app/record.tsx` | ✅ |
| 녹음 상세 | `app/recording/[id].tsx` | ✅ |
| 플래시카드 | `app/flashcard.tsx` | ✅ |
| 객관식 퀴즈 | `app/quiz/multiple-choice.tsx` | ✅ |
| 빈칸 채우기 | `app/quiz/fill-blank.tsx` | ✅ |
| 로그인 | `app/auth/login.tsx` | ✅ |
| Paywall | `app/auth/paywall.tsx` | ✅ |
| 404 | `app/+not-found.tsx` | ✅ |
| 루트 레이아웃 | `app/_layout.tsx` | ✅ |
| 탭 레이아웃 | `app/(tabs)/_layout.tsx` | ✅ |

### 핵심 기능
- [x] Firebase Auth (Apple/Google Sign In) + Auth Guard
- [x] 둘러보기 모드 (로그인 없이 앱 탐색)
- [x] 녹음 → Cloud Functions STT → 번역 → 표현 추출 파이프라인
- [x] 파이프라인 상태 머신 (크래시 복원 가능)
- [x] SM-2 Spaced Repetition 플래시카드 (단위 테스트 15개 통과)
- [x] 객관식 + 빈칸 채우기 퀴즈
- [x] 수동 표현 추가 (문장 탭 → 저장 모달)
- [x] 학습 통계 대시보드 (오늘 복습, 주간 활동, 어려운 표현 Top 5)
- [x] Firestore 월별 사용량 추적 (무료 5회/월)
- [x] RevenueCat 구독 SDK 연동 (Paywall UI)
- [x] Firestore + Storage 보안 규칙
- [x] Cloud Functions에서 RevenueCat API 폴백 (webhook 지연 보상)

### 요금 모델
| 플랜 | 가격 | 녹음 제한 | 학습 기능 |
|------|------|----------|----------|
| Free | 0원 | 월 5회 | 무제한 |
| Pro | ₩4,900/월 | 무제한 | 무제한 |
| Pro Annual | ₩39,000/년 | 무제한 | 무제한 |

---

## Gemini 작업 내역 (Handover from Gemini)

### A. 비밀번호 재설정 기능
- `src/hooks/useAuth.ts`: Firebase `sendPasswordResetEmail` 함수 구현
- `app/(auth)/forgot-password.tsx`: 이메일 입력 + 재설정 링크 발송 화면
- `app/(auth)/login.tsx`: "비밀번호를 잊으셨나요?" 링크 추가
- `src/constants/i18n.ts`: 관련 문구 (영문/국문)

### B. OTA 업데이트 인프라
- `expo-updates` 설치
- `app.json`: updates URL + runtimeVersion 정책 (appVersion)
- `eas.json`: production/preview/development 각 프로필에 channel 설정
- **이 버전부터 `eas update`로 JS 코드 실시간 업데이트 가능**

### C. 빌드 결과
- **Android AAB:** [다운로드](https://expo.dev/artifacts/eas/3onwZoKBtam8Ro6FGMcspn.aab)
- Google Play 비공개 테스트 중

### D. 다음 확인 사항
1. Firebase Console → Authentication → Email/Password 로그인 활성화 확인
2. Google Play Console → 앱 서명 키 SHA-1 → Firebase 프로젝트 설정에 등록
3. `forgot-password.tsx` 다국어 대응 및 에러 핸들링 검토
4. Firebase 이메일 템플릿 커스터마이징 (선택)

---

## 프로젝트 구조

```
daily-english/
├── app/                    # 14개 화면 (Expo Router)
│   ├── auth/               # 로그인, Paywall
│   ├── (tabs)/             # Home, Recordings, Study, Settings
│   ├── recording/          # [id] 상세
│   ├── quiz/               # 객관식, 빈칸
│   ├── record.tsx          # 녹음
│   └── flashcard.tsx       # SR 플래시카드
├── src/
│   ├── components/ui/      # FocusPlate, Card, Button, Badge, ProgressBar
│   ├── db/                 # SQLite 스키마, CRUD, React hooks
│   ├── services/           # Firebase, API, STT, Pipeline, RevenueCat
│   ├── stores/             # Zustand (session UI state only)
│   ├── lib/                # SM-2 알고리즘
│   ├── theme/              # 디자인 토큰 (colors, typography, spacing)
│   └── types/              # TypeScript 타입
├── functions/              # Cloud Functions 2nd gen (TypeScript)
│   └── src/                # processRecording, processLongRecording, translate
├── __tests__/              # SM-2 단위 테스트
├── firebase.json           # Firebase 설정
├── firestore.rules         # Firestore 보안 규칙
├── storage.rules           # Cloud Storage 보안 규칙
└── metro.config.js         # Firebase JS SDK ESM 호환
```

## DB 스키마 (SQLite)
- `recordings` — 녹음 메타, 트랜스크립트, 번역, 상태 머신
- `expressions` — 한/영 표현, 맥락, 난이도, auto/manual 구분
- `reviews` — SM-2 복습 기록 (ease_factor, interval, next_review)
- `quiz_results` — 퀴즈 결과
- `settings` — 키-값 설정
- **인덱스:** next_review, recording_id, status, created_at

## 테스트
- SM-2 알고리즘: 15개 단위 테스트 (Jest + ts-jest)
- `npx jest` 실행

---

## 알려진 이슈 & TODO

### 높은 우선순위
- [ ] Google Sign-In 실기기 테스트 (시뮬레이터에서 OAuth 리다이렉트 제한)
- [ ] RevenueCat 실제 상품 등록 (App Store Connect / Google Play Console)
- [ ] 다크 모드: `useTheme()` 훅 기반으로 전체 화면 리팩토링 필요

### 중간 우선순위
- [ ] 파이프라인 에러 시 "다시 시도" 버튼 UI
- [ ] 녹음 목록에서 세부 처리 단계 표시 (음성 인식 중/번역 중)
- [ ] 폰트 로딩 최적화 (11개 → 필수만 우선 로드)
- [ ] extract.ts Phase 2: Gemini API 기반 관용적 표현 추출

### 낮은 우선순위
- [ ] Firestore 학습 데이터 동기화 (기기 간 백업)
- [ ] Kakao 로그인 (Custom Token 방식)
- [ ] FTS (Full Text Search) 인덱스
- [ ] 앱 아이콘 + 스플래시 스크린 디자인

---

## Git 커밋 히스토리
1. `feat: Daily English MVP 전체 구현` — 39파일, 9화면, SQLite, SM-2
2. `feat: Firebase 백엔드 + 구독 모델 전환` — Auth, Cloud Functions, Firestore, RevenueCat
3. `feat: Cloud Functions 서버 코드 추가` — STT/Translate 프록시 3개
4. `refactor: EchoLing 리브랜딩 + 프라이머리 컬러 변경` — #121858, Pretendard
5. `fix: 앱 기능 전체 점검 + Firebase 배포 완료` — 버그 수정, 한글화
6. `test: SM-2 단위 테스트 추가` — 15개 테스트 통과
7. `feat: 수동 표현 추가 + 학습 통계 대시보드 강화` — 탭 저장, Top 5
8. `fix: 하드코딩 제거 + 플래시카드 빈 상태 분기 + 둘러보기 모드`
