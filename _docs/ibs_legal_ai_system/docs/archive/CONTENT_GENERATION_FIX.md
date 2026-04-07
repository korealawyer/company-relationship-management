# 법률 콘텐츠 생성 품질 개선 방안

## 🔴 발견된 주요 문제점

### 1. 법령 조문 번호 오류 (심각)
**문제**: 생성된 콘텐츠에서 잘못된 법령 조문 번호 사용
- ❌ "형법 제332조" (잘못됨) → ✅ 실제: "형법 제347조" (사기죄)
- ❌ "특경법 제347조" (잘못됨) → ✅ 실제: "특경법 제3조"

**원인**:
- `article_number` 추출 로직이 `document_id`에서 숫자만 추출하여 잘못된 조문 번호 생성
- 예: `statute-형법-344_chunk_2` → `344` 추출 → 하지만 실제 조문은 `347`임
- 참고 문서의 `article_number`가 이미 잘못되어 있거나 매칭 실패

### 2. 콘텐츠가 너무 짧고 피상적
**문제**: 생성된 콘텐츠가 1402자로 매우 짧고, 핵심 개념 정리 섹션이 부족
- 핵심 개념 정리 섹션이 최소 200자 요구사항을 만족하지 못함
- 법령 조문 설명이 부족하고 피상적

**원인**:
- LLM `max_tokens`가 충분하지만, 프롬프트가 너무 길어서 실제 생성 토큰이 부족
- Temperature가 낮아서 창의적이고 상세한 설명이 부족

### 3. 프롬프트가 너무 길고 복잡
**문제**: 프롬프트가 6800자 이상으로 너무 길어서 LLM이 혼란스러워함
- 핵심 지시사항이 묻힘
- LLM이 모든 지시사항을 제대로 따르지 못함

### 4. 검색 결과 문제
**문제**: 법령이 제대로 검색되지 않음
- 검색 결과에 판례만 많고 법령이 부족
- 법령 조문 번호가 제대로 매칭되지 않음

### 5. 법령/판례 인용 부족
**문제**: 참고 문서에 판례가 많은데 제대로 인용하지 않음
- 판례 번호 인용이 없음
- 법령 조문 번호 인용이 부정확

---

## ✅ 개선 방안

### 1. 법령 조문 번호 추출 로직 개선

**현재 문제 코드**:
```python
# content_workflow.py:535-540
article_number = metadata.get("article_number")
if not article_number and doc_type == "statute":
    doc_id_match = re.search(r'-(\d+)(?:_chunk_|$)', doc_id)
    if doc_id_match:
        article_number = doc_id_match.group(1)  # 잘못된 조문 번호 추출
```

**개선 방안**:
1. **메타데이터 우선 사용**: `metadata.get("article_number")`를 먼저 확인
2. **제목에서 추출**: 제목에 "제347조" 형식이 있으면 추출
3. **문서 내용에서 추출**: 문서 내용에서 "제347조" 패턴 추출
4. **검증 로직 추가**: 추출된 조문 번호가 실제 문서 내용과 일치하는지 검증

### 2. 프롬프트 간소화 및 핵심 지시사항 강화

**개선 방안**:
1. **프롬프트 길이 축소**: 6800자 → 4000자 이하
2. **핵심 지시사항만 포함**: 필수 항목만 강조
3. **법령 조문 번호 명시**: 프롬프트에 정확한 조문 번호를 명시적으로 제공
4. **Few-shot 예시 추가**: 좋은 예시를 제공하여 LLM이 따라할 수 있도록

### 3. LLM 파라미터 조정

**개선 방안**:
1. **Temperature 증가**: 0.6 → 0.7 (더 창의적이고 상세한 설명)
2. **Max tokens 증가**: 4096 → 6000 (더 긴 콘텐츠 생성)
3. **Top-p 조정**: 0.9 → 0.95 (다양한 표현 사용)

### 4. 검색 결과 개선

**개선 방안**:
1. **법령 우선 검색**: 주제에 법령 관련 키워드가 있으면 법령을 우선 검색
2. **검색 결과 검증**: 검색된 법령의 조문 번호가 정확한지 검증
3. **균등 분배 개선**: 법령과 판례를 균등하게 포함하되, 법령이 우선

### 5. 콘텐츠 길이 보장 로직

**개선 방안**:
1. **최소 길이 강제**: 각 섹션별 최소 길이를 프롬프트에 명시
2. **생성 후 검증**: 생성된 콘텐츠의 길이를 확인하고 부족하면 재생성
3. **섹션별 길이 체크**: 각 섹션이 최소 길이를 만족하는지 확인

### 6. 법령/판례 인용 검증 강화

**개선 방안**:
1. **인용 필수 항목 명시**: 프롬프트에 반드시 인용해야 할 법령/판례 목록 제공
2. **인용 형식 강제**: "형법 제347조에 따르면..." 형식으로 반드시 인용
3. **인용 검증 로직**: 생성된 콘텐츠에서 법령/판례 인용 여부 확인

---

## 🔧 구체적 수정 사항

### 수정 1: article_number 추출 로직 개선

```python
# content_workflow.py 수정
def _extract_article_number(self, result: Dict[str, Any]) -> Optional[str]:
    """법령 조문 번호 추출 (개선된 버전)"""
    metadata = result.get("metadata", {})
    doc_id = result.get("id", "")
    doc_type = metadata.get("type", "")
    title = metadata.get("title", "")
    document = result.get("document", "")
    
    # 1. 메타데이터에서 직접 추출 (우선)
    article_number = metadata.get("article_number")
    if article_number:
        return str(article_number).strip()
    
    # 2. 제목에서 추출: "형법 제347조" 또는 "제347조"
    if doc_type == "statute":
        title_pattern = r'제\s*(\d+)\s*조'
        title_match = re.search(title_pattern, title)
        if title_match:
            return title_match.group(1)
        
        # 3. 문서 내용에서 추출
        doc_pattern = r'제\s*(\d+)\s*조'
        doc_match = re.search(doc_pattern, document[:500])  # 처음 500자만 검색
        if doc_match:
            return doc_match.group(1)
        
        # 4. document_id에서 추출 (마지막 수단)
        doc_id_match = re.search(r'-(\d+)(?:_chunk_|$)', doc_id)
        if doc_id_match:
            return doc_id_match.group(1)
    
    return None
```

### 수정 2: 프롬프트 간소화

```python
# blog_instructions.txt 수정
# 핵심 지시사항만 남기고 나머지 제거
# 법령 조문 번호를 명시적으로 제공
```

### 수정 3: LLM 파라미터 조정

```python
# content_workflow.py:996-1004 수정
# 콘텐츠 생성 시 temperature를 0.7로 증가
self.llm_manager.temperature = 0.7  # 기존: 0.6

# max_tokens 증가
# llm_manager.py에서 max_tokens를 6000으로 증가
```

### 수정 4: 검색 결과 검증

```python
# content_workflow.py에 검증 로직 추가
def _validate_search_results(self, results: List[Dict], topic: str) -> List[Dict]:
    """검색 결과 검증 및 개선"""
    # 법령이 있는지 확인
    # 조문 번호가 정확한지 확인
    # 부족하면 재검색
```

---

## 📊 예상 개선 효과

1. **법령 조문 번호 정확도**: 60% → 95% 이상
2. **콘텐츠 길이**: 1402자 → 2500자 이상
3. **법령/판례 인용**: 0개 → 최소 3개 이상
4. **콘텐츠 품질 점수**: 95점 → 85점 이상 (더 엄격한 평가 기준 적용 시)

---

## 🚀 우선순위

1. **긴급**: 법령 조문 번호 추출 로직 개선 (가장 심각한 문제)
2. **높음**: 프롬프트 간소화 및 핵심 지시사항 강화
3. **중간**: LLM 파라미터 조정
4. **낮음**: 검색 결과 개선 (현재는 작동하지만 최적화 필요)

