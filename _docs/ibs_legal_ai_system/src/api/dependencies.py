"""FastAPI 의존성 주입 모듈"""

from functools import lru_cache
from typing import Tuple
import logging

from config.settings import settings
from ..rag import (
    VectorStore,
    EmbeddingGenerator,
    HybridRetriever,
    LLMManager,
    SessionManager,
)
from ..rag.content_workflow import ContentWorkflow
from ..utils.cache import QueryCache

logger = logging.getLogger(__name__)


@lru_cache()
def get_vector_store() -> VectorStore:
    """
    VectorStore 인스턴스를 반환합니다.
    
    Returns:
        VectorStore: 벡터 저장소 인스턴스 (싱글톤)
    """
    try:
        logger.debug("VectorStore 인스턴스 생성/반환")
        return VectorStore()
    except Exception as e:
        logger.error(f"VectorStore 초기화 실패: {e}", exc_info=True)
        raise


@lru_cache()
def get_embedding_generator() -> EmbeddingGenerator:
    """
    EmbeddingGenerator 인스턴스를 반환합니다.
    
    Returns:
        EmbeddingGenerator: 임베딩 생성기 인스턴스 (싱글톤)
    """
    try:
        logger.debug("EmbeddingGenerator 인스턴스 생성/반환")
        if not settings.openai_api_key:
            raise ValueError("OPENAI_API_KEY가 설정되지 않았습니다. .env 파일을 확인하세요.")
        return EmbeddingGenerator()
    except Exception as e:
        logger.error(f"EmbeddingGenerator 초기화 실패: {e}", exc_info=True)
        raise


@lru_cache()
def get_retriever() -> HybridRetriever:
    """
    HybridRetriever 인스턴스를 반환합니다.
    
    내부에서 VectorStore와 EmbeddingGenerator를 자동으로 생성합니다.
    
    Returns:
        HybridRetriever: 하이브리드 검색기 인스턴스 (싱글톤)
    """
    logger.debug("HybridRetriever 인스턴스 생성/반환")
    vector_store = get_vector_store()
    embedding_gen = get_embedding_generator()
    return HybridRetriever(vector_store, embedding_gen)


@lru_cache()
def get_llm_manager() -> LLMManager:
    """
    LLMManager 인스턴스를 반환합니다.
    
    Returns:
        LLMManager: LLM 관리자 인스턴스 (싱글톤)
    """
    try:
        logger.debug("LLMManager 인스턴스 생성/반환")
        if not settings.openai_api_key:
            raise ValueError("OPENAI_API_KEY가 설정되지 않았습니다. .env 파일을 확인하세요.")
        return LLMManager()
    except Exception as e:
        logger.error(f"LLMManager 초기화 실패: {e}", exc_info=True)
        raise


@lru_cache()
def get_session_manager() -> SessionManager:
    """
    SessionManager 인스턴스를 반환합니다.
    
    Returns:
        SessionManager: 세션 관리자 인스턴스 (싱글톤)
    """
    logger.debug("SessionManager 인스턴스 생성/반환")
    return SessionManager()


@lru_cache()
def get_query_cache() -> QueryCache:
    """
    QueryCache 인스턴스를 반환합니다.
    
    Returns:
        QueryCache: 쿼리 캐시 인스턴스 (싱글톤)
    """
    logger.debug("QueryCache 인스턴스 생성/반환")
    return QueryCache(
        max_size=settings.cache_max_size,
        ttl=settings.cache_ttl
    )


@lru_cache()
def get_content_workflow() -> ContentWorkflow:
    """
    ContentWorkflow 인스턴스를 반환합니다.
    
    Returns:
        ContentWorkflow: 콘텐츠 생성 워크플로우 인스턴스 (싱글톤)
    """
    logger.debug("ContentWorkflow 인스턴스 생성/반환")
    vector_store = get_vector_store()
    embedding_gen = get_embedding_generator()
    llm_manager = get_llm_manager()
    return ContentWorkflow(vector_store, embedding_gen, llm_manager)


def get_rag_services() -> Tuple[HybridRetriever, LLMManager, SessionManager]:
    """
    RAG 서비스 인스턴스들을 한 번에 반환합니다.
    
    Returns:
        Tuple[HybridRetriever, LLMManager, SessionManager]: 
            검색기, LLM 관리자, 세션 관리자 튜플
    """
    retriever = get_retriever()
    llm_manager = get_llm_manager()
    session_manager = get_session_manager()
    return retriever, llm_manager, session_manager

