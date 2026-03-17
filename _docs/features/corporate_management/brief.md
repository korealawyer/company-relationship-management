# 🏢 기업·법인 관리 모듈 — 기능 기획서 (Brief)
*(Corporate Client Management Module PRD v1.0)*

---

## 모듈 개요

| 항목 | 내용 |
|---|---|
| 모듈명 | 기업·법인 관리 (Corporate Client Management) |
| 우선순위 | P1 (개인 의뢰인 모듈 완성 후 즉시) |
| 예상 개발 기간 | 4주 |
| 담당 에이전트 | `@pm`, `@dev`, `@legal_ops` |
| 목표 | 기업 법인 의뢰인의 장기 관계 관리 + 자동화로 법인 LTV 극대화 |

---

## 비즈니스 목표

1. **법인 고객 LTV 극대화**: 단건 수임 → 연간 자문 계약 전환율 50% 이상
2. **법인 관계 이탈 방지**: 담당자 이직 등 이탈 신호 조기 감지 (헬스 스코어)
3. **SaaS 차별화**: 개인 의뢰인 CRM과 구분되는 기업 법무 전용 기능으로 Enterprise 계약 유도

---

## 페르소나

| 역할 | 관심사 | Pain Point |
|---|---|---|
| 파트너 변호사 | 법인 관계 유지, 자문 수익 | 법인 계약 만료 놓침, 계열사 추가 수임 기회 미포착 |
| 사무장 | 계약 관리, 청구 | 여러 법인 계약 만료일 추적 어려움 |
| 법인 법무담당자 | 빠른 응답, 투명한 진행 상황 | 로펌에 일일이 연락해야 현황 파악 가능 |

---

## 핵심 기능 목록

### Feature 1: 법인 프로필 확장 (clients_corporate)
```
법인 기본 정보:
  - 법인등기번호, 사업자등록번호 (AES-256 암호화)
  - 설립일, 업종, 임직원 수, 연 매출 규모
  - 대표이사, 법무담당자 (이름/이메일/전화)

법인 구조:
  - 모회사 연결 (parent_company_id)
  - 자회사 목록 (계열사 관계 맵)
  - 주요 주주 정보 (JSON)

계약 관리:
  - 자문 Tier (A/B/C)
  - 월간 자문료
  - 계약 기간 (start_date ~ end_date)
  - 정기 미팅 주기

리스크 관리:
  - 법무 리스크 점수 (0~10)
  - 주요 법무 리스크 태그 배열
  - 마지막 리스크 진단일
```

### Feature 2: 기업 법무 대시보드
화면 구성:
  - 상단: 법인명, Tier, 담당 변호사, 계약 현황 (D-Day)
  - 중단: 진행 중 사건 목록 (사건명, 상태, 마감일)
  - 하단: 최근 법무 이슈 타임라인, 다음 정기 미팅

### Feature 3: 법인 포털 (법인 담당자 전용)
기존 의뢰인 포털 확장:
  - 법인 담당자 로그인 → 法人별 격리 (기존 CLIENT 역할 재활용)
  - 진행 중 모든 사건 목록 조회
  - 계약 만료 현황 알림
  - 법무 리포트 다운로드

### Feature 4: 계약 자동 갱신 플로우
자동화 연동 (#31, #32 자동화 카탈로그):
  D-60: 담당 변호사 알림 + 갱신 검토 시작
  D-30: 갱신 제안서 자동 생성 + 발송
  D-7: 갱신 확정 or 미갱신 에스컬레이션
  D-0: 계약 만료 → cases.status 자동 변경

---

## DB 스키마

```sql
-- 기업 법인 확장 테이블
CREATE TABLE clients_corporate (
  client_id uuid PRIMARY KEY REFERENCES clients(id),
  law_firm_id uuid NOT NULL REFERENCES law_firms(id),

  -- 법인 기본 정보
  corp_registration_number text,       -- AES-256 암호화
  business_registration_number text,   -- AES-256 암호화
  founding_date date,
  industry text,
  employee_count int,
  annual_revenue_range text,           -- '10억미만' | '10~50억' | '50억이상'

  -- 법인 구조
  parent_company_id uuid REFERENCES clients(id),

  -- 법무 담당자
  legal_contact_name text,
  legal_contact_email text,
  legal_contact_phone text,
  ceo_name text,

  -- 자문 계약
  retainer_tier text CHECK (retainer_tier IN ('A', 'B', 'C')),
  retainer_monthly_fee numeric,
  retainer_start_date date,
  retainer_end_date date,
  review_cycle text CHECK (review_cycle IN ('monthly', 'quarterly', 'biannual')),

  -- 리스크
  risk_score int DEFAULT 0,
  last_risk_assessment_at date,
  key_legal_risks text[],

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS 활성화 필수
ALTER TABLE clients_corporate ENABLE ROW LEVEL SECURITY;
CREATE POLICY "firm_isolation" ON clients_corporate
  FOR ALL USING (law_firm_id = (auth.jwt() ->> 'law_firm_id')::uuid);
```

---

## Acceptance Criteria

- [ ] 기업 법인 등록 시 확장 필드 입력 폼 표시
- [ ] 법인 대시보드: 진행 중 사건 + 계약 만료 D-Day 표시
- [ ] 법인 담당자 포털 로그인 → 법인 사건만 조회 가능
- [ ] 계약 만료 D-60 자동 알림 발송 확인
- [ ] 계열사 연결 (parent_company_id) 시 관계 맵 표시
- [ ] risk_score 계산 로직 작동 확인

---

## 변호사법/개인정보보호법 체크

- [ ] 법인등기번호 AES-256 암호화 저장
- [ ] 사업자등록번호 AES-256 암호화 저장
- [ ] 법인 담당자 개인정보 수집 동의 항목 확인
- [ ] 계열사 정보: 해당 법인 담당 변호사만 열람 가능

---

*생성일: 2026-03-09 | Corporate Client Management Brief v1.0*
