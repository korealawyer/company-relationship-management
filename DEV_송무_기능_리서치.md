# 🏛️ DEV 송무(사건관리) 기능 리서치 결과
> 기준일: 2026-03-11 | 출처: 로탑 실제 메뉴 스크린샷 + LAWTOP_IA_DEEP_RESEARCH.md + DEV_MASTER문서

---

## 📌 리서치 요약

로탑이 **실제로 사용 중인 메뉴 전체**를 스크린샷으로 분석하고, `LAWTOP_IA_DEEP_RESEARCH.md` 및 `DEV_MASTER송무계약서관련.md`를 교차 검토하여 **현재 DEV에서 구현 필요한 송무 관련 기능**을 도출했습니다.

---

## 🗂️ PART 1 — 로탑 실제 메뉴 전체 구조 (스크린샷 직접 추출)

### 탑메뉴 바 (상단 네비게이션)
```
환경설정 | 사건/종결 | 고객관리 | 기일/일정 | TC/TM | 문서관리 | 공유자료실 | 업무지원 | 공지/게시 | 수납/통계 | 구성원전용 | 전자결재 | My Page | 멀티뷰 | 고객지원 | 로탑카운
```

---

### 📁 사건/종결 메뉴 (스크린샷 확인)
```
사건등록
  ├── 신건등록          ← 핵심 (의뢰인/상대방/사건명/사건번호/수임일/대분류/소분류)
  └── 사건 일괄등록

사건관리
  ├── 현행 사건 홈       ← 대시보드 메인
  ├── 사건메모/History  ← 타임라인 메모
  ├── 이해충돌체크       ← 자동 검사
  ├── 사건담당/주담당 일괄변경
  ├── 사건담당자 관리이력
  └── 의뢰인측 담당자 일괄변경

종결사건
  ├── 자동종결 예정건
  ├── 종결 홈
  ├── 일괄종결처리
  ├── 종결리스트
  └── 삭제리스트

기관관련
  ├── 대법원 파싱봇      ← 기일 자동 수집
  ├── 진행정보 파싱종합
  ├── 법원 경유 리스트관리
  └── 나의 참고사건
```

> **신건등록 실제 입력 필드** (스크린샷 확인):
> - 1. 기초사항: 사건 고유번호(Key), 기존사건호출등록, 대분류, 소분류, 심급, 수임일, 등록일, 등록인, 자문/TC체크
> - 2. 계속기관: 법원등/수사기관기타(검찰등), 법원(가관), 사건번호, 장소(재판정), 사건명
> - 3. 당사자: 의뢰인/상대방/제3자(관계인), 의뢰인명, 호출입력/중복체크, 공동추가, 내부관계인, 유형(법인/자연인), 대표자명, 직위, 이동전화, 이메일, 전화, 팩스, 주소, 우편번호, 비고
> - 4. 수임/수행/보조: 수임, 수행, 보조, 주수임/지정, 주수행/지정, 주보조/지정
> - **하단 상태바**: 심수연, 접속확인, 내일정, SMS, FAX, 도움말, 사건픽, 연락처픽, 관례/법령/뉴스, 법조인대관

---

### 📁 수납/통계 메뉴 (스크린샷 확인)
```
계약
  └── 사건별 계약정보

사건별 종합
  ├── 사건별 <수임료> 종합
  ├── 사건별 <실비> 종합
  └── 사건별 <수임료+실비> 종합

건별 관리 (핵심!)
  ├── 건별 청구/미수     ← 청구원금, 청구세금, 청구합계, 입금합계, 미수합계 표시
  ├── 사건별 청구/미수
  ├── 건별 입금          ← 입금일, 의뢰인, 구분, 항목, 입금액, 입금수단, 입금계좌, 입금명의인, 사건명, 사건번호
  ├── 사건별 입금
  ├── 지출관리
  ├── 지급품의서 종합
  ├── 청구서 리스트
  ├── 세금계산서 종합
  ├── 현금영수증 종합
  └── 수납 관리이력

분배/계좌
  ├── 기여분배 관리
  ├── 수임비율 / TM분배
  ├── 은행연동 계좌열람
  └── 계좌 - 수납관리

통계
  ├── 전체 통계/그래프
  └── 개인별 통계
```

---

### 📁 업무지원 메뉴 (스크린샷 확인)
```
계산 (법적 계산 도구)
  ├── 손해배상(원고용)
  ├── 손해배상(간이)     ← 실제로 있음
  ├── 부동산 가액/소가 계산
  ├── 소송비용 계산
  ├── 기간 계산
  ├── 이자 계산
  ├── 가압류비용 계산
  ├── 상속분 계산
  └── 불변기한 등 계산/입력

연락
  ├── 내부 홈
  ├── 내부연락처
  ├── 업무연락처(외부)
  ├── 연락처 퀵 검색
  ├── 우편번호 검색
  ├── 문자메시지(SMS, MMS)
  ├── 문자발신리스트
  └── 누구전화?

관리
  ├── 회의실관리
  ├── 도서관리
  ├── 출타 관리
  └── 배차/예약관리

기타
  ├── 법률서식
  ├── 법조인대관 사용인증/수정
  ├── 한국법조인대관
  ├── 로탑 업데이트 공지
  ├── 로탑 사용설명서
  └── 로탑 설치파일 다운로드 링크
```

---

### 📁 My Page 메뉴 (스크린샷 확인)
```
설정
  ├── 나의 설정
  ├── 내 정보 수정
  ├── 내 사건홈 항목위치 설정
  ├── 내 TC 기초단가
  └── 내 E-Mail β

일정/협업
  ├── 내일정
  ├── 로탑 메신저
  ├── 협업/Todo
  ├── 내 상담관리
  └── 나의 전자결재 종합

Data
  ├── 내 문서
  ├── 내 TC/TM 종합
  ├── 내 S-Memo 종합
  ├── 사건메모/History
  └── 나의 참고사건

기타
  ├── 최근사용메뉴 / 외부사이트
  └── 누구전화?
```

---

## 🔍 PART 2 — 현재 DEV 진행 현황 (창별 스프린트)

| 창 | 스프린트 | 상태 | 내용 |
|---|---|---|---|
| 창 1 | Sprint B (DocComment) | ⚙️ 진행중 | 문서허브 + 코멘트 시스템 |
| 창 2 | Sprint C (Esign) | ⏸️ Sprint B 완료 후 | 전자계약 직접 구현 |
| **창 3** | **MVP #1+#2 (사건/기일)** | **🔴 병렬 진행** | **사건 대시보드 + 기일 알림** |  
| 창 4 | C3 (결제) | ⏸️ Sprint C 완료 후 | SaaS 결제·구독 플로우 |

> ✅ 창 3 (송무 핵심)은 창 1/2와 **독립적으로 Day 1부터 병렬 가능**

---

## 📋 PART 3 — 현재 DEV 송무 관련 미구현 기능 갭 분석

### ✅ 이미 설계 완료된 것 (DEV_MASTER 창 3)
| 기능 | 테이블 | 완료 기준 |
|---|---|---|
| 사건 대시보드 | `cases` + `case_timeline` | 칸반 5단계 + RBAC |
| 이해충돌 체크 | `cases.opponent` × `tenant_id` | 충돌 시 409 반환 |
| 기일 등록 + 알림 스케줄 | `hearings` + `scheduled_alerts` | D-14/7/3/1/0 자동 생성 |
| 불변기일 관리 | `hearings.is_immutable` | D-14 특별 경고, 대표 CC |
| 알림 발송 | `notification_logs` | 카카오 → SMS fallback |

### 🔴 로탑 대비 **누락된 송무 기능** (미설계 상태)

#### 1. 신건등록 폼 — 상세 필드 부족
```
로탑 실제 필드 (스크린샷 확인):
  ├── 대분류/소분류/심급      ← case_type 세분화 필요
  ├── 자문/TC체크             ← 자문 사건 여부 플래그
  ├── 계속기관 (수사기관기타)  ← 법원 외 수사기관 처리
  ├── 기존사건 호출등록        ← 연관 사건 링크
  ├── 수임/수행/보조 3분류    ← attorney_role 세분화
  └── 공동 의뢰인 추가 (공동추가 버튼)
  
현재 DEV 스키마 gap:
  cases.case_type: ('civil','criminal','family','admin') → 소분류 없음
  cases.attorney_id: 단일 담당자 → 수임/수행/보조 3역할 없음
```

#### 2. 사건메모/History (타임라인) — 심화
```
로탑: 사건별 메모 + 히스토리 전용 화면
      My Page에서도 "내 사건메모/History" 접근 가능

현재 DEV: case_timeline 테이블 있음 (기본)
  gap: 사건메모 자유 텍스트 입력 UI 미설계
       개인별 내 사건 필터링 뷰 없음
```

#### 3. 대법원 파싱봇 — 기일 자동 수집
```
로탑 기능: 대법원 사이트 자동 파싱 → 기일·명령·제출서류·송달 자동 수집
           매일 자동 모니터링 페이지 생성
           
현재 DEV: NOT 설계됨 (수동 기일 등록만)
  → 중기 로드맵 수준이나 경쟁 우위 핵심 기능
```

#### 4. 수납/청구 관련 (수납 관리 시스템)
```
로탑 건별 청구/미수 화면 실제 컬럼:
  청구일 | 의뢰인 | 구분 | 항목 | 청구원금 | 청구세금 | 청구합계 | 입금합계 | 미수합계 | 
  비고 | 계산서 발행일 | 입력인 | 입력일시 | 상대방 | 사건명 | 사건번호

로탑 건별 입금 화면 실제 컬럼:
  입금일 | 의뢰인 | 구분 | 항목 | 입금액 | 입금수단 | 입금계좌 | 입금명의인 | 비고 | 입력인 | 
  입력일시 | 상대방 | 사건명 | 사건번호 | 수임 | 수행 | 보조

Header 요약: 청구원금 | 청구세금 | 청구합계 | 입금합계 | 미수합계

현재 DEV: 별도 Phase 예정 (DEV_MASTER 로드맵 #3순위)
  → billing_chase 워크플로우는 있으나 DB 스키마 미설계
```

#### 5. 손해배상 자동 계산
```
로탑 보유 계산 메뉴:
  ├── 손해배상(원고용)   ← 자·산·의·기 전 유형
  ├── 손해배상(간이)
  ├── 소송비용 계산
  ├── 기간 계산
  ├── 이자 계산
  ├── 가압류비용 계산
  ├── 상속분 계산
  └── 불변기한 등 계산/입력

현재 DEV: NOT 설계됨
  → LAWTOP_IA_DEEP_RESEARCH "로탑이 우세한 3가지 #1"로 분류
  → 중기 (3~6개월) 로드맵에 배치
```

#### 6. TC/TM 타임시트
```
로탑: Time Charge = 업무시간 입력 → 3분 내 정산 → 청구서 자동 발송
      Time Management = 비과금 내부 업무
      차등 단가 = 자문건별·업무수행자별 시간당 청구액 차등
      My Page → 내 TC/TM 종합 (개인 뷰)
      
현재 DEV: NOT 설계됨 (DEV_MASTER 로드맵 #6순위)
```

#### 7. 문자메시지 (SMS/MMS) 발신 시스템
```
로탑: 업무지원 → 문자메시지 메뉴
      연락처 퀵 검색 → 원클릭 SMS
      문자발신리스트 (발신 이력)
      미수 → 독촉 문자 원클릭

현재 DEV: 카카오 알림톡 → SMS fallback 자동화는 있음
           직원이 수동으로 개별 문자 발송하는 UI는 없음
```

#### 8. 종결 관리 심화
```
로탑 종결사건 메뉴:
  ├── 자동종결 예정건  ← 기간 경과 자동 분류
  ├── 종결 홈
  ├── 일괄종결처리     ← 여러 건 한 번에 종결
  ├── 종결리스트
  └── 삭제리스트

현재 DEV: 칸반에 'closing→closed' 상태는 있음
           자동종결 예정건 분류 로직 없음
           일괄종결처리 UI 없음
```

---

## 🎯 PART 4 — 송무 DEV 우선순위 매트릭스

| 우선순위 | 기능 | 구현 난이도 | 로탑 대비 중요도 | 창 연결 |
|---|---|---|---|---|
| **P0** | 사건 대시보드 (칸반) | 중 | ⭐⭐⭐⭐⭐ | **창 3 현재** |
| **P0** | 기일 알림 자동화 | 낮~중 | ⭐⭐⭐⭐⭐ | **창 3 현재** |
| **P0** | 이해충돌 체크 | 낮 | ⭐⭐⭐⭐ | **창 3 현재** |
| **P1** | 신건등록 폼 — 소분류/역할 세분화 | 낮 | ⭐⭐⭐⭐ | 창 3 확장 |
| **P1** | 사건메모/History UI | 낮 | ⭐⭐⭐ | 창 3 확장 |
| **P1** | 종결 관리 (일괄종결) | 낮 | ⭐⭐⭐ | 창 3 확장 |
| **P2** | 수납/청구/미수 관리 | 중 | ⭐⭐⭐⭐⭐ | 별도 Phase (창 3 이후) |
| **P2** | 수동 SMS 발송 UI | 낮 | ⭐⭐⭐ | 창 3 이후 |
| **P3** | 손해배상 자동 계산 | 높 | ⭐⭐⭐⭐⭐ | 중기 3~6개월 |
| **P3** | 대법원 파싱봇 | 높 | ⭐⭐⭐⭐ | 중기 3~6개월 |
| **P3** | TC/TM 타임시트 | 높 | ⭐⭐⭐⭐ | 중기 (로드맵 #6) |

---

## 🗃️ PART 5 — 송무 창 3 구현 스펙 완전 정리

### DB 스키마 (창 3 현재 설계 기준)

```sql
-- migration: migrations/003_mvp_cases.sql

-- 사건 테이블 (확장 필요 사항 표시)
CREATE TABLE cases (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES law_firms(id),
  name          TEXT NOT NULL,
  
  -- 현재 설계
  case_type     TEXT CHECK (case_type IN ('civil','criminal','family','admin')),
  status        TEXT CHECK (status IN ('intake','retained','active','closing','closed')),
  
  -- ⚠️ P1: 미구현 → 추가 필요
  -- case_subtype    TEXT,   -- 소분류 (예: 손해배상/대여금/임금 등)
  -- case_level      TEXT CHECK (case_level IN ('1심','2심','3심','조정','수사')),
  -- is_advisory     BOOLEAN DEFAULT FALSE,  -- 자문/TC 사건 여부
  -- related_case_id UUID REFERENCES cases(id),  -- 기존사건 연결
  
  client_id     UUID REFERENCES clients(id),
  attorney_id   UUID REFERENCES users(id),  -- 수임 담당자
  
  -- ⚠️ P1: 미구현 → 추가 필요  
  -- executor_id UUID REFERENCES users(id),  -- 수행 담당자
  -- assistant_id UUID REFERENCES users(id), -- 보조 담당자
  
  opponent_name TEXT,
  is_immutable  BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 기일 테이블 (현재 설계 그대로 사용)
CREATE TABLE hearings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id       UUID REFERENCES cases(id) ON DELETE CASCADE,
  hearing_type  TEXT CHECK (hearing_type IN ('pleading','judgment','mediation','conciliation')),
  hearing_at    TIMESTAMPTZ NOT NULL,
  court_name    TEXT,
  courtroom     TEXT,
  is_immutable  BOOLEAN DEFAULT FALSE,
  attorney_memo TEXT,
  created_by    UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 알림 스케줄 + 발송 이력 (현재 설계 그대로)
CREATE TABLE scheduled_alerts (...);
CREATE TABLE notification_logs (...);
```

---

### 창 3 신규 파일 목록 (DEV_MASTER 기준)

```
src/
├── app/
│   ├── cases/
│   │   ├── page.tsx           ← 사건 대시보드 (칸반)
│   │   ├── new/page.tsx       ← 신건등록 폼
│   │   └── [id]/
│   │       ├── page.tsx       ← 사건 상세
│   │       └── hearings/
│   │           └── new/page.tsx  ← 기일 등록
│   └── notifications/
│       └── monitor/page.tsx   ← 알림 발송 모니터링
│
├── api/
│   ├── cases/
│   │   ├── route.ts           ← GET/POST (이해충돌 체크 포함)
│   │   └── [id]/
│   │       ├── route.ts
│   │       └── status/route.ts
│   ├── hearings/
│   │   └── route.ts
│   └── notifications/
│       └── resend/route.ts
│
└── components/
    └── cases/
        ├── CaseKanban.tsx     ← 칸반 보드
        ├── CaseCard.tsx       ← 사건 카드
        └── HearingForm.tsx    ← 기일 등록 폼
```

---

### 완료 기준 (AC) — 창 3

```
MVP #1 사건 대시보드:
  [ ] 신건 등록 → 이해충돌 409 확인
  [ ] 칸반: 상담중→수임→진행중→종결준비→종결 5단계
  [ ] RBAC: attorney(내 담당) / staff(전체+상태) / admin(전체+통계)
  [ ] Realtime: 사건 생성/상태변경 → 전 직군 즉시 반영
  [ ] D-3 이내 기일 → 오늘의 긴급 섹션 하이라이트

MVP #2 기일 알림:
  [ ] 기일 등록 → scheduled_alerts D-14/7/3/1/0 자동 생성
  [ ] 불변기일 ON → D-14 특별 경고 (대표 CC 포함)
  [ ] 카카오 실패 → SMS fallback 자동 전환
  [ ] CASE_CONFLICT_DETECTED / HEARING_ALERT_SENT automation_logs 확인
  [ ] /notifications/monitor → 수신 여부 모니터링 + 수동 재발송
```

---

## 🔗 PART 6 — 로탑 vs 우리 플랫폼 송무 기능 갭 요약

| 로탑 기능 | 우리 현황 | 갭 수준 |
|---|---|---|
| 사건 홈 (칸반) | 창 3 구현 中 | ✅ 동등 수준 예정 |
| 기일 D-Day 알림 | 창 3 구현 中 | ✅ **로탑 초과** (카카오 알림톡) |
| 이해충돌 체크 | 창 3 구현 中 | ✅ 동등 또는 우세 |
| 신건등록 소분류/역할 3분류 | P1 미구현 | 🟡 소폭 갭 |
| 대법원 파싱봇 | 중기 로드맵 | 🔴 중요 갭 |
| 건별 청구/미수 관리 | 별도 Phase | 🔴 중요 갭 |
| 손해배상 자동 계산 | 중기 로드맵 | 🔴 중요 갭 |
| TC/TM 타임시트 | 중기 로드맵 | 🔴 갭 있음 |
| 법률 서식 (~3,000종) | 없음 | 🔴 큰 갭 |
| SMS 수동 발신 UI | 없음 | 🟡 소폭 갭 |
| 사건 일괄종결 처리 | 없음 | 🟡 소폭 갭 |

> **우리가 로탑을 이미 초과하는 영역**: 웹 SaaS 아키텍처, 카카오 알림톡, 전자서명, AI 기능, 기업 법인 대시보드, 투명한 요금(추후)

---

## 📎 연계 문서

| 문서 | 역할 |
|---|---|
| [DEV_MASTER송무계약서관련.md](file:///c:/projects/company-relationship-management/DEV_MASTER송무계약서관련.md) | 창 3 구현 프롬프트 본체 |
| [LAWTOP_IA_DEEP_RESEARCH.md](file:///c:/projects/company-relationship-management/_strategy/LAWTOP_IA_DEEP_RESEARCH.md) | 로탑 전체 기능 분석 |
| [11_WORKFLOW_SYSTEM.md](file:///c:/projects/company-relationship-management/_strategy/11_WORKFLOW_SYSTEM.md) | 워크플로우 트리거 |
| [12_WORKFLOW_DEV_PROMPT.md](file:///c:/projects/company-relationship-management/_strategy/12_WORKFLOW_DEV_PROMPT.md) | pg_cron·workflow_rules |

---

> **마지막 업데이트**: 2026-03-11 | 다음 리뷰: 창 3 완료 후
