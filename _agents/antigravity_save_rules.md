# 💾 Antigravity 저장 규칙 (Save Rules)
# 법무법인 CRM SaaS — 에이전트 지식 축적 & 라우팅 프로토콜

> **이 파일의 목적**: 세션이 끝나도 지식이 사라지지 않고 축적되게 하는 절대 규칙.
> 모든 에이전트는 결론 도출 즉시 이 규칙에 따라 저장한다.

---

## 1. 📂 @에이전트별 저장 위치 (라우팅 맵)

| 에이전트 태그 | 파일 | 저장 폴더 | 파일명 규칙 |
|---|---|---|---|
| `@ceo`, `@vc`, `@coach` | `ceo.md` | `_strategy/` | `YYYYMMDD_주제.md` |
| `@pm` | `pm.md` | `_docs/features/[기능명]/` | `brief.md` |
| `@dev` | `dev.md` | 루트 `00_MASTER_TASK.md` 업데이트 | — |
| `@sales`, `@cs` | `sales.md` | `_docs/sales/` | `sales_[주제].md` |
| `@legal_ops`, `@automation` | `legal_ops.md` | `_docs/ops/` | `ops_[자동화명].md` |
| `@growth`, `@seo`, `@marketing` | `growth.md` | `_docs/growth/` | `growth_[채널명].md` |
| `@data`, `@analytics` | `data_analyst.md` | `_docs/ops/` | `data_[주제].md` |
| `@auditor`, `@security` | `security_auditor.md` | `_logs/` | `audit_YYYYMMDD.md` |
| `@onboarding` | `onboarding.md` | `_docs/ops/` | `onboarding_[로펌명].md` |
| `@ai_legal`, `@판례` | `ai_legal.md` | `_docs/features/ai_legal/` | `ailegal_[기능명].md` |
| `@cs_success`, `@churn` | `cs_success.md` | `_docs/sales/` | `cs_[로펌명]_[이슈].md` |
| `@partnership`, `@partner` | `partnership.md` | `_strategy/` | `partner_[파트너명].md` |
| `@mentor` | — | `00_PROJECT_JOURNAL.md` 업데이트 | — |
| `@researcher`, `@research`, `@리서치` | `researcher.md` | `_docs/research/` | `research_[주제].md` |
| `@eap`, `@counselor`, `@심리` | `eap.md` | `_docs/ops/` | `eap_[기업명]_[날짜].md` |
| `@franchise`, `@가맹`, `@crm팀` | `franchise.md` | `_docs/sales/` | `franchise_[브랜드명].md` |
| `@investor`, `@vc팀`, `@투자` | `investor.md` | `_strategy/` | `investor_[VC명]_[날짜].md` |
| `@devops`, `@infra`, `@배포` | `devops.md` | `_logs/` | `devops_[날짜]_[이슈].md` |
| `@corp_hr`, `@hr`, `@인사` | `corp_hr.md` | `_docs/ops/` | `hr_[기업명]_[주제].md` |

---

## 2. 🚦 저장 트리거 (언제 저장하나)

```
✅ SAVE NOW 트리거:
  1. 가격/요금제 변경 결정 → _strategy/00_REVENUE_ROADMAP.md 업데이트
  2. 신규 기능 기획 완료 → _docs/features/[기능명]/brief.md 생성
  3. SEO 키워드/콘텐츠 결정 → _docs/seo/ 업데이트
  4. DB 스키마 변경 → _strategy/02_MULTITENANT_ARCHITECTURE.md 업데이트
  5. 아키텍처 중요 결정 → _strategy/02_MULTITENANT_ARCHITECTURE.md 업데이트
  6. 신규 자동화 설계 → _strategy/03_AUTOMATION_CATALOG.md 업데이트
  7. 로펌 세일즈 전략 변경 → _strategy/01_LAWFIRM_SAAS_PLAYBOOK.md 업데이트
  8. 세션 마무리 → 00_PROJECT_JOURNAL.md에 Today 요약 1~3줄 추가

❌ 저장 안 해도 되는 것:
  - 단순 브레인스토밍 아이디어 (결론 나기 전)
  - 에이전트가 임시로 제안한 초안
  - 반복되는 질문/답변
```

---

## 3. 📝 핸드오버 템플릿 (에이전트 간 인계)

다음 에이전트에게 넘길 때 반드시 이 템플릿 사용:

```markdown
[핸드오버 요약]
- 이전 작업자: @[에이전트명]
- 핵심 목적: (한 줄 요약)
- 절대 어기면 안 되는 제약: (예: 기존 DB 스키마 건드리지 말 것, 개인정보보호법 준수)
- 다음 작업자 할 일: (구체적인 액션 1~3개)
- 참고 파일: _docs/[관련 파일 경로]
```

---

## 4. 🏷️ 파일 네이밍 컨벤션

```
✅ 올바른 파일명:
  20260309_crm_dashboard_spec.md
  seo_franchise_keywords.md
  growth_naver_blog.md
  audit_20260309.md

❌ 잘못된 파일명:
  메모.md          ← 한글 단독 (CLI 에러)
  new_file(1).md   ← 괄호 사용
  Strategy_Final_v3_REAL.md  ← 버전 넘버 파일명
  untitled.md      ← 내용 불명확
```

---

## 5. 🔄 `/저장` 슬래시 명령어 상세 동작

```
💬 사용자: /저장

에이전트 동작 순서:
1. 현재 대화 핵심 결론 1~3개 추출
2. 내용 유형 판단 (전략/SEO/기능기획/운영 중 택1)
3. 해당 폴더로 자동 라우팅:
   - 전략 → _strategy/YYYYMMDD_[주제].md
   - SEO → _docs/seo/seo_[주제].md
   - 기능 기획 → _docs/features/[기능명]/brief.md
4. 저장 완료 후 00_PROJECT_JOURNAL.md에 Today 행 업데이트

예외: 유형 판단 불가 시 → _logs/[YYYYMMDD]_misc.md 저장 후 확인 요청
```

---

## 6. 📚 폴더 구조 최종 기준

```
c:\projects\company-relationship-management\
│
├── _agents/           🤖 AI 에이전트 프롬프트 (23개)
│   ├── ceo.md         (전략 & 1000억 목표)
│   ├── pm.md          (기능 기획 & PRD)
│   ├── dev.md         (개발 & RLS 아키텍처)
│   ├── sales.md       (로펌 세일즈)
│   ├── legal_ops.md   (자동화 설계)
│   ├── growth.md      (마케팅 & SEO)
│   ├── data_analyst.md (KPI & 분석)
│   ├── researcher.md  (리서치 & 인텔리전스) [NEW]
│   ├── eap.md         (EAP 심리지원) [NEW]
│   ├── franchise.md   (프랜차이즈 영업) [NEW]
│   ├── investor.md    (투자자 관계) [NEW]
│   ├── devops.md      (배포 & 인프라) [NEW]
│   ├── corp_hr.md     (기업 HR 포털) [NEW]
│   └── workflows/     ⚡ /슬래시 명령어 워크플로우
│
├── _strategy/         🧠 경영 전략 & 아키텍처 문서
│   ├── 00_REVENUE_ROADMAP.md    (1000억 ARR 수익 로드맵)
│   ├── 01_LAWFIRM_SAAS_PLAYBOOK.md (로펌 세일즈 플레이북)
│   ├── 02_MULTITENANT_ARCHITECTURE.md (RLS 다중 테넌트 설계)
│   └── 03_AUTOMATION_CATALOG.md (자동화 30개 카탈로그)
│
├── _docs/             📚 분석·기획 문서 (인간이 읽는 문서)
│   ├── seo/           (SEO 분석 & 키워드 전략)
│   ├── features/      (기능별 기획서)
│   │   └── [기능명]/brief.md
│   ├── growth/        (채널별 그로스 전략)
│   ├── sales/         (영업 & 고객 전환 전략)
│   └── ops/           (운영 자동화 & 시스템)
│
├── _logs/             📋 감사 로그 & 실험 기록
│
├── 00_~12_*.md        📖 프로젝트 헌법 (핵심 문서)
│
└── src/               🖥️ Next.js 앱 코드
```

---

*최종 업데이트: 2026-03-10 | 에이전트 23개 완전판 — researcher/eap/franchise/investor/devops/corp_hr 추가*
