# ChromaDB 인덱싱 오류 해결 가이드

## 🔴 발생한 오류

```
chromadb.errors.InternalError: Error in compaction: Error constructing hnsw segment reader: 
Error creating hnsw segment reader: Error loading hnsw index
```

## ✅ 적용된 수정 사항

### 1. 배치 크기 제한 추가
- 한 번에 최대 100개 청크만 추가하도록 제한
- 큰 배치는 자동으로 여러 번으로 나누어 처리

### 2. 재시도 로직 추가
- 인덱스 관련 오류 발생 시 자동 재시도 (최대 3회)
- 지수 백오프 방식으로 재시도 간격 증가 (0.5초 → 1초 → 2초)

### 3. 클라이언트 재연결 기능
- 오류 발생 시 ChromaDB 클라이언트 자동 재연결

## 🚀 즉시 해결 방법

### 방법 1: 벡터 DB 완전 삭제 후 재인덱싱 (권장)

```powershell
# 1. API 서버가 실행 중이면 중지 (Ctrl+C)

# 2. 벡터 DB 폴더 백업 (선택사항)
Copy-Item -Path "data\vector_db" -Destination "data\vector_db_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')" -Recurse -ErrorAction SilentlyContinue

# 3. 벡터 DB 폴더 완전 삭제
Remove-Item -Path "data\vector_db" -Recurse -Force

# 4. 재인덱싱 실행
python scripts/reindex_from_processed.py
```

### 방법 2: 기존 데이터 유지하고 계속 인덱싱

```powershell
# 기존 데이터 유지하고 실패한 파일만 다시 인덱싱
python scripts/reindex_from_processed.py --no-reset
```

## 📋 수정된 코드 위치

- `src/rag/vector_store.py`
  - `add_documents()`: 배치 크기 제한 추가
  - `_add_batch_with_retry()`: 재시도 로직 추가
  - `_reconnect()`: 클라이언트 재연결 기능 추가

## 🔍 오류 원인

1. **인덱스 파일 손상**: ChromaDB의 HNSW 인덱스 파일이 손상됨
2. **배치 크기 문제**: 한 번에 너무 많은 데이터 추가로 인덱스 파일 쓰기 실패
3. **동시 접근**: 여러 프로세스가 같은 벡터 DB에 접근

## 💡 예방 방법

1. **인덱싱 중에는 API 서버 중지**: 동시 접근 방지
2. **정기 백업**: 벡터 DB 폴더 정기 백업
3. **충분한 디스크 공간**: 벡터 DB 폴더에 충분한 공간 확보
4. **배치 크기 조정**: 필요시 `BATCH_SIZE` 값 조정 (현재 100)

## ⚠️ 주의사항

- 벡터 DB 폴더를 삭제하면 기존 인덱싱된 모든 데이터가 삭제됩니다
- 재인덱싱에는 시간이 오래 걸릴 수 있습니다 (965개 파일 기준 약 30분~1시간)
- 인덱싱 중에는 다른 프로세스가 벡터 DB에 접근하지 않도록 해야 합니다

## 📊 예상 결과

수정 후:
- ✅ 배치 크기 제한으로 인덱스 파일 손상 방지
- ✅ 재시도 로직으로 일시적 오류 자동 복구
- ✅ 더 안정적인 인덱싱 프로세스

## 🔄 다음 단계

1. 벡터 DB 폴더 삭제
2. 재인덱싱 실행
3. 인덱싱 완료 후 API 서버 실행
4. 검색 기능 테스트

