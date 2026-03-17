# 📋 Notion 에이전트 기능 완전 정복 — 리서치 보고서

> **작성일:** 2026-03-11 | **작성자:** Researcher Agent | **버전:** v1.0

---

## 🎯 Executive Summary

노션에서 AI 에이전트(MCP 기반)가 수행할 수 있는 작업은 크게 **6개 카테고리**로 분류된다:

| 카테고리 | 대표 기능 | 자동화 난이도 |
|---|---|---|
| 📝 글쓰기·편집 | 페이지 생성, 본문 수정, 블록 추가 | ⭐ 쉬움 |
| 🗄️ 데이터베이스 | DB 생성, 쿼리, 필터, 레코드 추가 | ⭐⭐ 보통 |
| 💬 댓글·협업 | 댓글 작성, 알림 트리거 | ⭐ 쉬움 |
| 🔍 검색·조회 | 페이지 검색, 블록 탐색 | ⭐ 쉬움 |
| 🤖 AI 자동화 | AI Autofill, 요약, 번역 | ⭐⭐⭐ 복잡 |
| 🔗 외부 연동 | Slack·GitHub·Zapier 통합 | ⭐⭐⭐ 복잡 |

---

## PART 1: 현재 MCP 툴로 가능한 것 (직접 실행 가능)

### 1️⃣ 페이지 생성 및 관리

#### `post-page` — 페이지 생성
```
가능한 작업:
- 새 페이지를 특정 부모 페이지 또는 데이터베이스 하위에 생성
- 페이지 제목, 본문 콘텐츠(블록 배열) 동시 작성
- 이모지 아이콘, 커버 이미지 설정
- 데이터베이스 레코드(행)로 생성 (속성값 동시 입력)
```

**실전 예시:**
```
"신규 의뢰인 A기업 페이지를 '기업고객 DB' 하위에 생성,
 계약일·담당변호사·업종 속성 입력, 계약서 URL 포함"
```

#### `patch-page` — 페이지 속성 수정
```
가능한 작업:
- 페이지 제목 변경
- DB 속성값 업데이트 (상태, 날짜, 담당자 등)
- 페이지 아카이브(삭제) 또는 복원
- 아이콘/커버 변경
```

#### `move-page` — 페이지 이동
```
- 페이지를 다른 부모 페이지로 이동
- DB 간 레코드 이전
```

---

### 2️⃣ 블록(본문) 작성 및 편집

#### `patch-block-children` — 블록 추가 (본문 쓰기)
```
추가 가능한 블록 타입:
- paragraph          → 일반 텍스트 단락
- heading_1/2/3      → 제목 (H1~H3)
- bulleted_list_item → 글머리 기호 목록
- numbered_list_item → 번호 목록
- to_do              → 체크박스 할 일
- toggle             → 접기/펼치기 토글
- code               → 코드 블록
- quote              → 인용구
- divider            → 구분선
- callout            → 강조 박스
- table              → 표
- image              → 이미지
- bookmark           → 외부 링크 북마크
- embed              → 외부 콘텐츠 임베드
- child_page         → 하위 페이지 링크
```

#### `update-a-block` — 블록 수정
```
- 기존 블록 텍스트 내용 변경
- to_do 블록의 체크 상태 변경 (완료/미완료 토글)
- 블록 보관(삭제)
```

#### `delete-a-block` — 블록 삭제
```
- 특정 블록 영구 삭제
```

---

### 3️⃣ 데이터베이스(DB) 관리

#### `create-a-data-source` — DB 생성
```
생성 가능한 속성 타입:
- title        → 제목 (필수)
- rich_text    → 텍스트
- number       → 숫자
- select       → 단일 선택
- multi_select → 다중 선택
- date         → 날짜
- people       → 사용자
- files        → 파일 첨부
- checkbox     → 체크박스
- url          → URL
- email        → 이메일
- phone_number → 전화번호
- formula      → 수식
- relation     → 다른 DB 연결
- rollup       → 연결 DB 집계
- created_time → 생성 시간 (자동)
- last_edited  → 최종 수정 (자동)
- status       → 상태 (신규/2024~)
```

#### `query-data-source` — DB 쿼리 (가장 강력!)
```
필터 조건 (논리 연산 가능):
- equals / does_not_equal
- contains / does_not_contain
- starts_with / ends_with
- is_empty / is_not_empty
- before / after / on_or_before (날짜)
- greater_than / less_than (숫자)

정렬:
- ascending / descending
- 복수 필드 정렬 가능

예시:
"상태=진행중 AND 담당변호사=김변호사 AND 마감일<오늘
 → 오버듀 사건 목록 추출"
```

#### `update-a-data-source` — DB 스키마 수정
```
- 속성(컬럼) 추가, 이름 변경, 삭제
- DB 제목 변경
- 설명 수정
```

#### `list-data-source-templates` — DB 템플릿 목록 조회
```
- DB에 설정된 템플릿 목록 확인
```

---

### 4️⃣ 블록/페이지 조회 및 탐색

#### `get-block-children` — 블록 자식 조회
```
- 페이지 전체 본문 읽기
- 특정 블록의 하위 블록 목록 조회
- 페이지네이션 지원 (최대 100개/요청)
```

#### `retrieve-a-block` — 단일 블록 조회
```
- 특정 블록 ID로 내용 및 메타데이터 조회
- 블록 타입, 생성/수정 시간 확인
```

#### `retrieve-a-page` — 페이지 조회
```
- 페이지 제목, 속성, 메타데이터 조회
- DB 레코드의 속성값 읽기
```

#### `retrieve-a-page-property` — 페이지 속성 조회
```
- 특정 속성 값만 선택적으로 읽기 (성능 최적화)
```

#### `retrieve-a-data-source` — DB 스키마 조회
```
- DB 구조(속성 정의) 확인
- 속성 ID, 타입, 옵션 목록 읽기
```

---

### 5️⃣ 검색

#### `post-search` — 전체 검색
```
검색 가능:
- 페이지 제목으로 검색
- 데이터베이스 제목으로 검색
- 필터: page만 or data_source만 선택 가능
- 정렬: last_edited_time 기준 오름/내림차순
- 페이지네이션 지원

⚠️ 제한: 제목 검색만 가능, 본문 내용 검색 불가
```

---

### 6️⃣ 댓글 (협업)

#### `API-create-a-comment` — 댓글 작성
```
- 페이지에 댓글 추가
- 리치 텍스트 형식 지원 (볼드, 이탤릭, 링크 등)
```

#### `retrieve-a-comment` — 댓글 조회
```
- 페이지/블록의 댓글 목록 읽기
```

---

### 7️⃣ 사용자 관리

#### `get-users` — 전체 사용자 목록
```
- 워크스페이스 멤버 전체 조회
- 이름, 이메일, 아바타 URL 포함
```

#### `get-user` — 단일 사용자 조회
```
- 특정 사용자 ID로 정보 조회
```

#### `get-self` — 봇(에이전트) 정보 조회
```
- 현재 연결된 통합(Integration) 정보 확인
```

---

## PART 2: Notion 내장 AI가 추가로 할 수 있는 것

> Notion AI (내장) + MCP 에이전트 결합 시 더 강력한 자동화 가능

### 🧠 AI 글쓰기 & 편집 기능

| 기능 | 설명 |
|---|---|
| **초안 생성** | 주제/키워드로 완성된 글 작성 |
| **요약** | 긴 문서를 핵심 포인트로 압축 |
| **문법 교정** | 맞춤법/문법 자동 수정 |
| **톤 변환** | 격식체↔비격식체, 전문적↔친근하게 |
| **길이 조절** | 텍스트 늘리기 / 줄이기 |
| **번역** | 다국어 번역 (한↔영 등) |
| **아이디어 제안** | 브레인스토밍, 대안 제시 |
| **글 계속 쓰기** | 기존 맥락 이어받아 작성 |

### 📊 AI Autofill (DB 자동 채우기)

```
DB 속성별 AI 자동 입력:
- Summary 속성: 페이지 본문 자동 요약
- Keywords 속성: 핵심 키워드 자동 추출
- Translation 속성: 제목/내용 자동 번역
- Sentiment 속성: 수동 정의 프롬프트로 감성 분류
- Category 속성: 내용 기반 자동 분류
- 커스텀 프롬프트: 완전 자유 형식 자동화
```

### 📎 PDF·이미지 분석

```
- PDF 내용 기반 Q&A
- 이미지 내 텍스트 OCR 추출
- 이미지 설명 자동 생성
- 차트/그래프 데이터 해석
```

---

## PART 3: 자동화 워크플로우 (Notion Automations)

### 트리거 유형
```
- 속성값 변경 시 (예: 상태 → 완료로 변경)
- 날짜 도달 시 (예: 마감일 D-1)
- 새 레코드 생성 시
- 버튼 클릭 시 (수동 트리거)
```

### 액션 유형
```
- 속성값 자동 업데이트
- 페이지 추가
- Slack 알림 전송
- 이메일 전송
- Webhook 호출 (Zapier, Make 등 외부 연동)
- 수식 실행
```

---

## PART 4: 외부 연동 생태계

| 외부 서비스 | 연동 방식 | 사용 예시 |
|---|---|---|
| **Slack** | 네이티브 연동 | DB 업데이트 → Slack 알림 |
| **Google Drive** | 공식 연동 | Drive 파일 → Notion 임베드 |
| **GitHub** | 공식 연동 | PR/Issue → Notion DB 동기화 |
| **Jira** | 공식 연동 | 이슈 양방향 동기화 |
| **Zapier** | Webhook | 수천 개 앱과 연결 |
| **Make (Integromat)** | Webhook | 복잡한 다단계 워크플로우 |
| **Lovable** | MCP | AI 앱 빌더와 Notion 연동 |
| **Perplexity** | MCP | 검색 결과 → Notion 저장 |
| **HubSpot** | MCP | CRM 데이터 ↔ Notion |

---

## PART 5: 법무법인 CRM 활용 시나리오

### 시나리오 A: 신규 의뢰인 자동 온보딩
```
트리거: 수임 계약 체결 완료(DB 상태 변경)
↓
1. [post-page] → 의뢰인 전용 페이지 자동 생성
2. [patch-block-children] → 환영 메시지 + 필요 서류 체크리스트 삽입
3. [API-create-a-comment] → 담당 변호사에게 온보딩 완료 알림
4. [Slack 연동] → 팀 채널에 신규 의뢰인 알림
```

### 시나리오 B: 사건 진행 현황 자동 보고서
```
트리거: 매주 월요일 자동 실행
↓
1. [query-data-source] → 진행중 사건 전체 쿼리
2. [post-page] → 주간 현황 보고서 페이지 생성
3. [patch-block-children] → 사건별 현황 표 + 이번주 기일 목록 삽입
4. [API-create-a-comment] → 대표 변호사에게 보고서 링크 댓글
```

### 시나리오 C: 수임료 미납 자동 추적
```
트리거: 청구일 + 30일 경과 & 미납 상태
↓
1. [query-data-source] → 미납 의뢰인 필터 쿼리
2. [patch-page] → 상태값 "연체" 로 업데이트
3. [API-create-a-comment] → 담당자에게 추심 필요 댓글
→ /billing_chase 워크플로우 연계
```

### 시나리오 D: 계약 만료 선제 대응
```
트리거: 법인 자문 계약 만료일 D-90
↓
1. [query-data-source] → 90일 내 만료 계약 필터
2. [post-page] → 갱신 협상 제안서 페이지 생성
3. [patch-page] → 갱신 협상 시작 상태로 업데이트
→ /contract_renewal 워크플로우 연계
```

### 시나리오 E: 월간 법무 리포트 자동 생성
```
트리거: 매월 말일 자동 실행
↓
1. [query-data-source] → 이번달 완료 사건, 진행중 사건 쿼리
2. [post-page] → 월간 리포트 페이지 생성
3. [patch-block-children] → AI 요약 + 통계 차트 블록 삽입
4. [API-create-a-comment] → 의뢰인에게 리포트 완성 알림
→ /monthly_report 워크플로우 연계
```

---

## PART 6: MCP 현재 한계점 & 보완 방법

| 한계점 | 현재 제약 | 보완 방법 |
|---|---|---|
| 본문 검색 불가 | 제목만 검색 가능 | block_id 직접 접근, 계층 탐색 |
| 블록 이동 불가 | cut & paste 없음 | 삭제+재생성으로 우회 |
| 대용량 처리 제한 | 100개/요청 | 페이지네이션 루프 처리 |
| 이미지 업로드 불가 | 외부 URL만 가능 | CDN URL 사용 |
| DB 뷰(View) 생성 불가 | 스키마만 수정 가능 | API로 뷰 직접 생성 필요 |
| 실시간 알림 불가 | 폴링 방식 필요 | Webhook + 외부 자동화 툴 |
| 권한 관리 불가 | 읽기/쓰기만 | Notion 웹 UI에서 직접 설정 |

---

## 📊 기능 완전 레퍼런스 (MCP Tool Map)

```
notion-mcp-server 제공 툴 전체 목록:

[페이지]
├── post-page              → 생성
├── patch-page             → 수정
├── move-page              → 이동
└── retrieve-a-page        → 조회

[블록]
├── patch-block-children   → 자식 블록 추가
├── get-block-children     → 자식 블록 조회
├── retrieve-a-block       → 단일 블록 조회
├── update-a-block         → 블록 수정
└── delete-a-block         → 블록 삭제

[데이터베이스]
├── create-a-data-source   → DB 생성
├── query-data-source      → DB 쿼리
├── retrieve-a-data-source → DB 조회
├── update-a-data-source   → DB 수정
└── list-data-source-templates → 템플릿 목록

[레거시 DB API]
└── retrieve-a-database    → DB 조회 (구버전)

[페이지 속성]
└── retrieve-a-page-property → 속성 값 조회

[댓글]
├── API-create-a-comment   → 댓글 작성
└── retrieve-a-comment     → 댓글 조회

[검색]
└── post-search            → 제목 검색

[사용자]
├── get-users              → 전체 멤버 조회
├── get-user               → 단일 유저 조회
└── get-self               → 봇 정보 조회
```

---

> **출처:** Notion 공식 API 문서 | Notion 3.0 발표 (2025.09) | MCP 서버 툴 명세 직접 분석
> **다음 리뷰:** 2026-06-11
> **연계 문서:** `researcher.md`, `_agents/ai_legal.md`, `/workflow/*.md`
