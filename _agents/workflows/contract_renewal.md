---
description: 기업·법인 자문 계약 만료 → 갱신 협상 → 전자서명 완결 자동화 워크플로우
---

# 🔄 계약 갱신 워크플로우

기업 법인 의뢰인의 자문 계약이 만료되기 전 자동으로 갱신 절차를 시작합니다.

---

## Step 1: 만료 예정 계약 자동 감지 (D-60)
// turbo
```
(Supabase Edge Function: pg_cron 매일 09:00 실행)
SELECT * FROM contracts 
WHERE expires_at = CURRENT_DATE + 60
  AND law_firm_id = [FIRM_ID]
  AND status = 'active'
```

자동 실행:
- `contracts` 테이블에서 만료 60일 전 계약 목록 조회
- 담당 변호사에게 이메일: "계약 갱신 검토 필요 — [법인명] 자문 계약"
- cases 테이블에 신규 항목 생성 (유형: 계약갱신, status: 'pending_review')

---

## Step 2: 고객 갱신 의향 확인 (D-45)

담당 변호사 액션:
1. 법인 법무 담당자에게 갱신 의향 문의 이메일 발송
2. CRM에 응답 기록 (갱신/해지/협상/보류)
3. 응답 결과 → cases.notes에 기록

갱신 의향 확인 이메일 템플릿:
```
제목: [법인명] 법무 자문 계약 갱신 안내

안녕하세요, [담당자명] 님.

저희 법무법인과의 자문 계약이 [날짜]에 만료됩니다.
계속해서 법무 자문 서비스를 이용하시겠습니까?

[ 갱신 희망 ] [ 조건 협의 희망 ] [ 계약 종료 ]

이 이메일에 회신 주시거나, 담당 [변호사명] 변호사(010-XXXX-XXXX)에게 연락해 주세요.
```

---

## Step 3: 갱신 조건 협의 (D-30)

조건 협의 가이드 (담당 변호사 참고):
- 현재 요금에서 업그레이드 제안 (업셀 기회)
- 연간 계약 전환 시 10% 할인 (현금 흐름 개선)
- 서비스 범위 확대 제안 (추가 계열사 포함 등)
- 해지 위험 시 → `_agents/cs_success.md` 헬스스코어 점검

협의 완료 → cases.status = 'negotiating' 업데이트

---

## Step 4: 신규 계약서 생성 & 전자서명 (D-14)

// turbo
```
(실 운영 시) contracts 테이블 → 신규 갱신 계약서 생성
```

자동 처리:
1. 기존 계약 조건 복사 + 변경 사항 반영
2. 계약서 PDF 자동 생성 (renewal_contract 템플릿)
3. 전자서명 API 요청 (이폼싸인) → 법인 담당자에게 카카오/이메일 발송
4. contracts.status = 'sent'

---

## Step 5: 서명 완료 처리 (서명 후 즉시)

서명 완료 웹훅 수신 시:
- contracts.status = 'signed', signed_at 업데이트
- 기존 계약 expires_at 연장 (또는 신규 계약으로 대치)
- 담당 변호사 + 사무장에게 "계약 갱신 완료" 알림
- 갱신 자문료 청구서 자동 생성 → `_agents/finance.md` 청구 파이프라인 진입

---

## Step 6: 미갱신 계약 에스컬레이션 (D-7)

D-7까지 서명 미완료 시:
- 대표 변호사에게 에스컬레이션 알림
- 법인 담당자에게 최종 독촉 연락
- 해지 가능성 → `_agents/workflows/saas_churn.md` 참조 (SaaS 고객의 경우)

---

## 완료 기준 (Acceptance Criteria)
- [ ] 만료 60일 전 자동 감지 및 알림 완료
- [ ] 갱신 의향 확인 완료 (수신 기록 CRM 기입)
- [ ] 신규 계약서 전자서명 완료
- [ ] 갱신 자문료 청구서 발송 완료
- [ ] contracts 테이블 상태 'active' 업데이트

---

참고: `_agents/legal_ops.md` #6, `_agents/finance.md`, `_agents/corporate_lawyer.md` [3]계약 포트폴리오 관리
