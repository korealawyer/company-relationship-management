---
description: 기업 법인 의뢰인을 위한 월간 법무 리포트 자동 생성 → 검토 → 발송 워크플로우
---

# 📊 월간 법무 리포트 자동 생성 워크플로우

매월 말일 기업 법인 의뢰인별로 법무 현황 리포트를 자동 생성하고 발송합니다.

---

## Step 1: 리포트 생성 트리거 (매월 말일 18:00)
// turbo
```
(Supabase Edge Function: pg_cron '0 18 L * *' 매월 말일)

-- 월간 리포트 대상 기업 법인 의뢰인 조회
SELECT c.*, lf.name as law_firm_name
FROM clients c
JOIN law_firms lf ON c.law_firm_id = lf.id
WHERE c.type = 'corporation'
  AND c.status = 'active'
  AND c.monthly_report_enabled = true
```

---

## Step 2: 데이터 자동 수집 (법인별)

자동 집계 항목:

```sql
-- 이달 사건 현황
SELECT 
  COUNT(*) FILTER (WHERE status = 'active') as active_cases,
  COUNT(*) FILTER (WHERE status = 'closed' AND closed_at >= DATE_TRUNC('month', NOW())) as closed_this_month,
  COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('month', NOW())) as new_this_month
FROM cases
WHERE client_id = [CLIENT_ID]

-- 계약 만료 예정 (다음 60일)
SELECT title, expires_at, counterpart_name
FROM contracts
WHERE client_id = [CLIENT_ID]
  AND expires_at BETWEEN NOW() AND NOW() + INTERVAL '60 days'
  AND status = 'active'
ORDER BY expires_at ASC

-- 이달 청구 및 수금 현황
SELECT 
  SUM(amount) as total_billed,
  SUM(amount) FILTER (WHERE status = 'paid') as total_paid,
  SUM(amount) FILTER (WHERE status IN ('pending','overdue')) as outstanding
FROM billing
WHERE client_id = [CLIENT_ID]
  AND created_at >= DATE_TRUNC('month', NOW())
```

---

## Step 3: AI 리포트 초안 생성

GPT-4o를 활용하여 데이터 → 리포트 문장 자동 변환:

입력 데이터:
- 이달 사건 현황 (신규/진행중/완료)
- 계약 만료 예정 목록
- 이달 완료된 주요 성과 (consultation.notes에서 추출)
- 다음 달 예정 업무

출력 형식:
```
[법인명] 법무 리포트 — [YYYY]년 [M]월

━━━━━━━━━━━━━━━━━━━━━━━━━
■ 이달 사건 현황
  진행 중: [N]건 | 이달 완료: [K]건 | 신규 수임: [M]건

■ 계약 만료 예정 (60일 이내)
  [계약명] — [상대방] — 만료: [날짜]
  [위험도: 높음/보통] 담당 변호사 조치 필요

■ 이달 주요 성과
  ✅ [성과 1]
  ✅ [성과 2]

■ 다음 달 예정 업무
  📅 [이사회/주주총회/계약 협상 등]

■ 법무 비용 현황
  이달 청구: [금액]원 | 수금: [금액]원 | 미납: [금액]원

■ 리스크 알림
  ⚠️ [리스크 1 — 조치 제안]

담당: [변호사명] 변호사 | [이메일] | [전화]
━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Step 4: 담당 변호사 검토 (24시간 이내)

담당 변호사 알림:
"[법인명] 월간 리포트 초안이 생성됐습니다. 검토 후 발송 승인해 주세요."

검토 포인트:
- [ ] 사건 현황 수치 정확성 확인
- [ ] 민감 정보 표현 적절성 (직접적 소송 내용 제외)
- [ ] 다음 달 예정 업무 누락 여부
- [ ] 비용 청구 정확성 확인
- [ ] 리스크 알림 내용 추가/수정

검토 완료 → "발송 승인" 버튼 클릭 → Step 5 자동 진행

---

## Step 5: 리포트 발송 (승인 즉시 자동)

발송 방법:
1. 이메일 발송 — 법인 법무 담당자 + (선택) 대표이사 참조
2. 의뢰인 포털 내 업데이트로도 게시
3. (Enterprise) PDF 리포트 다운로드 링크 포함

자동 기록:
- consultations 테이블에 월간 리포트 항목 생성
- 발송 완료 → automation_logs 기록

---

## Step 6: 리포트 분석 활성화 (익월 초)

다음 달 1일 자동:
- 리포트 열람 여부 확인 (이메일 오픈율 체크)
- 미열람 72시간 경과 → 담당 변호사에게 알림
- 의뢰인 피드백 수집 폼 자동 발송 (분기별)

---

## 완료 기준 (Acceptance Criteria)
- [ ] 모든 활성 법인 의뢰인 리포트 초안 자동 생성 완료
- [ ] 담당 변호사 검토 + 승인 완료
- [ ] 이메일 발송 + 포털 게시 완료
- [ ] automation_logs 기록 완료
- [ ] 클라이언트 열람 추적 완료

---

참고: `_agents/corporate_lawyer.md` PART 3, `_agents/legal_ops.md`, `_strategy/06_CORPORATE_AUTOMATION_BIBLE.md`
