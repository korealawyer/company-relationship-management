# 🎯 초정밀 코어 MVP 워크플로우 QA 및 디버깅 마스터 플랜

MVP의 프로덕션 수준 안정성을 담보하기 위해 **각 파일, 함수 단위, 엣지 케이스 시나리오**까지 고려한 극초정밀 Task List입니다. QA를 넘어 개발자가 즉시 코드를 고치고 단위 테스트를 할 수 있는 명세서입니다.

---

## 🛠️ Phase 1: 영업자 (Sales) 워크플로우 안정화

### [ ] TC-1.1: `useCallPage.ts` SWR 폴링 및 낙관적 UI 렌더링 충돌 방어
> **위치:** `src/components/sales/call/useCallPage.ts`
- `[ ]` **입력 데이터 유실(Cursor Loss) 차단 테스트:**
  - **시나리오:** 영업자가 `companies` 특정 로우의 `<textarea>`(메모) 또는 입력 필드에 장문의 텍스트를 기입 중 일 때 테스트.
  - **검증 대상:** 2초 단위의 백그라운드 폴링 (`setInterval` 또는 SWR `refresh`)이 실행될 때 DOM이 리렌더되었다고 해서 입력 중이던 텍스트가 날아가거나, Input 필드의 포커스(Focus)가 풀리지 않는지 점검. (해결책: `useRef`로 현재 포커싱된 아이템 ID를 들고 있거나, SWR의 `revalidateOnFocus` 조정)
- `[ ]` **BroadcastChannel 간섭 완전 격리:**
  - **시나리오:** 브라우저 탭 A와 탭 B를 동시에 열어둔 상태.
  - **검증 대상:** 탭 B에서 특정 회사를 클릭했을 때 발생하는 이벤트 리스너가 탭 A의 `selectedId` 상태를 강제로 오버라이드하여, A 탭 작업자의 화면이 튕기거나 변경되는 어뷰징이 발생하지 않는지 확인.

### [ ] TC-1.2: `TableView.tsx` 및 `supabaseStore.ts` 벌크(Bulk) 처리 무결성
> **위치:** `src/lib/supabaseStore.ts` -> `updateBulk` 함수
- `[ ]` **DB Chunk Upsert 배열 매핑 에러 해결:**
  - **시나리오:** 50개 이상의 레코드를 체크박스로 다중 선택 후 일괄 상태 변경(예: '등록됨' -> '거절')을 시도.
  - **검증 대상:** Supabase PostgREST는 부분 객체(Partial Object) UPSERT 시 내부적으로 NOT NULL 제약조건 우회 실패 에러가 발생 가능함. 현재 코드의 `Promise.all` + 50개 `chunk` 분할 로직에서, 하나라도 실패하면 전체 청크가 롤백(블로킹)되는지 아니면 `successCount`가 정상 집계되는지 체크. 에러 메세지 (`Bulk update individual mapping error`) 추적.
- `[ ]` **Pagination(페이지네이션) State 캐싱 유지:**
  - **검증 대상:** `/html/body/main/div/div[3]/div/div` 요소에 현재 페이지 번호(예: 3페이지)를 직접 입력하여 이동한 뒤 벌크업데이트 로직 발동 시, 강제로 1페이지(초기 상태)로 리다이렉트되지 않고 `3페이지` 상태를 그대로 유지하는지 `URL Parameter` 또는 `Local State` 바인딩 점검.

---

## 🏛️ Phase 2: 변호사 (Lawyer) 워크플로우 안정화

### [ ] TC-2.1: `api/analyze/route.ts` AI 모델 타임아웃 및 파싱 안정성
> **위치:** `src/app/api/analyze/route.ts`
- `[ ]` **Vercel Edge/Node Timeout 방어 100% 보장:**
  - **시나리오:** AI 모델(GPT-4o 또는 Claude)이 극도로 긴 개인정보처리방침 문서를 분석하느라 90초 이상 시간이 소요됨.
  - **검증 조건:** Vercel 배포 환경에서 524 타임아웃 에러 방지를 위해 설정한 `export const maxDuration = 180;` 및 `export const dynamic = 'force-dynamic';` 옵션이 인그레스(Ingress) 레벨에서 정상 우회되어 3분 대기 시간까지 HTTP Connection을 유지하는지 확인.
- `[ ]` **AI JSON Markdown 백틱(` ```json `) 역직렬화 공격 정규식 방어:**
  - **시나리오:** AI 모델이 순수 JSON 객체 `{}` 대신 줄바꿈과 마크다운 텍스트를 섞은 ` ```json { "risk": "HIGH" } ``` ` 형태로 반환.
  - **검증 조건:** `content.match(/\{[\s\S]*\}/)` 추출 로직이 줄바꿈 기호를 정확히 통과시키고, `JSON.parse`가 Syntax Error 없이 DTO로 매핑되는지 가짜 페이로드로 트라이/캐치 폴백 테스트 로직 검증.
- `[ ]` **과금 최적화 우회 (Bypass) 로직 오작동 점검:**
  - **검증 조건:** 본문이 '없음', '미기재', '추후등록' 일 때 LLM 토큰 소모를 막기 위해 바로 반환시키는 Exception 길이(`text.length < 20` 분기 등)가 너무 범용적이어서, "수집 항목 없음"이라는 정상적인 짧은 요약 문구를 무지성 에러로 패스시키지 않는지 확인.

### [ ] TC-2.2: `PendingClientsPanel.tsx` UI 레이어 연동 및 상태 공유
> **위치:** `src/components/lawyer/PendingClientsPanel.tsx`
- `[ ]` **사용자 식별자(Prefix) 렌더링 무결성 (Auth Join):**
  - **검증 조건:** 로그인 쿠키의 `auth.users.user_metadata` 값과 `public.users` (또는 `lawyers` 테이블)의 메타데이터 싱크가 안 맞아 렌더링 딜레이 시 "임시 변호사" 컴포넌트가 화면에 노출되는 글리치 현상이 없는지 확인.
- `[ ]` **아코디언(Accordion) 상태 기반 의뢰 프리필(Pre-fill):**
  - **검증 조건:** 우측 하단 컨펌 버튼 클릭 시 호출되는 `addLitigation()`에 맵핑되는 페이로드(`clientName`, `clientPhone`, `summarySteps`)가 undefined 상태로 DB에 넘어가지 않는지(레이스 컨디션 점검) 콘솔 데이터 검증.

---

## 🚀 Phase 3: 기업 (Client) 가입 방어 페이로드 로직 

### [ ] TC-3.1: 마케팅 클레임 진입 (`ClaimPopup.tsx`) UI 안정성
> **위치:** `src/components/landing/ClaimPopup.tsx`
- `[ ]` **Z-index 충돌 및 클릭 스루(Click-through) 렌더링 딜레이:**
  - **검증 조건:** `/?claim=uuid` 진입 후 0.8초 딜레이 뒤 렌더링되는 `Framer Motion` 팝업이, 후면에 배치된 페이지 컨텐츠의 Input / Link 등의 포커스를 스틸하거나 반대로 묻혀서 클릭이 차단되는 현상이 없는지 확인.
- `[ ]` **Next.js Router 간섭 및 Query Param 드랍 방어:**
  - **검증 조건:** [내 회사 권한 얻기] 버튼을 통해 `route.push('/login?claim=~')` 로 넘길 때, `middleware.ts` 에서 이 라우팅을 차단하거나 파라미터를 드랍(`?claim` 증발)해버리고 메인 로그인으로 리다이렉트 시키는지 검증.

### [ ] TC-3.2: `api/auth/claim/route.ts` 마이크로 트랜잭션 검증
> **위치:** `src/app/api/auth/claim/route.ts`
- `[ ]` **사업자 번호(biz_no) 기반 가상 이메일 생성 정규식 무결성:**
  - **시나리오:** 사용자가 "123-45-67890" 혹은 "123 45 67 890" 등을 마구잡이로 입력함.
  - **검증 조건:** `bizNum.replace(/\D/g, '')` 이 정확하게 하이픈, 공백, 특수문자를 제거하고, `1234567890@client.ibsbase.com` 형태의 인증용 UUID 이메일로 컨버전되는지 Edge Case 테스트.
- `[ ]` **Admin API Race Condition 방어 (초당 2회 다중 클릭 방어):**
  - **시나리오:** 사용자가 회원가입 버튼을 0.1초 간격으로 2번 연타함.
  - **검증 조건:** 백엔드에서 `supabase.auth.admin.createUser` 호출 후 `AuthApiError: User already exists` 에러 팝업을 띄우고 앱이 크래시 되는지, 아니면 우아하게 Catch하여 기존 User 객체를 `getUser` 또는 Update Flow로 무사히 안내하는지 검증.
- `[ ]` **최종 외래키 매핑 (Client Portal RLS 권한 확보):**
  - **검증 조건:** 인증 유저의 `user_metadata` 에 `companyId` 삽입 후, 해당 사용자가 로그인 했을 때 `policies` (Row Level Security) 제약을 통과하여 오로지 본인 회사의 데이터베이스 로우에만 `Select / Update` 권한을 갖도록 `updatedFromClaim = true` 플래그가 완벽하게 동기화되는지 E2E 테스트.
