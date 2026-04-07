# API 시스템 문제 원인 분석

## 🔍 발견된 문제점

### 1. **미들웨어 초기화 순서 문제** ⚠️

`src/api/main.py`에서 미들웨어가 잘못된 순서로 추가되어 있습니다:

```python
# 현재 코드 (잘못된 순서)
app.add_middleware(LoggingMiddleware)
app.add_middleware(RateLimitMiddleware, default_limit=settings.rate_limit_default)
app.add_middleware(CORSMiddleware, ...)
```

**문제점**: 
- FastAPI에서 미들웨어는 **역순으로 실행**됩니다
- CORS는 가장 먼저 처리되어야 하므로 **마지막에 추가**해야 합니다
- 현재는 LoggingMiddleware가 가장 먼저 실행되어 CORS 헤더가 제대로 처리되지 않을 수 있습니다

**올바른 순서**:
1. LoggingMiddleware (가장 나중에 추가 → 가장 먼저 실행)
2. RateLimitMiddleware
3. CORSMiddleware (가장 먼저 추가 → 가장 나중에 실행)

### 2. **의존성 초기화 시점 문제** ⚠️

`src/api/dependencies.py`에서 `@lru_cache()`를 사용하고 있지만, 초기화 시점에 오류가 발생할 수 있습니다:

- VectorStore 초기화 시 ChromaDB 연결 실패 가능
- EmbeddingGenerator 초기화 시 OpenAI API 키 누락 가능
- LLMManager 초기화 시 OpenAI API 키 누락 가능

### 3. **설정 파일 검증 부재** ⚠️

`config/settings.py`에서 필수 설정값 검증이 없습니다:
- `openai_api_key`가 빈 문자열일 수 있음
- `chroma_persist_directory` 경로가 존재하지 않을 수 있음

### 4. **예외 처리 부족** ⚠️

초기화 단계에서 예외가 발생하면 서버가 시작되지 않을 수 있습니다:
- `lifespan` 함수에서 예외 처리 없음
- 라우터 등록 시점에 예외 발생 가능

## 🛠️ 수정 방안

### 수정 1: 미들웨어 순서 수정

```python
# CORS를 가장 먼저 추가 (가장 나중에 실행)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# RateLimitMiddleware
app.add_middleware(RateLimitMiddleware, default_limit=settings.rate_limit_default)

# LoggingMiddleware를 가장 나중에 추가 (가장 먼저 실행)
app.add_middleware(LoggingMiddleware)
```

### 수정 2: 설정 검증 추가

```python
# config/settings.py에 추가
def __init__(self, **kwargs):
    super().__init__(**kwargs)
    self._validate_settings()
    
def _validate_settings(self):
    """설정값 검증"""
    if not self.openai_api_key:
        raise ValueError("OPENAI_API_KEY가 설정되지 않았습니다. .env 파일을 확인하세요.")
    
    # ChromaDB 경로 확인
    persist_path = Path(self.chroma_persist_directory)
    if not persist_path.exists():
        persist_path.mkdir(parents=True, exist_ok=True)
        logger.warning(f"ChromaDB 경로가 없어 생성했습니다: {persist_path}")
```

### 수정 3: Lifespan 함수에 예외 처리 추가

```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    """애플리케이션 생명주기 관리"""
    # Startup
    try:
        logger.info("IBS 법률 AI 시스템 API 서버 시작")
        logger.info(f"환경: {settings.log_level}")
        
        # 필수 서비스 초기화 확인
        try:
            from src.api.dependencies import get_vector_store
            vector_store = get_vector_store()
            count = vector_store.get_count()
            logger.info(f"벡터 DB 연결 성공: {count}개 문서")
        except Exception as e:
            logger.warning(f"벡터 DB 초기화 경고: {e}")
        
        yield
    except Exception as e:
        logger.error(f"서버 시작 실패: {e}", exc_info=True)
        raise
    finally:
        # Shutdown
        logger.info("IBS 법률 AI 시스템 API 서버 종료")
```

### 수정 4: 의존성 초기화에 예외 처리 추가

```python
@lru_cache()
def get_vector_store() -> VectorStore:
    """VectorStore 인스턴스를 반환합니다."""
    try:
        logger.debug("VectorStore 인스턴스 생성/반환")
        return VectorStore()
    except Exception as e:
        logger.error(f"VectorStore 초기화 실패: {e}", exc_info=True)
        raise
```

## 📋 체크리스트

API가 작동하지 않을 때 확인할 사항:

- [ ] `.env` 파일이 존재하고 `OPENAI_API_KEY`가 설정되어 있는가?
- [ ] `chroma_persist_directory` 경로가 존재하는가?
- [ ] 필요한 Python 패키지가 모두 설치되어 있는가? (`pip install -r requirements.txt`)
- [ ] 포트 8000이 이미 사용 중이 아닌가?
- [ ] 벡터 DB에 데이터가 인덱싱되어 있는가?
- [ ] 서버 로그에 오류 메시지가 있는가?

## 🚀 테스트 방법

1. **서버 시작 테스트**:
```bash
python -m src.api.main
```

2. **헬스체크 테스트**:
```bash
curl http://localhost:8000/api/v1/health
```

3. **Import 테스트**:
```bash
python test_import.py
```









