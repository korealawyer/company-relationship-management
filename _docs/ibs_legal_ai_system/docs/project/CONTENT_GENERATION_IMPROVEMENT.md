# 콘텐츠 생성 시스템 개선 사항 상세 문서

## 📋 목차

1. [개요](#개요)
2. [워크플로우 아키텍처](#워크플로우-아키텍처)
3. [워크플로우 노드 상세](#워크플로우-노드-상세)
4. [평가 시스템](#평가-시스템)
5. [템플릿 구조](#템플릿-구조)
6. [프롬프트 시스템](#프롬프트-시스템)
7. [메타데이터 생성](#메타데이터-생성)
8. [재사용 블록 추출](#재사용-블록-추출)
9. [API 변경사항](#api-변경사항)
10. [코드 구조 변경사항](#코드-구조-변경사항)
11. [사용 예제](#사용-예제)
12. [문제 해결 가이드](#문제-해결-가이드)
13. [마이그레이션 가이드](#마이그레이션-가이드)
14. [테스트 가이드](#테스트-가이드)
15. [성능 및 최적화](#성능-및-최적화)

---

## 개요

### 개선 목적

법률 블로그 콘텐츠 제작 의뢰서에 따라, 기존의 단순한 RAG 기반 콘텐츠 생성 시스템을 **LangGraph 기반 다단계 워크플로우**로 전면 개선했습니다.

### 주요 개선 사항

1. **LangGraph 기반 워크플로우 도입**
   - 14개 노드로 구성된 다단계 프로세스
   - 평가 기반 자동 재작성 피드백 루프
   - 최대 3회 재시도 메커니즘

2. **구조화된 블로그 템플릿**
   - 9개 필수 섹션 구조
   - 섹션별 상세 요구사항 정의
   - 재사용 가능한 블록 자동 추출

3. **3단계 평가 시스템**
   - 구조 평가 (30점): 필수 섹션, 마크다운 구조, 최소 길이
   - 내용 품질 평가 (40점): 법령/판례 인용, 용어 설명, 예시
   - 법적 정확성 평가 (30점): 법령/판례 검증, 최신성

4. **자동 메타데이터 생성**
   - SEO 제목 및 메타 디스크립션
   - 키워드 자동 추출
   - 카테고리 자동 분류
   - 버전 관리 (YYYYMMDD)

5. **재사용 블록 추출**
   - TL;DR (3-5줄 요약)
   - 체크리스트 (3-7개 항목)
   - Q&A (3-5개 질문/답변)
   - 숫자 팩트 (날짜, 기한, 금액)

### 개선 전후 비교

| 항목 | 개선 전 | 개선 후 |
|------|---------|---------|
| 워크플로우 | 단순 RAG 검색 → LLM 생성 | LangGraph 기반 14단계 워크플로우 |
| 평가 시스템 | 없음 | 3단계 평가 (100점 만점) |
| 재작성 | 없음 | 자동 재작성 (최대 3회) |
| 템플릿 | 기본 구조 | 9개 섹션 구조화된 템플릿 |
| 메타데이터 | 수동 입력 | 자동 생성 (SEO, 키워드, 카테고리) |
| 재사용 블록 | 없음 | 자동 추출 (TL;DR, 체크리스트, Q&A, 팩트) |
| 응답 구조 | 기본 필드만 | 확장된 필드 (평가 점수, 피드백, 재사용 블록 등) |

---

## 워크플로우 아키텍처

### LangGraph 기반 워크플로우

콘텐츠 생성은 **LangGraph**를 사용하여 구현된 상태 기반 워크플로우입니다.

#### 상태 정의 (ContentWorkflowState)

```python
class ContentWorkflowState(TypedDict):
    # 입력
    topic: str
    content_type: str
    style: Optional[str]
    target_length: Optional[int]
    include_sections: Optional[List[str]]
    keywords: Optional[List[str]]
    document_types: Optional[List[str]]
    
    # 검색 단계
    search_results: List[Dict[str, Any]]
    context: str
    references: List[Dict[str, Any]]
    
    # 생성 단계
    prompt: Optional[str]
    draft: Optional[str]
    structured_content: Optional[Dict[str, str]]
    
    # 평가 단계
    structure_score: Optional[float]  # 0-30
    content_quality_score: Optional[float]  # 0-40
    legal_accuracy_score: Optional[float]  # 0-30
    evaluation_score: Optional[float]  # 0-100
    evaluation_feedback: List[str]
    
    # 후처리 단계
    metadata: Dict[str, Any]
    reusable_blocks: Dict[str, Any]
    version: str
    
    # 제어
    revision_count: int
    max_revisions: int
    should_rewrite: bool
    error: Optional[str]
```

#### 워크플로우 그래프 구조

```
[시작]
  ↓
[1] 문서 검색 노드
  ↓
[2] 문서 요약 노드 (GPT API 사용) ⭐ 강화됨
  │   - 검색된 문서를 GPT API로 핵심 요약
  │   - 최소 길이 보장 (원본의 30% 이상, 최소 2000자)
  │   - 목표 길이에 따른 동적 최소 길이 조정
  │   - 초안 작성에 충분한 정보 제공 (1000자 이상 원고 작성 가능)
  │   - 요약이 너무 짧으면 자동 재요약
  │   - 법령 조문, 판례 번호, 법정형, 구성요건 등 핵심 정보 보존
  ↓
[3] 프롬프트 생성 노드
  │   - 요약된 컨텍스트를 우선 사용 (summarized_context)
  │   - 요약이 없으면 원본 컨텍스트 사용
  │   - 초안 작성에 충분한 정보가 포함된 컨텍스트로 프롬프트 생성
  ↓
[4] 초안 작성 노드
  ↓
[4] 구조 평가 노드
  ↓
[5] 내용 품질 평가 노드
  ↓
[6] 법적 정확성 평가 노드
  ↓
[7] 평가 점수 계산 노드
  ↓
[8] 평가 분기 노드 (조건부 분기)
  │
  ├─ 조건 1: evaluation_score >= 70.0 → [통과]
  │   ↓
  │   [12] 최종 정리 노드
  │   ↓
  │   [13] 메타데이터 생성 노드
  │   ↓
  │   [14] 재사용 블록 추출 노드
  │   ↓
  │   [종료]
  │
  ├─ 조건 2: evaluation_score < 70.0 AND revision_count < max_revisions → [재작성]
  │   ↓
  │   [9] 질문 재작성 노드
  │   ↓
  │   [10] 프롬프트 조정 노드
  │   ↓
  │   [11] 재검색 노드
  │   ↓
  │   → [2] 프롬프트 생성 노드로 돌아가기 (피드백 루프)
  │
  └─ 조건 3: evaluation_score < 70.0 AND revision_count >= max_revisions → [최대 재시도 도달]
      ↓
      [종료] (현재 점수로 종료, 최종 정리 없이 바로 종료)
```

**조건부 분기 로직** (`_should_rewrite` 메서드):

이것은 **조건부 분기(Conditional Branch)**이며, LangGraph의 `add_conditional_edges`를 사용하여 구현됩니다. 평가 점수와 재시도 횟수에 따라 3가지 경로 중 하나를 선택합니다:

1. **"pass"**: 
   - 조건: `evaluation_score >= 70.0`
   - 동작: 최종 정리 노드로 진행 → 메타데이터 생성 → 재사용 블록 추출 → 종료

2. **"rewrite"**: 
   - 조건: `evaluation_score < 70.0` AND `revision_count < max_revisions`
   - 동작: 재작성 루프로 진행 (질문 재작성 → 프롬프트 조정 → 재검색 → 프롬프트 생성으로 복귀)

3. **"max_revisions"**: 
   - 조건: `evaluation_score < 70.0` AND `revision_count >= max_revisions`
   - 동작: 최대 재시도 횟수 도달 → 바로 종료 (현재 점수와 함께 결과 반환)

**코드 위치**: 
- 조건부 엣지 설정: `src/rag/content_workflow.py:113-121`
- `_should_rewrite` 메서드: `src/rag/content_workflow.py:135-141`

```python
# 조건부 엣지 설정
workflow.add_conditional_edges(
    "check_threshold",
    self._should_rewrite,  # 분기 결정 함수
    {
        "pass": "finalize_content",      # 통과 시 최종 정리로
        "rewrite": "rewrite_topic",      # 재작성 시 재작성 루프로
        "max_revisions": END,            # 최대 재시도 도달 시 종료
    }
)
```

#### 노드 간 데이터 흐름

1. **검색 → 생성 흐름**
   - `search_results` → `context` → `prompt` → `draft`

2. **평가 흐름**
   - `draft` → `structure_score`, `content_quality_score`, `legal_accuracy_score` → `evaluation_score`

3. **피드백 루프**
   - `evaluation_feedback` → `prompt` (조정) → `draft` (재생성)

4. **후처리 흐름**
   - `draft` → `structured_content` → `metadata` → `reusable_blocks`

---

## 워크플로우 노드 상세

### 1. 문서 검색 노드 (`_search_documents_node`)

**역할**: RAG 검색을 수행하여 관련 법률 문서를 검색합니다.

**지원하는 문서 타입**:
시스템은 다음 **11가지 문서 타입**을 지원합니다:
1. **statute** (법령) - 법률 조문
2. **case** (판례) - 법원 판결 요약
3. **procedure** (절차 매뉴얼) - 법률 절차 안내
4. **manual** (실무 매뉴얼) - 실무 가이드
5. **case_type** (사건 유형) - 사건 분류 정의
6. **template** (템플릿) - 문서 템플릿
7. **sentencing_guideline** (양형기준) - 형량 기준
8. **faq** (FAQ) - 자주 묻는 질문
9. **keyword_mapping** (키워드 맵핑) - 키워드-사건 연결
10. **style_issue** (스타일 문제) - 문서 스타일 가이드
11. **statistics** (통계) - 법률 통계 데이터

**입력**:
- `topic`: 검색할 주제
- `document_types`: 문서 타입 필터 (선택사항, None이면 모든 타입 검색)
  - 예: `["statute", "case"]` → 법령과 판례만 검색
  - 예: `None` → 모든 문서 타입 검색
- `n_references`: 참고할 문서 수 (기본값: 5)

**처리 과정**:
1. `RAGWorkflow.run()` 호출하여 검색 수행
2. `document_types` 필터가 지정된 경우 해당 타입만 검색
3. 검색 결과를 `reranked_results`에서 상위 N개 선택
4. 컨텍스트 문자열 생성
5. 참고 문서 정보 정리 (타입, 제목, 메타데이터 포함)

**출력**:
- `search_results`: 검색된 문서 리스트 (모든 문서 타입 포함 가능)
- `context`: 검색된 문서로 구성한 컨텍스트 문자열
- `references`: 참고 문서 정보 리스트 (타입, 제목, 법원명, 판례번호, 법령명, 조문번호 등)

**코드 위치**: `src/rag/content_workflow.py:144-193`

**예외 처리**:
- 검색 실패 시 `error` 필드에 오류 메시지 저장
- 빈 결과 반환

**사용 예시**:
```python
# 법령과 판례만 검색
document_types = ["statute", "case"]

# 모든 문서 타입 검색
document_types = None

# 절차 매뉴얼과 실무 매뉴얼만 검색
document_types = ["procedure", "manual"]
```

---

### 2. 문서 요약 노드 (`_summarize_documents_node`) ⭐ 강화됨

**역할**: 검색된 문서를 GPT API를 사용하여 핵심만 왜곡 없이 요약합니다. 초안 작성 시 충분한 정보를 제공하기 위해 요약 품질을 강화했습니다.

**입력**:
- `context`: 검색된 문서로 구성한 컨텍스트 문자열
- `topic`: 생성할 콘텐츠 주제
- `target_length`: 목표 글자 수 (선택사항)
- `references`: 참고 문서 정보 리스트

**처리 과정**:
1. 컨텍스트가 비어있으면 요약 생략
2. 목표 길이에 따른 최소 요약 길이 계산
   - 원본의 30% 이상, 최소 2000자 보장
   - 목표 길이가 있으면 그에 맞춰 조정 (목표 길이의 2배 정도)
3. 요약 프롬프트 템플릿 로드 (`summarization_prompt.txt`)
4. GPT API를 사용하여 문서 요약 수행
   - 시스템 프롬프트: 법률 문서 요약 전문가 역할
   - Temperature: 0.3 (정확성 중시)
5. 요약 결과 검증
   - 최소 길이 미달 시 자동 재요약
   - 재요약도 실패하면 기존 요약 사용 (경고 로그)

**출력**:
- `summarized_context`: 요약된 문서 컨텍스트 (최소 길이 보장)
- 원본 컨텍스트보다 짧지만 초안 작성에 충분한 정보 포함

**개선 사항** ⭐:
- **최소 길이 보장**: 원본의 30% 이상, 최소 2000자
- **동적 길이 조정**: 목표 길이에 따라 최소 요약 길이 자동 조정
- **자동 재요약**: 요약이 너무 짧으면 자동으로 재요약 시도
- **핵심 정보 보존**: 법령 조문, 판례 번호, 법정형, 구성요건 등 필수 정보 보존
- **초안 작성 지원**: 1000자 이상의 원고 작성에 충분한 정보 제공

**코드 위치**: `src/rag/content_workflow.py:713-810`

**요약 프롬프트 위치**: `src/rag/prompts/summarization_prompt.txt`

**예외 처리**:
- 요약 실패 시 `summarized_context`를 `None`으로 설정
- 프롬프트 생성 노드에서 원본 컨텍스트 사용

**사용 예시**:
```python
# 원본 컨텍스트: 10,000자
# 요약 결과: 최소 2,000자 이상 (원본의 30% 이상)
# 목표 길이: 500자 → 최소 요약 길이: 1,000자 (목표의 2배)
```

**효과**:
- 초안 작성 시 문서량이 많아도 충분한 정보 제공
- 원고가 1000자를 넘기지 못하는 문제 해결
- 요약 품질 향상으로 초안 품질 개선

---

### 3. 프롬프트 생성 노드 (`_generate_prompt_node`)

**역할**: 구조화된 블로그 템플릿 기반 프롬프트를 생성합니다.

**입력**:
- `topic`: 생성할 콘텐츠 주제
- `content_type`: 콘텐츠 타입 (blog, article, opinion, analysis, faq)
- `style`: 작성 스타일
- `target_length`: 목표 글자 수
- `include_sections`: 포함할 섹션
- `keywords`: 포함할 키워드
- `context`: 참고 문서 컨텍스트

**처리 과정**:
1. 블로그 타입인 경우 `_build_structured_blog_prompt()` 호출
2. 다른 타입인 경우 `_build_basic_prompt()` 호출
3. 템플릿 상수(`BLOG_SECTIONS`)를 활용하여 섹션별 상세 지시사항 생성
4. 타깃 독자, 포지셔닝, 문체 지시사항 포함
5. 법령/판례 인용 형식 표준화 지시사항 포함

**출력**:
- `prompt`: 생성된 프롬프트 문자열

**코드 위치**: 
- `_generate_prompt_node` 메서드: `src/rag/content_workflow.py:195-235`
- `_select_sections_based_on_rag` 메서드: `src/rag/content_workflow.py:239-354`
- `_build_structured_blog_prompt` 메서드: `src/rag/content_workflow.py:356-472`

**프롬프트 구조** (블로그 타입):
```
당신은 전문 법률 콘텐츠 작가입니다. 제공된 법률 문서(법령, 판례 등)를 참고하여 정확하고 전문적인 법률 블로그 콘텐츠를 작성합니다.

## 타깃 독자
- 법률 비전공자(일반 직장인, 스타트업 대표, 자영업자, 일반 소비자 등)
- "변호사를 만나기 전, 기본 개념을 이해하게 해주는 친절한 안내서" 포지셔닝

## 문체 및 스타일
- "~합니다 / ~입니다" 체로 통일
- 한 문장은 되도록 2줄 이내로 짧게
- 어려운 법률 용어는 첫 등장 시 "용어(간단 설명)" 형태로 풀어서 설명
- 예시 중심: 법 조문 원문을 길게 인용하기보다, 예시 상황 → 그 상황에 법 조문을 어떻게 적용하는지 설명
- 위험한 단정 표현 지양: "무조건 ~이다" 보다는 "원칙적으로는 ~이지만, 예외적으로 ~할 수 있습니다" 식으로 서술

## 필수 구조 (반드시 다음 순서대로 작성)

**중요**: 토큰 절약을 위해 **필수 섹션 2개 + 선택적 섹션 5-7개**를 **RAG 검색 결과를 분석하여** 적합한 섹션을 선택합니다.

### 필수 섹션 (항상 포함)

1. **제목 (H1)**
   - 독자가 실제로 할 법한 질문 형태를 권장
   - 최소 길이: 20자 이상
   - 최대 길이: 120자 이하
   - 형식: 질문 형태 권장
   - SEO 최적화: 키워드 포함, 검색 엔진 최적화 고려
   - 예시: 퇴직금은 언제까지 줘야 할까? 지연 시 발생하는 법적 문제 정리

### 선택적 섹션 (RAG 검색 결과 기반으로 5-7개 선택)

다음 섹션 중에서 **RAG 검색 결과를 분석하여** 적합한 5-7개가 자동으로 선택됩니다:

2. **요약 (TL;DR)**
   - 글의 핵심 메시지를 간단히 정리 (3-5줄)
   - 최소 길이: 100자 이상
   - 재사용 가능: 카드뉴스, 인포그래픽, 뉴스레터 등으로 재활용 가능
   - 예시: 퇴직금은 퇴직일로부터 14일 이내에 지급해야 합니다. 지연 시 지연이자와 손해배상 책임이 발생할 수 있습니다.

3. **상황 예시**
   - 현실에서 자주 나오는 사례를 짧게 묘사 (스토리텔링 형 도입부)
   - 최소 길이: 50자 이상
   - 형식: 스토리텔링
   - 예시: 직원 A씨가 퇴사했는데, 퇴직금을 한 달 뒤에 주면 안 되냐고 대표가 묻는 상황

4. **핵심 개념 정리**
   - 관련 법령, 기본 개념, 판례 포함
   - 최소 길이: 200자 이상
   - 반드시 포함: 법령 조문 번호, 기본 개념 설명, 판례 번호
   - 예시: 근로기준법 제34조에 따르면...

5. **자주 묻는 질문 (Q&A)**
   - 3-5개 질문/답변 구성
   - 최소 개수: 3개 이상
   - 최대 개수: 5개 이하
   - 형식: Q&A 형식
   - 재사용 가능: 유튜브 쇼츠, 릴스로 재활용
   - 예시: Q1. 퇴직금은 언제까지 지급해야 하나요?\nA1. [답변]

6. **체크리스트 / To-do 리스트**
   - 독자가 지금 당장 무엇을 해야 하는지 한눈에 볼 수 있는 bullet 형식
   - 최소 개수: 3개 이상
   - 최대 개수: 7개 이하
   - 형식: bullet 형식
   - 재사용 가능: 인포그래픽, 카드뉴스로 재활용
   - 예시: 퇴직금 지급 전 체크할 것 3가지:\n- [ ] 항목 1\n- [ ] 항목 2

7. **주의할 점 & 예외 사항**
   - 예외 조항, 판례로 달라지는 부분, 오해하기 쉬운 지점 정리
   - 최소 길이: 100자 이상
   - 형식: 별도 박스형 섹션
   - 예시: 단, 합의서에 명시된 경우에는 예외적으로...

8. **마무리 요약 & 권장 행동**
   - 핵심 정리 및 권장 행동
   - 최소 길이: 100자 이상
   - 반드시 포함: 핵심 정리, 권장 행동
   - 예시: 핵심을 다시 정리하고, 필요 시 변호사 상담을 권장

### 필수 섹션 (항상 포함)

9. **디스클레이머**
   - 필수 법적 고지 문구
   - 필수 섹션: 반드시 포함해야 합니다
   - 고정 문구: "본 글은 일반적인 법률 정보 제공을 위한 것이며, 개별 사건에 대한 법률 자문을 대체하지 않습니다. 구체적인 사안은 반드시 전문가와 상담하시기 바랍니다."

**섹션 선택 로직** (`_select_sections_based_on_rag` 메서드):

RAG 검색 결과를 분석하여 적합한 섹션을 자동으로 선택합니다:

1. **필수 섹션** (항상 포함):
   - 제목 (H1)
   - 디스클레이머

2. **문서 타입 기반 선택**:
   - **판례 (case)**가 많으면 → `situation_example`, `qa` 섹션 추가
   - **법령 (statute)**가 많으면 → `core_concepts` 섹션 추가
   - **절차 매뉴얼 (procedure)** 또는 **실무 매뉴얼 (manual)**이 있으면 → `checklist`, `warnings` 섹션 추가

3. **주제 키워드 기반 선택**:
   - "어떻게", "방법", "절차", "순서" 키워드 → `checklist` 섹션 추가
   - "질문", "궁금", "묻" 키워드 → `qa` 섹션 추가
   - "처벌", "벌금", "형량", "벌" 키워드 → `warnings`, `summary` 섹션 추가

4. **기본 섹션** (항상 유용):
   - `tldr` (요약) - 항상 추가
   - `core_concepts` (핵심 개념) - 법령(`statute`)이 있으면 추가
   - `summary` (마무리) - 항상 추가

5. **우선순위 기반 최종 선택**:
   - 최대 7개 선택적 섹션 유지 (토큰 절약)
   - 우선순위: `tldr` > `core_concepts` > `qa` > `checklist` > `warnings` > `summary` > `situation_example`

**총 섹션 수**: 7-9개 (필수 2개 + 선택적 5-7개)

**토큰 절약**: 전체 9개 섹션을 모두 요구하지 않고, 검색 결과에 맞는 섹션만 선택하여 프롬프트 길이와 생성 비용을 절감합니다.

**코드 위치**: 
- `_select_sections_based_on_rag` 메서드: `src/rag/content_workflow.py:239-354`
- `_build_structured_blog_prompt` 메서드: `src/rag/content_workflow.py:356-472`

## 추가 스타일 요구사항 (선택)
{style}  # style 파라미터가 제공된 경우

## 목표 글자 수 (선택)
약 {target_length}자 (공백 제외)  # target_length 파라미터가 제공된 경우

## 반드시 포함할 섹션 (선택)
{include_sections}  # include_sections 파라미터가 제공된 경우

## 반드시 포함할 키워드 (선택)
{keywords}  # keywords 파라미터가 제공된 경우
키워드는 자연스럽게 문맥에 맞게 배치하세요.

## 법령/판례 인용 형식
- 법령: "근로기준법 제34조에 따르면..." 형식으로 통일
- 판례: "대법원 2023도11234 판결에서는..." 형식으로 통일
- 조문 번호와 판례 번호는 반드시 명시

## 중요 사항
- 제공된 법률 문서의 내용을 정확히 반영
- 법령 조문 번호와 판례 번호를 명확히 표시
- 최신성: 기준 시점을 명시 (예: "2024년 12월 기준")

## 작성할 주제
{topic}

## 참고 문서
{context}

위 구조에 맞춰 블로그 글을 작성해주세요. 각 섹션은 명확히 구분하고, H1, H2, H3 마크다운 헤더를 사용하여 구조화해주세요.
```

**참고**: 
- 위 프롬프트는 블로그 타입(`content_type="blog"`)일 때 사용됩니다.
- 다른 타입(article, opinion, analysis, faq)은 `_build_basic_prompt()` 메서드를 사용합니다.
- 선택적 파라미터(style, target_length, include_sections, keywords)는 제공된 경우에만 프롬프트에 포함됩니다.

---

### 3. 초안 작성 노드 (`_generate_draft_node`)

**역할**: LLM을 사용하여 블로그 초안을 생성합니다.

**입력**:
- `prompt`: 생성된 프롬프트
- `context`: 참고 문서 컨텍스트
- `document_types`: 문서 타입

**처리 과정**:
1. 시스템 프롬프트 생성 (`_build_system_prompt()`)
2. `LLMManager.generate_response()` 호출
3. 생성된 콘텐츠를 `draft`에 저장

**출력**:
- `draft`: 생성된 초안 문자열

**코드 위치**: `src/rag/content_workflow.py:497-551`

**LLM 호출**:
```python
draft = self.llm_manager.generate_response(
    context=context,
    query=prompt,
    system_prompt=system_prompt,
    document_types=document_types,
)
```

---

### 4. 구조 평가 노드 (`_evaluate_structure_node`)

**역할**: 필수 섹션 존재 여부, H1/H2/H3 구조, 섹션 최소 길이를 평가합니다.

**입력**:
- `draft`: 생성된 초안
- `content_type`: 콘텐츠 타입

**처리 과정**:
1. 블로그 타입인 경우 `_evaluate_blog_structure()` 호출
2. 다른 타입인 경우 `_build_basic_structure()` 호출

**평가 항목** (30점 만점):

1. **필수 섹션 존재 여부 (15점)**
   - **현재 구현**: `REQUIRED_SECTIONS` (9개 섹션 모두) 존재 여부 확인
   - 각 섹션 존재 시 약 1.67점 부여 (15점 / 9개 = 약 1.67점)
   - 섹션별 키워드 패턴 매칭 사용
   - **참고**: 프롬프트에는 RAG 기반으로 선택된 섹션만 포함되지만, 평가는 모든 필수 섹션을 체크합니다. 향후 선택된 섹션만 평가하도록 개선 가능합니다.

2. **마크다운 구조 검증 (10점)**
   - H1 헤더 존재: 3점
   - H2 헤더 3개 이상: 4점 (1개 이상: 2점)
   - H3 헤더 존재: 3점

3. **섹션 최소 길이 (5점)**
   - 각 섹션이 최소 길이 요구사항을 만족하는지 확인
   - 70% 이상 섹션이 요구사항 충족 시 5점

**출력**:
- `structure_score`: 구조 평가 점수 (0-30)
- `evaluation_feedback`: 평가 피드백 목록에 추가

**코드 위치**: 
- `_evaluate_structure_node` 메서드: `src/rag/content_workflow.py:553-583`
- `_evaluate_blog_structure` 메서드: `src/rag/content_workflow.py:585-640`

**섹션 키워드 매핑**:
```python
section_keywords = {
    "title": [r"^#\s+", r"제목", r"Title"],
    "tldr": [r"TL;DR", r"요약", r"핵심"],
    "situation_example": [r"상황", r"예시", r"사례"],
    "core_concepts": [r"핵심\s*개념", r"법령", r"판례"],
    "qa": [r"Q\s*[1-9]", r"질문", r"FAQ"],
    "checklist": [r"체크리스트", r"체크", r"To-do"],
    "warnings": [r"주의", r"예외", r"주의사항"],
    "summary": [r"마무리", r"요약", r"정리"],
    "disclaimer": [r"디스클레이머", r"면책", r"법률\s*자문"],
}
```

---

### 5. 내용 품질 평가 노드 (`_evaluate_content_quality_node`)

**역할**: 법령/판례 인용 정확성, 용어 설명 포함 여부, 예시 적절성을 평가합니다.

**입력**:
- `draft`: 생성된 초안
- `references`: 참고 문서 목록

**평가 항목** (40점 만점):

1. **법령 조문 번호 인용 정확성 (15점)**
   - 정규식 패턴: `r'(제\d+조|제\d+조의\d+)'`
   - 1개 이상 인용 시 15점

2. **판례 번호 인용 정확성 (10점)**
   - 정규식 패턴: `r'(\d{4}[도나가다라마바사아자차카타노]\d+)'`
   - 1개 이상 인용 시 10점

3. **법률 용어 설명 포함 여부 (10점)**
   - 법률 용어 목록: ["기망", "처분행위", "재산상 손해", "사기죄", "특가법"]
   - 정규식 패턴: `r"{term}\s*\([^)]+\)"` (용어(설명) 형식)
   - 2개 이상 설명: 10점
   - 1개 설명: 5점

4. **예시의 적절성 (5점)**
   - 예시 키워드: ["예:", "예를 들어", "예시", "사례", "상황"]
   - 키워드 포함 시 5점

**출력**:
- `content_quality_score`: 내용 품질 평가 점수 (0-40)
- `evaluation_feedback`: 평가 피드백 목록에 추가

**코드 위치**: 
- `_evaluate_content_quality_node` 메서드: `src/rag/content_workflow.py:703-723`
- `_evaluate_content_quality` 메서드: `src/rag/content_workflow.py:725-774`

---

### 6. 법적 정확성 평가 노드 (`_evaluate_legal_accuracy_node`)

**역할**: 법령 조문 번호 검증, 판례 번호 검증, 최신성을 확인합니다.

**입력**:
- `draft`: 생성된 초안
- `references`: 참고 문서 목록
- `search_results`: 검색 결과

**평가 항목** (30점 만점):

1. **법령 조문 번호 검증 (10점)**
   - 초안에서 법령 조문 번호 추출
   - 참고 문서에서 법령 조문 번호 추출
   - 일치하는 조문이 있으면 10점
   - 일치하지 않으면 감점

2. **판례 번호 검증 (10점)**
   - 초안에서 판례 번호 추출
   - 참고 문서에서 판례 번호 추출
   - 일치하는 판례가 있으면 10점
   - 일치하지 않으면 감점

3. **최신성 확인 (10점)**
   - 기준 시점 명시 여부 확인
   - 패턴: `r'\d{4}년\s*\d{1,2}월\s*기준'`
   - 명시 시 10점
   - 미명시 시 5점

**출력**:
- `legal_accuracy_score`: 법적 정확성 평가 점수 (0-30)
- `evaluation_feedback`: 평가 피드백 목록에 추가

**코드 위치**: 
- `_evaluate_legal_accuracy_node` 메서드: `src/rag/content_workflow.py:776-867`

---

### 7. 평가 점수 계산 노드 (`_calculate_score_node`)

**역할**: 세 가지 평가 점수를 합산하여 총점을 계산합니다.

**입력**:
- `structure_score`: 구조 평가 점수 (0-30)
- `content_quality_score`: 내용 품질 평가 점수 (0-40)
- `legal_accuracy_score`: 법적 정확성 평가 점수 (0-30)

**처리 과정**:
```python
total_score = structure_score + content_quality_score + legal_accuracy_score
```

**출력**:
- `evaluation_score`: 총 평가 점수 (0-100)

**코드 위치**: `src/rag/content_workflow.py:869-892`

---

### 8. 평가 분기 노드 (`_check_threshold_node`)

**역할**: 점수 임계값(70점) 기준으로 통과/재작성 분기를 결정합니다.

**입력**:
- `evaluation_score`: 총 평가 점수
- `revision_count`: 현재 재시도 횟수
- `max_revisions`: 최대 재시도 횟수 (기본값: 3)

**처리 로직**:
```python
threshold = 70.0

if evaluation_score >= threshold:
    should_rewrite = False  # 통과
elif revision_count < max_revisions:
    should_rewrite = True  # 재작성 필요
else:
    should_rewrite = False  # 최대 재시도 도달
```

**출력**:
- `should_rewrite`: 재작성 필요 여부 (bool)

**코드 위치**: `src/rag/content_workflow.py:894-919`

---

### 9. 질문 재작성 노드 (`_rewrite_topic_node`)

**역할**: 주제를 구체화하고 키워드를 조정합니다.

**입력**:
- `topic`: 현재 주제
- `evaluation_feedback`: 평가 피드백 목록
- `revision_count`: 현재 재시도 횟수

**처리 과정**:
1. 재시도 횟수 증가 (`revision_count += 1`)
2. 피드백을 바탕으로 주제 구체화 (간단한 구현)
3. 실제로는 LLM을 사용하여 개선 가능

**출력**:
- `revision_count`: 증가된 재시도 횟수
- `topic`: 조정된 주제 (현재는 그대로 유지)

**코드 위치**: `src/rag/content_workflow.py:921-947`

**향후 개선 방향**:
- LLM을 사용하여 피드백 기반 주제 개선
- 키워드 자동 보강

---

### 10. 프롬프트 조정 노드 (`_adjust_prompt_node`)

**역할**: 평가 피드백을 반영하여 프롬프트를 수정합니다.

**입력**:
- `prompt`: 현재 프롬프트
- `evaluation_feedback`: 평가 피드백 목록

**처리 과정**:
1. 최근 5개 피드백을 수집
2. 프롬프트 끝에 피드백 섹션 추가
3. 개선 지시사항 포함

**출력**:
- `prompt`: 조정된 프롬프트

**코드 위치**: `src/rag/content_workflow.py:948-973`

**피드백 추가 형식**:
```
{기존 프롬프트}

## 이전 평가 피드백 (반드시 개선 필요)
- {피드백 1}
- {피드백 2}
- {피드백 3}
...

위 피드백을 반영하여 콘텐츠를 개선해주세요.
```

---

### 11. 재검색 노드 (`_re_search_node`)

**역할**: 평가 결과에 따라 관련 문서를 재검색합니다.

**입력**:
- `topic`: 현재 주제
- `evaluation_feedback`: 평가 피드백 목록

**처리 과정**:
1. 피드백을 바탕으로 검색 쿼리 개선 (간단한 구현)
2. `_search_documents_node()` 재호출
3. 검색 결과 업데이트

**출력**:
- `search_results`: 재검색된 문서 리스트
- `context`: 업데이트된 컨텍스트
- `references`: 업데이트된 참고 문서 목록

**코드 위치**: `src/rag/content_workflow.py:974-994`

**향후 개선 방향**:
- 피드백에서 키워드 추출하여 검색 쿼리 보강
- 검색 범위 확대/축소

---

### 12. 최종 정리 노드 (`_finalize_content_node`)

**역할**: 구조화된 블로그 형식으로 변환합니다.

**입력**:
- `draft`: 생성된 초안
- `content_type`: 콘텐츠 타입

**처리 과정**:
1. 블로그 타입인 경우 `_parse_structured_content()` 호출
2. 마크다운 헤더 기반으로 섹션 추출
3. 섹션별로 딕셔너리 구성

**출력**:
- `structured_content`: 구조화된 콘텐츠 딕셔너리

**코드 위치**: 
- `_finalize_content_node` 메서드: `src/rag/content_workflow.py:995-1093`

**파싱 로직**:
- 마크다운 헤더 패턴: `r'^(#{1,3})\s+(.+?)$'`
- 섹션별 키워드 매핑으로 섹션 식별
- 헤더 레벨에 따라 섹션 계층 구조 파악

---

### 13. 메타데이터 생성 노드 (`_generate_metadata_node`)

**역할**: SEO 제목, 메타 디스크립션, 키워드, 카테고리를 생성합니다.

**입력**:
- `draft`: 생성된 초안
- `topic`: 주제
- `structured_content`: 구조화된 콘텐츠

**생성 항목**:

1. **SEO 제목**
   - 구조화된 콘텐츠의 제목에서 추출
   - 80-120자 제한
   - 키워드 포함 고려

2. **메타 디스크립션**
   - TL;DR 섹션 또는 콘텐츠 첫 120자에서 추출
   - 80-120자 제한

3. **키워드**
   - 주제에서 정규식으로 단어 추출
   - 3-5개 키워드

4. **카테고리**
   - 키워드 기반 자동 분류:
     - 노무: "퇴직금", "근로", "임금", "연차"
     - 개인정보: "개인정보", "정보보호", "개인정보보호법"
     - 계약: "계약", "계약서", "약관"
     - 분쟁: "분쟁", "소송", "손해배상"
     - 기타: 위 키워드가 없으면 "기타"

5. **태그**
   - 키워드에서 상위 3개를 태그로 사용

6. **버전 정보**
   - YYYYMMDD 형식 (예: "20241209")

**출력**:
- `metadata`: 메타데이터 딕셔너리

**코드 위치**: `src/rag/content_workflow.py:1094-1149`

---

### 14. 재사용 블록 추출 노드 (`_extract_reusable_blocks_node`)

**역할**: TL;DR, 체크리스트, Q&A, 숫자 팩트를 추출합니다.

**입력**:
- `draft`: 생성된 초안
- `structured_content`: 구조화된 콘텐츠

**추출 항목**:

1. **TL;DR**
   - "요약", "TL;DR" 섹션에서 추출
   - 구조화된 콘텐츠 또는 초안에서 직접 추출

2. **체크리스트**
   - 마크다운 bullet 포인트 (`-`, `*`) 추출
   - 정규식 패턴: `r'[-*]\s*(.+?)(?=\n[-*]|\n\n|$)'`
   - 3-7개 항목

3. **Q&A**
   - "Q1:", "Q2:" 형식의 질문/답변 쌍 추출
   - 정규식 패턴: `r'(Q\d*[.:]\s*.+?)(?=Q\d*[.:]|$)'`
   - 3-5개 질문/답변

4. **숫자 팩트**
   - 정규식 패턴으로 추출:
     - 날짜/기한: `r'(\d+일\s*이내)'`
     - 연도: `r'(\d+년)'`
     - 금액: `r'(\d+만\s*원)'`
     - 기간: `r'(\d+개월)'`
   - 2-3개 팩트 추출

**출력**:
- `reusable_blocks`: 재사용 블록 딕셔너리

**코드 위치**: `src/rag/content_workflow.py:1150-1200`

---

## 평가 시스템

### 평가 항목 상세

#### 1. 구조 평가 (30점 만점)

**목적**: 콘텐츠가 요구된 구조를 갖추고 있는지 평가합니다.

**평가 항목**:

1. **필수 섹션 존재 여부 (15점)**
   - 9개 섹션 각각 존재 여부 확인
   - 각 섹션 존재 시 약 1.67점 부여
   - 섹션별 키워드 패턴 매칭 사용

2. **마크다운 구조 검증 (10점)**
   - H1 헤더 존재: 3점
   - H2 헤더 3개 이상: 4점 (1개 이상: 2점)
   - H3 헤더 존재: 3점

3. **섹션 최소 길이 (5점)**
   - 각 섹션이 최소 길이 요구사항을 만족하는지 확인
   - 70% 이상 섹션이 요구사항 충족 시 5점

**점수 계산 예시**:
```python
# 필수 섹션 (15점)
section_scores = {}
for section_id in REQUIRED_SECTIONS:
    found = check_section_exists(draft, section_id)
    if found:
        score += 15.0 / len(REQUIRED_SECTIONS)  # 약 1.67점

# 마크다운 구조 (10점)
h1_count = draft.count("# ")
h2_count = draft.count("## ")
h3_count = draft.count("### ")

if h1_count >= 1:
    score += 3.0
if h2_count >= 3:
    score += 4.0
elif h2_count >= 1:
    score += 2.0
if h3_count >= 1:
    score += 3.0

# 최소 길이 (5점)
min_length_ok = count_sections_meeting_min_length(draft)
if min_length_ok >= required_sections * 0.7:
    score += 5.0
```

---

#### 2. 내용 품질 평가 (40점 만점)

**목적**: 콘텐츠의 품질과 가독성을 평가합니다.

**평가 항목**:

1. **법령 조문 번호 인용 (15점)**
   - 정규식: `r'(제\d+조|제\d+조의\d+)'`
   - 1개 이상 인용 시 15점

2. **판례 번호 인용 (10점)**
   - 정규식: `r'(\d{4}[도나가다라마바사아자차카타노]\d+)'`
   - 1개 이상 인용 시 10점

3. **법률 용어 설명 (10점)**
   - 법률 용어 목록: ["기망", "처분행위", "재산상 손해", "사기죄", "특가법"]
   - 정규식: `r"{term}\s*\([^)]+\)"` (용어(설명) 형식)
   - 2개 이상 설명: 10점
   - 1개 설명: 5점

4. **예시 적절성 (5점)**
   - 예시 키워드: ["예:", "예를 들어", "예시", "사례", "상황"]
   - 키워드 포함 시 5점

**점수 계산 예시**:
```python
# 법령 조문 (15점)
statute_pattern = r'(제\d+조|제\d+조의\d+)'
statute_matches = re.findall(statute_pattern, draft)
if len(statute_matches) >= 1:
    score += 15.0

# 판례 번호 (10점)
case_pattern = r'(\d{4}[도나가다라마바사아자차카타노]\d+)'
case_matches = re.findall(case_pattern, draft)
if len(case_matches) >= 1:
    score += 10.0

# 법률 용어 설명 (10점)
legal_terms = ["기망", "처분행위", "재산상 손해", "사기죄", "특가법"]
explained_terms = 0
for term in legal_terms:
    pattern = rf"{re.escape(term)}\s*\([^)]+\)"
    if re.search(pattern, draft):
        explained_terms += 1

if explained_terms >= 2:
    score += 10.0
elif explained_terms >= 1:
    score += 5.0

# 예시 (5점)
example_keywords = ["예:", "예를 들어", "예시", "사례", "상황"]
if any(keyword in draft for keyword in example_keywords):
    score += 5.0
```

---

#### 3. 법적 정확성 평가 (30점 만점)

**목적**: 콘텐츠의 법적 정확성을 평가합니다.

**평가 항목**:

1. **법령 조문 검증 (10점)**
   - 초안에서 법령 조문 번호 추출
   - 참고 문서에서 법령 조문 번호 추출
   - 일치하는 조문이 있으면 10점
   - 일치하지 않으면 감점

2. **판례 번호 검증 (10점)**
   - 초안에서 판례 번호 추출
   - 참고 문서에서 판례 번호 추출
   - 일치하는 판례가 있으면 10점
   - 일치하지 않으면 감점

3. **최신성 확인 (10점)**
   - 기준 시점 명시 여부 확인
   - 패턴: `r'\d{4}년\s*\d{1,2}월\s*기준'`
   - 명시 시 10점
   - 미명시 시 5점

**점수 계산 예시**:
```python
# 법령 조문 검증 (10점)
draft_statutes = extract_statute_numbers(draft)
reference_statutes = extract_statute_numbers_from_references(references)

if draft_statutes and reference_statutes:
    if draft_statutes.intersection(reference_statutes):
        score += 10.0
    else:
        feedback.append("인용된 법령 조문이 참고 문서와 일치하지 않습니다.")
elif draft_statutes:
    score += 5.0

# 판례 번호 검증 (10점)
draft_cases = extract_case_numbers(draft)
reference_cases = extract_case_numbers_from_references(references)

if draft_cases and reference_cases:
    if draft_cases.intersection(reference_cases):
        score += 10.0
    else:
        feedback.append("인용된 판례 번호가 참고 문서와 일치하지 않습니다.")
elif draft_cases:
    score += 5.0

# 최신성 확인 (10점)
freshness_patterns = [
    r'\d{4}년\s*\d{1,2}월\s*기준',
    r'\d{4}\.\s*\d{1,2}\.\s*기준',
    r'기준\s*시점',
]

has_freshness = any(re.search(pattern, draft) for pattern in freshness_patterns)
if has_freshness:
    score += 10.0
else:
    score += 5.0
```

---

### 피드백 루프

#### 재작성 조건

- 평가 점수가 70점 미만인 경우
- 재시도 횟수가 최대 재시도 횟수(3회) 미만인 경우

#### 재작성 프로세스

1. **질문 재작성 노드**
   - 피드백을 바탕으로 주제 구체화
   - 재시도 횟수 증가

2. **프롬프트 조정 노드**
   - 평가 피드백을 프롬프트에 추가
   - 개선 지시사항 포함

3. **재검색 노드**
   - 피드백 기반 검색 쿼리 개선
   - 관련 문서 재검색

4. **프롬프트 생성 노드로 복귀**
   - 조정된 프롬프트로 재생성

#### 최대 재시도 제한

- 기본값: 3회
- 최대 재시도 도달 시 재작성 중단
- 현재 점수와 함께 최종 결과 반환

---

## 템플릿 구조

### 9개 필수 섹션

#### 1. 제목 (H1)

**요구사항**:
- 최소 길이: 20자
- 최대 길이: 120자
- 형식: 질문 형태 권장
- SEO 최적화: 키워드 포함

**예시**:
```
퇴직금은 언제까지 줘야 할까? 지연 시 발생하는 법적 문제 정리
```

**코드 위치**: `src/rag/content_templates.py:7-17`

---

#### 2. 요약 (TL;DR)

**요구사항**:
- 최소 길이: 100자
- 최대 줄 수: 5줄
- 재사용 가능: 카드뉴스, 썸네일, 뉴스레터 인트로로 재사용

**예시**:
```
퇴직금은 퇴직일로부터 14일 이내에 지급해야 합니다. 지연 시 지연이자와 손해배상 책임이 발생할 수 있습니다.
```

**코드 위치**: `src/rag/content_templates.py:18-27`

---

#### 3. 상황 예시

**요구사항**:
- 최소 길이: 50자
- 스타일: 스토리텔링

**예시**:
```
직원 A씨가 퇴사했는데, 퇴직금을 한 달 뒤에 주면 안 되냐고 대표가 묻는 상황
```

**코드 위치**: `src/rag/content_templates.py:28-36`

---

#### 4. 핵심 개념 정리

**요구사항**:
- 최소 길이: 200자
- 반드시 포함: 법령 조문 번호, 기본 개념 설명, 판례 번호

**예시**:
```
근로기준법 제34조에 따르면, 사용자는 근로자가 퇴사한 경우 퇴직일로부터 14일 이내에 퇴직금을 지급해야 합니다.
```

**코드 위치**: `src/rag/content_templates.py:37-45`

---

#### 5. 자주 묻는 질문 (Q&A)

**요구사항**:
- 최소 개수: 3개
- 최대 개수: 5개
- 형식: Q&A 형식
- 재사용 가능: 유튜브 쇼츠, 릴스로 재활용

**예시**:
```
Q1. 퇴직금은 언제까지 지급해야 하나요?
A1. 퇴직일로부터 14일 이내에 지급해야 합니다.

Q2. 퇴직금 늦게 주면 이자가 붙나요?
A2. 네, 지연이자가 발생할 수 있습니다.
```

**코드 위치**: `src/rag/content_templates.py:46-56`

---

#### 6. 체크리스트 / To-do 리스트

**요구사항**:
- 최소 개수: 3개
- 최대 개수: 7개
- 형식: bullet 형식
- 재사용 가능: 인포그래픽, 카드뉴스로 재활용

**예시**:
```
퇴직금 지급 전 체크할 것 3가지:
- [ ] 근로기간 확인
- [ ] 평균임금 계산
- [ ] 지급 기한 확인
```

**코드 위치**: `src/rag/content_templates.py:57-67`

---

#### 7. 주의할 점 & 예외 사항

**요구사항**:
- 최소 길이: 100자
- 형식: 별도 박스형 섹션

**예시**:
```
단, 합의서에 명시된 경우에는 예외적으로 퇴직금을 줄일 수 있습니다. 다만 이는 법적으로 유효한 합의여야 합니다.
```

**코드 위치**: `src/rag/content_templates.py:68-76`

---

#### 8. 마무리 요약 & 권장 행동

**요구사항**:
- 최소 길이: 100자
- 반드시 포함: 핵심 정리, 권장 행동

**예시**:
```
퇴직금은 법적으로 명확한 지급 의무가 있으므로, 반드시 기한 내에 지급해야 합니다. 지연 시 법적 책임이 발생할 수 있으므로, 사전에 준비하는 것이 중요합니다.
```

**코드 위치**: `src/rag/content_templates.py:77-85`

---

#### 9. 디스클레이머

**요구사항**:
- 필수 섹션
- 고정 문구 포함

**고정 문구**:
```
본 글은 일반적인 법률 정보 제공을 위한 것이며, 개별 사건에 대한 법률 자문을 대체하지 않습니다. 구체적인 사안은 반드시 전문가와 상담하시기 바랍니다.
```

**코드 위치**: `src/rag/content_templates.py:86-95`

---

### 섹션 순서

```python
SECTION_ORDER = [
    "title",
    "tldr",
    "situation_example",
    "core_concepts",
    "qa",
    "checklist",
    "warnings",
    "summary",
    "disclaimer",
]
```

---

## 프롬프트 시스템

### 구조화된 프롬프트 생성

프롬프트는 템플릿 상수를 활용하여 동적으로 생성됩니다.

#### 기본 구조

```
당신은 전문 법률 콘텐츠 작가입니다...

## 타깃 독자
- 법률 비전공자
- "변호사를 만나기 전, 기본 개념을 이해하게 해주는 친절한 안내서" 포지셔닝

## 문체 및 스타일
- "~합니다 / ~입니다" 체로 통일
- 한 문장은 되도록 2줄 이내로 짧게
- 어려운 법률 용어는 첫 등장 시 "용어(간단 설명)" 형태로 풀어서 설명
- 예시 중심 설명
- 위험한 단정 표현 지양

## 필수 구조 (반드시 다음 순서대로 작성)
[템플릿 상수 기반 섹션별 상세 지시사항]

## 작성할 주제
{topic}

## 참고 문서
{context}
```

#### 섹션별 상세 지시사항 생성

**중요**: RAG 검색 결과 기반으로 선택된 섹션(`selected_sections`)만 프롬프트에 포함됩니다.

템플릿 상수(`BLOG_SECTIONS`)를 사용하여 **선택된 섹션**의 요구사항을 프롬프트에 포함합니다:

```python
# RAG 검색 결과 기반 섹션 선택
selected_sections = self._select_sections_based_on_rag(
    references=references or [],
    topic=topic,
    include_sections=include_sections,
)

# 선택된 섹션만 프롬프트에 포함
for idx, section_id in enumerate(selected_sections, 1):
    section_info = BLOG_SECTIONS[section_id]
    section_name = section_info["name"]
    description = section_info["description"]
    example = section_info.get("example", "")
    requirements = section_info.get("requirements", {})
    
    sections_guide += f"\n{idx}. **{section_name}**\n"
    sections_guide += f"   - {description}\n"
    
    # 요구사항 추가
    if requirements.get("min_length"):
        sections_guide += f"   - 최소 길이: {requirements['min_length']}자 이상\n"
    if requirements.get("max_length"):
        sections_guide += f"   - 최대 길이: {requirements['max_length']}자 이하\n"
    if requirements.get("min_count"):
        sections_guide += f"   - 최소 개수: {requirements['min_count']}개 이상\n"
    if requirements.get("max_count"):
        sections_guide += f"   - 최대 개수: {requirements['max_count']}개 이하\n"
    if requirements.get("format"):
        sections_guide += f"   - 형식: {requirements['format']}\n"
    if requirements.get("must_include"):
        sections_guide += f"   - 반드시 포함: {', '.join(requirements['must_include'])}\n"
    if requirements.get("reusable"):
        sections_guide += f"   - 재사용 가능: 카드뉴스, 인포그래픽, 뉴스레터 등으로 재활용 가능\n"
    if requirements.get("seo_optimized"):
        sections_guide += f"   - SEO 최적화: 키워드 포함, 검색 엔진 최적화 고려\n"
    if requirements.get("required"):
        sections_guide += f"   - 필수 섹션: 반드시 포함해야 합니다\n"
    if requirements.get("fixed_text"):
        sections_guide += f"   - 고정 문구: \"{requirements['fixed_text']}\"\n"
    
    if example:
        sections_guide += f"   - 예시: {example}\n"
```

**코드 위치**: `src/rag/content_workflow.py:384-426`

---

## 메타데이터 생성

### SEO 제목 생성

**로직**:
1. 구조화된 콘텐츠의 제목에서 추출
2. 없으면 초안의 첫 줄에서 추출
3. 80-120자 제한

**코드**:
```python
title = structured_content.get("# " + topic, topic)
metadata["seo_title"] = title[:120] if len(title) > 120 else title
```

---

### 메타 디스크립션 생성

**로직**:
1. TL;DR 섹션에서 추출
2. 없으면 초안의 첫 120자에서 추출
3. 80-120자 제한

**코드**:
```python
tldr = structured_content.get("## 요약", "") or structured_content.get("## TL;DR", "")
if tldr:
    metadata["meta_description"] = tldr[:120] if len(tldr) > 120 else tldr
else:
    metadata["meta_description"] = draft[:120] if len(draft) > 120 else draft
```

---

### 키워드 추출

**로직**:
1. 주제에서 정규식으로 단어 추출
2. 3-5개 키워드 선택

**코드**:
```python
import re
keywords = re.findall(r'\b\w{2,}\b', topic)
metadata["keywords"] = keywords[:5]
```

---

### 카테고리 자동 분류

**로직**:
키워드 기반으로 자동 분류:

```python
category_keywords = {
    "노무": ["퇴직금", "근로", "임금", "연차"],
    "개인정보": ["개인정보", "정보보호", "개인정보보호법"],
    "계약": ["계약", "계약서", "약관"],
    "분쟁": ["분쟁", "소송", "손해배상"],
}

category = "기타"
for cat, keywords_list in category_keywords.items():
    if any(kw in topic for kw in keywords_list):
        category = cat
        break

metadata["category"] = category
```

---

## 재사용 블록 추출

### TL;DR 추출

**로직**:
1. 구조화된 콘텐츠의 "요약" 또는 "TL;DR" 섹션에서 추출
2. 없으면 초안에서 직접 추출

**코드**:
```python
tldr = structured_content.get("## 요약", "") or structured_content.get("## TL;DR", "")
if tldr:
    reusable_blocks["tldr"] = tldr.strip()
```

---

### 체크리스트 추출

**로직**:
1. 마크다운 bullet 포인트 (`-`, `*`) 추출
2. 정규식 패턴: `r'[-*]\s*(.+?)(?=\n[-*]|\n\n|$)'`
3. 3-7개 항목 선택

**코드**:
```python
checklist_pattern = r'[-*]\s*(.+?)(?=\n[-*]|\n\n|$)'
checklist_items = re.findall(checklist_pattern, draft, re.MULTILINE)
if checklist_items:
    reusable_blocks["checklist"] = checklist_items[:7]
```

---

### Q&A 추출

**로직**:
1. "Q1:", "Q2:" 형식의 질문/답변 쌍 추출
2. 정규식 패턴: `r'(Q\d*[.:]\s*.+?)(?=Q\d*[.:]|$)'`
3. 3-5개 질문/답변 선택

**코드**:
```python
qa_pattern = r'(Q\d*[.:]\s*.+?)(?=Q\d*[.:]|$)'
qa_matches = re.findall(qa_pattern, draft, re.DOTALL | re.IGNORECASE)
if qa_matches:
    reusable_blocks["qa"] = qa_matches[:5]
```

---

### 숫자 팩트 추출

**로직**:
1. 정규식 패턴으로 숫자 정보 추출:
   - 날짜/기한: `r'(\d+일\s*이내)'`
   - 연도: `r'(\d+년)'`
   - 금액: `r'(\d+만\s*원)'`
   - 기간: `r'(\d+개월)'`
2. 2-3개 팩트 선택

**코드**:
```python
number_patterns = [
    r'(\d+일\s*이내)',
    r'(\d+년)',
    r'(\d+만\s*원)',
    r'(\d+개월)',
]

facts = []
for pattern in number_patterns:
    matches = re.findall(pattern, draft)
    facts.extend(matches[:2])

if facts:
    reusable_blocks["facts"] = facts[:3]
```

---

## API 변경사항

### 요청 모델 (ContentGenerationRequest)

**변경 없음** - 기존과 동일

```python
class ContentGenerationRequest(BaseModel):
    topic: str
    content_type: Literal["blog", "article", "opinion", "analysis", "faq"] = "blog"
    style: Optional[str] = None
    target_length: Optional[int] = None
    include_sections: Optional[List[str]] = None
    keywords: Optional[List[str]] = None
    document_types: Optional[List[str]] = None
    n_references: int = 5
```

---

### 응답 모델 (ContentGenerationResponse)

**새로 추가된 필드**:

1. **`structured_content: Optional[Dict[str, str]]`**
   - 구조화된 콘텐츠 (섹션별)
   - 예: `{"# 제목": "...", "## 요약": "..."}`

2. **`reusable_blocks: Optional[Dict[str, Any]]`**
   - 재사용 블록
   - 예: `{"tldr": "...", "checklist": [...], "qa": [...], "facts": [...]}`

3. **`evaluation_score: Optional[float]`**
   - 평가 점수 (0-100)

4. **`evaluation_feedback: List[str]`**
   - 평가 피드백 목록

5. **`version: Optional[str]`**
   - 버전 정보 (YYYYMMDD)

6. **`revision_count: int`**
   - 재작성 횟수

**확장된 필드**:

- **`metadata: Dict[str, Any]`**
  - 기존: `content_type`, `topic`, `word_count`
  - 추가: `seo_title`, `meta_description`, `keywords`, `category`, `tags`, `version`

---

### 엔드포인트 변경사항

**엔드포인트**: `POST /api/v1/generate`

**변경 전**:
```python
@router.post("/generate", response_model=ContentGenerationResponse)
async def generate_content(
    request: ContentGenerationRequest,
    retriever: HybridRetriever = Depends(get_retriever),
    llm_manager: LLMManager = Depends(get_llm_manager),
):
    # 단순 RAG 검색 → LLM 생성
    search_result = await retriever.search(...)
    generated_content = llm_manager.generate_response(...)
    return ContentGenerationResponse(...)
```

**변경 후**:
```python
@router.post("/generate", response_model=ContentGenerationResponse)
async def generate_content(
    request: ContentGenerationRequest,
    content_workflow: ContentWorkflow = Depends(get_content_workflow),
):
    # LangGraph 워크플로우 실행
    result = content_workflow.run(
        topic=request.topic,
        content_type=request.content_type,
        ...
    )
    
    # 확장된 응답 구조 반환
    return ContentGenerationResponse(
        success=True,
        content=result.get("draft", ""),
        structured_content=result.get("structured_content"),
        reusable_blocks=result.get("reusable_blocks"),
        evaluation_score=result.get("evaluation_score"),
        evaluation_feedback=result.get("evaluation_feedback", []),
        version=result.get("version"),
        revision_count=result.get("revision_count", 0),
        ...
    )
```

---

## 코드 구조 변경사항

### 새로 추가된 파일

1. **`src/rag/content_workflow.py`**
   - ContentWorkflow 클래스
   - ContentWorkflowState 정의
   - 14개 워크플로우 노드 구현
   - 워크플로우 그래프 빌드 로직

2. **`src/rag/content_templates.py`**
   - BLOG_SECTIONS 상수 정의
   - SECTION_ORDER 정의
   - REQUIRED_SECTIONS 정의
   - REUSABLE_SECTIONS 정의

3. **`tests/test_content_generation.py`**
   - 콘텐츠 생성 워크플로우 테스트
   - 구조 검증 테스트
   - 평가 점수 테스트
   - 피드백 루프 테스트

---

### 수정된 파일

1. **`src/api/routers/generate.py`**
   - `ContentGenerationResponse` 모델 확장
   - `generate_content` 엔드포인트 수정
   - ContentWorkflow 통합

2. **`src/api/dependencies.py`**
   - `get_content_workflow()` 함수 추가

3. **`docs/guides/CONTENT_GENERATION_GUIDE.md`**
   - LangGraph 워크플로우 설명 추가
   - 평가 기준 설명 추가
   - 메타데이터 생성 방법 설명 추가
   - 재사용 블록 설명 추가
   - API 사용 예제 업데이트

---

### 클래스 및 함수 상세

#### ContentWorkflow 클래스

**위치**: `src/rag/content_workflow.py`

**주요 메서드**:

1. **`__init__(vector_store, embedding_generator, llm_manager)`**
   - 의존성 주입
   - RAGWorkflow 초기화
   - 그래프는 `run()` 호출 시 빌드

2. **`_build_graph() -> StateGraph`**
   - 워크플로우 그래프 구성
   - 14개 노드 추가
   - 엣지 연결
   - 조건부 엣지 설정

3. **`run(topic, content_type, ...) -> Dict[str, Any]`**
   - 워크플로우 실행
   - 초기 상태 설정
   - 그래프 실행
   - 결과 반환

4. **14개 노드 메서드**
   - 각 노드는 `ContentWorkflowState`를 입력받아 수정된 상태를 반환

---

## 사용 예제

### 기본 사용

**요청**:
```json
{
  "topic": "퇴직금은 언제까지 지급해야 하나요?",
  "content_type": "blog",
  "n_references": 5
}
```

**응답**:
```json
{
  "success": true,
  "content": "# 퇴직금은 언제까지 지급해야 하나요?\n\n## 요약\n...",
  "title": "퇴직금은 언제까지 지급해야 하나요?",
  "structured_content": {
    "# 퇴직금은 언제까지 지급해야 하나요?": "",
    "## 요약": "퇴직금은 퇴직일로부터 14일 이내에 지급해야 합니다...",
    "## 상황 예시": "직원 A씨가 퇴사했는데...",
    "## 핵심 개념 정리": "근로기준법 제34조에 따르면...",
    "## 자주 묻는 질문": "Q1. 퇴직금은 언제까지 지급해야 하나요?\nA1. ...",
    "## 체크리스트": "- [ ] 근로기간 확인\n- [ ] 평균임금 계산",
    "## 주의할 점": "...",
    "## 마무리": "...",
    "## 디스클레이머": "본 글은 일반적인 법률 정보..."
  },
  "reusable_blocks": {
    "tldr": "퇴직금은 퇴직일로부터 14일 이내에 지급해야 합니다.",
    "checklist": ["근로기간 확인", "평균임금 계산", "지급 기한 확인"],
    "qa": ["Q1. 퇴직금은 언제까지 지급해야 하나요?\nA1. ..."],
    "facts": ["14일 이내", "5년"]
  },
  "evaluation_score": 85.5,
  "evaluation_feedback": [],
  "version": "20241209",
  "revision_count": 0,
  "references": [
    {
      "title": "근로기준법 제34조",
      "type": "statute",
      "id": "statute-34",
      "relevance": 0.95
    }
  ],
  "metadata": {
    "seo_title": "퇴직금은 언제까지 지급해야 하나요? 근로기준법 완벽 정리",
    "meta_description": "퇴직금은 퇴직일로부터 14일 이내에 지급해야 합니다. 지연 시 지연이자와 손해배상 책임이 발생할 수 있습니다.",
    "keywords": ["퇴직금", "지급", "기한"],
    "category": "노무",
    "tags": ["퇴직금", "지급", "기한"],
    "version": "20241209",
    "content_type": "blog",
    "topic": "퇴직금은 언제까지 지급해야 하나요?",
    "word_count": 2500
  },
  "timestamp": "2024-12-09T18:00:00"
}
```

---

### 고급 옵션 사용

**요청**:
```json
{
  "topic": "사기죄 처벌",
  "content_type": "blog",
  "style": "대중적",
  "target_length": 2000,
  "keywords": ["사기죄", "처벌", "형법"],
  "include_sections": ["법적기준", "판례", "대응방법"],
  "document_types": ["case", "statute"],
  "n_references": 10
}
```

**응답 특징**:
- 평가 점수가 70점 미만이면 자동 재작성
- 최대 3회 재시도
- 재시도 횟수는 `revision_count`에 기록
- 평가 피드백은 `evaluation_feedback`에 포함

---

## 문제 해결 가이드

### 일반적인 오류

#### 1. "프롬프트 생성 실패"

**원인**: 템플릿 상수 로드 실패

**해결**:
- `src/rag/content_templates.py` 파일 확인
- `BLOG_SECTIONS` 상수 정의 확인

---

#### 2. "평가 점수가 항상 0점"

**원인**: 평가 노드에서 예외 발생

**해결**:
- 로그 확인: `logger.error()` 메시지
- 초안이 비어있는지 확인
- 평가 로직의 정규식 패턴 확인

---

#### 3. "재작성이 무한 반복"

**원인**: 최대 재시도 횟수 체크 실패

**해결**:
- `max_revisions` 파라미터 확인
- `_check_threshold_node` 로직 확인

---

### 디버깅 방법

#### 1. 로그 확인

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

#### 2. 상태 확인

워크플로우 실행 중간에 상태를 확인하려면:

```python
# content_workflow.py의 각 노드에서
logger.info(f"현재 상태: {state}")
```

#### 3. 평가 점수 상세 확인

```python
# 평가 노드에서
logger.info(f"구조 평가: {structure_score}/30")
logger.info(f"내용 품질: {content_quality_score}/40")
logger.info(f"법적 정확성: {legal_accuracy_score}/30")
logger.info(f"총점: {total_score}/100")
```

---

## 마이그레이션 가이드

### 기존 코드에서 새 워크플로우로 전환

#### 1. 의존성 변경

**변경 전**:
```python
from src.api.dependencies import get_retriever, get_llm_manager

@router.post("/generate")
async def generate_content(
    request: ContentGenerationRequest,
    retriever: HybridRetriever = Depends(get_retriever),
    llm_manager: LLMManager = Depends(get_llm_manager),
):
    ...
```

**변경 후**:
```python
from src.api.dependencies import get_content_workflow

@router.post("/generate")
async def generate_content(
    request: ContentGenerationRequest,
    content_workflow: ContentWorkflow = Depends(get_content_workflow),
):
    ...
```

#### 2. 실행 로직 변경

**변경 전**:
```python
# 1. 검색
search_result = await retriever.search(...)

# 2. 프롬프트 생성
system_prompt = _build_system_prompt(...)
user_prompt = _build_user_prompt(...)

# 3. LLM 생성
generated_content = llm_manager.generate_response(...)

# 4. 파싱
parsed_content = _parse_generated_content(...)
```

**변경 후**:
```python
# 워크플로우 실행 (모든 단계 자동 처리)
result = content_workflow.run(
    topic=request.topic,
    content_type=request.content_type,
    ...
)

# 결과 추출
draft = result.get("draft", "")
structured_content = result.get("structured_content", {})
evaluation_score = result.get("evaluation_score")
...
```

#### 3. 응답 구조 변경

**변경 전**:
```python
return ContentGenerationResponse(
    success=True,
    content=generated_content,
    title=parsed_content.get("title"),
    sections=parsed_content.get("sections"),
    references=reference_list,
    metadata={...},
    timestamp=datetime.now().isoformat(),
)
```

**변경 후**:
```python
return ContentGenerationResponse(
    success=True,
    content=result.get("draft", ""),
    title=title,
    sections=structured_content,
    structured_content=structured_content,
    reusable_blocks=result.get("reusable_blocks", {}),
    evaluation_score=result.get("evaluation_score"),
    evaluation_feedback=result.get("evaluation_feedback", []),
    version=result.get("version"),
    revision_count=result.get("revision_count", 0),
    references=reference_list,
    metadata=extended_metadata,
    timestamp=datetime.now().isoformat(),
)
```

---

## 테스트 가이드

### 테스트 파일 구조

```
tests/
  ├── test_content_generation.py  # 콘텐츠 생성 워크플로우 테스트
  ├── conftest.py                  # 픽스처 정의
  └── ...
```

### 테스트 실행

```bash
# 모든 테스트 실행
pytest tests/test_content_generation.py

# 특정 테스트만 실행
pytest tests/test_content_generation.py::TestContentGeneration::test_basic_content_generation

# 커버리지 포함
pytest tests/test_content_generation.py --cov=src.rag.content_workflow
```

### 테스트 예시

```python
def test_basic_content_generation(mock_content_workflow):
    """기본 콘텐츠 생성 테스트"""
    result = mock_content_workflow.run(
        topic="퇴직금",
        content_type="blog",
    )
    
    assert result is not None
    assert "draft" in result
    assert result.get("evaluation_score", 0) >= 0
```

---

## 성능 및 최적화

### 워크플로우 실행 시간

**예상 실행 시간**:
- 문서 검색: 1-2초
- 프롬프트 생성: <0.1초
- 초안 작성: 5-15초 (LLM 호출)
- 평가: <0.5초
- 메타데이터 생성: <0.1초
- 재사용 블록 추출: <0.1초

**총 실행 시간**: 약 7-18초 (재작성 없을 경우)

**재작성 포함**: 최대 3회 재시도 시 약 21-54초

### 최적화 전략

1. **캐싱**
   - 검색 결과 캐싱
   - 프롬프트 캐싱

2. **병렬 처리**
   - 평가 노드들을 병렬로 실행 가능 (향후 개선)

3. **재시도 최적화**
   - 재시도 횟수 조정 가능
   - 임계값 조정 가능

---

## 결론

이번 개선을 통해 법률 블로그 콘텐츠 생성 시스템이 다음과 같이 향상되었습니다:

1. **구조화된 템플릿**: 9개 필수 섹션으로 일관된 구조
2. **자동 평가**: 3단계 평가 시스템으로 품질 보장
3. **자동 재작성**: 피드백 루프로 품질 개선
4. **메타데이터 자동 생성**: SEO 최적화 자동화
5. **재사용 블록 추출**: 다양한 포맷으로 재활용 가능

시스템은 이제 **프로덕션 환경에서 사용 가능**한 수준입니다.

