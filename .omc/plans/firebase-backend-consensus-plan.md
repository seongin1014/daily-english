# Daily English — Firebase Backend + 구독 모델 구현 계획 (Consensus v3 — APPROVED)

## Requirements Summary

**Goal:** 로컬 API 키 방식 → Firebase 백엔드 전환. 사용자가 API 키 없이 로그인만으로 사용.
**Source:** Deep Interview Spec (`.omc/specs/deep-interview-firebase-backend.md`)
**Project:** `/Users/seongin/Desktop/daily-english` (Expo RN, 39개 파일)
**Scope:** Firebase Auth + Cloud Functions(프록시) + Firestore(사용량) + RevenueCat(구독)

---

## RALPLAN-DR Summary

### Principles
1. **최소 변경 (Surgical Modification)** — 기존 학습 로직/UI는 건드리지 않음. 서비스 레이어와 인증 부분만 교체.
2. **서버 사이드 보안** — API 키는 Cloud Functions에서만 사용. 앱에 절대 노출하지 않음.
3. **결제 안전성** — RevenueCat 서버 사이드 검증으로 구독 상태 위변조 방지.
4. **점진적 전환** — 기존 로컬 파이프라인 구조를 유지하되, API 호출만 Cloud Functions로 리다이렉트.
5. **사용자 가치 우선** — 학습 기능은 무제한 무료, 녹음/변환만 제한하여 가치 체험 후 전환 유도.

### Decision Drivers
1. **보안** — Google Cloud API 키 클라이언트 노출 제거
2. **수익화** — 무료 체험(5회/월) → Pro 구독 전환 경로
3. **개발 속도** — 기존 코드 최소 변경으로 빠른 출시

### Viable Options

**Option A: Firebase (JS SDK) + Cloud Functions 2nd gen + Firestore + RevenueCat (Recommended)**
- Pros: Google Cloud와 같은 생태계, 2nd gen Functions로 32MB 페이로드/60분 타임아웃, JS SDK로 Expo managed 유지 (prebuild 불필요), RevenueCat이 iOS/Android 구독 통합
- Cons: JS SDK는 네이티브 Firestore 오프라인 캐시 없음 (이 앱에선 불필요), Cloud Functions cold start (~1-2초, min_instances=1로 완화)

**Option B: Custom Node.js 백엔드 (Vercel/Railway) + Stripe**
- Pros: 프레임워크 자유도, Stripe 웹 결제도 가능
- Cons: 인프라 관리 필요, 모바일 인앱 결제에 Stripe 부적합 (Apple 30% 수수료 정책 위반 가능), Auth 직접 구현
- **Invalidation:** 모바일 앱에서 인앱 구독은 App Store/Play Store 결제 시스템을 거쳐야 함. Stripe은 디지털 콘텐츠 인앱 결제에 사용 불가. RevenueCat이 유일하게 실용적인 선택.

---

## Acceptance Criteria
- [ ] AC1: Apple Sign In → Firebase Auth 사용자 생성 → 앱 홈 화면 진입
- [ ] AC2: Google Sign In → Firebase Auth 사용자 생성 → 앱 홈 화면 진입
- [ ] AC3: 비로그인 상태에서 앱 접근 시 로그인 화면으로 리다이렉트
- [ ] AC4: 녹음 → Cloud Function 호출 → STT 결과 반환 (API 키 앱에 없음)
- [ ] AC5: Cloud Function 경유 번역 → 영어 번역 반환
- [ ] AC6: 전체 플로우: 로그인 → 녹음 → STT → 번역 → 표현 추출 → 로컬 저장 → 플래시카드 학습
- [ ] AC7: Firestore에 월별 사용량 기록 (users/{uid}/usage/2026-04)
- [ ] AC8: 무료 사용자 6회차 녹음 시도 → Paywall 표시, 녹음 차단
- [ ] AC9: RevenueCat Pro 구독 결제 → 즉시 무제한 녹음 가능
- [ ] AC10: 구독 해지 → 다음 주기에 무료 복귀, 기존 학습 데이터 유지
- [ ] AC11: 홈 화면에 "이번 달 N회 남음" 또는 "Pro" 배지 표시
- [ ] AC12: Settings에서 API 키 입력 제거 → 계정 정보/구독 관리/로그아웃 UI
- [ ] AC13: 로그아웃 → 재로그인 시 Firestore 사용량/구독 상태 복원

---

## Implementation Steps

### Phase 1: Firebase 프로젝트 설정

**Step 1: Firebase 프로젝트 생성 + 앱 등록**
- Firebase Console에서 프로젝트 생성
- iOS 앱 등록 (bundleId: `com.seongin.daily-english`)
- `GoogleService-Info.plist` 다운로드 → `ios/` 디렉토리
- `.gitignore`에 Firebase config 파일 추가

**Step 2: Firebase JS SDK + 의존성 설치**
```bash
npm install firebase                    # JS SDK (no prebuild needed)
npm install @react-native-async-storage/async-storage  # Auth persistence
npx expo install expo-apple-authentication expo-auth-session expo-crypto
npm install react-native-purchases      # RevenueCat (native module)
npx expo install expo-file-system       # Cloud Storage 업로드용
```
- **JS Firebase SDK 사용** — `@react-native-firebase` 대신. Expo managed workflow 유지, New Architecture 호환 문제 없음, prebuild 불필요.
- `firebase/auth`에 AsyncStorage persistence 설정으로 토큰 자동 유지
- `react-native-purchases`는 native module → `app.json` plugins에 추가 후 `npx expo prebuild --clean` 필요 (Expo CNG 호환)
- `expo-apple-authentication` → `app.json`에 `"usesAppleSignIn": true` iOS entitlement 설정
- `expo-auth-session` → Google Sign-In용 web client ID를 `app.json`에 설정
- `GoogleService-Info.plist` → 프로젝트 루트에 배치, `app.json`의 `ios.googleServicesFile`로 참조 (CNG가 prebuild 시 복사)

**Step 3: Cloud Functions 2nd gen 프로젝트 초기화**
```
daily-english/
└── functions/
    ├── package.json
    ├── tsconfig.json
    └── src/
        ├── index.ts              # Function exports
        ├── processRecording.ts   # STT + Translate 프록시 (<60s, base64)
        ├── processLongRecording.ts # >60s: Cloud Storage URI → longrunningrecognize
        ├── onSubscriptionChange.ts # RevenueCat webhook handler
        └── middleware/
            └── auth.ts           # Firebase Auth 토큰 검증
```
- `firebase init functions` (TypeScript)
- **2nd gen Cloud Functions** — 32MB 페이로드, 최대 60분 타임아웃, concurrency 지원
- Region: `asia-northeast3` (서울)
- Google Cloud STT/Translate API 키: Firebase Functions 환경변수
- Cloud Storage 버킷: 오디오 파일 임시 업로드용 (>60s 녹음)

### Phase 2: 인증 (Auth)

**Step 4: Firebase Auth 서비스** → `src/services/firebase.ts` (신규)
```typescript
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInWithCredential, OAuthProvider, GoogleAuthProvider, signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getReactNativePersistence, initializeAuth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase 앱 초기화 (JS SDK)
// initializeAuth with AsyncStorage persistence (토큰 자동 유지)
// signInWithApple(): expo-apple-authentication → OAuthProvider credential
// signInWithGoogle(): expo-auth-session → GoogleAuthProvider credential  
// signOut(), onAuthStateChanged 리스너
// getIdToken() 헬퍼 (자동 갱신 포함)
```

**Step 5: Auth Store** → `src/stores/useAppStore.ts` (수정)
- `apiKeyConfigured` 제거
- `user: FirebaseUser | null`, `isAuthenticated: boolean` 추가
- `subscription: 'free' | 'pro'`, `monthlyUsage: number`, `monthlyLimit: number` 추가
- `setUser()`, `setSubscription()`, `setMonthlyUsage()` 추가

**Step 6: 로그인 화면** → `app/auth/login.tsx` (신규)
- Apple Sign In 버튼 (iOS 필수)
- Google Sign In 버튼
- 앱 로고 + "우리의 일상을 영어로" 태그라인
- Academic Atelier 디자인 적용

**Step 7: Auth Guard** → `app/_layout.tsx` (수정)
- `onAuthStateChanged` 리스너 설정
- 비로그인: `app/auth/login.tsx`로 리다이렉트
- 로그인됨: `(tabs)` 탭으로 진입
- SecureStore API 키 체크 로직 제거

### Phase 3: Cloud Functions (API 프록시)

**Step 8: processRecording Cloud Function** → `functions/src/processRecording.ts` (2nd gen)

**8a. 짧은 녹음 (<60s): base64 방식**
```typescript
// 1. Firebase Auth 토큰 검증
// 2. Firestore 사용량 조회 + RevenueCat API 폴백 체크
//    - Firestore subscription == 'free' → RevenueCat GET /subscribers/{uid} 확인
//    - RevenueCat에서 'pro'이면 Firestore 업데이트 후 허용 (webhook 지연 보상)
// 3. 무료 + 5회 초과 → 403 반환
// 4. 오디오 base64 수신 → Google Cloud STT (recognize) 호출
// 5. 한국어 텍스트 → Google Cloud Translate 호출
// 6. 문장 분리 + 개별 번역 (표현 페어링용)
// 7. Firestore 사용량 카운터 증가
// 8. 결과 반환: { koreanTranscript, englishTranslation, sentences: [{korean, english}] }
```

**8b. 긴 녹음 (>60s): Cloud Storage 방식** → `functions/src/processLongRecording.ts`
```typescript
// 1. Auth 검증 + 사용량 체크 (위와 동일)
// 2. 앱이 Cloud Storage에 업로드한 오디오의 gs:// URI 수신
// 3. Google Cloud STT longrunningrecognize 호출 (gs:// URI 사용, base64 불필요)
// 4. 폴링으로 완료 대기 (2nd gen이라 타임아웃 충분)
// 5. 번역 + 문장 분리
// 6. Cloud Storage에서 오디오 파일 삭제 (처리 완료 후)
// 7. 결과 반환
```

- **2nd gen Functions:** 32MB 페이로드, 최대 60분 타임아웃
- **사용량 이중 검증:** Firestore 'free' → RevenueCat REST API 폴백 (webhook 지연 보상)
- 환경변수: `GOOGLE_CLOUD_API_KEY`, `REVENUECAT_API_KEY`

**Step 9: Firestore 스키마**
```
users/
  {uid}/
    - email: string
    - displayName: string
    - createdAt: timestamp
    - subscription: 'free' | 'pro'
    usage/
      {YYYY-MM}/
        - recordingCount: number
        - lastRecordingAt: timestamp
```

**Step 9b: Firestore + Cloud Storage 보안 규칙**
```
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
      match /usage/{month} {
        allow read: if request.auth != null && request.auth.uid == uid;
        // 쓰기는 Cloud Functions만 (admin SDK)
        allow write: if false;
      }
    }
  }
}

// storage.rules  
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /audio/{uid}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == uid
                         && request.resource.size < 10 * 1024 * 1024; // 10MB 제한
    }
  }
}
```

**Step 10: Cloud Functions 배포**
- `firebase deploy --only functions`
- asia-northeast3 리전 배포 확인
- Functions URL 확인 → 앱에서 사용

### Phase 4: 앱 서비스 레이어 교체

**Step 11: STT/Translate 서비스 교체** → `src/services/stt.ts`, `src/services/translate.ts` (수정)
- Google Cloud 직접 호출 → Cloud Function 호출로 교체
- `src/services/api.ts` (신규): Firebase Auth 토큰 포함 fetch 래퍼 (자동 갱신 + 재시도)
```typescript
async function authenticatedFetch(url: string, body: object, retries = 2) {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  
  for (let i = 0; i <= retries; i++) {
    const token = await user.getIdToken(i > 0); // 재시도 시 forceRefresh
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.status === 401 && i < retries) continue; // 토큰 만료 → 갱신 후 재시도
    return res;
  }
}
```
- **토큰 만료 대응:** 401 시 forceRefresh=true로 토큰 갱신 후 최대 2회 재시도. 3회 실패 시 재로그인 유도.

**Step 12: Pipeline 수정** → `src/services/pipeline.ts` (수정)
- 기존 상태 머신 유지: `recorded → stt_processing → stt_done → translating → translated → extracting → ready`
- **변경점: API 호출만 Cloud Function으로 리다이렉트**
  - `recorded → stt_processing`: 앱에서 Cloud Function 호출 (짧은 녹음: base64, 긴 녹음: Cloud Storage 업로드 후 gs:// URI)
  - Cloud Function 응답을 로컬 SQLite에 캐시 (korean_transcript, english_translation)
  - `translated → extracting`: 로컬 extract.ts로 표현 생성 (기존 로직 유지)
- **기존 `transcribeLong()` (stt.ts:53-98) base64 inline 방식을 Cloud Storage + gs:// URI 방식으로 교체** (Google STT longrunningrecognize inline 10MB 제한 해결)
- **복원성 유지:** Cloud Function 성공 응답을 SQLite에 즉시 저장. 로컬 추출 실패 시 서버 재호출 없이 캐시된 데이터로 재시도.
- **업로드 진행률:** 긴 녹음은 Cloud Storage 업로드 시 진행률 표시 (expo-file-system uploadAsync)
- 사용량 초과 에러(403) 처리 → Paywall 표시

**Step 13: 녹음 화면 사용량 게이트** → `app/record.tsx` (수정)
- 녹음 시작 전: Firestore에서 현재 월 사용량 조회
- 무료 + 5회 도달: Paywall 화면으로 네비게이션
- Pro 또는 잔여 횟수 있음: 정상 녹음 진행
- API 키 사전 검증 로직 제거

### Phase 5: RevenueCat 구독

**Step 14: RevenueCat 설정**
- RevenueCat 대시보드: 프로젝트 생성, 앱 등록
- App Store Connect: 구독 상품 등록 (Pro Monthly ₩4,900, Pro Annual ₩39,000)
- RevenueCat에 App Store Connect 연결
- Entitlement: "pro" → 상품 매핑

**Step 15: RevenueCat SDK 연동** → `src/services/subscription.ts` (신규)
```typescript
// Purchases.configure({ apiKey: REVENUECAT_API_KEY })
// checkSubscription(): Promise<'free' | 'pro'>
// purchasePackage(pkg): Promise<void>
// restorePurchases(): Promise<void>
// onSubscriptionChange 리스너
```

**Step 16: Paywall 화면** → `app/auth/paywall.tsx` (신규)
- "월 5회 녹음을 모두 사용했어요" 메시지
- Pro 플랜 혜택 설명 (무제한 녹음, 우선 처리 등)
- 가격 표시: ₩4,900/월, ₩39,000/년 (33% 할인)
- "Pro 시작하기" 구매 버튼
- "구매 복원" 링크
- Academic Atelier 디자인

**Step 17: RevenueCat ↔ Firebase 사용자 연결 + Firestore 동기화**
- **앱 시작 시:** `Purchases.logIn(firebaseUser.uid)` 호출 → RevenueCat app_user_id를 Firebase UID로 매핑
- RevenueCat Webhook → Cloud Function(`onSubscriptionChange`) → Firestore `users/{uid}/subscription` 업데이트
- **이중 검증:** 앱에서 RevenueCat SDK가 primary (즉시 반영), Firestore는 서버 사이드 검증용 보조
- **Cloud Function 폴백:** Firestore에서 'free'인데 RevenueCat API에서 'pro'이면 → Firestore 업데이트 후 허용 (webhook 지연 보상)

### Phase 6: UI 변경

**Step 18: 홈 화면 수정** → `app/(tabs)/index.tsx` (수정)
- 잔여 횟수 배지 추가: "이번 달 N회 남음" 또는 "Pro" 배지
- FAB 탭 시: 사용량 체크 → 초과 시 Paywall 리다이렉트

**Step 19: Settings 화면 교체** → `app/(tabs)/settings.tsx` (수정)
- API 키 입력 섹션 제거
- 계정 정보: 이름, 이메일, 프로필 (Firebase Auth에서)
- 구독 관리: 현재 플랜, "Pro로 업그레이드" 또는 "구독 관리"
- 로그아웃 버튼
- 기존 학습 설정 (알림, 다크모드, 일일 목표)은 유지

**Step 20: 녹음 목록 수정** → `app/(tabs)/recordings.tsx` (수정)
- 헤더에 잔여 횟수 표시 (선택적)

### Phase 7: 정리 + 테스트

**Step 21: 코드 정리**
- `src/services/stt.ts`: 기존 Google Cloud 직접 호출 코드 제거
- `src/services/translate.ts`: 기존 Google Cloud 직접 호출 코드 제거
- Settings에서 expo-secure-store API 키 관련 코드 제거
- `.gitignore`에 `GoogleService-Info.plist`, `google-services.json` 추가

**Step 22: E2E 테스트**
- 신규 사용자: 회원가입 → 녹음 5회 → 6회차 Paywall → 구독 → 무제한
- 기존 사용자: 로그인 → 사용량 복원 → 녹음
- 로그아웃 → 재로그인: 구독 상태/사용량 유지 확인
- 오프라인: 학습 기능 정상 동작 확인

---

## Pre-mortem (3 Failure Scenarios)

### Scenario 1: Cloud Function Cold Start로 사용자 이탈
- **원인:** asia-northeast3 리전에서도 첫 호출 시 1-3초 cold start
- **영향:** 녹음 후 처리 대기 시간이 길어져 사용자가 앱을 이탈
- **완화:** Cloud Function에 min_instances=1 설정 (비용 ~$5/월), 앱에서 "처리 중" 스켈레톤 UI로 체감 대기 시간 감소

### Scenario 2: RevenueCat ↔ Firestore 구독 상태 불일치
- **원인:** Webhook 지연 또는 실패로 Firestore의 subscription 필드가 업데이트되지 않음
- **영향:** Pro 결제했는데 여전히 5회 제한 적용 → 사용자 불만
- **완화:** 앱에서 RevenueCat SDK로 직접 구독 상태 확인 (Firestore는 보조). Cloud Function에서도 RevenueCat API로 이중 검증.

### Scenario 3: Firebase Auth 토큰 만료로 API 호출 실패
- **원인:** ID Token 1시간 만료, refresh 실패 시 401
- **영향:** 녹음 처리 실패 → 사용자 혼란
- **완화:** `authenticatedFetch`에서 401 시 자동 토큰 갱신 + 재시도. 3회 실패 시 재로그인 유도.

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Cloud Functions cold start | 처리 지연 1-3초 | min_instances=1, 스켈레톤 UI |
| 구독 상태 불일치 | Pro 결제 후 제한 유지 | RevenueCat SDK 직접 확인 + Firestore 보조 |
| Auth 토큰 만료 | API 호출 실패 | 자동 갱신 + 재시도 로직 |
| Apple Sign In 설정 복잡 | 빌드 실패 | Expo plugin으로 자동 설정 |
| 오디오 페이로드 크기 | Function 타임아웃 | <60s: base64 (~1.3MB) 직접 전송. >60s: Cloud Storage 업로드 + gs:// URI. 2nd gen 60분 타임아웃. |
| Auth 토큰 만료 | API 호출 실패 | authenticatedFetch에서 401 시 forceRefresh + 최대 2회 재시도 |
| RevenueCat↔Firestore 불일치 | Pro 결제 후 제한 유지 | Cloud Function에서 RevenueCat REST API 폴백 체크 |
| Firestore 비용 | 예상 초과 | 사용량 문서만 읽기/쓰기, 월 수천 건 기준 무료 티어 내 |

---

## Verification Steps

1. **Auth 검증:** Apple/Google 로그인 → Firebase Console에서 사용자 확인
2. **Function 검증:** 테스트 오디오 → Cloud Function 직접 호출 → STT/번역 결과 확인
3. **사용량 검증:** 5회 녹음 → Firestore 카운터 5 확인 → 6회차 403 반환 확인
4. **구독 검증:** RevenueCat Sandbox 결제 → Firestore subscription='pro' → 무제한 확인
5. **전체 플로우:** 로그인 → 녹음 → 처리 → 학습 (API 키 없이 완전한 동작)
6. **오프라인:** 비행기 모드 → 플래시카드/퀴즈 정상 동작 확인
7. **보안:** 앱 코드에서 Google Cloud API 키 검색 → 0건 확인

---

## ADR (Architecture Decision Record)

### Decision
Firebase (Auth + Cloud Functions + Firestore) + RevenueCat 기반 백엔드 전환

### Drivers
- Google Cloud STT/Translate와 같은 생태계 (Firebase = Google Cloud)
- 모바일 인앱 구독은 App Store/Play Store 결제 필수 → RevenueCat
- 기존 코드 최소 변경 (서비스 레이어 교체만)

### Alternatives Considered
1. **Supabase + Stripe:** Edge Functions는 Deno 기반으로 Google Cloud SDK 호환 복잡. Stripe은 모바일 인앱 결제에 부적합.
2. **Custom 백엔드 (Vercel):** 인프라 관리 부담. Auth 직접 구현 필요. Firebase 대비 이점 없음.
3. **서버 없이 RevenueCat만:** API 키 보안 문제 해결 안됨. 사용량 추적 불가.

### Why Chosen
Firebase는 Google Cloud 프로젝트와 통합되어 STT/Translate API를 서버 사이드에서 직접 호출 가능. Cloud Functions가 프록시+사용량 체크를 한 곳에서 처리. Firestore가 사용량/구독 상태를 실시간 동기화. RevenueCat은 iOS/Android 인앱 구독의 사실상 표준.

### Consequences
- (+) API 키 클라이언트 노출 완전 제거
- (+) 사용량 기반 과금으로 수익화 가능
- (+) Firebase 무료 티어로 초기 비용 최소
- (-) Firebase 종속성 (향후 마이그레이션 비용)
- (-) Cloud Functions cold start 지연
- (-) RevenueCat 수수료 (매출의 1-2% + App Store 15-30%)

### Follow-ups
- Kakao 로그인 추가 (Custom Token 방식)
- Cloud Functions에서 AI 기반 표현 추출 (Gemini API)
- Firestore 학습 데이터 동기화 (기기 간)
- 관리자 대시보드 (사용량 모니터링)

---

## Changelog
- v1: Initial consensus draft by Planner
- v2: Architect review 반영 (5개 이슈):
  1. JS Firebase SDK로 변경 (prebuild/New Arch 리스크 제거, Expo managed 유지)
  2. 2nd gen Cloud Functions 명시 (32MB 페이로드, 60분 타임아웃)
  3. >60s 녹음용 Cloud Storage + longrunningrecognize 경로 추가
  4. 파이프라인 복원성 유지 (서버 응답 SQLite 캐시, 로컬 추출만 재시도)
  5. RevenueCat logIn(firebaseUid) + Cloud Function RevenueCat API 폴백
  6. authenticatedFetch 토큰 자동 갱신 + 재시도 로직 명시
- v3: Critic review 반영:
  1. react-native-purchases prebuild 필요 명시 + app.json plugin 설정
  2. expo-apple-authentication, expo-auth-session plugin 설정 명시
  3. GoogleService-Info.plist 배치 경로 수정 (프로젝트 루트 + ios.googleServicesFile)
  4. 기존 transcribeLong() base64 방식 → Cloud Storage 교체 명시
  5. Firestore + Cloud Storage 보안 규칙 추가 (Step 9b)
  6. expo-file-system 명시적 설치
