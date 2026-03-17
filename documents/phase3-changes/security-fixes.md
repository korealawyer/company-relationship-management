# 보안 수정 상세

> 분석 보고서 항목 #2, #16 및 신규 발견 항목

---

## 1. middleware.ts — RBAC 우회 취약점 수정 🆕

**위치**: `src/middleware.ts`

**문제**: `ibs_role` 쿠키가 있을 때만 역할 검증을 하고, 없으면 그냥 통과시켰음

```typescript
// ❌ 이전 코드 — ibs_role 없으면 역할 체크 자체를 건너뜀
const roleCookie = req.cookies.get('ibs_role');
if (roleCookie?.value) {
    // ...역할 체크...
}
return NextResponse.next(); // ← 쿠키 없는 요청도 통과!
```

```typescript
// ✅ 수정 후 — 보호 경로에서 ibs_role 없으면 로그인으로 리다이렉트
const matchedPath = Object.keys(PROTECTED)...
if (matchedPath) {
    const roleCookie = req.cookies.get('ibs_role');
    if (!roleCookie?.value) {
        return NextResponse.redirect(new URL('/login?error=no_role', req.url));
    }
    if (!allowedRoles.includes(roleCookie.value)) {
        return NextResponse.redirect(new URL('/login?error=unauthorized', req.url));
    }
}
```

---

## 2. dripStore.ts — `IBS2026!` 하드코딩 제거 (항목 #16)

**위치**: `src/lib/dripStore.ts` L165, L173

**문제**: Mock 데이터에 실제 임시 비밀번호가 평문으로 하드코딩 → Git 히스토리 영구 노출

```typescript
// ❌ 이전
tempPassword: 'IBS2026!',

// ✅ 수정 후 — 플레이스홀더로 교체
tempPassword: '[발송 완료 — 저장 안 함]',
```

**추가**: `register()` 함수에서 임시 비밀번호 생성 후 이메일 발송 시 사용, 저장 시에는 플레이스홀더만 남기도록 TODO 주석 추가

---

## 3. auth.ts — signUp() ID 충돌 방지 🆕

**위치**: `src/lib/auth.ts` L226

**문제**: `Date.now()` 기반 ID는 동시 가입 시 충돌 가능

```typescript
// ❌ 이전
id: `u_${Date.now()}`,

// ✅ 수정 후
id: typeof crypto !== 'undefined' && crypto.randomUUID
    ? `u_${crypto.randomUUID()}`
    : `u_${Date.now()}`,
```

---

## 4. dripStore.ts — register() ID 충돌 방지 🆕

**위치**: `src/lib/dripStore.ts` `register()` 함수

```typescript
// ❌ 이전
id: `drip_${Date.now()}`,

// ✅ 수정 후
id: typeof crypto !== 'undefined' && crypto.randomUUID
    ? `drip_${crypto.randomUUID()}`
    : `drip_${Date.now()}`,
```
