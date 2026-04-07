# ChromaDB 인덱싱 오류 분석 및 해결 방안

## 🔴 오류 메시지

```
chromadb.errors.InternalError: Error in compaction: Error constructing hnsw segment reader: 
Error creating hnsw segment reader: Error loading hnsw index
```

## 📋 원인 분석

### 1. **인덱스 파일 손상** (가장 가능성 높음)
- ChromaDB의 HNSW 인덱스 파일이 손상되었을 수 있습니다
- 인덱싱 중단, 디스크 오류, 메모리 부족 등으로 인해 발생 가능

### 2. **동시 접근 문제**
- 여러 프로세스가 같은 벡터 DB에 접근
- 같은 프로세스 내에서 여러 `VectorStore` 인스턴스가 동시에 접근
- `DocumentIndexer`가 매번 새로운 `VectorStore` 인스턴스를 생성

### 3. **배치 크기 문제**
- 한 번에 너무 많은 청크를 추가하면 인덱스 파일 쓰기 실패 가능
- 현재 코드는 문서당 모든 청크를 한 번에 추가

### 4. **디스크 공간 부족**
- 벡터 DB 폴더에 충분한 공간이 없을 수 있음

### 5. **ChromaDB 버전 문제**
- ChromaDB 0.4.0 이상 사용 중이지만, 특정 버전에서 버그 가능

## 🛠️ 해결 방안

### 즉시 해결 방법

#### 1. 벡터 DB 완전 삭제 및 재생성 (권장)

```powershell
# 벡터 DB 폴더 백업 (선택사항)
Copy-Item -Path "data\vector_db" -Destination "data\vector_db_backup" -Recurse

# 벡터 DB 폴더 완전 삭제
Remove-Item -Path "data\vector_db" -Recurse -Force

# 재인덱싱 실행
python scripts/reindex_from_processed.py
```

#### 2. ChromaDB 클라이언트를 싱글톤으로 관리

현재 문제: `DocumentIndexer`가 매번 새로운 `VectorStore` 인스턴스를 생성하여 동시 접근 문제 발생 가능

해결: `VectorStore`를 싱글톤으로 관리하거나, 인덱싱 중에는 단일 인스턴스만 사용

### 코드 개선 방안

#### 1. 배치 크기 제한 및 재시도 로직 추가

`vector_store.py`의 `add_documents` 메서드에 배치 크기 제한과 재시도 로직 추가

#### 2. ChromaDB 설정 최적화

`ChromaSettings`에 추가 설정:
- `allow_reset=True` (이미 설정됨)
- `anonymized_telemetry=False` (이미 설정됨)
- 추가: `is_persistent=True` 명시

#### 3. 인덱싱 중 동시 접근 방지

인덱싱 중에는 다른 프로세스가 벡터 DB에 접근하지 않도록 보장

## 🔧 즉시 적용 가능한 수정 사항

### 수정 1: VectorStore에 배치 크기 제한 및 재시도 로직 추가

`src/rag/vector_store.py` 수정 필요

### 수정 2: 인덱싱 중 배치 처리 개선

`src/rag/indexer.py`에서 한 번에 추가하는 청크 수 제한

### 수정 3: ChromaDB 클라이언트 재사용

`DocumentIndexer`가 `VectorStore` 인스턴스를 재사용하도록 수정

## 📝 권장 조치 순서

1. **즉시**: 벡터 DB 폴더 삭제 후 재인덱싱
2. **단기**: 코드에 배치 크기 제한 및 재시도 로직 추가
3. **중기**: ChromaDB 클라이언트 싱글톤 패턴 적용
4. **장기**: ChromaDB 버전 업데이트 및 모니터링 강화

## ⚠️ 주의사항

- 벡터 DB 폴더를 삭제하기 전에 백업 권장
- 인덱싱 중에는 다른 프로세스(API 서버 등)를 중지해야 함
- 대량 데이터 인덱싱 시 시간이 오래 걸릴 수 있음

