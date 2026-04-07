# n_results 검색 결과 수 문제 해결

## 🔴 문제

- `n_results: 10`으로 요청했는데 5개만 반환됨
- `statistics` 타입 문서가 검색 결과에 없음

## 🔍 원인 분석

### 1. n_results가 5개로 제한되는 문제

**원인:**
- `_rerank_results_node`에서 `settings.search_rerank_top_k` (기본값 5)를 하드코딩하여 사용
- `workflow.run()`에 `n_results` 파라미터가 전달되지 않음
- `retriever.py`에서 `n_results`를 워크플로우에 전달하지 않음

**영향:**
- 사용자가 요청한 `n_results` 값이 무시되고 항상 5개만 반환됨

### 2. statistics 타입이 검색되지 않는 문제

**가능한 원인:**
1. 벡터 DB에 `statistics` 타입 문서가 인덱싱되지 않았을 수 있음
2. 검색 쿼리 "스미싱"과 `statistics` 타입 문서의 유사도가 낮아서 상위 결과에 포함되지 않았을 수 있음
3. 벡터 검색 단계에서 충분한 결과를 가져오지 못했을 수 있음

## ✅ 적용된 수정 사항

### 1. GraphState에 n_results 필드 추가

```python
class GraphState(TypedDict):
    ...
    n_results: Optional[int]  # 반환할 결과 수
    ...
```

### 2. workflow.run()에 n_results 파라미터 추가

```python
def run(self, query: str, **kwargs) -> Dict[str, Any]:
    # n_results 기본값 설정
    n_results = kwargs.get("n_results", settings.search_rerank_top_k)
    
    initial_state: GraphState = {
        ...
        "n_results": n_results,
        ...
    }
```

### 3. _rerank_results_node에서 n_results 사용

```python
def _rerank_results_node(self, state: GraphState) -> GraphState:
    n_results = state.get("n_results", settings.search_rerank_top_k)
    
    # 상위 결과만 선택 (n_results 사용)
    reranked = reranked[:n_results]
```

### 4. retriever.py에서 n_results 전달

```python
result = await asyncio.to_thread(
    self.workflow.run,
    query=query,
    metadata_filters=metadata_filters,
    document_types=document_types,
    n_results=n_results,  # n_results 전달
)
```

## 📝 수정된 파일

- `src/rag/workflow.py`
  - `GraphState`: `n_results` 필드 추가
  - `run()`: `n_results` 파라미터 처리
  - `_rerank_results_node()`: `n_results` 사용

- `src/rag/retriever.py`
  - `search()`: `n_results`를 워크플로우에 전달

## 🧪 테스트 방법

### 1. n_results 테스트

```bash
# 10개 요청
curl -X POST "http://localhost:8000/api/v1/search" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "스미싱",
    "n_results": 10
  }'

# 예상 결과: 10개 반환 (또는 검색 가능한 문서 수만큼)
```

### 2. statistics 타입 확인

```bash
# statistics 타입만 검색
curl -X POST "http://localhost:8000/api/v1/search" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "스미싱",
    "n_results": 10,
    "document_types": ["statistics"]
  }'
```

### 3. 벡터 DB에 statistics 타입 문서 확인

```python
import chromadb
from chromadb.config import Settings

client = chromadb.PersistentClient(
    path="./data/vector_db",
    settings=Settings(anonymized_telemetry=False)
)
collection = client.get_collection("legal_documents")

# statistics 타입 문서 확인
results = collection.get(
    where={"type": "statistics"},
    limit=10
)

print(f"statistics 타입 문서: {len(results['ids'])}개")
for i, doc_id in enumerate(results['ids'][:5], 1):
    print(f"{i}. {doc_id}")
    if results.get('metadatas'):
        meta = results['metadatas'][i-1]
        print(f"   제목: {meta.get('title', 'N/A')}")
```

## 📊 예상 결과

수정 후:
- ✅ `n_results` 값이 정확히 반영됨 (10개 요청 시 10개 반환)
- ✅ `statistics` 타입 문서도 검색 결과에 포함될 수 있음 (인덱싱되어 있다면)

## ⚠️ 주의사항

1. **벡터 DB 재인덱싱 필요 여부 확인**
   - `statistics` 타입 문서가 인덱싱되어 있는지 확인 필요
   - 인덱싱되지 않았다면 재인덱싱 필요

2. **검색 결과 수 제한**
   - `settings.search_max_results` (기본값 20)를 초과할 수 없음
   - API에서 이미 검증됨

3. **API 서버 재시작 필요**
   - 코드 변경을 반영하기 위해 서버 재시작 필요

## 🔄 다음 단계

1. API 서버 재시작
2. `n_results: 10`으로 검색 테스트
3. `statistics` 타입 문서 인덱싱 확인
4. 필요시 재인덱싱 실행

