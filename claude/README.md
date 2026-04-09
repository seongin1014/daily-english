# EchoLing — 프로젝트 문서

## 프로젝트 개요
- **앱 이름:** EchoLing (에코링)
- **태그라인:** 일상이 영어로 돌아오다 / Your daily life, echoed in English
- **패키지:** `com.monik.echoling`
- **Repo:** https://github.com/seongin1014/daily-english
- **스택:** React Native (Expo SDK 54, managed + dev builds), TypeScript

## 구조

```
claude/
├── README.md                    # 이 파일 (프로젝트 현황 + 인덱스)
├── design/
│   ├── DESIGN-SYSTEM-LIGHT.md   # 라이트 모드 디자인 시스템 (Academic Atelier)
│   └── DESIGN-SYSTEM-DARK.md    # 다크 모드 디자인 시스템 (Midnight Study)
└── plans/
    └── firebase-backend-plan.md # Firebase 백엔드 전환 계획 (COMPLETED)
```

## 디자인 레퍼런스 이미지
- **라이트:** `stitch/` 폴더
- **다크:** `stitch_daily_english_ai_tutor_dark mode/` 폴더

## 아키텍처

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
  +-- 로컬 SQLite: 학습 데이터 (표현, SR 복습, 퀴즈 결과)
```

## 구현 완료 기능

### 화면 (14개)
홈 대시보드, 녹음 목록, 학습 허브, 설정, 녹음, 녹음 상세, 플래시카드,
객관식 퀴즈, 빈칸 채우기, 로그인, Paywall, 404, 루트 레이아웃, 탭 레이아웃

### 핵심 기능
- Firebase Auth (Apple/Google Sign In) + Auth Guard + 둘러보기 모드
- 녹음 -> Cloud Functions STT -> 번역 -> 표현 추출 파이프라인 (상태 머신)
- SM-2 Spaced Repetition 플래시카드 (단위 테스트 15개 통과)
- 객관식 + 빈칸 채우기 퀴즈
- 수동 표현 추가 + 학습 통계 대시보드
- Firestore 월별 사용량 추적 (무료 5회/월)
- RevenueCat 구독 SDK 연동 (Paywall UI)
- 다크 모드 (딥 네이비 테마, useTheme() 기반 전체 화면 반응형)

## 작업 히스토리

| 날짜 | 작업 | 상태 |
|------|------|------|
| 2026-04-08 | Firebase 백엔드 + 구독 모델 전환 | COMPLETED |
| 2026-04-08 | 코드 리뷰 반영 (품질/성능/재사용성) | COMPLETED |
| 2026-04-09 | 다크 모드 구현 (레퍼런스 기반 17개 파일) | COMPLETED |
| 2026-04-09 | EAS 빌드 설정 + APK 빌드 | IN PROGRESS |
| — | Google Play 등록 | PENDING |
| — | RevenueCat 실제 상품 등록 | PENDING |
| — | 앱 아이콘 + 스플래시 스크린 디자인 | PENDING |

## 알려진 이슈 & TODO

### 높은 우선순위
- [ ] Google Sign-In 실기기 테스트 (시뮬레이터에서 OAuth 리다이렉트 제한)
- [ ] RevenueCat 실제 상품 등록 (App Store Connect / Google Play Console)

### 중간 우선순위
- [ ] 이메일 인증 (Firebase sendEmailVerification, 인증 전 녹음 기능 제한)
- [ ] 알림/리마인더 시스템 (로컬 push notification, 현재 버튼은 "준비 중" 토스트)
- [ ] 파이프라인 에러 시 "다시 시도" 버튼 UI
- [ ] 녹음 목록에서 세부 처리 단계 표시 (음성 인식 중/번역 중)
- [ ] 폰트 로딩 최적화 (11개 -> 필수만 우선 로드)
- [ ] extract.ts Phase 2: Gemini API 기반 관용적 표현 추출

### 낮은 우선순위
- [ ] Firestore 학습 데이터 동기화 (기기 간 백업)
- [ ] Kakao 로그인 (Custom Token 방식)
- [ ] FTS (Full Text Search) 인덱스
- [ ] 앱 아이콘 + 스플래시 스크린 디자인

### 나중에 추가할 UI 기능 (현재 제거됨)
- [ ] 홈 화면 검색 버튼
- [ ] 홈/학습 허브 알림 버튼
- [ ] 녹음 상세 공유/더보기/북마크 버튼
- [ ] 녹음 목록 정렬 드롭다운
- [ ] 녹음 목록 더보기 버튼
- [ ] 녹음 목록 Insight 리포트 보기 버튼
