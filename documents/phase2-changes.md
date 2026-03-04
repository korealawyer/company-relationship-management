# Phase 2 보안 강화 수정 완료 보고서

> **완료 일시**: 2026-03-05  
> **빌드 상태**: ✅ `npm run build` Exit 0 (34개 페이지, 에러 없음)

---

## 수정 파일 목록

| 파일 | 수정 내용 |
|------|---------|
| `src/middleware.ts` | RBAC 역할 검증 완성 |
| `src/lib/auth.ts` | 비밀번호 검증 강화 + passwordHash 필드 분리 |
| `src/app/login/page.tsx` | ibs_role 쿠키 설정 (4곳) |
| `src/components/layout/Navbar.tsx` | /my-page 404 수정 + 타 탭 로그아웃 동기화 |

---

## 상세 변경 내역

### 1. middleware.ts — RBAC 역할 검증 완성 (항목 2번)

**이전**: 쿠키 존재 여부만 확인 → 역할 검증 없이 통과  
**이후**: `ibs_role` 쿠키에서 역할을 읽어 경로별 허용 역할 검증

```diff
- const auth = req.cookies.get('ibs_auth');
- if (!auth) return redirect('/login');
- return NextResponse.next(); // 역할 확인 없이 통과!

+ const roleCookie = req.cookies.get('ibs_role');
+ const allowedRoles = PROTECTED[matchedPath];
+ if (!allowedRoles.includes(role)) {
+   return redirect('/login?error=unauthorized');
+ }
```

추가 사항:
- `/company-hr`, `/dashboard`, `/counselor`, `/consultation` 경로 RBAC 매핑 추가
- 퍼블릭 경로 목록에 `/signup`, `/landing` 추가
- 미인증 접근 시 `?from=경로` 파라미터 포함하여 로그인 후 복귀 가능

### 2. auth.ts — 비밀번호 취약점 수정 (항목 1번, 3번)

**취약점 1**: `loginWithBiz()` — 4자 이상이면 어떤 비밀번호든 통과
```diff
- if (password.length < 4) { return error; }
+ if (biz.password !== password) { return error; }
```

**취약점 2**: `signUp()` — `avatar` 필드에 평문 비밀번호 저장
```diff
- saveUsers([...all, { ...user, avatar: password }]);
+ saveUsers([...all, { ...user, passwordHash: password }]);
// TODO(Phase 3): bcryptjs 해싱으로 교체
```

**취약점 3**: `AuthUser` 인터페이스에 `passwordHash?` 옵셔널 필드 추가  
→ avatar 필드는 프로필 이미지 URL 전용으로 역할 명시

### 3. login/page.tsx — ibs_role 쿠키 설정 (미들웨어 연동)

로그인 성공 시 `ibs_session` 외에 `ibs_role` 쿠키도 설정:
- Staff 로그인 (`handleStaffLogin`)
- Client(사업자) 로그인 (`handleClientLogin`)
- Quick Badge 직원 로그인 (역할별 버튼 4개)
- Quick 고객사 테스트 로그인

### 4. Navbar.tsx — /my-page 404 수정 + 타 탭 동기화 (항목 19번)

**이전**: `/my-page` 링크 → 존재하지 않는 경로 (404)  
**이후**: 역할별 첫 번째 링크(`LINKS_BY_ROLE[role][0].href`)로 이동  
표시 텍스트: "내 페이지" → "내 대시보드"

```typescript
// storage 이벤트로 타 탭 로그아웃 감지
window.addEventListener('storage', (e) => {
    if (e.key === 'ibs_auth_v1') setUser(e.newValue ? getSession() : null);
});
```

---

## 남은 Phase 2 작업

- [ ] `dripStore.ts` — 임시 비밀번호 `'IBS2026!'` 하드코딩 제거 (항목 16번)
