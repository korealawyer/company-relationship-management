# LangGraph 재귀 제한 오류 해결

## 🔴 문제

```
Recursion limit of 25 reached without hitting a stop condition.
```

콘텐츠 생성 워크플로우에서 재작성 루프가 무한 반복되어 LangGraph의 재귀 제한에 도달했습니다.

## 🔍 원인 분석

### 1. 재작성 루프 무한 반복

**원인:**
- 평가 점수가 70점 미만이면 재작성 시도
- 재작성 후에도 점수가 개선되지 않아 계속 재시도
- `revision_count`는 증가하지만, 재작성 루프가 LangGraph의 재귀 제한(25)에 먼저 도달

**재작성 루프 구조:**
```
rewrite_topic → adjust_prompt → re_search → generate_prompt → 
generate_draft → evaluate_structure → evaluate_content_quality → 
evaluate_legal_accuracy → calculate_score → check_threshold → 
(점수 < 70) → rewrite_topic (반복)
```

각 재작성마다 약 10개 노드를 거치므로, 3회 재작성 시 약 30개 노드 필요

### 2. 점수 개선 확인 부족

**원인:**
- 재작성 후 점수가 개선되지 않아도 계속 재시도
- 점수가 오히려 하락해도 재시도

### 3. 재귀 제한 설정 부족

**원인:**
- LangGraph의 기본 재귀 제한(25)이 재작성 루프를 고려하지 않음
- 재귀 제한 설정이 없음

## ✅ 적용된 수정 사항

### 1. 재귀 제한 설정 추가

`_build_graph()`:
```python
compiled = workflow.compile()
compiled = compiled.with_config({"recursion_limit": 50})
return compiled
```

`run()` 메서드:
```python
result = self.graph.invoke(
    initial_state,
    config={"recursion_limit": 50}
)
```

### 2. 점수 개선 확인 로직 추가

`_check_threshold_node`:
- `previous_score` 필드를 사용하여 이전 점수 저장
- 재작성 후 점수가 개선되지 않으면 중단
- 점수가 하락해도 중단

### 3. 최대 재시도 횟수 체크 강화

`_should_rewrite`:
- `revision_count`를 먼저 체크하여 무한 루프 방지
- 최대 재시도 도달 시 즉시 중단

### 4. 에러 처리 개선

`run()` 메서드:
- 재귀 제한 오류 발생 시 현재까지 생성된 `draft` 반환
- 빈 콘텐츠일 때 기본 메시지 반환
- 상세한 에러 로깅

### 5. 최대 재시도 도달 시 최종 정리 수행

- `max_revisions` 엔드포인트가 `END`로 가던 것을 `finalize_content`로 변경
- 최대 재시도 도달 시에도 구조화된 콘텐츠 생성

## 📝 수정된 파일

- `src/rag/content_workflow.py`
  - `ContentWorkflowState`: `previous_score` 필드 추가
  - `_build_graph()`: 재귀 제한 설정 추가
  - `_check_threshold_node()`: 점수 개선 확인 로직 추가
  - `_should_rewrite()`: 최대 재시도 체크 강화
  - `run()`: 에러 처리 및 재귀 제한 설정 개선
  - 그래프 엣지: `max_revisions` → `finalize_content`로 변경

## 🧪 테스트 방법

### 1. 기본 테스트

```bash
curl -X POST "http://localhost:8000/api/v1/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "사기죄와 특경법 적용 유무의 차이 설명해줘",
    "content_type": "blog",
    "n_references": 5
  }'
```

### 2. 재시도 횟수 제한 테스트

```bash
curl -X POST "http://localhost:8000/api/v1/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "사기죄와 특경법 적용 유무의 차이 설명해줘",
    "content_type": "blog",
    "n_references": 5,
    "max_revisions": 2
  }'
```

## 📊 예상 결과

수정 후:
- ✅ 재귀 제한 오류 방지 (재귀 제한 50으로 증가)
- ✅ 점수가 개선되지 않으면 재작성 중단
- ✅ 최대 재시도 도달 시 현재까지 생성된 콘텐츠 반환
- ✅ 빈 콘텐츠일 때 기본 메시지 반환

## ⚠️ 주의사항

1. **재귀 제한 설정**
   - 재귀 제한을 50으로 설정했지만, 필요시 더 증가 가능
   - 재작성 루프가 많을수록 더 많은 재귀 제한 필요

2. **점수 개선 확인**
   - 재작성 후 점수가 개선되지 않으면 즉시 중단
   - 이는 불필요한 재작성을 방지하지만, 일부 경우 조기 중단될 수 있음

3. **API 서버 재시작 필요**
   - 코드 변경을 반영하기 위해 서버 재시작 필요

## 🔄 다음 단계

1. API 서버 재시작
2. 콘텐츠 생성 API 테스트
3. 로그 확인하여 재작성 루프 동작 모니터링
4. 필요시 재귀 제한 값 조정

