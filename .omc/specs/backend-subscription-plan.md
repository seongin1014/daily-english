# Daily English — Backend + 구독 모델 전환 계획

## 현재 상태
- 로컬 전용, 사용자가 Google Cloud API 키 직접 입력
- SQLite 로컬 저장소, 서버 없음

## 목표
- 사용자는 API 키 없이 바로 사용
- 백엔드가 Google Cloud API를 프록시
- 구독 모델로 수익화 (무료 체험 + 유료 플랜)

---

## 아키텍처

```
[앱] → [백엔드 API] → [Google Cloud STT/Translate]
  │         │
  │         ├── 인증 (Supabase Auth)
  │         ├── 사용량 추적/제한
  │         └── 결제 (RevenueCat)
  │
  └── 로컬 SQLite (표현, SR 데이터는 로컬 유지)
```

## 핵심 결정

### 백엔드: Supabase
- Auth (소셜 로그인: Apple, Google, Kakao)
- Edge Functions (STT/Translate 프록시)
- PostgreSQL (사용자 정보, 사용량 추적)
- 무료 티어 넉넉, 확장 용이

### 결제: RevenueCat
- iOS/Android 인앱 구독 통합
- 서버 사이드 영수증 검증
- 무료 체험 관리

### 요금 모델 (안)
| 플랜 | 가격 | 내용 |
|------|------|------|
| Free | 0원 | 월 5회 녹음, 기본 학습 기능 |
| Pro | ₩4,900/월 | 무제한 녹음, 전체 학습 기능 |
| Pro Annual | ₩39,000/년 | Pro 연간 (33% 할인) |

## 구현 단계

### Phase 1: Supabase 셋업
- Supabase 프로젝트 생성
- Auth 설정 (Apple Sign In, Google, Kakao)
- users 테이블 + usage_logs 테이블

### Phase 2: Edge Functions (API 프록시)
- /api/stt — 오디오 → Google STT → 텍스트 반환
- /api/translate — 텍스트 → Google Translate → 번역 반환
- 사용량 체크 미들웨어 (무료: 5회/월, Pro: 무제한)

### Phase 3: 앱 연동
- Settings에서 API 키 입력 제거
- 로그인/회원가입 화면 추가
- STT/Translate 서비스를 Supabase Edge Function 호출로 교체
- 구독 상태에 따른 녹음 제한 UI

### Phase 4: RevenueCat 결제
- RevenueCat SDK 연동
- 구독 상품 등록 (App Store Connect / Google Play Console)
- Paywall 화면
- 구독 상태 → Supabase user metadata 동기화
