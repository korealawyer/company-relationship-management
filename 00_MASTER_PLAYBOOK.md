# 📘 Master Playbook — 법무법인 CRM SaaS
*(1000억 ARR 목표 | 로펌 전용 B2B SaaS | 에이전트 운영 완전 가이드 v4.0)*

이 문서는 **기업·법인 CRM SaaS 플랫폼**을 구축하고  
**타 로펌에 판매**하기 위해 에이전트들을 지휘하는 종합 플레이북입니다.
👉 **전체 시스템 지도**: `00_SYSTEM_MAP.md` 참조

---

## 🗺️ 에이전트 지도 (Agent Map) — 23개 에이전트 완전판 v4.0

### 🔵 Strategic Layer — 전략 결정
| 에이전트 | 파일 | 역할 | 언제 쓰나 |
|---|---|---|---|
| 🏛️ **CEO** | `_agents/ceo.md` | 전략 총괄 (1000억 ARR) | 전략, 수익 모델, 투자자 대응 |
| 🧭 **PM** | `_agents/pm.md` | 기능 기획 디렉터 | 기능 기획, PRD, 우선순위 |
| 📊 **Data Analyst** | `_agents/data_analyst.md` | 데이터 분석 | KPI, MRR, Churn 코호트 분석 |
| 🔍 **Researcher** ⭐ NEW | `_agents/researcher.md` | 리서치 & 인텔리전스 | 판례 조사, 시장분석, 경쟁사 리서치 |

### 🟢 Revenue Layer — 수익 창출
| 에이전트 | 파일 | 역할 | 언제 쓰나 |
|---|---|---|---|
| 💼 **Sales** | `_agents/sales.md` | 세일즈 디렉터 | 로펌 세일즈, 데모, 계약, 협상 |
| 💰 **Finance** | `_agents/finance.md` | 재무 CFO | MRR 추적, 청구 자동화, 미납 관리 |
| 📣 **Marketing** | `_agents/marketing.md` | 마케팅 그로스 | SEO, 콘텐츠, 레퍼럴 프로그램 |
| 🤝 **Partnership** | `_agents/partnership.md` | 파트너십 | 변협, 회계법인, 리셀러 파트너 |
| 📈 **Growth** | `_agents/growth.md` | 그로스 해킹 | 채널별 성장, 바이럴, 실험 설계 |
| 🏪 **Franchise** ⭐ NEW | `_agents/franchise.md` | 프랜차이즈 영업 | 가맹본부 리드 발굴, AI 개인정보 분석 |
| 💹 **Investor** ⭐ NEW | `_agents/investor.md` | 투자자 관계 | Series A 준비, 투자 덱, VC 타겟팅 |

### 🟡 Delivery Layer — 서비스 전달
| 에이전트 | 파일 | 역할 | 언제 쓰나 |
|---|---|---|---|
| 🏢 **Corporate Lawyer** | `_agents/corporate_lawyer.md` | 기업법인 전담 | 기업 의뢰인 법무 자문, 계약 관리 |
| ⚙️ **Legal Ops** | `_agents/legal_ops.md` | 법률 자동화 | 자동화 설계, 트리거-액션 |
| 🚀 **Onboarding** | `_agents/onboarding.md` | 온보딩 | 신규 로펌 세팅, 데이터 마이그레이션 |
| 🎯 **CS Success** | `_agents/cs_success.md` | 고객 성공 | Churn 예방, 헬스스코어, 업셀 |
| 🤖 **AI Legal** | `_agents/ai_legal.md` | AI 법률 분석 | 판례 검색, 계약서 리뷰 |
| 💡 **AI Product** | `_agents/ai_product.md` | AI 제품 기획 | AI 기능 로드맵, 기술 사양, 데모 |
| 🧠 **EAP** ⭐ NEW | `_agents/eap.md` | EAP 심리지원 | 상담 운영, 위기 개입, 기업 복지 |
| 🏢 **Corp HR** ⭐ NEW | `_agents/corp_hr.md` | 기업 HR 포털 | 이사회 이벤트, 임직원 법무, EAP 연계 |
| 📰 **Newsletter** ⭐ NEW | `_agents/newsletter.md` | AI 뉴스레터 자동화 | 프랜차이즈 본사 AI 리포트 생성·발송 |

### 🔴 Infrastructure Layer — 시스템 기반
| 에이전트 | 파일 | 역할 | 언제 쓰나 |
|---|---|---|---|
| 💻 **Dev** | `_agents/dev.md` | 개발 디렉터 | 코드 구현, DB 설계, RLS |
| 🛡️ **Compliance** | `_agents/compliance.md` | 컴플라이언스 | 개인정보법, 변호사법, 보안 감사 |
| 🔒 **Security Auditor** | `_agents/security_auditor.md` | 보안 감사 | RLS 감사, 취약점 분석 |
| 🚀 **DevOps** ⭐ NEW | `_agents/devops.md` | 배포 & 인프라 | Vercel배포, Supabase운영, CI/CD |
| 📁 **Save Rules** | `_agents/antigravity_save_rules.md` | 저장 규칙 | 대화 저장 시 폴더 라우팅 |

---

## 🔄 워크플로우 맵 (전체 8개)

| 워크플로우 | 명령어 | 핵심 에이전트 | 사용 시점 |
|---|---|---|---|
| 기업 수임 접수 | `/corporate_intake` | corporate_lawyer | 신규 기업 법인 수임 시 |
| 계약 갱신 | `/contract_renewal` ⭐ NEW | legal_ops + finance | 계약 만료 60일 전 |
| 미납 수금 추적 | `/billing_chase` ⭐ NEW | finance + legal_ops | 납부 기한 초과 시 |
| 월간 법무 리포트 | `/monthly_report` ⭐ NEW | corporate_lawyer | 매월 말 자동 |
| 이해충돌 검사 | `/conflict_check` ⭐ NEW | compliance | 신규 의뢰인 등록 시 |
| SaaS 데모 세일즈 | `/saas_demo` | sales + onboarding | 데모 예약 시 |
| 해지 방어 | `/saas_churn` ⭐ NEW | cs_success + sales | 헬스스코어 이상 시 |
| 파일 저장 | `/저장` | - | 대화 종료 시 |

---

## 🚀 PHASE 0: SaaS 세일즈 (타 로펌 판매)
*"타 로펌을 유료 고객으로 만드는 단계"*

1. **[리드 발굴]** → `_agents/marketing.md` + `_agents/partnership.md`
   - "변호사 10명 규모 로펌 대상 인바운드 리드 50건 만들어줘"

2. **[데모 준비]** → `/saas_demo` + `_agents/sales.md`
   - "이 로펌의 Pain Point 기반 40분 데모 스크립트"

3. **[파일럿 온보딩]** → `_agents/onboarding.md`
   - 30일 무료 파일럿 세팅 + 데이터 마이그레이션

4. **[유료 전환]** → `_agents/sales.md` + `_strategy/08_PRICING_STRATEGY.md`
   - Day 21 전환 제안 스크립트 + 업셀 타이밍

5. **[해지 방어]** → `/saas_churn`
   - 헬스스코어 < 50점 감지 → 즉시 개입

---

## 🏢 PHASE 1-A: 기업·법인 고객 관리 (자사 운영)
*"기업 의뢰인을 장기 파트너로 만드는 단계"*

1. **[신규 기업 수임]** → `/conflict_check` → `/corporate_intake`
   - 이해충돌 검사 → 법인 정보 등록 → 자동화 세팅

2. **[법인 법무 자문]** → `_agents/corporate_lawyer.md`
   - 계약 포트폴리오 관리, 이사회 지원, 규제 준법

3. **[자동화 설계]** → `_agents/legal_ops.md` + `_strategy/06_CORPORATE_AUTOMATION_BIBLE.md`
   - "이 법인의 계약 만료 + 이사 임기 알림 자동화 설계해줘"

4. **[월간 리포트]** → `/monthly_report`
   - 매월 자동 생성 → 담당 변호사 검토 → 기업 발송

5. **[수임료 관리]** → `/billing_chase` + `_agents/finance.md`
   - 미납 D+1/7/14 자동 추적

---

## 🛠️ PHASE 2: 제품 개발 (Build)
*"PRD를 코드로 바꾸는 메인 이벤트"*

1. **[기획]** → `_agents/pm.md` → `_agents/ceo.md` (결정)

2. **[개발]** → `_agents/dev.md` → Antigravity에 직접 지시
   - "Next.js + Supabase RLS로 구현. JWT law_firm_id 클레임 필수"

3. **[AI 기능]** → `_agents/ai_product.md` + `_strategy/07_AI_PRODUCT_ROADMAP.md`
   - "판례 검색 AI 기능 Phase 1 구현 스펙 작성해줘"

4. **[보안 감사]** → `_agents/compliance.md` + `_agents/security_auditor.md`
   - "RLS 전체 테이블 감사 + 개인정보법 체크리스트"

---

## 📊 PHASE 3: 수익 성장 (Measure & Scale)
*"숫자로 다음 액션을 결정하는 단계"*

1. **[KPI 대시보드]** → `_agents/data_analyst.md` + `_agents/finance.md`
   - "이달 MRR, NRR, Churn Rate, 자동화 건수 분석"

2. **[1000억 로드맵 추적]** → `_strategy/00_REVENUE_ROADMAP.md`
   - 연도별 목표 vs 실적 비교

3. **[투자 준비]** → `_strategy/10_INVESTOR_NARRATIVE.md` + `_agents/ceo.md`
   - Series A 투자자 미팅 자료 준비

4. **[파트너 채널]** → `_strategy/09_PARTNERSHIP_STRATEGY.md`
   - 회계법인, 변협 파트너십 협약

---

## 📁 전략 파일 완전 맵 (11개)

| 번호 | 파일 | 핵심 내용 |
|---|---|---|
| `00` | `REVENUE_ROADMAP.md` | 1000억 ARR 연도별 목표 + Phase 계획 |
| `01` | `LAWFIRM_SAAS_PLAYBOOK.md` | Pain Point 15가지 + 데모 스크립트 |
| `02` | `MULTITENANT_ARCHITECTURE.md` | Supabase RLS 멀티테넌트 설계 |
| `03` | `AUTOMATION_CATALOG.md` | 전체 자동화 카탈로그 40개+ |
| `04` | `CORPORATE_CLIENT_PLAYBOOK.md` | 기업법인 Tier 분류 + 자문 구조 |
| `05` | `SAAS_SALES_PLAYBOOK.md` | 타 로펌 B2B 세일즈 바이블 |
| `06` ⭐ NEW | `CORPORATE_AUTOMATION_BIBLE.md` | 기업법인 100개 자동화 완전 가이드 |
| `07` ⭐ NEW | `AI_PRODUCT_ROADMAP.md` | AI 기능 4단계 출시 로드맵 |
| `08` ⭐ NEW | `PRICING_STRATEGY.md` | 가격 전략 + 업셀 플레이북 |
| `09` ⭐ NEW | `PARTNERSHIP_STRATEGY.md` | 파트너십 채널 (변협, 회계법인) |
| `10` ⭐ NEW | `INVESTOR_NARRATIVE.md` | 투자자 내러티브 + Exit 시나리오 |

---

## 💡 시스템 핵심 요약

**2트랙 비즈니스 Flywheel:**
```
Track A (자사 운영): 기업 의뢰인 → 완성도 향상 → 레퍼런스
        ↓
Track B (SaaS 판매): "우리가 쓰는 그 시스템" → 타 로펌 판매 → 1000억 ARR
        ↓
AI 기능 → 이탈 비용 증가 → Churn 감소 → NRR 110%+ → 성장 가속 ♻️
```

**대표님은 코드를 몰라도 됩니다.**
에이전트 23개 + 워크플로우 8개를 상황에 맞게 지휘하면 됩니다.
👉 모든 연결 관계는 `00_SYSTEM_MAP.md`에서 확인하세요.

**🎯 목표: 1000억 ARR. 이 시스템이 그 기반입니다.**
