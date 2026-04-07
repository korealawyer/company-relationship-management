# 블로그 콘텐츠 생성 가이드

## 📋 목차

1. [개요](#개요)
2. [전체 워크플로우](#전체-워크플로우)
3. [프롬프트 구조 및 처리](#프롬프트-구조-및-처리)
4. [파인튜닝 모델 사용 방법](#파인튜닝-모델-사용-방법)
5. [API 사용 예제](#api-사용-예제)
6. [고급 설정](#고급-설정)
7. [문제 해결](#문제-해결)

---

## 개요

### 블로그 콘텐츠 생성이란?

이 시스템은 **RAG(Retrieval-Augmented Generation)** 기반으로 법률 관련 블로그 콘텐츠를 자동 생성합니다. 벡터 데이터베이스에서 관련 법령, 판례, 절차 등을 검색하여 정확하고 전문적인 콘텐츠를 생성합니다.

**주요 특징:**
- 법령 및 판례 기반 정확한 정보 제공
- SEO 최적화된 블로그 포스팅 생성
- 다양한 콘텐츠 타입 지원 (블로그, 기사, 의견서, 분석, FAQ)
- 파인튜닝 모델 지원으로 특화된 콘텐츠 생성

**지원하는 콘텐츠 타입:**
- `blog`: 블로그 포스팅
- `article`: 법률 기사
- `opinion`: 법률 의견서
- `analysis`: 법률 케이스 분석
- `faq`: FAQ 형식

---

## 전체 워크플로우

### LangGraph 기반 다단계 프로세스

블로그 콘텐츠 생성은 **LangGraph**를 사용한 다단계 워크플로우로 구성되어 있습니다. 각 단계는 독립적인 노드로 구현되어 있으며, 평가 결과에 따라 자동으로 재작성하는 피드백 루프를 포함합니다.

```
사용자 요청
    ↓
[1] 문서 검색 노드
    - RAG 검색 수행
    - 관련 법령/판례 검색
    - 검색 결과를 state에 저장
    ↓
[2] 프롬프트 생성 노드
    - 구조화된 블로그 템플릿 기반 프롬프트 생성
    - 9개 섹션 구조 포함
    - 타깃 독자 및 스타일 지시사항 포함
    ↓
[3] 초안 작성 노드
    - LLM을 사용한 블로그 초안 생성
    - 구조화된 템플릿에 맞춰 작성
    ↓
[4] 구조 평가 노드
    - 필수 섹션 9개 존재 여부 확인
    - H1/H2/H3 마크다운 구조 검증
    - 각 섹션 최소 길이 확인
    ↓
[5] 내용 품질 평가 노드
    - 법령/판례 인용 정확성 검증
    - 법률 용어 설명 포함 여부 확인
    - 예시의 적절성 평가
    ↓
[6] 법적 정확성 평가 노드
    - 법령 조문 번호 검증
    - 판례 번호 검증
    - 최신성 확인 (기준 시점 명시)
    ↓
[7] 평가 점수 계산 노드
    - 구조 평가 (30점) + 내용 품질 (40점) + 법적 정확성 (30점)
    - 총점 계산 (100점 만점)
    ↓
[8] 평가 분기 노드
    - 점수 임계값(70점) 기준으로 분기
    - 70점 이상: 통과 → 최종 정리
    - 70점 미만: 재작성 필요 → 피드백 루프
    ↓
[피드백 루프] (점수 미달 시)
    [9] 질문 재작성 노드
        - 주제 구체화 및 키워드 조정
    ↓
    [10] 프롬프트 조정 노드
        - 평가 피드백 반영하여 프롬프트 수정
    ↓
    [11] 재검색 노드
        - 평가 결과에 따라 관련 문서 재검색
    ↓
    → [2] 프롬프트 생성 노드로 돌아가기
    (최대 3회 재시도)
    ↓
[12] 최종 정리 노드
    - 구조화된 블로그 형식으로 변환
    - 섹션별로 파싱 및 정리
    ↓
[13] 메타데이터 생성 노드
    - SEO 제목 생성 (80-120자)
    - 메타 디스크립션 생성 (80-120자)
    - 키워드 추출 (3-5개)
    - 카테고리 자동 분류
    - 태그 생성
    - 버전 정보 생성 (YYYYMMDD)
    ↓
[14] 재사용 블록 추출 노드
    - TL;DR 추출 (3-5줄 요약)
    - 체크리스트 추출 (3-7개 bullet)
    - Q&A 추출 (3-5개 질문/답변)
    - 숫자 팩트 추출 (날짜, 기한, 금액 등)
    ↓
응답 반환
```

### 평가 시스템

워크플로우는 3가지 평가 항목으로 콘텐츠 품질을 평가합니다:

#### 1. 구조 평가 (30점 만점)
- **필수 섹션 존재 여부 (15점)**: 9개 섹션 모두 포함 여부
- **마크다운 구조 검증 (10점)**: H1, H2, H3 헤더 구조
- **섹션 최소 길이 (5점)**: 각 섹션의 최소 길이 요구사항 충족

#### 2. 내용 품질 평가 (40점 만점)
- **법령 조문 번호 인용 (15점)**: 법령 조문 번호 정확성
- **판례 번호 인용 (10점)**: 판례 번호 정확성
- **법률 용어 설명 (10점)**: 첫 등장 시 용어(설명) 형태 포함
- **예시 적절성 (5점)**: 현실적이고 적절한 예시 포함

#### 3. 법적 정확성 평가 (30점 만점)
- **법령 조문 검증 (10점)**: RAG 검색 결과와 법령 인용 대조
- **판례 번호 검증 (10점)**: RAG 검색 결과와 판례 인용 대조
- **최신성 확인 (10점)**: 기준 시점 명시 여부

**총점**: 100점 만점, **통과 기준**: 70점 이상

### 피드백 루프

평가 점수가 70점 미만인 경우:
1. 평가 피드백을 수집
2. 주제를 구체화하고 키워드 조정
3. 프롬프트에 피드백 반영
4. 관련 문서 재검색
5. 프롬프트 생성부터 다시 시작
6. 최대 3회까지 재시도

### 단계별 상세 설명

#### 1단계: 문서 검색 노드 (RAG)

**코드 위치:** `src/rag/content_workflow.py:144-193`

```python
def _search_documents_node(self, state: ContentWorkflowState) -> ContentWorkflowState:
    """문서 검색 노드 - RAG 검색 수행 및 결과를 state에 저장"""
    # RAG 워크플로우를 사용하여 검색
    search_result = self.rag_workflow.run(
        query=topic,
        metadata_filters=None,
        document_types=document_types,
    )
    
    # 검색 결과 추출
    reranked_results = search_result.get("reranked_results", [])[:n_references]
    context = search_result.get("context", "")
    
    # 상태 업데이트
    state["search_results"] = reranked_results
    state["context"] = context
    state["references"] = references
```

**처리 과정:**
1. 사용자가 입력한 `topic` (예: "사기죄 처벌")을 쿼리로 사용
2. 벡터 데이터베이스에서 의미적으로 유사한 문서 검색
3. 하이브리드 검색 (벡터 검색 + 키워드 검색) 수행
4. 상위 N개 문서 반환 (기본값: 5개, 최대: 20개)

**검색 결과 예시:**
```json
{
  "query": "사기죄 처벌",
  "results": [
    {
      "id": "case-2005고합694_chunk_1",
      "document": "【판단】 피고인들은 이 사건 토지를 매수하여...",
      "metadata": {
        "title": "대구지법 2005고합694 판결",
        "case_number": "2005고합694",
        "category": "형사",
        "sub_category": "사기"
      },
      "distance": 0.234,
      "score": 0.81
    },
    ...
  ],
  "context": "[문서 1]\n제목: 대구지법 2005고합694 판결\n내용: ...\n\n[문서 2]\n..."
}
```

#### 2단계: 컨텍스트 구성

**코드 위치:** `src/rag/content_workflow.py:160-182`

컨텍스트 구성은 문서 검색 노드 내에서 자동으로 수행됩니다. RAG 워크플로우가 검색 결과를 컨텍스트 형식으로 변환하여 state에 저장합니다.

**컨텍스트 형식:**
```
[문서 1]
제목: 대구지법 2005고합694 판결
타입: case
내용: 【판단】 피고인들은 이 사건 토지를 매수하여 아파트 건설 공사를 추진하고...

[문서 2]
제목: 형법 제347조 (사기)
타입: statute
내용: ① 사람을 기망하여 재물의 교부를 받거나 재산상 이익을 취득한 자는...

[문서 3]
...
```

**컨텍스트 최적화:**
- `ContextOptimizer.optimize_context()` 메서드가 자동으로 컨텍스트 길이를 최적화
- 최대 길이: 약 12,000자 (4,000 토큰 기준)
- 문서 중요도에 따라 상위 문서 우선 선택

#### 3단계: 프롬프트 생성

**코드 위치:** `src/rag/content_workflow.py:195-237`

프롬프트 생성 노드는 블로그 타입인 경우 구조화된 템플릿을 사용하고, 다른 타입은 기본 프롬프트를 사용합니다.

##### 3-1. 구조화된 블로그 프롬프트 생성

**코드 위치:** `src/rag/content_workflow.py:356-472`

블로그 타입인 경우 `_build_structured_blog_prompt` 메서드를 사용하여 구조화된 프롬프트를 생성합니다. 이 메서드는 `content_templates.py`의 `BLOG_SECTIONS` 상수를 활용하여 섹션별 상세 지시사항을 포함합니다.

**프롬프트 생성 과정:**

1. **RAG 검색 결과 기반 섹션 선택** (`_select_sections_based_on_rag`)
   - 검색된 문서 타입(판례, 법령, 절차 등)을 분석하여 적합한 섹션 자동 선택
   - 사용자가 `include_sections`를 지정한 경우 우선 사용
   - 최소 5개, 최대 9개 섹션 선택

2. **템플릿 상수 활용** (`content_templates.py`의 `BLOG_SECTIONS`)
   - 각 섹션의 이름, 설명, 예시, 요구사항을 템플릿에서 가져옴
   - 섹션별 최소/최대 길이, 형식, 필수 포함 사항 등을 프롬프트에 포함

3. **프롬프트 조합**
   - 타깃 독자, 문체 및 스타일 지시사항
   - 선택된 섹션별 상세 지시사항
   - 스타일, 목표 길이, 키워드 등 추가 옵션
   - 법령/판례 인용 형식 규칙

**구조화된 블로그 프롬프트 예시:**
```
당신은 전문 법률 콘텐츠 작가입니다. 제공된 법률 문서(법령, 판례 등)를 참고하여 정확하고 전문적인 법률 블로그 콘텐츠를 작성합니다.

## 타깃 독자
- 법률 비전공자(일반 직장인, 스타트업 대표, 자영업자, 일반 소비자 등)
- "변호사를 만나기 전, 기본 개념을 이해하게 해주는 친절한 안내서" 포지셔닝

## 문체 및 스타일
- "~합니다 / ~입니다" 체로 통일
- 한 문장은 되도록 2줄 이내로 짧게
- 어려운 법률 용어는 첫 등장 시 "용어(간단 설명)" 형태로 풀어서 설명
...

## 필수 구조 (반드시 다음 순서대로 작성)

1. **제목 (H1)**
   - 독자가 실제로 할 법한 질문 형태를 권장
   - 최소 길이: 20자 이상
   - 최대 길이: 120자 이하
   - SEO 최적화: 키워드 포함, 검색 엔진 최적화 고려
   - 예시: 퇴직금은 언제까지 줘야 할까? 지연 시 발생하는 법적 문제 정리

2. **요약 (TL;DR)**
   - 글의 핵심 메시지를 간단히 정리 (3-5줄)
   - 최소 길이: 100자 이상
   - 재사용 가능: 카드뉴스, 썸네일, 뉴스레터 인트로로 재사용
   ...

## 작성할 주제
사기죄 처벌

## 참고 문서
[문서 1]
제목: 대구지법 2005고합694 판결
타입: case
내용: 【판단】 피고인들은 이 사건 토지를 매수하여...
```

#### 4단계: LLM으로 콘텐츠 생성

**코드 위치:** `src/rag/content_workflow.py:497-530`, `src/rag/llm_manager.py:48-114`

```python
def _generate_draft_node(self, state: ContentWorkflowState) -> ContentWorkflowState:
    """초안 작성 노드 - LLM을 사용한 블로그 초안 생성"""
    prompt = state.get("prompt")
    context = state.get("context", "")
    document_types = state.get("document_types")
    
    # 시스템 프롬프트 생성
    system_prompt = self._build_system_prompt(state)
    
    # LLM으로 콘텐츠 생성
    draft = self.llm_manager.generate_response(
        context=context,
        query=prompt,
        system_prompt=system_prompt,
        document_types=document_types,
    )
    
    state["draft"] = draft
    return state
```

**LLMManager 내부 처리:**

1. **컨텍스트 최적화**
   ```python
   optimized_context = ContextOptimizer.optimize_context(context)
   ```

2. **프롬프트 구성**
   ```python
   # 이미 완전한 프롬프트인 경우 (콘텐츠 생성 등)
   if "\n참고 문서:" in query or len(query) > 500:
       user_prompt = query.replace("{context}", optimized_context)
   else:
       # 일반 질의응답 프롬프트 구성
       user_prompt = PromptTemplates.build_user_prompt(
           context=optimized_context,
           query=query,
           document_types=document_types,
       )
   ```

3. **메시지 구성**
   ```python
   messages = [
       SystemMessage(content=system_prompt_text),
       HumanMessage(content=user_prompt),
   ]
   ```

4. **LLM 호출**
   ```python
   response = self.llm.invoke(messages)
   return response.content
   ```

**사용되는 LLM 모델:**
- 기본값: `gpt-4-turbo-preview` (설정에서 변경 가능)
- 파인튜닝 모델: `ft:gpt-3.5-turbo-0125:korealawyer2::CgYw1VLx` (설정 가능)

#### 5단계: 구조 평가

**코드 위치:** `src/rag/content_workflow.py:553-583`

구조 평가 노드는 필수 섹션 존재 여부, 마크다운 구조(H1/H2/H3), 섹션 최소 길이를 검증합니다.

#### 6단계: 내용 품질 평가

**코드 위치:** `src/rag/content_workflow.py:703-723`

법령 조문 번호 인용, 판례 번호 인용, 법률 용어 설명, 예시 적절성을 평가합니다.

#### 7단계: 법적 정확성 평가

**코드 위치:** `src/rag/content_workflow.py:776-799`

RAG 검색 결과와 인용된 법령/판례를 대조하여 정확성을 검증하고, 최신성(기준 시점 명시)을 확인합니다.

#### 8단계: 평가 점수 계산 및 임계값 체크

**코드 위치:** `src/rag/content_workflow.py:869-919`

- 구조 평가(30점) + 내용 품질(40점) + 법적 정확성(30점) = 총점(100점)
- 70점 이상: 통과 → 최종 정리로 진행
- 70점 미만: 재작성 필요 → 피드백 루프로 진행

#### 9단계: 최종 정리 및 구조화

**코드 위치:** `src/rag/content_workflow.py:995-1015`

생성된 초안을 구조화된 콘텐츠로 파싱합니다. 마크다운 헤더를 기반으로 섹션별로 분리하여 `structured_content`에 저장합니다.

#### 10단계: 메타데이터 생성

**코드 위치:** `src/rag/content_workflow.py:1094-1148`

SEO 제목, 메타 디스크립션, 키워드, 카테고리, 태그, 버전 정보를 생성합니다.

#### 11단계: 재사용 블록 추출

**코드 위치:** `src/rag/content_workflow.py:1150-1200`

TL;DR, 체크리스트, Q&A, 숫자 팩트를 추출하여 재사용 가능한 블록으로 저장합니다.

#### 12단계: API 응답 반환

**코드 위치:** `src/api/routers/generate.py:68-161`

워크플로우 실행 결과를 `ContentGenerationResponse` 형식으로 변환하여 반환합니다.

---

## 프롬프트 구조 및 처리

### 프롬프트 관리 방식

프롬프트는 **파일 기반 방식**으로 관리됩니다:

1. **템플릿 상수 (별도 파일)**
   - **파일 위치**: `src/rag/content_templates.py`
   - **내용**: 섹션별 구조, 요구사항, 예시 등
   - **용도**: 블로그 섹션 템플릿 정의 (`BLOG_SECTIONS`, `SECTION_ORDER`, `REQUIRED_SECTIONS`)

2. **프롬프트 템플릿 파일 (별도 폴더)**
   - **폴더 위치**: `src/rag/prompts/`
   - **파일 목록**:
     - `blog_base.txt`: 블로그 기본 지시사항 (타깃 독자, 문체, 스타일)
     - `blog_instructions.txt`: 블로그 상세 지시사항 (법령 인용 형식, 중요 사항)
     - `system_blog.txt`: 시스템 프롬프트 (블로그용)
     - `system_base.txt`: 시스템 프롬프트 (기본)
     - `basic_template.txt`: 기본 프롬프트 템플릿 (블로그 외 타입용)
   - **플레이스홀더**: `{TOPIC}`, `{CONTEXT}`, `{CONTENT_TYPE}` 등 사용 가능

3. **프롬프트 로더**
   - **파일 위치**: `src/rag/prompt_loader.py`
   - **클래스**: `PromptLoader`
   - **기능**: 템플릿 파일 로드, 플레이스홀더 치환, 캐싱

4. **프롬프트 생성 로직**
   - **파일 위치**: `src/rag/content_workflow.py`
   - **메서드**:
     - `_build_structured_blog_prompt()`: 블로그용 구조화된 프롬프트 생성 (파일 기반)
     - `_build_basic_prompt()`: 다른 타입용 기본 프롬프트 (파일 기반)
     - `_build_system_prompt()`: 시스템 프롬프트 생성 (파일 기반)

**프롬프트 수정 방법:**
- 섹션 구조/요구사항 변경: `content_templates.py`의 `BLOG_SECTIONS` 수정
- 프롬프트 본문 변경: `src/rag/prompts/` 폴더의 해당 `.txt` 파일 수정
  - 파일 수정 후 즉시 반영 (캐시 사용 시 재시작 필요할 수 있음)
  - 플레이스홀더 사용: `{TOPIC}`, `{CONTEXT}`, `{CONTENT_TYPE}` 등

**중요: 필수 파일 검증**
- 다음 파일들은 프로그램 시작 시 필수로 존재해야 합니다:
  - `blog_base.txt`
  - `blog_instructions.txt`
  - `system_blog.txt`
  - `system_base.txt`
  - `basic_template.txt`
- 필수 파일이 없으면 프로그램이 시작되지 않습니다 (`FileNotFoundError` 발생)
- 프로그램 시작 전에 모든 필수 파일이 존재하는지 확인됩니다

### 프롬프트 구성 요소

#### 1. 시스템 프롬프트 (System Prompt)

**역할:** LLM의 역할과 작성 규칙 정의

**코드 위치:** `src/rag/content_workflow.py:532-551`

```python
def _build_system_prompt(self, state: ContentWorkflowState) -> str:
    """시스템 프롬프트 생성"""
    content_type = state.get("content_type", "blog")
    style = state.get("style")
    
    base_prompt = "당신은 전문 법률 콘텐츠 작가입니다..."
    
    if content_type == "blog":
        base_prompt += """블로그 포스팅 작성 규칙:
- 독자 친화적이고 이해하기 쉬운 문체 사용
- 법률 용어는 쉬운 설명과 함께 사용
- 실제 사례와 판례를 활용하여 구체적으로 설명
- 실용적인 조언과 대응 방법 포함
- SEO를 고려한 제목과 키워드 배치
"""
    
    if style:
        base_prompt += f"\n작성 스타일: {style}\n"
    
    return base_prompt
```

#### 2. 구조화된 블로그 프롬프트 (Structured Blog Prompt)

**역할:** 블로그 타입인 경우 구조화된 템플릿 기반 프롬프트 생성

**코드 위치:** `src/rag/content_workflow.py:356-472`

**구성 요소:**
- 타깃 독자 및 포지셔닝
- 문체 및 스타일 지시사항
- RAG 검색 결과 기반 섹션 선택
- 템플릿 상수(`BLOG_SECTIONS`)를 활용한 섹션별 상세 지시사항
- 스타일, 목표 길이, 키워드 등 추가 옵션
- 법령/판례 인용 형식 규칙
- 주제 및 참고 문서

### 프롬프트 처리 흐름

```
사용자 요청 (ContentGenerationRequest)
    ↓
ContentWorkflow.run()
    ↓
[1] _search_documents_node
    └─ RAG 워크플로우로 문서 검색
    ↓
[2] _generate_prompt_node
    ├─ 블로그 타입인 경우:
    │   ├─ _select_sections_based_on_rag() - RAG 결과 기반 섹션 선택
    │   └─ _build_structured_blog_prompt() - 구조화된 프롬프트 생성
    │       ├─ content_templates.BLOG_SECTIONS 활용
    │       ├─ 섹션별 상세 지시사항 포함
    │       ├─ 스타일, 목표 길이, 키워드 추가
    │       └─ 참고 문서 포함
    └─ 다른 타입인 경우:
        └─ _build_basic_prompt() - 기본 프롬프트 생성
    ↓
[3] _generate_draft_node
    ├─ _build_system_prompt() - 시스템 프롬프트 생성
    └─ LLMManager.generate_response()
        ├─ 컨텍스트 최적화 (ContextOptimizer)
        ├─ 프롬프트 조합
        └─ LLM 호출
```

### 프롬프트 최적화 기법

#### 1. 컨텍스트 최적화

**코드 위치:** `src/rag/prompts.py:111-168`

```python
class ContextOptimizer:
    MAX_CONTEXT_LENGTH = 4000  # 최대 컨텍스트 길이 (토큰 기준)
    
    @staticmethod
    def optimize_context(context: str, max_length: int = None) -> str:
        """
        컨텍스트를 최적화합니다.
        - 문서 단위로 분할
        - 각 문서의 중요도 평가 (길이 기반)
        - 상위 문서 우선 선택
        - 최대 길이 제한 내에서 재구성
        """
```

**최적화 과정:**
1. 문서 단위로 분할 (`[문서 N]` 기준)
2. 각 문서의 중요도 평가 (문서 길이 기반)
3. 중요도 순으로 정렬
4. 최대 길이 내에서 상위 문서 선택
5. 원래 순서대로 재정렬

#### 2. 프롬프트 자동 감지

**코드 위치:** `src/rag/llm_manager.py:77-87`

```python
# query가 이미 완전한 프롬프트인 경우 (콘텐츠 생성 등) 그대로 사용
if "\n참고 문서:" in query or len(query) > 500:
    # 이미 완전한 프롬프트로 보임
    user_prompt = query.replace("{context}", optimized_context)
else:
    # 일반 질의응답 프롬프트 구성
    user_prompt = PromptTemplates.build_user_prompt(
        context=optimized_context,
        query=query,
        document_types=document_types,
    )
```

**자동 감지 기준:**
- `"\n참고 문서:"` 포함 → 완전한 프롬프트로 인식
- 길이가 500자 이상 → 완전한 프롬프트로 인식
- 그 외 → 일반 질의응답 프롬프트로 구성

---

## 파인튜닝 모델 사용 방법

### 파인튜닝 모델이란?

파인튜닝(Fine-tuning)은 기존 LLM 모델을 특정 도메인(법률)에 맞게 추가 학습시키는 과정입니다. 법률 콘텐츠 생성에 특화된 모델을 사용하면 더 정확하고 일관된 결과를 얻을 수 있습니다.

**파인튜닝 모델 예시:**
- `ft:gpt-3.5-turbo-0125:korealawyer2::CgYw1VLx`
- 베이스 모델: `gpt-3.5-turbo-0125`
- 학습 데이터: 246개 샘플 (법률 콘텐츠)
- 에포크: 3

### 파인튜닝 모델 설정 방법

#### 방법 1: 환경 변수로 설정 (권장)

`.env` 파일에 모델 이름 추가:

```bash
# 기본 LLM 모델
LLM_MODEL=ft:gpt-3.5-turbo-0125:korealawyer2::CgYw1VLx

# 또는 일반 모델
LLM_MODEL=gpt-4-turbo-preview
```

**설정 파일 위치:** `config/settings.py`

```python
class Settings(BaseSettings):
    # LLM Settings
    llm_model: str = "gpt-4-turbo-preview"  # .env에서 LLM_MODEL로 오버라이드 가능
    openai_api_key: str  # .env에서 OPENAI_API_KEY로 설정
```

#### 방법 2: 의존성 주입으로 커스터마이징

**코드 위치:** `src/api/dependencies.py:62-70`

현재 `get_llm_manager()`는 환경 변수에서 모델을 읽습니다. 커스터마이징하려면:

```python
@lru_cache()
def get_llm_manager() -> LLMManager:
    """LLM Manager 싱글톤"""
    # 환경 변수에서 파인튜닝 모델 읽기
    import os
    finetuned_model = os.getenv("FINETUNED_MODEL")
    model_name = finetuned_model or settings.llm_model
    
    return LLMManager(
        model_name=model_name,
        temperature=0.7
    )
```

**참고:** `ContentWorkflow`는 `get_llm_manager()`를 통해 LLM Manager를 주입받으므로, 의존성 주입 함수를 수정하면 전체 워크플로우에 적용됩니다.

### 파인튜닝 모델 사용 시 주의사항

1. **모델 이름 정확성**
   - 파인튜닝 모델 이름은 정확히 입력해야 합니다
   - 형식: `ft:베이스모델:조직명::모델ID`

2. **API 키 확인**
   - 파인튜닝 모델도 OpenAI API 키가 필요합니다
   - `.env` 파일에 `OPENAI_API_KEY` 설정 확인

3. **비용 고려**
   - 파인튜닝 모델 사용 시 일반 모델과 다른 요금이 적용될 수 있습니다
   - 사용량 모니터링 권장

4. **성능 비교**
   - 파인튜닝 모델: 법률 도메인 특화, 빠른 응답, 비용 효율적
   - GPT-4: 더 넓은 일반 지식, 더 정확한 분석, 높은 비용

### 파인튜닝 모델 테스트

**Python 스크립트로 테스트:**

```python
from src.rag import LLMManager, VectorStore, EmbeddingGenerator
from src.rag.content_workflow import ContentWorkflow

# 파인튜닝 모델로 LLM Manager 초기화
llm_manager = LLMManager(
    model_name="ft:gpt-3.5-turbo-0125:korealawyer2::CgYw1VLx",
    temperature=0.7
)

# ContentWorkflow 초기화
vector_store = VectorStore()
embedding_gen = EmbeddingGenerator()
workflow = ContentWorkflow(vector_store, embedding_gen, llm_manager)

# 워크플로우 실행
result = workflow.run(
    topic="사기죄 처벌",
    content_type="blog",
    n_references=5,
)

print(f"생성된 콘텐츠: {result.get('draft', '')[:200]}...")
print(f"평가 점수: {result.get('evaluation_score', 0)}/100")
```

---

## 평가 기준 상세 설명

### 구조 평가 (30점 만점)

#### 필수 섹션 존재 여부 (15점)

**코드 위치:** `src/rag/content_workflow.py:585-648`, `src/rag/content_templates.py:111`

`content_templates.py`의 `REQUIRED_SECTIONS`에 정의된 모든 섹션이 포함되어야 합니다. 기본적으로 `BLOG_SECTIONS`의 모든 섹션이 필수입니다:

1. 제목 (title)
2. 요약 (tldr)
3. 상황 예시 (situation_example)
4. 핵심 개념 정리 (core_concepts)
5. 자주 묻는 질문 (qa)
6. 체크리스트 (checklist)
7. 주의할 점 & 예외 사항 (warnings)
8. 마무리 요약 & 권장 행동 (summary)
9. 디스클레이머 (disclaimer)

각 섹션이 존재하면 15/9 = 약 1.67점씩 부여됩니다.

#### 마크다운 구조 검증 (10점)
- H1 헤더 존재: 3점
- H2 헤더 3개 이상: 4점 (1개 이상: 2점)
- H3 헤더 존재: 3점

#### 섹션 최소 길이 (5점)
각 섹션이 최소 길이 요구사항을 만족하는지 확인:
- TL;DR: 최소 100자
- 핵심 개념: 최소 200자
- 기타 섹션: 각각 최소 길이 기준

### 내용 품질 평가 (40점 만점)

#### 법령 조문 번호 인용 (15점)
- 법령 조문 번호가 1개 이상 인용되면 15점
- 인용 형식: "근로기준법 제34조에 따르면..."

#### 판례 번호 인용 (10점)
- 판례 번호가 1개 이상 인용되면 10점
- 인용 형식: "대법원 2023도11234 판결에서는..."

#### 법률 용어 설명 (10점)
- 법률 용어가 첫 등장 시 "용어(설명)" 형태로 설명되면 점수 부여
- 2개 이상 설명: 10점
- 1개 설명: 5점

#### 예시 적절성 (5점)
- 예시 키워드("예:", "예를 들어", "사례" 등)가 포함되면 5점

### 법적 정확성 평가 (30점 만점)

#### 법령 조문 검증 (10점)
- RAG 검색 결과와 인용된 법령 조문이 일치하면 10점
- 일치하지 않으면 감점

#### 판례 번호 검증 (10점)
- RAG 검색 결과와 인용된 판례 번호가 일치하면 10점
- 일치하지 않으면 감점

#### 최신성 확인 (10점)
- 기준 시점이 명시되면 10점 (예: "2024년 12월 기준")
- 명시되지 않으면 5점

## 메타데이터 생성 방법

### SEO 제목 생성
- 콘텐츠의 제목에서 추출
- 80-120자 제한
- 키워드 포함 고려

### 메타 디스크립션 생성
- TL;DR 섹션 또는 콘텐츠 첫 120자에서 추출
- 80-120자 제한
- 핵심 내용 요약

### 키워드 추출
- 주제에서 자동으로 3-5개 키워드 추출
- 정규식을 사용하여 단어 추출

### 카테고리 자동 분류
다음 키워드 기반으로 자동 분류:
- 노무: "퇴직금", "근로", "임금", "연차"
- 개인정보: "개인정보", "정보보호", "개인정보보호법"
- 계약: "계약", "계약서", "약관"
- 분쟁: "분쟁", "소송", "손해배상"
- 기타: 위 키워드가 없으면 "기타"

### 태그 생성
- 키워드에서 상위 3개를 태그로 사용

### 버전 정보
- YYYYMMDD 형식 (예: "20241209")
- 콘텐츠 생성 날짜 기준

## 재사용 블록 설명

### TL;DR 추출
- 콘텐츠에서 "요약", "TL;DR" 섹션 추출
- 3-5줄 요약
- 카드뉴스, 썸네일, 뉴스레터 인트로로 재사용 가능

### 체크리스트 추출
- 마크다운 bullet 포인트 (`-`, `*`) 추출
- 3-7개 항목
- 인포그래픽, 카드뉴스로 재사용 가능

### Q&A 추출
- "Q1:", "Q2:" 형식의 질문/답변 쌍 추출
- 3-5개 질문/답변
- 유튜브 쇼츠, 릴스로 재사용 가능

### 숫자 팩트 추출
- 정규식을 사용하여 다음 정보 추출:
  - 날짜/기한: "14일 이내", "2024년"
  - 금액: "2천만 원", "100만원"
  - 기간: "3개월", "1년"
- 2-3개 팩트 추출
- 한 줄 문장으로 변환

## API 사용 예제

### 1. 기본 블로그 콘텐츠 생성

**Swagger UI 사용:**

1. `http://localhost:8000/docs` 접속
2. `POST /api/v1/generate` 선택
3. "Try it out" 클릭
4. 요청 본문 입력:

```json
{
  "topic": "사기죄 처벌",
  "content_type": "blog",
  "n_references": 5
}
```

5. "Execute" 클릭

**참고:** 실제로는 `ContentWorkflow`가 내부적으로 LangGraph 워크플로우를 실행하여 콘텐츠를 생성합니다.

**cURL 사용:**

```bash
curl -X POST "http://localhost:8000/api/v1/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "사기죄 처벌",
    "content_type": "blog",
    "n_references": 5
  }'
```

**Python requests 사용:**

```python
import requests

url = "http://localhost:8000/api/v1/generate"
data = {
    "topic": "사기죄 처벌",
    "content_type": "blog",
    "n_references": 5
}

response = requests.post(url, json=data)
result = response.json()

print(f"제목: {result['title']}")
print(f"콘텐츠: {result['content']}")
print(f"평가 점수: {result.get('evaluation_score', 'N/A')}/100")
print(f"재작성 횟수: {result.get('revision_count', 0)}")
print(f"버전: {result.get('version', 'N/A')}")

# 구조화된 콘텐츠
if result.get('structured_content'):
    print("\n=== 구조화된 콘텐츠 ===")
    for section, content in result['structured_content'].items():
        print(f"{section}: {content[:100]}...")

# 재사용 블록
if result.get('reusable_blocks'):
    print("\n=== 재사용 블록 ===")
    if 'tldr' in result['reusable_blocks']:
        print(f"TL;DR: {result['reusable_blocks']['tldr']}")
    if 'checklist' in result['reusable_blocks']:
        print(f"체크리스트: {result['reusable_blocks']['checklist']}")
    if 'qa' in result['reusable_blocks']:
        print(f"Q&A: {len(result['reusable_blocks']['qa'])}개")

# 메타데이터
if result.get('metadata'):
    print("\n=== 메타데이터 ===")
    print(f"SEO 제목: {result['metadata'].get('seo_title', 'N/A')}")
    print(f"메타 디스크립션: {result['metadata'].get('meta_description', 'N/A')}")
    print(f"키워드: {result['metadata'].get('keywords', [])}")
    print(f"카테고리: {result['metadata'].get('category', 'N/A')}")

# 평가 피드백
if result.get('evaluation_feedback'):
    print("\n=== 평가 피드백 ===")
    for feedback in result['evaluation_feedback']:
        print(f"- {feedback}")

print(f"\n참고 문서: {len(result['references'])}개")
```

### 2. 고급 옵션 사용

**키워드, 스타일, 길이 지정:**

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

**새로운 응답 구조 예시:**

```json
{
  "success": true,
  "content": "# 사기죄 처벌은 어떻게 되나요?\n\n## 요약\n...",
  "title": "사기죄 처벌은 어떻게 되나요?",
  "structured_content": {
    "# 사기죄 처벌은 어떻게 되나요?": "",
    "## 요약": "사기죄는 형법 제347조에 따라...",
    "## 상황 예시": "A씨가 B씨를 속여...",
    "## 핵심 개념 정리": "근로기준법 제34조에 따르면...",
    "## 자주 묻는 질문": "Q1. 사기죄 처벌은?\nA1. ...",
    "## 체크리스트": "- 항목 1\n- 항목 2",
    "## 주의할 점": "...",
    "## 마무리": "...",
    "## 디스클레이머": "본 글은 일반적인 법률 정보..."
  },
  "reusable_blocks": {
    "tldr": "사기죄는 형법 제347조에 따라 처벌됩니다.",
    "checklist": ["항목 1", "항목 2", "항목 3"],
    "qa": ["Q1. 사기죄 처벌은?\nA1. ..."],
    "facts": ["14일 이내", "2천만 원"]
  },
  "evaluation_score": 85.5,
  "evaluation_feedback": [],
  "version": "20241209",
  "revision_count": 0,
  "references": [
    {
      "title": "형법 제347조",
      "type": "statute",
      "id": "statute-347",
      "relevance": 0.95
    }
  ],
  "metadata": {
    "seo_title": "사기죄 처벌은 어떻게 되나요? 형법 제347조 완벽 정리",
    "meta_description": "사기죄는 형법 제347조에 따라 처벌됩니다. 기망행위, 처분행위, 재산상 손해가 모두 충족되어야 합니다.",
    "keywords": ["사기죄", "처벌", "형법"],
    "category": "형사",
    "tags": ["사기죄", "처벌", "형법"],
    "version": "20241209",
    "content_type": "blog",
    "topic": "사기죄 처벌",
    "word_count": 2500
  },
  "timestamp": "2024-12-09T18:00:00"
}
```

### 3. 다른 콘텐츠 타입 생성

**법률 기사:**

```json
{
  "topic": "최근 사기죄 판례 동향",
  "content_type": "article",
  "style": "객관적",
  "n_references": 8
}
```

**법률 의견서:**

```json
{
  "topic": "특정경제범죄 가중처벌법 적용 여부",
  "content_type": "opinion",
  "style": "전문적",
  "n_references": 10
}
```

**FAQ:**

```json
{
  "topic": "사기죄 관련 자주 묻는 질문",
  "content_type": "faq",
  "n_references": 5
}
```

---

## 고급 설정

### 1. 커스텀 프롬프트 수정

프롬프트는 파일 기반으로 관리되므로, 텍스트 파일을 직접 수정하면 됩니다.

**수정 방법:**

1. **블로그 기본 지시사항 수정**
   - 파일: `src/rag/prompts/blog_base.txt`
   - 내용: 타깃 독자, 문체, 스타일 지시사항

2. **블로그 상세 지시사항 수정**
   - 파일: `src/rag/prompts/blog_instructions.txt`
   - 내용: 법령 인용 형식, 중요 사항
   - 플레이스홀더: `{TOPIC}`, `{CONTEXT}` 사용 가능

3. **시스템 프롬프트 수정**
   - 블로그용: `src/rag/prompts/system_blog.txt`
   - 기본: `src/rag/prompts/system_base.txt`

4. **기본 템플릿 수정** (블로그 외 타입)
   - 파일: `src/rag/prompts/basic_template.txt`
   - 플레이스홀더: `{CONTENT_TYPE}`, `{TOPIC}`, `{CONTEXT}` 사용 가능

**주의사항:**
- 파일 수정 후 애플리케이션 재시작 권장 (캐시 사용 시)
- 플레이스홀더는 대문자로 작성: `{TOPIC}`, `{CONTEXT}`, `{CONTENT_TYPE}`
- UTF-8 인코딩으로 저장

### 2. Temperature 조정

Temperature는 생성된 텍스트의 창의성을 조절합니다.

**설정 방법:**

`.env` 파일에 추가하고 `src/api/dependencies.py` 수정:

```python
# .env
LLM_TEMPERATURE=0.7

# src/api/dependencies.py
@lru_cache()
def get_llm_manager() -> LLMManager:
    import os
    temperature = float(os.getenv("LLM_TEMPERATURE", "0.7"))
    return LLMManager(
        model_name=settings.llm_model,
        temperature=temperature
    )
```

**Temperature 값 가이드:**
- `0.0-0.3`: 매우 보수적, 사실 기반, 일관성 높음
- `0.4-0.7`: 균형잡힌 창의성 (권장)
- `0.8-1.0`: 높은 창의성, 다양성

### 3. 최대 토큰 수 제한

**설정 방법:**

`src/rag/llm_manager.py` 수정:

```python
self.llm = ChatOpenAI(
    model_name=self.model_name,
    temperature=self.temperature,
    openai_api_key=settings.openai_api_key,
    max_tokens=2000,  # 추가
)
```

### 4. 스트리밍 응답

현재는 지원하지 않지만, `LLMManager.generate_response_async()`를 사용하여 구현 가능합니다.

**구현 예시:**

```python
async def generate_content_stream(request):
    # ... 검색 및 프롬프트 생성 ...
    
    async for chunk in llm_manager.generate_response_async(
        context=context,
        query=user_prompt,
        document_types=request.document_types,
    ):
        yield chunk
```

---

## 문제 해결

### 문제 1: 생성된 콘텐츠가 너무 짧음

**원인:**
- `target_length`가 설정되지 않음
- 컨텍스트가 부족함

**해결 방법:**
1. `target_length` 파라미터 지정
2. `n_references` 증가 (더 많은 참고 문서)
3. `include_sections`로 필수 섹션 지정

### 문제 2: 생성된 콘텐츠가 부정확함

**원인:**
- 검색된 문서가 주제와 관련이 적음
- 컨텍스트가 충분하지 않음

**해결 방법:**
1. `document_types`로 문서 타입 필터링
2. `n_references` 증가
3. `topic`을 더 구체적으로 작성

### 문제 3: 파인튜닝 모델이 작동하지 않음

**원인:**
- 모델 이름 오타
- API 키 문제
- 모델이 삭제되었거나 접근 불가

**해결 방법:**
1. 모델 이름 정확히 확인
2. OpenAI 대시보드에서 모델 상태 확인
3. API 키 유효성 확인
4. 일반 모델로 테스트 후 비교

### 문제 4: 생성 속도가 느림

**원인:**
- 많은 참고 문서 사용
- 긴 콘텐츠 생성
- 네트워크 지연

**해결 방법:**
1. `n_references` 감소 (3-5개 권장)
2. `target_length` 조정
3. 파인튜닝 모델 사용 (일반적으로 더 빠름)

### 문제 5: 키워드가 자연스럽지 않게 배치됨

**원인:**
- 키워드가 너무 많음
- 키워드가 주제와 관련이 적음

**해결 방법:**
1. 키워드 수 제한 (3-5개 권장)
2. 주제와 관련된 키워드만 선택
3. 시스템 프롬프트에 "자연스럽게 배치" 지시 추가

---

## 참고 자료

- [RAG 데이터 구축 가이드](./RAG_DATA_BUILD_GUIDE.md)
- [Swagger UI 사용 가이드](./SWAGGER_UI_GUIDE.md)
- [API 문서](../api/README.md)

---

## 요약

블로그 콘텐츠 생성은 LangGraph 기반 워크플로우로 다음과 같은 과정으로 진행됩니다:

1. **문서 검색**: RAG 워크플로우를 사용하여 주제와 관련된 법령, 판례 검색
2. **프롬프트 생성**: RAG 검색 결과를 분석하여 적합한 섹션 선택 후 구조화된 프롬프트 생성
3. **초안 작성**: LLM을 사용하여 구조화된 템플릿에 맞춰 콘텐츠 초안 생성
4. **평가**: 구조 평가, 내용 품질 평가, 법적 정확성 평가 수행
5. **피드백 루프**: 평가 점수가 70점 미만인 경우 최대 3회까지 재작성
6. **최종 정리**: 구조화된 콘텐츠로 파싱, 메타데이터 생성, 재사용 블록 추출
7. **응답 반환**: 모든 결과를 `ContentGenerationResponse` 형식으로 반환

**로깅:**
각 단계의 진행 상황과 결과는 자동으로 로그에 기록됩니다:
- **로그 파일 위치**: `./logs/app.log` (기본값, `.env`에서 `LOG_FILE`로 변경 가능)
- **로그 형식**: JSON 형식으로 저장 (타임스탬프, 레벨, 로거명, 메시지, 모듈, 함수, 라인 번호 포함)
- **로그 회전**: 파일 크기가 10MB를 넘으면 자동으로 회전하며, 최대 5개의 백업 파일 유지
- **로그 레벨**: 파일에는 DEBUG 레벨 이상, 콘솔에는 INFO 레벨 이상 출력
- **주요 로그 내용**:
  - 각 노드의 시작/완료/실패 메시지
  - 검색 결과 수, 컨텍스트 길이
  - 평가 점수 및 피드백
  - 재작성 횟수 및 이유
  - 오류 메시지 및 스택 트레이스

**파인튜닝 모델 사용:**
- `.env` 파일에 `LLM_MODEL=ft:모델이름` 설정
- 또는 `LLMManager` 초기화 시 `model_name` 파라미터 지정

**최적의 결과를 위한 팁:**
- 구체적인 주제 사용
- 적절한 참고 문서 수 (5-10개)
- 목표 길이 지정
- 필수 키워드 명시
- 문서 타입 필터링

