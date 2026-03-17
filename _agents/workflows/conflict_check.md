---
description: 신규 의뢰인 등록 시 기존 DB 자동 교차 검사 → 이해충돌 확인 → 승인/거절 워크플로우
---

# ⚖️ 이해충돌 검사 워크플로우

신규 의뢰인 등록 시 기존 의뢰인 DB와 자동 교차 검사하여 이해충돌을 방지합니다.
변호사법 제31조 (수임 제한) 준수를 위한 필수 절차입니다.

---

## Step 1: 신규 의뢰인 등록 트리거 (자동)

TRIGGER: `clients` 테이블 INSERT 발생

자동 수집 항목:
- 의뢰인 이름 (또는 법인명)
- 사건 상대방 이름 목록 (`case_parties` 테이블에 기록 예정)
- 사건 유형 (소송/자문/계약 등)

---

## Step 2: 이해충돌 자동 교차 검사 (즉시)
// turbo
```
(lib/compliance/conflict-check.ts 자동 실행)
```

검사 로직:
```
1. 신규 의뢰인 이름 → 기존 의뢰인 DB 검색
   - 동일/유사 이름의 기존 의뢰인 여부
   - 동일/유사 법인명 여부

2. 신규 사건 상대방 → 기존 의뢰인 DB 역방향 검색
   - 상대방이 현재 or 과거 의뢰인인지
   - 상대방 법인과 관계회사가 의뢰인인지

3. 담당 변호사 기준 이해충돌 추가 검사
   - 배정된 변호사가 과거 같은 상대방을 대리한 이력
```

검사 결과 분류:
- **✅ CLEAR**: 이해충돌 없음 → 즉시 수임 진행
- **⚠️ POTENTIAL**: 유사 케이스 발견 → 변호사 검토 필요
- **🚨 CONFLICT**: 명백한 이해충돌 → 수임 불가 (대표 변호사 승인 없이)

---

## Step 3: CLEAR — 자동 수임 진행

검사 결과 CLEAR 시:
- clients.status = 'active' 자동 업데이트
- 담당 변호사에게 "이해충돌 검사 통과" 알림
- `conflict_check_logs` 테이블에 기록 (검사일시, 결과: CLEAR)
- 다음 절차: `_agents/workflows/corporate_intake.md` Step 2로 이동

---

## Step 4: POTENTIAL — 담당 변호사 검토 요청 (24시간 이내)

알림 내용:
```
🔍 이해충돌 잠재적 위험 감지

신규 의뢰인: [이름/법인명]
유사 기존 건: [기존 의뢰인명] (사건번호: [번호])

24시간 이내 검토 후 수임 여부를 결정해 주세요.

[ 수임 승인 ] [ 추가 검토 필요 ] [ 수임 거절 ]
```

변호사 판단 기준:
- 상대방 동일 여부 (법인은 계열사까지 확인)
- 비밀 정보 공유 가능성
- 이익 충돌 실질 여부

---

## Step 5: CONFLICT — 수임 불가 처리

자동 처리:
- clients.status = 'conflict_blocked' 업데이트
- cases.status = 'rejected_conflict' 업데이트
- 담당 변호사 + 대표 변호사에게 즉시 알림

의뢰인 안내:
```
안녕하세요, [의뢰인명] 귀하.

내부 검토 결과, 본 사안에 대해 수임이 어렵습니다.
구체적인 사유는 법적 보호 의무로 인해 상세히 안내드리기
어려운 점 양해 부탁드립니다.

타 법무법인 연결이 필요하시면 말씀해 주세요.
```

대체 법무법인 연결 옵션 (파트너십 활용):
- 파트너 로펌 리스트 → `_strategy/09_PARTNERSHIP_STRATEGY.md` 참조
- 의뢰인 동의 하에 파트너 로펌 소개 (레퍼럴 수수료 수취)

---

## Step 6: 검사 결과 로그 기록 (항상)

```sql
INSERT INTO conflict_check_logs (
  law_firm_id,
  new_client_id,
  checked_at,
  result,    -- CLEAR / POTENTIAL / CONFLICT
  matched_clients,  -- JSON 배열
  checked_by,  -- 'system' or 담당 변호사 ID
  approved_by  -- 대표 변호사 ID (POTENTIAL/CONFLICT 시)
)
```

---

## 완료 기준 (Acceptance Criteria)
- [ ] 이해충돌 자동 검사 실행 완료 (즉시)
- [ ] 검사 결과 CRM 기록 완료
- [ ] CLEAR: 수임 진행 | POTENTIAL: 변호사 검토 완료 | CONFLICT: 수임 거절 처리
- [ ] conflict_check_logs 테이블 기록 완료
- [ ] 의뢰인에게 결과 안내 (CONFLICT 시)

---

참고: `_agents/compliance.md` [이해충돌 검사 알고리즘], `_agents/corporate_lawyer.md`, `_strategy/02_MULTITENANT_ARCHITECTURE.md`
