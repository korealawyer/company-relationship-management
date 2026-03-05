# UI/UX 버그 수정 상세

> 분석 보고서 항목 #7, #8 및 신규 발견 항목

---

## 1. page.tsx — 푸터 오탈자 수정 (항목 #7)

**위치**: `src/app/page.tsx` L137

```diff
- '가맹점 해승 대응'
+ '가맹점 분쟁 해결'
```

---

## 2. page.tsx — searchParams Promise → useSearchParams 훅 (항목 #8)

**위치**: `src/app/page.tsx` L21–32

**문제**: `'use client'` 컴포넌트에서 `searchParams: Promise<...>` 비동기 처리는 불필요하고 혼란을 야기. Next.js 15+ 빌드 경고 발생

```typescript
// ❌ 이전 — Promise 처리 패턴 (Client Component에서 불필요)
export default function LandingPage({ searchParams }: { searchParams: Promise<{ cid?: string }> }) {
  useEffect(() => {
    searchParams.then((params) => { ... });
  }, [searchParams]);
}
```

```typescript
// ✅ 수정 후 — useSearchParams 훅 + Suspense 래핑
function LandingPageInner() {
  const searchParams = useSearchParams();
  const cid = searchParams.get('cid') ?? '';
  ...
}

// Suspense 래퍼: useSearchParams 사용을 위해 필수 (Next.js 빌드 요구사항)
export default function LandingPage() {
  return (
    <Suspense>
      <LandingPageInner />
    </Suspense>
  );
}
```

> **왜 Suspense?** Next.js 프리렌더링 시 `useSearchParams()`는 반드시 Suspense 경계 안에서 사용해야 함. 없으면 `missing-suspense-with-csr-bailout` 빌드 오류 발생

---

## 3. Navbar.tsx — 드롭다운 hover 사라짐 버그 (신규 발견 🆕)

**위치**: `src/components/layout/Navbar.tsx` L121–L156

**문제**: 버튼(`top-full`)과 드롭다운 사이에 `mt-2` (8px 갭)가 있어 마우스가 이 틈을 지날 때 `onMouseLeave`가 발동하여 드롭다운이 닫힘

```
[버튼]
  ↑
 8px 갭 ← mouseLeave 발동 지점 (문제!)
  ↓
[드롭다운]
```

```typescript
// ❌ 이전 — mt-2로 버튼과 드롭다운 사이에 갭 발생
<motion.div className="absolute right-0 top-full mt-2 ...">

// ✅ 수정 후 — 투명 패딩 래퍼(pt-2)로 마우스 이탈 방지
<div className="absolute right-0 top-full pt-2 z-50">
  <motion.div className="w-52 ...">
```

**원리**: `pt-2` 래퍼가 버튼과 드롭다운 사이 공간을 채우므로, 마우스가 그 공간을 지날 때도 `div` 위에 있어 `onMouseLeave`가 발동하지 않음
