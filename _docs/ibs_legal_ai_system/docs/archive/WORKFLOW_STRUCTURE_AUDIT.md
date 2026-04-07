# 법률 콘텐츠 생성 워크플로우 구조 검수 보고서

## 📋 인포그래픽 요구사항 vs 현재 구현 비교

### 인포그래픽 구조 요구사항

**메인 플로우 (상단 회색 실선)**:
1. 질문 → 문서 검색
2. **"자료 요청에 맞는 프롬프트 작성"** (파란색 노드)
3. **"평가자"** (빨간색 노드)
4. **"답변 생성 LLM or 파인 튜닝"** (파란색 노드)
5. **"종합 평가자"** (빨간색 노드)
6. 최종 답변

**피드백 루프 (하단 빨간 점선)**:
- 평가자 → 프롬프트 작성으로 올라가는 점선
- 평가자 → 상단 이전 단계(질문/문서 검색)로 돌아가는 점선
- 종합 평가자 → 평가자/프롬프트/질문 쪽으로 가는 점선
- 하단 "질문 재작성" (녹색 텍스트)에서 다시 상단으로

---

## ✅ 현재 구현 분석

### 메인 플로우 (현재 코드)

```python
# 엣지 정의
workflow.set_entry_point("search_documents")  # 1. 문서 검색
workflow.add_edge("search_documents", "generate_prompt")  # 2. 프롬프트 작성 ✅
workflow.add_edge("generate_prompt", "generate_draft")  # 3. 답변 생성 ✅
workflow.add_edge("generate_draft", "evaluate_structure")  # 4-1. 구조 평가
workflow.add_edge("evaluate_structure", "evaluate_content_quality")  # 4-2. 내용 품질 평가
workflow.add_edge("evaluate_content_quality", "evaluate_legal_accuracy")  # 4-3. 법적 정확성 평가
workflow.add_edge("evaluate_legal_accuracy", "calculate_score")  # 5-1. 점수 계산
workflow.add_edge("calculate_score", "check_threshold")  # 5-2. 임계값 체크
```

**현재 구조**:
1. ✅ `search_documents` - 문서 검색
2. ✅ `generate_prompt` - "자료 요청에 맞는 프롬프트 작성" (파란색 노드)
3. ✅ `generate_draft` - "답변 생성 LLM or 파인 튜닝" (파란색 노드)
4. ⚠️ **평가자가 3개로 분리됨**: `evaluate_structure`, `evaluate_content_quality`, `evaluate_legal_accuracy`
5. ⚠️ **종합 평가자가 2개로 분리됨**: `calculate_score`, `check_threshold`

### 피드백 루프 (현재 코드)

```python
# 조건부 엣지: 평가 점수에 따라 분기
workflow.add_conditional_edges(
    "check_threshold",
    self._should_rewrite,
    {
        "pass": "finalize_content",
        "rewrite": "rewrite_topic",  # 피드백 루프 시작
        "max_revisions": "finalize_content",
    }
)

# 재작성 루프
workflow.add_edge("rewrite_topic", "adjust_prompt")  # 질문 재작성
workflow.add_edge("adjust_prompt", "re_search")  # 프롬프트 조정
workflow.add_edge("re_search", "generate_prompt")  # 프롬프트 작성으로 복귀
```

**현재 피드백 루프**:
- ✅ `check_threshold` → `rewrite_topic` (종합 평가자에서 질문 재작성으로)
- ✅ `rewrite_topic` → `adjust_prompt` → `re_search` → `generate_prompt` (프롬프트 작성으로 복귀)
- ❌ **평가자에서 직접 프롬프트 작성으로 가는 루프 없음**
- ❌ **평가자에서 질문/문서 검색으로 가는 루프 없음**

---

## 🔍 차이점 분석

### 1. 평가자 노드 분리 문제

**인포그래픽**: 평가자가 하나의 노드로 표시
**현재 구현**: 평가자가 3개로 분리됨
- `evaluate_structure` (구조 평가)
- `evaluate_content_quality` (내용 품질 평가)
- `evaluate_legal_accuracy` (법적 정확성 평가)

**영향**: 인포그래픽과 구조가 다르지만, 기능적으로는 정상 작동함. 다만 시각적 표현과 다름.

### 2. 종합 평가자 노드 분리 문제

**인포그래픽**: 종합 평가자가 하나의 노드로 표시
**현재 구현**: 종합 평가자가 2개로 분리됨
- `calculate_score` (점수 계산)
- `check_threshold` (임계값 체크)

**영향**: 인포그래픽과 구조가 다르지만, 기능적으로는 정상 작동함.

### 3. 피드백 루프 부족

**인포그래픽 요구사항**:
1. ✅ 평가자 → 프롬프트 작성 (현재: 종합 평가자 → 질문 재작성 → 프롬프트 작성)
2. ❌ 평가자 → 질문/문서 검색 (없음)
3. ✅ 종합 평가자 → 질문 재작성 (현재: `check_threshold` → `rewrite_topic`)

**현재 구현**:
- 피드백 루프는 `check_threshold`에서만 시작됨
- 중간 평가 단계에서의 피드백 루프가 없음

---

## ✅ 일치하는 부분

1. ✅ **문서 검색** 단계 존재
2. ✅ **프롬프트 작성** 노드 존재 (`generate_prompt`)
3. ✅ **답변 생성** 노드 존재 (`generate_draft`)
4. ✅ **평가 단계** 존재 (다만 여러 노드로 분리됨)
5. ✅ **종합 평가** 단계 존재 (다만 여러 노드로 분리됨)
6. ✅ **피드백 루프** 존재 (질문 재작성 → 프롬프트 조정 → 재검색 → 프롬프트 작성)

---

## ⚠️ 불일치하는 부분

### 1. 노드 분리 문제

**문제**: 인포그래픽에서는 평가자와 종합 평가자가 각각 하나의 노드로 표시되지만, 실제 구현에서는 여러 노드로 분리되어 있음.

**해결 방안**:
- 현재 구조를 유지하되, 인포그래픽에서는 논리적으로 그룹화하여 표시
- 또는 평가 노드들을 하나로 통합 (기능상 문제 없음)

### 2. 피드백 루프 부족

**문제**: 인포그래픽에는 평가자에서 직접 프롬프트 작성으로 가는 루프와 평가자에서 질문/문서 검색으로 가는 루프가 있지만, 현재 구현에는 없음.

**현재 동작**:
- 모든 피드백은 `check_threshold` (종합 평가자)에서만 발생
- 중간 평가 단계에서는 피드백 루프가 없음

**해결 방안**:
- 중간 평가 단계에서도 피드백 루프 추가 가능
- 또는 현재 구조를 유지하고 인포그래픽을 실제 구조에 맞게 수정

---

## 📊 구조 비교 요약

| 항목 | 인포그래픽 요구사항 | 현재 구현 | 일치 여부 |
|------|-------------------|----------|----------|
| 문서 검색 | ✅ 있음 | ✅ `search_documents` | ✅ 일치 |
| 프롬프트 작성 | ✅ 파란색 노드 | ✅ `generate_prompt` | ✅ 일치 |
| 평가자 | ✅ 빨간색 노드 (1개) | ⚠️ 3개 노드로 분리 | ⚠️ 부분 일치 |
| 답변 생성 | ✅ 파란색 노드 | ✅ `generate_draft` | ✅ 일치 |
| 종합 평가자 | ✅ 빨간색 노드 (1개) | ⚠️ 2개 노드로 분리 | ⚠️ 부분 일치 |
| 피드백 루프 (종합→재작성) | ✅ 있음 | ✅ `check_threshold` → `rewrite_topic` | ✅ 일치 |
| 피드백 루프 (평가→프롬프트) | ✅ 있음 | ❌ 없음 | ❌ 불일치 |
| 피드백 루프 (평가→질문) | ✅ 있음 | ❌ 없음 | ❌ 불일치 |

---

## 🎯 결론

### 기능적 측면
- ✅ **기본 워크플로우는 정상 작동**: 질문 → 검색 → 프롬프트 → 생성 → 평가 → 피드백 루프
- ✅ **핵심 기능은 모두 구현됨**: 모든 필수 노드가 존재

### 구조적 측면
- ⚠️ **노드 분리**: 평가자와 종합 평가자가 여러 노드로 분리되어 있음 (기능상 문제 없음)
- ❌ **피드백 루프 부족**: 중간 평가 단계에서의 피드백 루프가 없음

### 권장 사항

1. **인포그래픽 수정 (권장)**: 실제 구현 구조에 맞게 인포그래픽을 수정
   - 평가자를 3개 노드로 표시하거나 논리적 그룹으로 묶어서 표시
   - 종합 평가자를 2개 노드로 표시하거나 논리적 그룹으로 묶어서 표시
   - 피드백 루프는 종합 평가자에서만 시작하는 것으로 표시

2. **코드 수정 (선택)**: 인포그래픽 구조에 맞게 코드 수정
   - 평가 노드들을 하나로 통합
   - 중간 평가 단계에서도 피드백 루프 추가

---

**검수 일자**: 2024년 12월
**검수 결과**: 기본 구조는 일치하나, 노드 분리와 피드백 루프에서 차이 있음

