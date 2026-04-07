"""임베딩 생성 및 관리"""

from typing import List, Optional, Dict, Any
import logging
import asyncio
from functools import lru_cache
import hashlib
import json

try:
    from langchain_openai import OpenAIEmbeddings
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False

from config.settings import settings
from ..utils.exceptions import EmbeddingError, ConfigurationError

logger = logging.getLogger(__name__)


class EmbeddingGenerator:
    """
    임베딩 생성기
    
    OpenAI Embedding API를 사용하여 텍스트를 벡터로 변환합니다.
    캐싱 및 배치 처리를 지원합니다.
    """
    
    def __init__(self, model_name: Optional[str] = None, enable_cache: bool = True):
        """
        임베딩 생성기 초기화
        
        Args:
            model_name: 임베딩 모델 이름 (기본값: settings.embedding_model)
            enable_cache: 임베딩 캐싱 활성화 여부
        """
        self.model_name = model_name or settings.embedding_model
        self.embeddings = None
        self.enable_cache = enable_cache
        self._cache: Dict[str, List[float]] = {}  # 메모리 캐시
        self._initialize()
    
    def _initialize(self):
        """임베딩 모델 초기화"""
        if not OPENAI_AVAILABLE:
            raise ConfigurationError(
                "langchain-openai가 설치되지 않았습니다.",
                details={"package": "langchain-openai", "command": "pip install langchain-openai"}
            )
        
        if not settings.openai_api_key:
            raise ConfigurationError(
                "OPENAI_API_KEY가 설정되지 않았습니다.",
                details={"setting": "OPENAI_API_KEY"}
            )
        
        try:
            self.embeddings = OpenAIEmbeddings(
                model=self.model_name,
                openai_api_key=settings.openai_api_key,
            )
            logger.info(f"임베딩 모델 초기화: {self.model_name}")
        except Exception as e:
            raise EmbeddingError(
                f"임베딩 모델 초기화 실패: {str(e)}",
                details={"model": self.model_name, "error": str(e)}
            )
    
    def _get_cache_key(self, text: str) -> str:
        """
        캐시 키 생성
        
        Args:
            text: 텍스트
            
        Returns:
            캐시 키 (해시값)
        """
        # 텍스트와 모델 이름을 조합하여 캐시 키 생성
        cache_data = f"{self.model_name}:{text}"
        return hashlib.md5(cache_data.encode('utf-8')).hexdigest()
    
    async def embed_text(self, text: str) -> List[float]:
        """
        단일 텍스트를 임베딩합니다.
        
        캐싱이 활성화된 경우 이전에 생성한 임베딩을 재사용합니다.
        
        Args:
            text: 임베딩할 텍스트
            
        Returns:
            임베딩 벡터
            
        Raises:
            EmbeddingError: 임베딩 생성 실패 시
        """
        # 캐시 확인
        if self.enable_cache:
            cache_key = self._get_cache_key(text)
            if cache_key in self._cache:
                logger.debug(f"캐시에서 임베딩 반환: {cache_key[:8]}...")
                return self._cache[cache_key]
        
        try:
            result = await asyncio.to_thread(self.embeddings.embed_query, text)
            
            # 캐시에 저장
            if self.enable_cache:
                cache_key = self._get_cache_key(text)
                self._cache[cache_key] = result
                logger.debug(f"임베딩 캐시 저장: {cache_key[:8]}...")
            
            return result
        except Exception as e:
            logger.error(f"임베딩 생성 실패: {str(e)}")
            raise EmbeddingError(
                f"임베딩 생성 실패: {str(e)}",
                details={"text_length": len(text), "model": self.model_name, "error": str(e)}
            ) from e
    
    async def embed_texts(
        self, 
        texts: List[str], 
        batch_size: Optional[int] = None
    ) -> List[List[float]]:
        """
        여러 텍스트를 일괄 임베딩합니다.
        
        배치 처리를 통해 효율적으로 임베딩을 생성하며, 캐싱이 활성화된 경우
        이전에 생성한 임베딩을 재사용합니다.
        
        Args:
            texts: 임베딩할 텍스트 리스트
            batch_size: 배치 크기 (None이면 자동 계산, 최대 100)
            
        Returns:
            임베딩 벡터 리스트
            
        Raises:
            EmbeddingError: 임베딩 생성 실패 시
        """
        if not texts:
            return []
        
        # 배치 크기 자동 계산 (최대 100, OpenAI API 제한)
        if batch_size is None:
            batch_size = min(100, len(texts))
        else:
            batch_size = min(batch_size, 100, len(texts))
        
        results: List[List[float]] = []
        texts_to_embed: List[str] = []
        text_indices: List[int] = []
        
        # 캐시 확인 및 배치 구성
        for i, text in enumerate(texts):
            if self.enable_cache:
                cache_key = self._get_cache_key(text)
                if cache_key in self._cache:
                    # 캐시에서 가져오기
                    results.append(self._cache[cache_key])
                    logger.debug(f"캐시에서 임베딩 반환 [{i}]: {cache_key[:8]}...")
                    continue
            
            # 캐시에 없으면 배치에 추가
            texts_to_embed.append(text)
            text_indices.append(i)
        
        # 배치 처리
        if texts_to_embed:
            try:
                # 결과를 올바른 순서로 저장하기 위한 딕셔너리
                result_dict: Dict[int, List[float]] = {}
                
                # 배치 단위로 처리
                for batch_start in range(0, len(texts_to_embed), batch_size):
                    batch_texts = texts_to_embed[batch_start:batch_start + batch_size]
                    batch_indices = text_indices[batch_start:batch_start + batch_size]
                    
                    logger.debug(f"임베딩 배치 처리: {len(batch_texts)}개 텍스트")
                    batch_results = await asyncio.to_thread(
                        self.embeddings.embed_documents, 
                        batch_texts
                    )
                    
                    # 결과 저장 및 캐싱
                    for text, idx, result in zip(batch_texts, batch_indices, batch_results):
                        result_dict[idx] = result
                        
                        # 캐시에 저장
                        if self.enable_cache:
                            cache_key = self._get_cache_key(text)
                            self._cache[cache_key] = result
                    
                    logger.debug(f"배치 처리 완료: {len(batch_texts)}개")
                
                # 원본 텍스트 순서대로 결과 재구성
                for i in range(len(texts)):
                    if i in result_dict:
                        results.append(result_dict[i])
                    else:
                        # 캐시에서 가져온 경우
                        if self.enable_cache:
                            cache_key = self._get_cache_key(texts[i])
                            if cache_key in self._cache:
                                results.append(self._cache[cache_key])
                            else:
                                # 이론적으로 발생하지 않아야 함
                                logger.warning(f"임베딩 결과를 찾을 수 없음: 인덱스 {i}")
                                results.append([0.0] * self.get_embedding_dimension())
                        else:
                            logger.warning(f"임베딩 결과를 찾을 수 없음: 인덱스 {i}")
                            results.append([0.0] * self.get_embedding_dimension())
                
            except Exception as e:
                logger.error(f"일괄 임베딩 생성 실패: {str(e)}")
                raise EmbeddingError(
                    f"일괄 임베딩 생성 실패: {str(e)}",
                    details={"texts_count": len(texts), "model": self.model_name, "error": str(e)}
                ) from e
        
        return results
    
    def get_embedding_dimension(self) -> int:
        """임베딩 차원을 반환합니다."""
        # text-embedding-3-large는 3072차원
        if "3-large" in self.model_name:
            return 3072
        elif "3-small" in self.model_name:
            return 1536
        else:
            # 기본값 (ada-002 등)
            return 1536

