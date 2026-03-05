# 아키텍처 리팩토링 상세

> 분석 보고서 항목 #14, #15 및 신규 발견 항목

---

## 1. mockStore.ts — runAutoPipeline 재귀 setTimeout 제거 (항목 #14)

**위치**: `src/lib/mockStore.ts` L434–L482

**문제**: 재귀 `setTimeout`은 함수가 계속 쌓여 메모리 누수 가능. 종료 조건이 암묵적

```typescript
// ❌ 이전 — 재귀 setTimeout
function runAutoPipeline(companyId: string, delay = 0) {
    setTimeout(() => {
        // ...Step 1 처리...
        runAutoPipeline(companyId, 800); // ← 자기 자신을 다시 호출!
        return;
    }, delay);
}
```

```typescript
// ✅ 수정 후 — async/await Promise 체이닝
async function runAutoPipeline(companyId: string): Promise<void> {
    const delay = (ms: number) => new Promise<void>(res => setTimeout(res, ms));

    await delay(500);
    { /* Step 1: 자동 영업 컨펌 */ }

    await delay(800);
    { /* Step 2: 자동 변호사 배정 */ }

    await delay(800);
    { /* Step 3: 이메일 자동 발송 */ }
}
```

**개선 효과**:
- ✅ 재귀 호출 제거 → 메모리 누수 없음
- ✅ 각 Step이 명시적으로 분리되어 흐름 파악 용이
- ✅ 이전 Step 실패해도 다음 Step 진행 (각 Step이 독립적 조건 체크)

---

## 2. mockStore.ts — _lawyerIdx 인메모리 변수 제거 (항목 #15)

**위치**: `src/lib/mockStore.ts` L761–L767

**문제**: `let _lawyerIdx = 0` 인메모리 변수는 서버/브라우저 새로고침 시 리셋 → 라운드로빈 순서가 항상 0번부터 재시작

```typescript
// ❌ 이전 — 인메모리 변수 (새로고침 시 초기화)
let _lawyerIdx = 0;
function assignNextLawyer(): string {
    const l = LAWYERS[_lawyerIdx % LAWYERS.length];
    _lawyerIdx++;
    return l;
}
```

```typescript
// ✅ 수정 후 — AutoSettings.lawyerRoundRobin (localStorage 영속)
function assignNextLawyer(): string {
    const s = loadAuto();
    const lawyer = LAWYERS[s.lawyerRoundRobin % LAWYERS.length];
    saveAuto({ ...s, lawyerRoundRobin: (s.lawyerRoundRobin + 1) % LAWYERS.length });
    return lawyer;
}
```

**개선 효과**: `AutoSettings`의 `lawyerRoundRobin` 필드(이미 localStorage에 저장)로 통일하여 단일 진실 공급원(SSOT) 유지

---

## 3. dripStore.ts — _members 인메모리 → localStorage 영속화

**위치**: `src/lib/dripStore.ts`

**문제**: `let _members: DripMember[]` 인메모리 배열이라 서버/새로고침 시 초기화

```typescript
// ✅ 수정 후 — loadMembers / saveMembers 함수로 localStorage 영속화
const DRIP_STORE_KEY = 'ibs_drip_v1';

function loadMembers(): DripMember[] {
    if (typeof window === 'undefined') return [...INITIAL_MEMBERS];
    try {
        const raw = localStorage.getItem(DRIP_STORE_KEY);
        if (!raw) {
            localStorage.setItem(DRIP_STORE_KEY, JSON.stringify(INITIAL_MEMBERS));
            return [...INITIAL_MEMBERS];
        }
        return JSON.parse(raw) as DripMember[];
    } catch { return [...INITIAL_MEMBERS]; }
}
```

**추가**: `markSubscribed()` TypeScript 타입 오류 수정 — `dripStatus: 'converted' as DripStatus`
