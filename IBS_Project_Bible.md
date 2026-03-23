# IBS 법률사무소 CRM — Project Bible v1.0
> **이 문서는 프로젝트의 단 하나의 진실(Single Source of Truth)입니다.**
> 안티그래비티, 커서 등 AI 에이전트는 이 문서를 가장 먼저 참조하세요.
> 마지막 업데이트: 2026-03-23

---

## 0. 프로젝트 개요

| 항목 | 내용 |
|---|---|
| **서비스명** | IBS 법률사무소 CRM |
| **도메인** | ibslaw.co.kr |
| **카테고리** | B2B SaaS — 프랜차이즈 본사 전문 법률 자문 |
| **핵심 사업** | 개인정보처리방침 AI 자동 분석 → 변호사 검토 → 월 구독 리테이너 전환 |
| **타깃 고객** | 한국 프랜차이즈 본부 (대상: 12,000개) |
| **가격대** | 월 330,000원 ~ 4,000,000원 (storeCount 기준) |
| **기술 스택** | Next.js 14 (App Router), TypeScript, Framer Motion, Lucide Icons |
| **데이터** | localStorage (ibs_store_v4) + Supabase Write-Through Cache |
| **폰트** | Noto Sans KR (400~900) |
| **테마 컬러** | #c9a84c (골드) |

---

## 1. Information Architecture (IA) — 전체 사이트맵

### 1-A. 상단 내비게이션 바 (Navbar)
> 역할에 따라 메뉴 항목이 달라집니다. MODULE_REGISTRY가 SSOT.

```
[IBS 로고] | 관리자 홈 | 영업 CRM | 전화 영업 | 음성 메모 | 견적 계산기 | 변호사 포털 | 조문 검토 | 송무 대시보드 | EAP 상담 | 고객 포털 | [역할 선택]
```

### 1-B. 내부 직원 영역 (로펌 내부 팀)

| 경로 | 라벨 | 담당 역할 | 설명 |
|---|---|---|---|
| `/` | 홈 (랜딩) | 전체 공개 | 서비스 소개, 가격표, 챗봇 |
| `/employee` | 영업 CRM | sales, admin | 기업 DB 관리, 상태 파이프라인 |
| `/sales/call` | 전화 영업 센터 | sales | 콜 센터, AI 메모, 계약서 발송 |
| `/sales/voice-memo` | 음성 메모 | sales | 통화 녹음·STT 변환 보관함 |
| `/sales/pricing-calculator` | 견적 계산기 | sales, admin | 가맹점수 기반 가격 산출 |
| `/sales/email-history` | 이메일 히스토리 | sales | 발송된 이메일 이력 |
| `/sales/leads` | 리드 관리 | sales | 신규 리드 등록/관리 |
| `/sales/dashboard` | 영업 대시보드 | sales, admin | 영업팀 KPI |
| `/lawyer` | 변호사 포털 | lawyer, admin | 배정된 기업 조문 검토 |
| `/lawyer/privacy-review` | 조문 검토 | lawyer | 개인정보처리방침 조항별 검토 |
| `/litigation` | 송무 대시보드 | litigation, lawyer | 기업소송 사건 관리 |
| `/personal-litigation` | 개인 소송 | lawyer, litigation | 개인 의뢰인 소송 관리 |
| `/counselor` | 상담사 포털 | counselor | EAP 심리상담 케이스 관리 |
| `/admin` | 관리자 KPI | admin, super_admin | 전체 KPI 대시보드 |
| `/admin/reports` | 월간 리포트 | admin | AI 생성 월간 법무 리포트 |
| `/admin/email-preview` | 이메일 미리보기 | admin, sales | 발송 이메일 미리보기 |
| `/admin/clients` | 고객사 목록 | admin | 구독 기업 관리 |
| `/admin/contract-preview` | 계약서 미리보기 | admin | 계약서 내용 확인 |
| `/admin/ai-prompts` | AI 프롬프트 | super_admin | AI 자동화 설정 |

### 1-C. 고객사 포털 (Client Portal)

| 경로 | 라벨 | 설명 |
|---|---|---|
| `/dashboard` | 대시보드 | 고객사 홈 (법무 현황 요약) |
| `/consultation` | 법률 상담 신청 | 법률 상담 요청 양식 |
| `/chat` | AI 법률 상담 | GPT 기반 챗봇 |
| `/cases` | 사건 관리 | 진행 중인 법률 사건 현황 |
| `/client-portal` | 고객 포털 홈 | 문서/청구서 통합 뷰 |
| `/documents` | 문서함 | 법률 문서 보관/열람 |
| `/billing` | 결제 관리 | 월 구독 청구서 |
| `/privacy-report` | 개인정보 리포트 | AI 진단 보고서 |
| `/company-hr` | 고객사 HR 포털 | 임직원 EAP 신청 |

### 1-D. 퍼블릭/공통 경로

| 경로 | 설명 |
|---|---|
| `/login` | 로그인 |
| `/signup` | 회원가입 |
| `/onboarding` | 신규 가입 온보딩 |
| `/pricing` | 가격표 |
| `/about` | 회사 소개 |
| `/eap` | EAP 상담 신청 (고객사용) |
| `/franchise` | 프랜차이즈 전용 랜딩 |
| `/superlawyer` | 슈퍼변호사 연동 |
| `/contracts` | 계약서 관리 |
| `/contracts/sign/[token]` | 전자서명 |
| `/notifications` | 알림 내역 |
| `/profile` | 프로필 설정 |
| `/settings` | 환경 설정 |

---

## 2. 권한(Role) 시스템

> `src/lib/mockStore.ts` → `RoleType` 및 `MODULE_REGISTRY`

### 역할 목록

| 코드값 | 한국어 | 접근 권한 요약 |
|---|---|---|
| `super_admin` | 슈퍼관리자 | 전체 접근 |
| `admin` | 관리자 | KPI, 영업CRM, 이메일/계약서 |
| `sales` | 영업팀 | 영업CRM, 전화영업, 견적계산기 |
| `lawyer` | 변호사 | 변호사포털, 조문검토, 송무 |
| `litigation` | 송무팀 | 송무 대시보드, 개인소송 |
| `general` | 총무팀 | (coming_soon) |
| `hr` | 인사팀 | (coming_soon) |
| `finance` | 회계팀 | 결제관리 |
| `counselor` | EAP 상담사 | 상담사 포털, EAP |
| `client_hr` | 고객사 HR | 대시보드, 상담신청, 문서함, 결제 |

### 역할 전환 방법
```
localStorage.setItem('ibs_role', '역할코드')
— 또는 —
Navbar 우상단 역할 선택 드롭다운에서 변경
```

### localStorage 키 목록

| 키 | 내용 |
|---|---|
| `ibs_store_v4` | 전체 기업 데이터 (Company[]) |
| `ibs_role` | 현재 로그인 역할 |
| `ibs_lit_v1` | 송무팀 사건 데이터 |
| `ibs_auto_settings` | 자동화 설정값 |
| `ibs_personal_v1` | 개인 소송 데이터 |
| `ibs_personal_clients_v1` | 개인 의뢰인 데이터 |

> **리셋 방법:** 브라우저 Console → `localStorage.removeItem('ibs_store_v4'); location.reload();`

---

## 3. 핵심 데이터 모델

> `src/lib/mockStore.ts` — `Company` 인터페이스

### 3-A. Company 필드 전체

| 필드 | 타입 | 설명 |
|---|---|---|
| `id` | string | 고유 ID (c1, c2...) |
| `name` | string | 기업명 |
| `biz` | string | 사업자등록번호 |
| `url` | string | 기업 홈페이지 URL |
| `email` | string | 기본 이메일 |
| `phone` | string | 대표 전화 |
| `storeCount` | number | 가맹점 수 (가격 산정 기준) |
| `status` | CaseStatus | 현재 파이프라인 상태 |
| `assignedLawyer` | string | 배정된 변호사명 |
| `issues` | Issue[] | AI 발견 법적 이슈 목록 |
| `riskScore` | number | 위험도 점수 (0~100) |
| `riskLevel` | HIGH/MEDIUM/LOW | 위험도 등급 |
| `contactName` | string | 고객사 담당자명 |
| `contactEmail` | string | 담당자 이메일 |
| `contactPhone` | string | 담당자 전화번호 |
| `callNote` | string | 통화 메모 |
| `plan` | none/starter/standard/premium | 구독 플랜 |
| `contractSentAt` | string | 계약서 발송 일시 |
| `contractSignedAt` | string | 계약서 서명 일시 |
| `contractMethod` | email/system/offline | 계약 방법 |
| `aiMemoSummary` | string | AI 자동 생성 통화 요약 |
| `aiNextAction` | string | AI 추천 다음 행동 |
| `lastCallResult` | connected/no_answer/callback | 마지막 통화 결과 |
| `callAttempts` | number | 총 통화 시도 횟수 |
| `emailSentAt` | string | 이메일 발송 일시 |
| `lawyerConfirmed` | boolean | 변호사 컨펌 여부 |
| `clientReplied` | boolean | 고객 답장 여부 |
| `autoMode` | boolean | 자동화 모드 ON/OFF |
| `source` | manual/crawler | 등록 방법 |

### 3-B. Issue (법적 이슈) 구조

| 필드 | 타입 | 설명 |
|---|---|---|
| `id` | string | 이슈 ID |
| `level` | HIGH/MEDIUM/LOW | 심각도 |
| `law` | string | 관련 법령 (예: 개인정보 보호법 제30조) |
| `title` | string | 이슈 제목 |
| `originalText` | string | 원문 조항 |
| `riskDesc` | string | 리스크 설명 + 과태료 금액 |
| `customDraft` | string | AI 초안 (변호사 수정 가능) |
| `lawyerNote` | string | 변호사 메모 |
| `reviewChecked` | boolean | 검토 완료 여부 |

---

## 4. 상태값 (Status) 전체 사전

### 4-A. CaseStatus — 영업 파이프라인 (핵심)

| 코드값 | 한글 라벨 | 단계 | 다음 자동 행동 |
|---|---|---|---|
| `pending` | 등록됨 | 1 | AI 크롤링 시작 |
| `crawling` | 분석중 | 2 | AI 분석 완료 후 자동 전환 |
| `analyzed` | 분석완료 | 3 | 영업팀 전화영업 → 변호사 배정 |
| `assigned` | 변호사배정 | 4 | 변호사 검토 시작 |
| `reviewing` | 검토중 | 5 | 변호사 컨펌 대기 |
| `lawyer_confirmed` | 변호사컨펌 | 6 | 이메일 자동 발송 |
| `emailed` | 발송완료 | 7 | 고객 답장 대기 (자동 팔로업) |
| `client_replied` | 답장수신 | 8 | 계약서 발송 단계 |
| `client_viewed` | 리포트열람 | 9 | 전환 가능성 높음 → 즉시 전화 |
| `contract_sent` | 계약서발송 | 10 | 전자서명 자동 감지 |
| `contract_signed` | 계약서명 | 11 | 구독 플랜 자동 전환 |
| `subscribed` | 구독완료 | 12 | 송무팀 자동 이관 |

**전화영업 페이지에서 보이는 상태 (CALLABLE):**
`analyzed`, `lawyer_confirmed`, `emailed`, `client_replied`, `client_viewed`, `contract_sent`, `contract_signed`

### 4-B. LitigationStatus — 송무팀 (`/litigation`)

| 코드값 | 한글 |
|---|---|
| `preparing` | 소장 준비 |
| `filed` | 접수완료 |
| `hearing` | 심리중 |
| `settlement` | 합의진행 |
| `judgment` | 판결 |
| `closed` | 종결 |

### 4-C. ConsultStatus — 상담관리 (`/counselor`)

| 코드값 | 한글 |
|---|---|
| `submitted` | 접수완료 |
| `ai_analyzing` | AI분석중 |
| `ai_done` | AI완료 |
| `assigned` | 변호사배정 |
| `reviewing` | 검토중 |
| `answered` | 답변완료 |
| `callback_requested` | 콜백요청 |
| `callback_done` | 콜백완료 |

### 4-D. PersonalLitStatus — 개인소송 (`/personal-litigation`)

| 코드값 | 한글 |
|---|---|
| `consulting` | 상담중 |
| `preparing` | 소장준비 |
| `filed` | 접수완료 |
| `hearing` | 심리중 |
| `settlement` | 조정/합의 |
| `judgment` | 판결선고 |
| `appeal` | 항소/상고 |
| `enforcing` | 강제집행 |
| `closed` | 종결 |

### 4-E. 소송 유형 (PersonalLitType)

`민사(손해배상)` / `민사(대여금)` / `민사(부동산)` / `가사(이혼)` / `가사(양육권)` / `가사(상속)` / `형사(피해자)` / `형사(피의자)` / `행정소송` / `산재/노동` / `채권추심` / `기타`

---

## 5. 페이지별 UI 구성 요소

### 5-A. 📞 전화영업 센터 (`/sales/call`)

**상단 통계 카드:**

| 카드 | 설명 |
|---|---|
| N 대기 | 전화 미완료 기업 수 |
| N 완료 | 오늘 통화 완료 수 |
| N 고위험 | riskScore ≥ 70인 기업 수 |
| N% 전환율 | ConversionPrediction 평균 |

**우상단 버튼:**

| 버튼 | 설명 |
|---|---|
| 자동배정 | 미배정 기업 일괄 변호사 배정 |
| 자동이메일 | 조건 충족 기업 이메일 일괄 발송 |
| 뉴스 N건 | AI 법률 뉴스 알림 팝업 |

**탭 필터:**

| 탭 | 필터 상태 |
|---|---|
| 전체 | 전체 CALLABLE 상태 |
| 분석완료 | `analyzed` |
| 변호사컨펌 | `lawyer_confirmed` |
| 답장수신 | `client_replied` |
| 계약서발송 | `contract_sent` |
| 서명완료 | `contract_signed` |

**테이블 컬럼:**

| 컬럼 | 정렬 | 설명 |
|---|---|---|
| 기업명 | ✅ | 이름 + 확장 여부 아이콘 |
| 상태 | ✅ | CaseStatus 배지 + 부가 배지 |
| 위험도 | ✅ | 막대 그래프 + 숫자 |
| 담당자 | — | 고객사 담당자명 |
| 전화번호 | — | tel: 링크 |
| 전환율 | — | 🔥/🌡️/❄️ + % |
| 이슈 | — | #H건/#총건 |
| 바로가기 | — | 아이콘 버튼 모음 |

**바로가기 아이콘 버튼 (왼쪽→오른쪽):**

| 아이콘 | 색 | 기능 | 동작 |
|---|---|---|---|
| Mail ✉️ | 파란색 | 이메일 미리보기 | `/admin/email-preview?company=기업명` 새탭 |
| Eye 👁️ | 보라색 | 1차 조문검토 미리보기 | `/lawyer/privacy-review?company=기업명&preview=1` 새탭 |
| Globe 🌐 | 청록색 | 홈페이지 열기 | `기업명.co.kr` 새탭 |
| MessageCircle 💬 | 노란색 | 카카오 알림톡 | 모달 팝업 |
| FileSignature 📄 | 황금색 | 계약서 발송 미리보기 | 계약서 미리보기 모달 → 발송 확정 |

**인라인 확장 패널 (행 클릭 시 펼쳐짐):**
- AI 통화 스크립트 (상태별 자동 생성)
- 통화 녹음/STT 기능 (MicOn/Off)
- 통화 결과 기록 (연결됨 / 부재중 / 콜백)
- 콜백 예약 모달
- AI 메모 자동 생성
- 팔로업 이메일 단계 표시 (1~3단계)

### 5-B. 🏢 영업 CRM (`/employee`)

**테이블 컬럼:**

| 컬럼 | 설명 |
|---|---|
| 기업명 | 이름 + AI 분석 소스 배지 |
| 상태 | CaseStatus 배지 |
| 가맹점수 | storeCount |
| 이슈 | HIGH/MEDIUM/LOW 개수 |
| 변호사 | assignedLawyer |
| 담당자 | 영업팀 담당자 |
| 최종 액션 | updatedAt |
| 바로가기 | 아이콘 버튼 |

### 5-C. ⚖️ 변호사 포털 (`/lawyer/privacy-review`)

- 기업별 개인정보처리방침 조항 목록
- 각 이슈: level 배지, 법령명, 원문, AI 초안, 변호사 메모 편집
- `?preview=1` 파라미터 시: 읽기 전용 모드 (수정 불가)
- 검토 완료 체크박스 → `reviewChecked: true`
- 변호사 컨펌 버튼 → status를 `lawyer_confirmed`로 전환

---

## 6. 핵심 비즈니스 워크플로우

### 6-A. 기업 영업 라이프사이클 (메인 파이프라인)

```
[기업 등록] → pending
     ↓ AI 자동 크롤링
[분석중] → crawling
     ↓ AI 분석 완료
[분석완료] → analyzed ← 전화영업 시작 포인트
     ↓ 변호사 자동 배정
[변호사배정] → assigned
     ↓ 변호사 조문 검토
[검토중] → reviewing
     ↓ 변호사 컨펌
[변호사컨펌] → lawyer_confirmed
     ↓ 이메일 자동 발송
[발송완료] → emailed
     ↓ 고객 답장
[답장수신] → client_replied
     ↓ 계약서 발송 미리보기 → 발송 확정
[계약서발송] → contract_sent
     ↓ 전자서명 자동 감지
[계약서명] → contract_signed
     ↓ 구독 플랜 자동 전환
[구독완료] → subscribed → 송무팀 자동 이관
```

### 6-B. 전화 영업 사이클

```
1. 전화영업 페이지 열기 (CALLABLE 상태 기업 표시)
2. 기업 행 클릭 → 인라인 패널 펼침
3. AI 통화 스크립트 확인
4. 전화 버튼 클릭 → 타이머 시작, 녹음 시작
5. 통화 중 실시간 STT 변환
6. 통화 종료 → 결과 선택 (연결됨/부재중/콜백)
7. AI 메모 자동 생성 (aiMemoSummary, aiNextAction)
8. 카카오 알림톡 또는 이메일 후속 발송
9. 계약서 발송 미리보기 → 확인 후 발송 확정
```

### 6-C. 자동화 서비스 목록

> `src/lib/salesAutomation.ts`

| 서비스 | 기능 |
|---|---|
| `AutoEmailService` | 조건 충족 기업 이메일 자동 발송 |
| `FollowUpService` | D+3, D+7, D+14 자동 팔로업 이메일 |
| `RiskAlertService` | riskScore 기반 위험 알림 |
| `AIMemoService` | 통화 후 AI 메모 자동 생성 |
| `AutoKakaoService` | 카카오 알림톡 자동 발송 |
| `AutoSignatureService` | 전자서명 완료 자동 감지 |
| `AutoSubscriptionService` | 서명 완료 시 구독 자동 전환 |
| `EmailTrackingService` | 이메일 열람 여부 추적 (👁️열람/📧추적중) |
| `ConversionPredictionService` | AI 전환율 예측 (HOT/WARM/COLD) |
| `CallQueueManager` | 통화 대기열 관리 |
| `NewsLeadService` | AI 뉴스 기반 리드 발굴 |

---

## 7. 구독 플랜 & 가격 구조

| 플랜 | 코드값 | 가맹점 기준 | 월 가격 (VAT 별도) |
|---|---|---|---|
| 없음 | `none` | — | — |
| 스타터 | `starter` | ~300개 | 330,000원 |
| 스탠다드 | `standard` | ~1,000개 | 660,000원 |
| 프리미엄 | `premium` | 1,000개 이상 | 협의 |

---

## 8. 디자인 원칙

### 8-A. 색상 시스템 (CRM Light Theme)

| 변수 | 값 | 용도 |
|---|---|---|
| `bg` | #f8f9fc | 페이지 배경 |
| `surface` | #ffffff | 카드/테이블 배경 |
| `heading` | #0f172a | 제목 텍스트 |
| `body` | #1e293b | 본문 텍스트 |
| `sub` | #475569 | 보조 텍스트 |
| `muted` | #64748b | 흐린 텍스트 |
| `faint` | #94a3b8 | 매우 흐린 |
| `accent` | #4f46e5 | 강조 (인디고) |
| `green` | #059669 | 성공/완료 |
| `red` | #dc2626 | 위험/오류 |
| `amber` | #d97706 | 경고/중간 |
| `gold` | #c9a84c | IBS 브랜드 컬러 |

### 8-B. 위험도 색상

| 점수 | 색상 | 의미 |
|---|---|---|
| 70 이상 | 빨간색 (#dc2626) | HIGH |
| 40~69 | 주황색 (#d97706) | MEDIUM |
| 0~39 | 초록색 (#059669) | LOW |

### 8-C. 전환율 예측 라벨

| 라벨 | 아이콘 | 배경색 | 의미 |
|---|---|---|---|
| HOT | 🔥 | #fef2f2 | 전환 가능성 높음 |
| WARM | 🌡️ | #fffbeb | 전환 가능성 보통 |
| COLD | ❄️ | #f0f9ff | 전환 가능성 낮음 |

### 8-D. UI 라이브러리

- **애니메이션:** Framer Motion (`motion.div`, `AnimatePresence`)
- **아이콘:** Lucide React (모든 아이콘 여기서)
- **CSS:** Tailwind CSS (inline style 혼용)
- **폰트:** Noto Sans KR (Variable: `--font-noto`)

---

## 9. 파일 위치 빠른 참조

| 수정 목적 | 파일 |
|---|---|
| 상태 추가/라벨 변경 | `src/lib/mockStore.ts` → `CaseStatus` + `STATUS_LABEL` |
| 모듈/메뉴 추가 | `src/lib/mockStore.ts` → `MODULE_REGISTRY` |
| 역할 추가 | `src/lib/mockStore.ts` → `RoleType` |
| 샘플 기업 데이터 | `src/lib/mockStore.ts` → `DEFAULT_COMPANIES` |
| 자동화 로직 | `src/lib/salesAutomation.ts` |
| 전화영업 페이지 | `src/app/sales/call/page.tsx` |
| 영업 CRM 페이지 | `src/app/employee/page.tsx` |
| 변호사 포털 | `src/app/lawyer/page.tsx` |
| 조문 검토 | `src/app/lawyer/privacy-review/page.tsx` |
| 계약서 미리보기 | `src/app/admin/contract-preview/page.tsx` |
| 이메일 미리보기 | `src/app/admin/email-preview/page.tsx` |
| 관리자 KPI | `src/app/admin/page.tsx` |
| 송무팀 | `src/app/litigation/page.tsx` |
| 개인 소송 | `src/app/personal-litigation/page.tsx` |
| 상담사 포털 | `src/app/counselor/page.tsx` |
| 글로벌 레이아웃 | `src/app/layout.tsx` |
| 글로벌 스타일 | `src/app/globals.css` |
| Supabase 연동 | `src/lib/supabase.ts` |
| 통화 녹음 | `src/lib/callRecordingService.ts` |

---

## 10. AI 에이전트 지시 규칙

> **안티그래비티(Antigravity) 또는 Cursor에게 작업 지시 시 이 규칙을 따르세요.**

### 10-A. 필수 컨텍스트 문장
```
이 프로젝트는 IBS Project Bible을 따릅니다.
데이터 모델은 src/lib/mockStore.ts의 Company 인터페이스 기준.
상태값 추가 시 반드시 CaseStatus에 추가하고 STATUS_LABEL도 함께 수정.
```

### 10-B. 지시 예시 템플릿

```
"전화영업 페이지에서 [위험도] 컬럼 제거해줘"
"CaseStatus에 'meeting_scheduled' 추가하고 라벨 '미팅예정'으로"
"전화영업 탭에 [구독완료] 탭도 추가해줘"
"바로가기에서 [카카오] 버튼 제거해줘"
"계약서발송 상태인 기업에만 빨간 점 표시 추가해줘"
"영업 CRM 테이블에 [마지막통화일] 컬럼 추가해줘"
"DEFAULT_COMPANIES에 [기업명] 새 샘플 2개 추가해줘, 상태는 analyzed"
"admin 역할이 /sales/call 에도 접근 가능하게 MODULE_REGISTRY 수정해줘"
```

### 10-C. 절대 변경 금지 항목
- `Company` 인터페이스의 기존 필드명 (다른 페이지에서 의존)
- `CASE_KEY = 'ibs_store_v4'` (localStorage 키)
- `CaseStatus` 기존 코드값 (영어 코드값은 고정, 라벨만 변경 가능)
- `MODULE_REGISTRY`의 기존 `id`, `href` 값

---

## 11. 개발 단계 (Phase)

| Phase | 상태 | 내용 |
|---|---|---|
| **Phase 1** | ✅ 운영 중 | 영업CRM, 변호사포털, 송무팀, 관리자KPI, 고객포털, 개인소송 |
| **Phase 2** | 🔧 Beta | EAP 상담사 포털, 고객사 HR 포털 |
| **Phase 3** | 🔜 예정 | 법률 지식관리(RAG), 총무/인사팀 내부툴 |
