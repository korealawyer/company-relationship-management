# 인덱싱 완료 여부 확인 명령어

## 1. 검색 API로 확인 (가장 확실한 방법) ⭐
```powershell
python check_via_search.py
```
또는 브라우저에서:
```
http://localhost:8000/docs#/search/search_documents_api_v1_search_post
```

## 2. 기본 확인
```powershell
python check_completion.py
```

## 3. 상세 상태 확인 (재시도 포함)
```powershell
python check_indexing_status.py
```

## 4. 간단한 파일 수 확인
```powershell
python check_indexing_log.py
```

## 5. 벡터 DB 크기 확인
```powershell
Get-ChildItem -Path "data\vector_db" -Recurse | Measure-Object -Property Length -Sum | Select-Object @{Name="Size(MB)";Expression={[math]::Round($_.Sum / 1MB, 2)}}
```

## 문제 해결

### ChromaDB 접근 오류 발생 시 (현재 상황):
**증상:**
- `Error loading hnsw index`
- `memory allocation failed`
- 검색 결과 0개

**해결 방법:**

1. **API 서버 재시작** (가장 먼저 시도)
   ```powershell
   # API 서버 중지 후 재시작
   python -m src.api.main
   ```

2. **ChromaDB 인덱스 재구성** (필요 시)
   - 벡터 DB 크기가 500MB 이상이면 인덱싱은 완료된 상태
   - ChromaDB가 인덱스를 읽지 못하는 문제일 수 있음
   - API 서버 재시작으로 해결되는 경우가 많음

3. **인덱싱 재실행** (최후의 수단)
   ```powershell
   python scripts/reindex_from_processed.py --reset
   ```

### 인덱싱이 완료되었는지 확인하는 방법:
- ✅ **벡터 DB 크기가 500MB 이상** → 인덱싱 완료 가능성 높음
- ✅ **검색 API가 결과 반환** → 완료
- ❌ **검색 API가 0개 결과** → ChromaDB 접근 문제 또는 인덱싱 미완료
- ❌ **ChromaDB 접근 오류** → 인덱스 안정화 필요 또는 재시작 필요

