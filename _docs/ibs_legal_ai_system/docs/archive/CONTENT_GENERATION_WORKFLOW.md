# 법률 콘텐츠 생성 워크플로우 작동 방식 문서

## 📋 목차

1. [개요](#개요)
2. [워크플로우 구조](#워크플로우-구조)
3. [각 노드 상세 설명](#각-노드-상세-설명)
4. [피드백 루프](#피드백-루프)
5. [평가 시스템](#평가-시스템)
6. [단조로움 해결 방안](#단조로움-해결-방안)

---

## 개요

법률 콘텐츠 생성 워크플로우는 LangGraph를 사용하여 구현된 다단계 콘텐츠 생성 시스템입니다. 사용자가 주제(topic)를 입력하면, 관련 법령과 판례를 검색하고, 이를 바탕으로 전문적인 법률 블로그 콘텐츠를 생성합니다.

### 주요 특징

- **RAG 기반**: 벡터 검색을 통해 관련 법령/판례를 자동으로 찾아 참고
- **다단계 평가**: 구조, 내용 품질, 법적 정확성을 종합적으로 평가
- **자동 재작성**: 평가 점수가 낮으면 자동으로 재작성 시도
- **피드백 루프**: 평가 단계에서 문제 발견 시 이전 단계로 복귀하여 개선

---

## 워크플로우 구조

### 전체 흐름도

```
[시작]
    ↓
[1. 문서 검색] (search_documents)
    ↓
[2. 프롬프트 작성] (generate_prompt)
    ↓
[3. 답변 생성] (generate_draft)
    ↓
[4. 평가자] (evaluate)
    ├─→ [프롬프트 작성] (경미한 문제)
    ├─→ [문서 검색] (심각한 문제)
    └─→ [종합 평가자] (정상)
         ├─→ [최종 정리] (통과)
         └─→ [질문 재작성] (재작성 필요)
              ↓
              [프롬프트 조정] (adjust_prompt)
              ↓
              [재검색] (re_search)
              ↓
              [프롬프트 작성] (generate_prompt)
              ↓
              [답변 생성] (generate_draft)
              ↓
              [평가자] (evaluate)
              ↓
              [종합 평가자] (comprehensive_evaluate)
              ↓
              (반복 또는 종료)
    ↓
[5. 최종 정리] (finalize_content)
    ↓
[6. 메타데이터 생성] (generate_metadata)
    ↓
[7. 재사용 블록 추출] (extract_reusable_blocks)
    ↓
[종료]
```

### 노드 목록

| 노드 이름 | 설명 | 타입 |
|----------|------|------|
| `search_documents` | 관련 법령/판례 검색 | 시작 노드 |
| `generate_prompt` | LLM용 프롬프트 생성 | 일반 노드 |
| `generate_draft` | 초안 콘텐츠 생성 | 일반 노드 |
| `evaluate` | 통합 평가 (구조/내용/법적 정확성) | 평가 노드 |
| `comprehensive_evaluate` | 종합 평가 (점수 계산 + 임계값 체크) | 평가 노드 |
| `rewrite_topic` | 질문 재작성 | 재작성 노드 |
| `adjust_prompt` | 프롬프트 조정 | 재작성 노드 |
| `re_search` | 재검색 | 재작성 노드 |
| `finalize_content` | 최종 콘텐츠 정리 | 최종 노드 |
| `generate_metadata` | 메타데이터 생성 | 최종 노드 |
| `extract_reusable_blocks` | 재사용 블록 추출 | 최종 노드 |

---

## 각 노드 상세 설명

### 1. 문서 검색 (search_documents)

**역할**: 주제와 관련된 법령, 판례, 절차서 등을 벡터 검색으로 찾습니다.

**작동 방식**:
1. **주제 분석**: 주제에서 키워드를 추출하여 문서 타입 자동 추출
   - 법령 관련 키워드 → `statute` 타입 우선 검색
   - 판례 관련 키워드 → `case` 타입 우선 검색
   - 절차 관련 키워드 → `procedure` 타입 우선 검색

2. **법령 우선 검색** (법령 관련 키워드가 있는 경우):
   - 법령만 먼저 검색하여 충분한 법령 확보
   - 검색 결과 수: `max(5, n_references // 2)`

3. **전체 검색**:
   - 모든 문서 타입을 대상으로 검색
   - 검색 결과 수: `max(n_references * 3, 20)`

4. **결과 통합 및 선별**:
   - 법령 우선 검색 결과와 전체 검색 결과를 통합
   - 법령과 판례의 균형을 맞춰 최종 `n_references`개 선별
   - 법령 우선 전략: 법령이 있으면 법령을 우선 포함

5. **컨텍스트 생성**:
   - 선별된 검색 결과를 텍스트로 변환하여 `context` 생성
   - 각 문서의 메타데이터(타입, 제목, 조문 번호 등) 추출하여 `references` 생성

**출력**:
- `search_results`: 검색 결과 리스트
- `context`: 검색 결과를 텍스트로 변환한 컨텍스트
- `references`: 참고 문서 메타데이터 리스트

---

### 2. 프롬프트 작성 (generate_prompt)

**역할**: LLM이 콘텐츠를 생성하기 위한 상세한 프롬프트를 작성합니다.

**작동 방식**:
1. **섹션 선택**:
   - RAG 검색 결과를 분석하여 적합한 블로그 섹션 선택
   - 판례 데이터 → "상황 예시", "Q&A" 섹션
   - 법령 데이터 → "핵심 개념 정리", "주의사항" 섹션
   - 절차 데이터 → "체크리스트" 섹션

2. **프롬프트 구성 요소**:
   - **기본 지시사항** (`blog_base.txt`): 작성 원칙, 문체, 스타일
   - **필수 요구사항**: 왜곡 방지, 정확성, 상세 설명 요구
   - **참고 문서 정보**: 법령 조문 번호, 판례 번호 목록
   - **섹션 가이드**: 선택된 섹션별 상세 작성 가이드
   - **Few-shot 예시** (`blog_example.txt`): 참고용 예시

3. **프롬프트 특징**:
   - 참고 문서 기반만 작성 (왜곡 방지)
   - 섹션별 최소 길이 요구사항 명시
   - 구체적인 예시와 사례 요구
   - 디스클레이머 금지

**출력**:
- `prompt`: 완성된 프롬프트 문자열

---

### 3. 답변 생성 (generate_draft)

**역할**: LLM을 사용하여 실제 콘텐츠 초안을 생성합니다.

**작동 방식**:
1. **시스템 프롬프트 생성**:
   - `system_blog.txt` 로드
   - 작성 원칙, 왜곡 방지 원칙 포함

2. **LLM 설정**:
   - **Temperature**: 
     - 초안 생성: `0.7` (창의적이고 상세한 콘텐츠)
     - 재작성: `0.8` (더 창의적인 접근)
   - **Max Tokens**: `4096` (GPT-4 기준, 충분한 길이)

3. **콘텐츠 생성**:
   - `context` (검색 결과)와 `prompt`를 LLM에 전달
   - LLM이 마크다운 형식의 블로그 콘텐츠 생성

4. **검증**:
   - 생성된 콘텐츠의 최소 길이 확인 (2000자 이상)
   - 너무 짧으면 재생성 시도

**출력**:
- `draft`: 생성된 콘텐츠 초안 (마크다운 형식)

---

### 4. 평가자 (evaluate)

**역할**: 생성된 콘텐츠를 구조, 내용 품질, 법적 정확성 세 가지 측면에서 평가합니다.

**작동 방식**:
1. **LLM 기반 평가** (구조 + 내용 품질):
   - `_evaluate_with_llm()` 메서드 호출
   - `evaluation_prompt.txt` 사용
   - 평가 항목:
     - **구조 평가 (30점)**: 필수 섹션, 마크다운 구조, 섹션 길이
     - **내용 품질 평가 (40점)**: 법령 조문 인용 정확성, 법률 용어 설명, 구체적 예시
   - JSON 형식으로 점수와 피드백 반환

2. **규칙 기반 평가** (법적 정확성):
   - `_evaluate_legal_accuracy()` 메서드 호출
   - 평가 항목:
     - **법령 조문 번호 검증 (15점)**: 초안의 조문 번호와 참고 문서 비교
     - **판례 번호 검증 (선택사항, 점수 없음)**: 초안의 판례 번호와 참고 문서 비교
     - **최신성 확인 (15점)**: 기준 시점 명시 여부

3. **점수 저장**:
   - `structure_score`: 구조 평가 점수 (0-30)
   - `content_quality_score`: 내용 품질 평가 점수 (0-40)
   - `legal_accuracy_score`: 법적 정확성 평가 점수 (0-30)
   - `evaluation_feedback`: 피드백 리스트

4. **분기 결정** (`_evaluate_decision`):
   - **심각한 문제** (`critical_issues`) → `to_search` (문서 검색으로 복귀)
   - **경미한 문제** (프롬프트 관련) → `to_prompt` (프롬프트 작성으로 복귀)
   - **정상** → `to_comprehensive` (종합 평가로 진행)

**출력**:
- `structure_score`, `content_quality_score`, `legal_accuracy_score`
- `evaluation_feedback`
- 분기 결정 결과

---

### 5. 종합 평가자 (comprehensive_evaluate)

**역할**: 총점을 계산하고 임계값을 체크하여 재작성 필요 여부를 결정합니다.

**작동 방식**:
1. **총점 계산**:
   - `evaluation_score = structure_score + content_quality_score + legal_accuracy_score`
   - 최대 점수: 100점

2. **임계값 체크**:
   - **임계값**: 70점
   - **최대 재시도 횟수**: `max_revisions` (기본값: 3)
   - **점수 개선 확인**: 이전 점수보다 개선되지 않으면 중단

3. **분기 결정**:
   - **통과** (`evaluation_score >= 70`) → `pass` (최종 정리로)
   - **재작성 필요** (`evaluation_score < 70`) → `rewrite` (질문 재작성으로)
   - **최대 재시도 도달** → `max_revisions` (최종 정리로)

**출력**:
- `evaluation_score`: 총점 (0-100)
- `should_rewrite`: 재작성 필요 여부 (boolean)

---

### 6. 질문 재작성 (rewrite_topic)

**역할**: 평가 피드백을 바탕으로 주제를 구체화하거나 키워드를 조정합니다.

**작동 방식**:
1. **재시도 횟수 증가**: `revision_count += 1`

2. **피드백 분석**:
   - 평가 피드백에서 키워드 추출
   - 주제를 더 구체화하거나 키워드 추가

3. **주제 유지 또는 조정**:
   - 현재는 주제를 그대로 유지 (향후 LLM을 사용하여 개선 가능)

**출력**:
- `revision_count`: 증가된 재시도 횟수
- `topic`: 조정된 주제 (현재는 유지)

---

### 7. 프롬프트 조정 (adjust_prompt)

**역할**: 평가 피드백을 반영하여 프롬프트를 수정합니다.

**작동 방식**:
1. **피드백 분석**:
   - 각 피드백을 구체적인 개선 지시사항으로 변환
   - 예시:
     - "빈 섹션" → "해당 섹션을 최소 길이 요구사항을 만족하도록 상세히 작성"
     - "법령 조문 인용 부족" → "참고 문서의 법령 조문을 반드시 인용"

2. **프롬프트 수정**:
   - 기존 프롬프트에 개선 지시사항 추가
   - 구체적인 예시와 "❌ 금지", "✅ 필수" 형식의 명확한 지시

**출력**:
- `prompt`: 수정된 프롬프트

---

### 8. 재검색 (re_search)

**역할**: 조정된 주제나 키워드로 다시 문서를 검색합니다.

**작동 방식**:
1. **재검색 수행**:
   - `search_documents_node`와 동일한 로직 사용
   - 조정된 주제로 검색

2. **결과 업데이트**:
   - `search_results`, `context`, `references` 업데이트

**출력**:
- `search_results`, `context`, `references`: 업데이트된 검색 결과

---

### 9. 최종 정리 (finalize_content)

**역할**: 생성된 콘텐츠를 구조화된 형태로 정리합니다.

**작동 방식**:
1. **섹션 추출**:
   - 마크다운 헤더를 기준으로 섹션별로 분리
   - 각 섹션을 `structured_content` 딕셔너리에 저장

2. **메타데이터 추출**:
   - 제목, 요약 등 기본 정보 추출

**출력**:
- `structured_content`: 섹션별로 구조화된 콘텐츠 딕셔너리

---

### 10. 메타데이터 생성 (generate_metadata)

**역할**: 콘텐츠의 메타데이터를 생성합니다.

**작동 방식**:
1. **기본 메타데이터**:
   - 생성 일시, 주제, 콘텐츠 타입 등

2. **통계 정보**:
   - 콘텐츠 길이, 섹션 수 등

**출력**:
- `metadata`: 메타데이터 딕셔너리

---

### 11. 재사용 블록 추출 (extract_reusable_blocks)

**역할**: 재사용 가능한 콘텐츠 블록을 추출합니다.

**작동 방식**:
1. **블록 식별**:
   - 특정 섹션(예: Q&A, 체크리스트)을 재사용 블록으로 추출

2. **블록 저장**:
   - `reusable_blocks` 딕셔너리에 저장

**출력**:
- `reusable_blocks`: 재사용 블록 딕셔너리

---

## 피드백 루프

### 1. 평가자 → 프롬프트 작성 (경미한 문제)

**조건**: 평가 단계에서 경미한 문제 발견 (프롬프트 관련 문제)

**동작**:
- `evaluate` 노드에서 `to_prompt` 반환
- `generate_prompt` 노드로 복귀
- 프롬프트를 다시 생성하여 개선

**예시**:
- 섹션 구조 문제
- 프롬프트 지시사항 불명확

---

### 2. 평가자 → 문서 검색 (심각한 문제)

**조건**: 평가 단계에서 심각한 문제 발견 (`critical_issues`)

**동작**:
- `evaluate` 노드에서 `to_search` 반환
- `search_documents` 노드로 복귀
- 더 나은 문서를 검색하여 재시도

**예시**:
- 참고 문서 부족
- 법령 조문 번호 불일치
- 심각한 내용 오류

---

### 3. 종합 평가자 → 질문 재작성 (점수 미달)

**조건**: 총점이 70점 미만이고 최대 재시도 횟수 미만

**동작**:
- `comprehensive_evaluate` 노드에서 `rewrite` 반환
- `rewrite_topic` → `adjust_prompt` → `re_search` → `generate_prompt` → `generate_draft` → `evaluate` 순서로 재작성 루프 실행

**예시**:
- 콘텐츠 품질이 낮음
- 법적 정확성 부족
- 구조 문제

---

## 평가 시스템

### 평가 항목 및 점수 배분

| 평가 항목 | 점수 | 평가 방법 |
|----------|------|----------|
| **구조 평가** | 30점 | LLM 기반 평가 |
| - 필수 섹션 존재 여부 | - | 마크다운 헤더 분석 |
| - 마크다운 구조 | - | 구조 검증 |
| - 섹션 길이 | - | 각 섹션 최소 길이 확인 |
| **내용 품질 평가** | 40점 | LLM 기반 평가 |
| - 법령 조문 인용 정확성 | - | 참고 문서와 비교 |
| - 법률 용어 설명 | - | 용어 설명 여부 확인 |
| - 구체적 예시 | - | 예시 포함 여부 확인 |
| - 피상적 내용 체크 | - | 피상적 설명 감지 |
| **법적 정확성 평가** | 30점 | 규칙 기반 평가 |
| - 법령 조문 번호 검증 | 15점 | 초안과 참고 문서 비교 |
| - 판례 번호 검증 | 선택사항 | 초안과 참고 문서 비교 |
| - 최신성 확인 | 15점 | 기준 시점 명시 여부 |
| **총점** | **100점** | - |

### 임계값 및 재작성 기준

- **임계값**: 70점
- **최대 재시도 횟수**: 3회 (기본값)
- **점수 개선 확인**: 이전 점수보다 개선되지 않으면 중단

---

## 단조로움 해결 방안

현재 콘텐츠가 단조로운 이유와 해결 방안:

### 문제점

1. **프롬프트가 너무 규격화됨**: 모든 콘텐츠에 동일한 구조와 요구사항 적용
2. **섹션 선택이 제한적**: RAG 결과에 따라 섹션이 고정됨
3. **예시가 부족**: Few-shot 예시가 하나만 있어 다양성 부족
4. **Temperature가 낮음**: 0.7-0.8로 창의성 제한

### 해결 방안

#### 1. 프롬프트 다양화

**현재**: 모든 콘텐츠에 동일한 프롬프트 구조

**개선안**:
- 주제 유형에 따라 다른 프롬프트 템플릿 사용
  - 비교/차이 주제 → 비교 중심 프롬프트
  - 절차 주제 → 절차 중심 프롬프트
  - 개념 설명 주제 → 개념 중심 프롬프트

**구현 방법**:
```python
def _select_prompt_template(self, topic: str, references: List[Dict]) -> str:
    """주제 유형에 따라 프롬프트 템플릿 선택"""
    topic_lower = topic.lower()
    
    if any(kw in topic_lower for kw in ["차이", "비교", "구분"]):
        return "comparison_template.txt"
    elif any(kw in topic_lower for kw in ["절차", "방법", "절차서"]):
        return "procedure_template.txt"
    else:
        return "concept_template.txt"
```

#### 2. 섹션 선택 다양화

**현재**: RAG 결과에 따라 섹션이 고정됨

**개선안**:
- 주제 유형에 따라 다른 섹션 조합 제안
- 랜덤 요소 추가 (예: Q&A 섹션 개수 변동)

**구현 방법**:
```python
def _select_sections_diversified(self, topic: str, references: List[Dict]) -> List[str]:
    """다양한 섹션 조합 선택"""
    base_sections = self._select_sections_based_on_rag(references, topic)
    
    # 주제 유형에 따라 추가 섹션 제안
    if "비교" in topic.lower():
        # 비교 주제는 "주의사항" 섹션 추가
        if "warnings" not in base_sections:
            base_sections.append("warnings")
    
    return base_sections
```

#### 3. Few-shot 예시 다양화

**현재**: `blog_example.txt` 하나만 사용

**개선안**:
- 주제 유형에 따라 다른 예시 사용
- 여러 예시 중 랜덤 선택

**구현 방법**:
```python
def _load_example_diversified(self, topic: str) -> str:
    """주제에 맞는 다양한 예시 로드"""
    topic_lower = topic.lower()
    
    if "비교" in topic_lower:
        return self.prompt_loader.load_template("blog_example_comparison.txt")
    elif "절차" in topic_lower:
        return self.prompt_loader.load_template("blog_example_procedure.txt")
    else:
        # 기본 예시 중 랜덤 선택
        examples = ["blog_example_1.txt", "blog_example_2.txt", "blog_example_3.txt"]
        import random
        return self.prompt_loader.load_template(random.choice(examples))
```

#### 4. Temperature 조정

**현재**: 초안 0.7, 재작성 0.8

**개선안**:
- 주제 유형에 따라 Temperature 변동
- 비교/차이 주제는 더 높은 Temperature (0.8-0.9)
- 개념 설명 주제는 낮은 Temperature (0.6-0.7)

**구현 방법**:
```python
def _get_temperature_for_topic(self, topic: str, revision_count: int) -> float:
    """주제에 맞는 Temperature 반환"""
    base_temp = 0.7 if revision_count == 0 else 0.8
    
    topic_lower = topic.lower()
    if any(kw in topic_lower for kw in ["비교", "차이", "구분"]):
        # 비교 주제는 더 창의적 접근
        return min(base_temp + 0.1, 0.9)
    elif any(kw in topic_lower for kw in ["개념", "의미", "정의"]):
        # 개념 설명은 더 정확한 접근
        return max(base_temp - 0.1, 0.6)
    
    return base_temp
```

#### 5. 문체 다양화

**현재**: 모든 콘텐츠에 동일한 문체 ("~합니다 / ~입니다" 체)

**개선안**:
- 주제 유형에 따라 문체 변동
- 예시 중심 주제는 더 대화체
- 개념 설명 주제는 더 전문체

**구현 방법**:
```python
def _get_style_for_topic(self, topic: str) -> str:
    """주제에 맞는 문체 반환"""
    topic_lower = topic.lower()
    
    if any(kw in topic_lower for kw in ["예시", "사례", "상황"]):
        return "대화체: 독자에게 직접 말하듯이 친근하게 작성하세요."
    elif any(kw in topic_lower for kw in ["개념", "의미", "정의"]):
        return "전문체: 정확하고 명확하게 작성하세요."
    
    return "표준체: '~합니다 / ~입니다' 체로 통일하세요."
```

#### 6. 섹션 순서 다양화

**현재**: 섹션 순서가 고정됨

**개선안**:
- 주제 유형에 따라 섹션 순서 변동
- 예시 중심 주제는 "상황 예시"를 앞에 배치
- 개념 설명 주제는 "핵심 개념 정리"를 앞에 배치

**구현 방법**:
```python
def _order_sections_diversified(self, sections: List[str], topic: str) -> List[str]:
    """주제에 맞게 섹션 순서 조정"""
    topic_lower = topic.lower()
    
    # 기본 순서
    default_order = ["title", "tldr", "situation_example", "core_concepts", "qa", "checklist", "warnings", "summary"]
    
    if "예시" in topic_lower or "사례" in topic_lower:
        # 예시 중심 주제는 상황 예시를 앞에
        if "situation_example" in sections:
            sections.remove("situation_example")
            sections.insert(2, "situation_example")  # title, tldr 다음
    
    return [s for s in default_order if s in sections]
```

---

## 구현 우선순위

### 1단계 (즉시 구현 가능)
- [ ] Temperature 조정 (주제 유형별)
- [ ] Few-shot 예시 다양화 (여러 예시 파일 준비)

### 2단계 (중기)
- [ ] 프롬프트 템플릿 다양화
- [ ] 섹션 선택 다양화
- [ ] 문체 다양화

### 3단계 (장기)
- [ ] 섹션 순서 다양화
- [ ] 랜덤 요소 추가 (섹션 개수 등)

---

## 참고 자료

- **LangGraph 문서**: https://langchain-ai.github.io/langgraph/
- **프롬프트 파일 위치**: `src/rag/prompts/`
- **워크플로우 코드**: `src/rag/content_workflow.py`

---

**작성 일자**: 2024년 12월
**최종 수정**: 2024년 12월
