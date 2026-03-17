# 잔여 작업 항목

> 코드 수정만으로는 처리 불가 — 외부 인프라/패키지 필요

---

## 🔴 보안 — auth.ts MOCK_ACCOUNTS 비밀번호 해싱

**항목**: 코드 개선 분석 #1  
**위치**: `src/lib/auth.ts` — `MOCK_ACCOUNTS` 배열, `signUp()` 함수

**현 상태**:
```typescript
// MOCK_ACCOUNTS에 평문 비밀번호 잔존
{ email: 'admin@ibslaw.kr', password: 'admin123' }

// signUp()에서도 평문 저장
passwordHash: password, // ← 해싱 미적용
```

**해결 방안**:
1. `npm install bcryptjs @types/bcryptjs` 설치
2. `MOCK_ACCOUNTS` 비밀번호를 `bcryptjs.hashSync('admin123', 10)` 형태로 변환
3. `signUp()`에서 `bcryptjs.hashSync(password, 10)` 적용
4. `signIn()`에서 `bcryptjs.compareSync(password, account.passwordHash)` 변경

> **권장**: Supabase Auth 전환 시 함께 처리 (Supabase에서 자체 해싱 제공)

---

## 🟠 아키텍처 — 전체 데이터 Supabase 전환

**항목**: 코드 개선 분석 #5  
**대상 파일**:
- `src/lib/mockStore.ts` → `supabase.ts` 기반 API 호출로 교체
- `src/lib/dripStore.ts` → Supabase 테이블 연동
- `src/lib/leadStore.ts` → Supabase 테이블 연동
- `src/lib/auth.ts` → Supabase Auth 연동

**선행 조건**:
- [ ] Supabase 프로젝트 생성 및 URL/ANON_KEY 발급
- [ ] `.env.local`에 환경변수 설정
- [ ] `supabase.ts` 스키마 마이그레이션 실행
- [ ] Row Level Security (RLS) 정책 설정

---

## 🟡 아키텍처 — Zustand 상태관리 도입

**항목**: 코드 개선 분석 #6  
**현 상태**: 각 컴포넌트에서 `store.getAll()` 직접 호출 → 데이터 불일치 가능

**해결 방안**: Zustand Store 도입
```typescript
// 예시
const useCompanyStore = create<CompanyStore>(...)
```

> **권장**: Supabase 전환 후 함께 구현 (서버 상태 관리는 TanStack Query + Supabase가 더 적합할 수 있음)

---

## 🟡 기능 — URL 분석기 실제 분석 연동

**항목**: 코드 개선 분석 #9  
**현 상태**: `api/analyze/route.ts` — 고정 Mock 데이터 반환 (isDemoMode: true 플래그)

**해결 방안**:
1. OpenAI API 키 연동 (`OPENAI_API_KEY` 환경변수)
2. Puppeteer 서버 Side 설치 및 URL 크롤링
3. 실제 처리방침 텍스트를 GPT-4o에 전달하여 이슈 분석

---

## 📅 권장 타임라인

```
현재 (2026-03-05) ────── Supabase 전환 ────── 서비스 오픈
      ↑                       ↑
   Phase 3 완료          Phase 4 시작
   (이번 세션)           bcryptjs + Supabase Auth +
                          Zustand + URL 실제 분석
```
