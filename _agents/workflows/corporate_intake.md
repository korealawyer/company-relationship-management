---
description: 기업·법인 신규 수임 접수 → CRM 등록 → 자동화 세팅 워크플로우
---

# 🏢 기업·법인 신규 수임 워크플로우

신규 기업 법인 의뢰인을 수임하고 CRM에 등록하는 표준 절차입니다.

---

## Step 1: 법인 기본 정보 수집
수집 항목:
- 법인명, 사업자등록번호, 법인등기번호
- 대표이사, 법무담당자 이름/이메일/전화
- 업종, 임직원 수, 연 매출 규모 (대략)
- 계열사 구조 (있을 경우)

도구: 법인 온보딩 설문지 (Google Form or 포털 내 폼)

---

## Step 2: CRM 등록
// turbo
```
(실 운영 시 스크립트 실행)
```

수동 처리:
1. `clients` 테이블 → 신규 추가 (type: corporation)
2. `clients_corporate` 확장 필드 입력 (법인등기번호, 담당자 등)
3. 의뢰인 Tier 분류: A/B/C (`_strategy/04_CORPORATE_CLIENT_PLAYBOOK.md` 기준)
4. 담당 변호사 배정 (`assigned_lawyer_id`)

---

## Step 3: 자문 계약서 생성 & 전자서명
- 계약 유형 선택: 월간 자문 (Basic/Standard/Premium)
- 자동화: cases → status: 'retained' 변경 → 전자서명 자동 요청 (`legal_ops.md` #4번)
- 계약서 서명 완료 → Supabase Storage 자동 보관

---

## Step 4: 자동화 세팅
- 계약 만료 알림: 60일/30일/7일 전 자동 알림 설정
- 정기 법무 리포트: 분기별 자동 생성 스케줄 등록
- 법인 담당자 포털 계정 발행 → 환영 이메일 자동 발송

---

## Step 5: 킥오프 미팅 등록
- cases 테이블 → 신규 사건 생성 (사건 유형: 법인 자문)
- consultations → 킥오프 미팅 일정 등록
- 담당 변호사 → 카카오 알림 자동 발송

---

## 완료 기준 (Acceptance Criteria)
- [ ] 법인 정보 CRM 등록 완료
- [ ] 전자서명 계약서 체결 완료
- [ ] 법인 담당자 포털 로그인 확인
- [ ] 자동화 알림 (계약 만료, 법령 변경) 설정 완료
- [ ] 킥오프 일정 등록 완료

---

참고: `_strategy/04_CORPORATE_CLIENT_PLAYBOOK.md`, `_agents/onboarding.md`
