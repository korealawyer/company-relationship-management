# statistics 타입 검색 문제 해결

## 🔴 문제

`statistics` 타입 문서가 검색되지 않는 문제가 발생했습니다.

## 🔍 원인 분석

1. **벡터 검색 단계에서 `document_types` 필터 미적용**
   - `_vector_search_node`에서 `document_types`를 `where` 절에 포함시키지 않음
   - `document_types` 필터는 `_filter_metadata_node`에서만 적용되어, 벡터 검색 후 필터링됨
   - 이로 인해 `statistics` 타입이 검색되지 않거나 검색 효율이 떨어짐

2. **검색 효율성 문제**
   - 벡터 검색 단계에서 필터링하지 않으면 불필요한 문서까지 검색됨
   - 검색 후 필터링은 비효율적

## ✅ 적용된 수정 사항

### 1. 벡터 검색 단계에 `document_types` 필터 추가

`src/rag/workflow.py`의 `_vector_search_node` 메서드 수정:

- `document_types`를 `where` 절에 포함
- 단일 타입: `{"type": "statistics"}`
- 여러 타입: `{"type": {"$in": ["statistics", "case"]}}`
- 유효한 타입만 필터링: `{"case", "statute", "procedure", "template", "manual", "faq", "statistics"}`

### 2. 메타데이터 필터와 통합

- `document_types`와 `metadata_filters`를 하나의 `where_conditions`로 통합
- 여러 조건이면 `$and` 연산자로 결합

## 📝 수정된 코드 위치

- `src/rag/workflow.py`
  - `_vector_search_node()`: `document_types` 필터를 `where` 절에 추가

## 🧪 테스트 방법

### 1. statistics 타입만 검색

```bash
# API 요청
curl -X POST "http://localhost:8000/api/v1/search" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "스미싱",
    "n_results": 5,
    "document_types": ["statistics"]
  }'
```

### 2. Python으로 테스트

```python
import requests

response = requests.post(
    "http://localhost:8000/api/v1/search",
    json={
        "query": "스미싱",
        "n_results": 5,
        "document_types": ["statistics"]
    }
)

results = response.json()
print(f"검색 결과: {results['total']}개")
for result in results['results']:
    print(f"- {result['metadata'].get('title', 'N/A')} ({result['metadata'].get('type', 'N/A')})")
```

### 3. Swagger UI에서 테스트

1. http://localhost:8000/docs 접속
2. `POST /api/v1/search` 엔드포인트 선택
3. Request body에 다음 입력:
```json
{
  "query": "스미싱",
  "n_results": 5,
  "document_types": ["statistics"]
}
```
4. "Execute" 클릭

## 📊 예상 결과

수정 후:
- ✅ `statistics` 타입 문서가 정상적으로 검색됨
- ✅ 벡터 검색 단계에서 필터링하여 검색 효율 향상
- ✅ `document_types` 필터가 모든 문서 타입에서 정상 작동

## ⚠️ 주의사항

1. **벡터 DB 재인덱싱 불필요**
   - 메타데이터는 이미 올바르게 저장되어 있음
   - 코드 수정만으로 문제 해결

2. **ChromaDB `$in` 연산자 지원 확인**
   - ChromaDB 0.4.0 이상에서 `$in` 연산자 지원
   - 단일 타입 검색은 문제없음

3. **기존 검색 동작 유지**
   - `document_types`가 `None`이거나 빈 배열이면 모든 타입 검색 (기존 동작 유지)
   - `_filter_metadata_node`에서도 여전히 필터링 수행 (이중 필터링으로 안전성 향상)

## 🔄 다음 단계

1. 코드 수정 확인
2. API 서버 재시작 (코드 변경 반영)
3. statistics 타입 검색 테스트
4. 다른 문서 타입 검색도 정상 작동 확인

