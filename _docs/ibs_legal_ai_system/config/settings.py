"""설정 관리"""

from pathlib import Path
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import model_validator
import logging

logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    """애플리케이션 설정"""
    
    # OpenAI API
    openai_api_key: str = ""
    
    # Vector Database
    vector_db_type: str = "chroma"  # chroma, pinecone, faiss
    chroma_persist_directory: str = "./data/vector_db"
    
    # Pinecone (Optional)
    pinecone_api_key: Optional[str] = None
    pinecone_environment: Optional[str] = None
    pinecone_index_name: str = "ibs-legal-ai"
    
    # LLM Settings
    llm_model: str = "gpt-4-turbo-preview"
    embedding_model: str = "text-embedding-3-large"
    
    # Search Settings
    search_default_top_k: int = 10  # 초기 검색 결과 수
    search_rerank_top_k: int = 5  # 재랭킹 후 상위 결과 수
    search_max_results: int = 20  # 최대 검색 결과 수
    search_default_results: int = 5  # 기본 검색 결과 수 (API 기본값)
    search_max_sources: int = 3  # 응답에 포함할 최대 출처 수
    
    # Session Settings
    session_max_turns: int = 3  # 세션 히스토리 최대 턴 수
    redis_url: Optional[str] = None  # Redis URL (예: "redis://localhost:6379/0"), None이면 메모리 사용
    
    # API Settings
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    api_reload: bool = True
    
    # CORS Settings
    cors_origins: str = "*"  # 개발: "*", 프로덕션: "https://example.com,https://app.example.com"
    
    @property
    def cors_origins_list(self) -> list[str]:
        """CORS 허용 오리진 리스트"""
        if self.cors_origins == "*":
            return ["*"]
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]
    
    # Rate Limiting Settings
    rate_limit_default: int = 60  # 기본 요청 수/분
    rate_limit_ask: int = 30  # 질의응답 엔드포인트 요청 수/분
    rate_limit_search: int = 100  # 검색 엔드포인트 요청 수/분
    rate_limit_generate: int = 20  # 콘텐츠 생성 엔드포인트 요청 수/분
    rate_limit_admin: int = 10  # 관리자 엔드포인트 요청 수/분
    
    # Cache Settings
    cache_enabled: bool = True  # 캐시 활성화 여부
    cache_max_size: int = 1000  # 최대 캐시 항목 수
    cache_ttl: int = 3600  # 캐시 TTL (초 단위, 기본값: 1시간)
    
    # Logging
    log_level: str = "INFO"
    log_file: str = "./logs/app.log"
    
    # Data Settings
    data_dir: str = "./data"
    processed_data_dir: str = "./data/processed"
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",  # 정의되지 않은 필드는 무시 (다른 프로젝트의 설정과 공유 시 유용)
    )
    
    @property
    def chroma_persist_path(self) -> Path:
        """Chroma DB 저장 경로"""
        return Path(self.chroma_persist_directory)
    
    @property
    def data_path(self) -> Path:
        """데이터 디렉토리 경로"""
        return Path(self.data_dir)
    
    @property
    def processed_data_path(self) -> Path:
        """처리된 데이터 디렉토리 경로"""
        return Path(self.processed_data_dir)
    
    @model_validator(mode='after')
    def _validate_and_create_paths(self):
        """설정값 검증 및 경로 생성"""
        # ChromaDB 경로 확인 및 생성
        persist_path = self.chroma_persist_path
        if not persist_path.exists():
            persist_path.mkdir(parents=True, exist_ok=True)
            logger.info(f"ChromaDB 경로가 없어 생성했습니다: {persist_path}")
        
        # 데이터 디렉토리 확인 및 생성
        data_path = self.data_path
        if not data_path.exists():
            data_path.mkdir(parents=True, exist_ok=True)
            logger.info(f"데이터 디렉토리가 없어 생성했습니다: {data_path}")
        
        # 로그 디렉토리 확인 및 생성
        log_file_path = Path(self.log_file)
        log_dir = log_file_path.parent
        if not log_dir.exists():
            log_dir.mkdir(parents=True, exist_ok=True)
            logger.info(f"로그 디렉토리가 없어 생성했습니다: {log_dir}")
        
        return self


# 전역 설정 인스턴스
settings = Settings()

