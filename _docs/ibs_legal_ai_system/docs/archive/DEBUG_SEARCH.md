# 검색 문제 진단 가이드

## 🔍 검색이 안될 때 확인사항

### 1. 서버가 실행 중인지 확인

```bash
# 헬스체크
curl http://localhost:8000/api/v1/health

# 또는 브라우저에서
http://localhost:8000/api/v1/health
```

**예상 응답:**
```json
{
  "status": "healthy",
  "version": "0.1.0",
  "timestamp": "..."
}
```

### 2. 벡터 DB에 데이터가 있는지 확인

```bash
python scripts/check_indexed_data.py
```

또는 API로 확인:
```bash
curl http://localhost:8000/api/v1/health/detailed
```

### 3. 검색 테스트

**Python으로 테스트:**
```python
import requests

response = requests.post(
    "http://localhost:8000/api/v1/search",
    json={
        "query": "형법 제101조",
        "n_results": 5
    }
)

print(response.json())
```

**PowerShell로 테스트:**
```powershell
$body = @{
    query = "형법 제101조"
    n_results = 5
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/api/v1/search" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

### 4. 서버 로그 확인

서버를 실행한 터미널에서 로그를 확인하세요:
- 검색 요청이 들어오는지
- 에러 메시지가 있는지
- 임베딩 생성이 성공하는지

### 5. 일반적인 문제 해결

#### 문제 1: "검색 결과가 없습니다"
- **원인**: 벡터 DB에 데이터가 없거나, 필터가 너무 엄격함
- **해결**: 
  - `python scripts/check_indexed_data.py`로 데이터 확인
  - 필터 제거 후 재시도: `{"query": "형법 제101조", "n_results": 5}`

#### 문제 2: "임베딩 생성 실패"
- **원인**: OpenAI API 키가 없거나 잘못됨
- **해결**: `.env` 파일에 `OPENAI_API_KEY` 확인

#### 문제 3: "벡터 DB 연결 실패"
- **원인**: ChromaDB 파일이 손상되었거나 경로가 잘못됨
- **해결**: `data/vector_db` 폴더 확인

#### 문제 4: "document_types 필터 문제"
- **원인**: `["string"]`이 포함되어 있거나 잘못된 타입
- **해결**: 
  - `null` 또는 `[]`로 설정 (모든 타입 검색)
  - `["statute"]`로 설정 (법령만 검색)

### 6. 디버깅 모드로 실행

서버를 디버깅 모드로 실행하면 더 자세한 로그를 볼 수 있습니다:

```bash
# 로깅 레벨을 DEBUG로 설정
export LOG_LEVEL=DEBUG
python -m src.api.main
```

또는 Python 코드에서:
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

## 📝 체크리스트

- [ ] 서버가 실행 중인가요? (`http://localhost:8000/api/v1/health`)
- [ ] 벡터 DB에 데이터가 있나요? (`python scripts/check_indexed_data.py`)
- [ ] OpenAI API 키가 설정되어 있나요? (`.env` 파일 확인)
- [ ] 검색 쿼리가 올바른가요? (예: `"형법 제101조"`)
- [ ] 필터가 너무 엄격하지 않나요? (`document_types`, `category` 등)
- [ ] 서버 로그에 에러가 있나요?

## 🚀 빠른 테스트

```bash
# 1. 서버 실행 (터미널 1)
python -m src.api.main

# 2. 검색 테스트 (터미널 2)
python test_search.py
```

