# 🗺️ 시스템 지도 — 기업·법인 CRM SaaS 전체 운영 체계
*(에이전트 × 워크플로우 × 전략 파일 완전 연결 맵 | 시스템 진입점)*

---

> **이 파일을 읽으면 전체 시스템을 10분 안에 이해할 수 있습니다.**

---

## 🏗️ 시스템 구조 개요

```
c:\projects\company-relationship-management\
│
├── 📋 마스터 파일 (여기서 시작)
│   ├── 00_SYSTEM_MAP.md          ← 지금 이 파일 (진입점)
│   ├── 00_MASTER_PLAYBOOK.md     ← 전략 총괄 + AI 세션 규칙
│   ├── 00_MASTER_PROMPT.md       ← AI 프롬프트 템플릿 모음
│   └── 00_MASTER_TASK.md         ← 현재 진행 중 태스크
│
├── 🤖 _agents/ (역할별 AI 에이전트)
│
├── 🔄 _agents/workflows/ (실행 절차서)
│
├── 📊 _strategy/ (사업 전략 문서)
│
└── 📁 src/ (Next.js 웹 애플리케이션 코드)
```

---

## 🤖 에이전트 디렉토리 (전체 18개)

### Strategic Layer (전략 결정)
| 파일 | 역할 | 우선 사용 시점 |
|---|---|---|
| `ceo.md` | CEO 전략 파트너 (1000억 ARR) | 전략 결정, 방향성 검토, 투자자 대응 |
| `pm.md` | 제품 관리 디렉터 | 기능 기획, 로드맵, 우선순위 결정 |
| `data_analyst.md` | 데이터 분석 | KPI 분석, 코호트, 이탈 분석 |

### Revenue Layer (수익 창출)
| 파일 | 역할 | 우선 사용 시점 |
|---|---|---|
| `sales.md` | 세일즈 디렉터 | 데모, 파일럿, 유료 전환, 협상 |
| `finance.md` ⭐ NEW | 재무 CFO | MRR 추적, 청구 자동화, 미납 관리 |
| `marketing.md` ⭐ NEW | 마케팅 그로스 | SEO, 콘텐츠, 레퍼럴, 광고 |
| `partnership.md` | 파트너십 | 회계법인, 변협, 리셀러 파트너 관리 |
| `growth.md` | 그로스 해킹 | 채널별 성장, 바이럴, 실험 설계 |

### Delivery Layer (서비스 전달)
| 파일 | 역할 | 우선 사용 시점 |
|---|---|---|
| `corporate_lawyer.md` ⭐ NEW | 기업법인 전담 변호사 | 기업 의뢰인 법무 자문, 계약 관리 |
| `legal_ops.md` | 법률 업무 자동화 | 자동화 설계, 트리거-액션 구성 |
| `onboarding.md` | 온보딩 | 신규 로펌 세팅, 데이터 마이그레이션 |
| `cs_success.md` | 고객 성공 | 헬스스코어, 이탈 방어, 고객 관계 |
| `ai_legal.md` | AI 법률 분석 | 판례 검색, 계약서 리뷰, 법률 질의 |
| `ai_product.md` ⭐ NEW | AI 제품 기획 | AI 기능 로드맵, 기술 사양, 데모 설계 |

### Infrastructure Layer (시스템 기반)
| 파일 | 역할 | 우선 사용 시점 |
|---|---|---|
| `dev.md` | 개발 디렉터 | 코드 구현, 버그 수정, 기술 결정 |
| `compliance.md` ⭐ NEW | 컴플라이언스 | 개인정보법, 변호사법, 보안 감사 |
| `security_auditor.md` | 보안 감사 | 취약점 분석, RLS 감사 |
| `antigravity_save_rules.md` | 저장 규칙 | AI 대화 저장 시 폴더 라우팅 규칙 |

---

## 🔄 워크플로우 디렉토리 (전체 8개)

### 기업법인 고객 관리 (Track A)
| 워크플로우 | 트리거 | 핵심 에이전트 |
|---|---|---|
| `corporate_intake.md` | 신규 기업 법인 수임 시 | `corporate_lawyer` → `onboarding` |
| `contract_renewal.md` ⭐ NEW | 계약 만료 60일 전 | `legal_ops` → `finance` |
| `monthly_report.md` ⭐ NEW | 매월 말일 18:00 | `corporate_lawyer` → `legal_ops` |
| `conflict_check.md` ⭐ NEW | 신규 의뢰인 등록 시 | `compliance` → `corporate_lawyer` |
| `billing_chase.md` ⭐ NEW | 납부 기한 초과 시 | `finance` → `legal_ops` |

### SaaS 로펌 고객 관리 (Track B)
| 워크플로우 | 트리거 | 핵심 에이전트 |
|---|---|---|
| `saas_demo.md` | 데모 예약 완료 시 | `sales` → `onboarding` |
| `saas_churn.md` ⭐ NEW | 헬스스코어 < 50점 | `cs_success` → `sales` |
| `저장.md` | `/저장` 명령어 실행 시 | 자동 폴더 라우팅 |

---

## 📊 전략 파일 디렉토리 (전체 11개)

| 번호 | 파일 | 내용 요약 |
|---|---|---|
| `00` | `REVENUE_ROADMAP.md` | 1000억 ARR 연도별 목표 + Phase 실행 계획 |
| `01` | `LAWFIRM_SAAS_PLAYBOOK.md` | 로펌 Pain Point 15가지 + 데모 스크립트 |
| `02` | `MULTITENANT_ARCHITECTURE.md` | Supabase RLS 멀티테넌트 기술 설계 |
| `03` | `AUTOMATION_CATALOG.md` | 전체 자동화 항목 카탈로그 |
| `04` | `CORPORATE_CLIENT_PLAYBOOK.md` | 기업법인 의뢰인 Tier 분류 + 관리 |
| `05` | `SAAS_SALES_PLAYBOOK.md` | 타 로펌 세일즈 바이블 |
| `06` | `CORPORATE_AUTOMATION_BIBLE.md` ⭐ NEW | 기업법인 자동화 완전 가이드 (100개) |
| `07` | `AI_PRODUCT_ROADMAP.md` ⭐ NEW | AI 기능 4단계 출시 로드맵 |
| `08` | `PRICING_STRATEGY.md` ⭐ NEW | 가격 전략 + 업셀 플레이북 + 할인 정책 |
| `09` | `PARTNERSHIP_STRATEGY.md` ⭐ NEW | 파트너십 채널 (회계법인, 변협, 리셀러) |
| `10` | `INVESTOR_NARRATIVE.md` ⭐ NEW | 투자자 설득 내러티브 + Exit 시나리오 |

---

## 🔀 에이전트 × 워크플로우 연결 맵

```
신규 기업 법인 수임 플로우:
corporate_intake.md
  ↓ Step 2
conflict_check.md  ← compliance.md
  ↓ CLEAR
corporate_lawyer.md  ← legal_ops.md
  ↓ 계약 체결
contract_renewal.md (60일 전 자동 시작)
monthly_report.md (매월 말 자동)
billing_chase.md (미납 시 자동)

SaaS 로펌 판매 플로우:
sales.md (리드 발굴)
  ↓ 데모 예약
saas_demo.md
  ↓ 파일럿 시작
onboarding.md
  ↓ 헬스스코어 모니터링
saas_churn.md (위험 감지 시)
  ↓ 유료 전환
finance.md (subscription 관리)
```

---

## 🚀 상황별 빠른 접근 가이드

| 상황 | 사용할 에이전트/워크플로우 |
|---|---|
| **신규 기업 법인 수임 시작** | `/corporate_intake` → `corporate_lawyer.md` |
| **계약서 위험 조항 검토** | `ai_product.md` (AI 기능) → `ai_legal.md` |
| **미납 수임료 추적** | `/billing_chase` → `finance.md` |
| **이달 법무 리포트 생성** | `/monthly_report` → `corporate_lawyer.md` |
| **타 로펌 데모 준비** | `/saas_demo` → `sales.md` |
| **로펌 이탈 위험 감지** | `/saas_churn` → `cs_success.md` |
| **이해충돌 검사** | `/conflict_check` → `compliance.md` |
| **계약 만료 갱신** | `/contract_renewal` → `legal_ops.md` |
| **투자자 미팅 준비** | `_strategy/10_INVESTOR_NARRATIVE.md` → `ceo.md` |
| **가격 협상** | `_strategy/08_PRICING_STRATEGY.md` → `sales.md` |
| **AI 기능 기획** | `ai_product.md` → `_strategy/07_AI_PRODUCT_ROADMAP.md` |
| **대화 내용 저장** | `/저장` |

---

## 📌 시스템 운영 원칙

```
1. 에이전트 선택: 목적에 맞는 에이전트 1개만 활성화
2. 워크플로우 실행: 해당 워크플로우 파일 첫 줄부터 Step 순서대로
3. 저장 규칙: 모든 산출물은 /저장 명령어로 타입별 저장
4. 연결 참조: 각 파일 하단 "참고:" 링크 반드시 확인
5. 업데이트: 새 전략/기능 추가 시 이 파일(시스템 맵)도 동시 업데이트
```

---

*시스템 버전: 2.0 | 최종 업데이트: 2026-03-09 | 에이전트 18개 | 워크플로우 8개 | 전략 파일 11개*
