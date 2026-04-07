"""검색 및 검색 강화 모듈"""

from typing import List, Dict, Any, Optional
import logging
import asyncio

from .vector_store import VectorStore
from .embedding import EmbeddingGenerator
from .workflow import RAGWorkflow
from ..utils.exceptions import SearchError, VectorStoreError, EmbeddingError

logger = logging.getLogger(__name__)


class HybridRetriever:
    """하이브리드 검색 (벡터 + 키워드)"""
    
    def __init__(
        self,
        vector_store: VectorStore,
        embedding_generator: EmbeddingGenerator,
    ):
        self.vector_store = vector_store
        self.embedding_generator = embedding_generator
        self.workflow = RAGWorkflow(vector_store, embedding_generator)
    
    async def search(
        self,
        query: str,
        n_results: int = 5,
        document_types: Optional[List[str]] = None,
        metadata_filters: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        하이브리드 검색 수행
        
        벡터 검색 실패 시 키워드 검색으로 폴백합니다.
        
        Args:
            query: 검색 쿼리
            n_results: 반환할 결과 수
            document_types: 문서 타입 필터
            metadata_filters: 메타데이터 필터
            
        Returns:
            검색 결과 딕셔너리
            
        Raises:
            SearchError: 검색 실패 시
        """
        try:
            # 워크플로우 실행 (동기 함수를 비동기로 실행)
            result = await asyncio.to_thread(
                self.workflow.run,
                query=query,
                metadata_filters=metadata_filters,
                document_types=document_types,
                n_results=n_results,
            )
            
            # 워크플로우에서 이미 n_results로 제한되었으므로 추가 제한 불필요
            reranked = result.get("reranked_results", [])
            
            return {
                "query": query,
                "results": reranked,
                "total": len(reranked),
                "context": result.get("context", ""),
                "error": result.get("error"),
            }
            
        except (VectorStoreError, EmbeddingError) as e:
            # 벡터 검색 실패 시 키워드 검색으로 폴백
            logger.warning(f"벡터 검색 실패, 키워드 검색으로 폴백: {str(e)}")
            return await self._fallback_keyword_search(
                query=query,
                n_results=n_results,
                document_types=document_types,
                metadata_filters=metadata_filters,
                original_error=str(e)
            )
        except Exception as e:
            logger.error(f"검색 실패: {str(e)}", exc_info=True)
            raise SearchError(
                f"검색 중 오류가 발생했습니다: {str(e)}",
                details={"query": query, "error": str(e)}
            ) from e
    
    async def _fallback_keyword_search(
        self,
        query: str,
        n_results: int,
        document_types: Optional[List[str]],
        metadata_filters: Optional[Dict[str, Any]],
        original_error: str
    ) -> Dict[str, Any]:
        """
        키워드 검색 폴백
        
        벡터 검색 실패 시 메타데이터 기반 키워드 검색을 수행합니다.
        
        Args:
            query: 검색 쿼리
            n_results: 반환할 결과 수
            document_types: 문서 타입 필터
            metadata_filters: 메타데이터 필터
            original_error: 원본 에러 메시지
            
        Returns:
            검색 결과 딕셔너리
        """
        try:
            logger.info(f"키워드 검색 폴백 실행: query='{query}'")
            
            # 메타데이터 기반 검색 시도
            # 모든 문서를 가져와서 필터링
            all_docs = self.vector_store.collection.get(limit=1000)
            
            results = []
            if all_docs.get('ids'):
                for i, doc_id in enumerate(all_docs['ids'][:1000]):
                    metadata = all_docs['metadatas'][i] if all_docs.get('metadatas') and i < len(all_docs['metadatas']) else {}
                    document = all_docs['documents'][i] if all_docs.get('documents') and i < len(all_docs['documents']) else ""
                    
                    # 키워드 매칭
                    query_lower = query.lower()
                    if query_lower in document.lower() or query_lower in str(metadata).lower():
                        results.append({
                            "id": doc_id,
                            "document": document,
                            "metadata": metadata,
                            "distance": None,  # 키워드 검색이므로 거리 없음
                            "score": 1.0,  # 기본 점수
                        })
            
            # 필터 적용
            from .filter_manager import FilterManager
            filtered_results = FilterManager.apply_filters(
                results=results,
                document_types=document_types,
                metadata_filters=metadata_filters
            )
            
            # 상위 n_results 선택
            filtered_results = filtered_results[:n_results]
            
            logger.info(f"키워드 검색 완료: {len(filtered_results)}개 결과")
            
            return {
                "query": query,
                "results": filtered_results,
                "total": len(filtered_results),
                "context": "\n".join([r.get("document", "") for r in filtered_results[:3]]),
                "error": None,
                "fallback": True,  # 폴백 사용 표시
                "original_error": original_error,
            }
            
        except Exception as e:
            logger.error(f"키워드 검색 폴백도 실패: {str(e)}")
            return {
                "query": query,
                "results": [],
                "total": 0,
                "context": "",
                "error": f"검색 실패 (벡터 검색: {original_error}, 키워드 검색: {str(e)})",
                "fallback": True,
            }
    
    def rerank_results(
        self,
        results: List[Dict[str, Any]],
        query: str,
        top_k: int = 5,
    ) -> List[Dict[str, Any]]:
        """
        검색 결과 재랭킹
        
        Args:
            results: 검색 결과 리스트
            query: 원본 쿼리
            top_k: 상위 k개 반환
            
        Returns:
            재랭킹된 결과
        """
        if not results:
            return []
        
        # 거리 기반 정렬 (이미 워크플로우에서 처리됨)
        # 여기서는 추가적인 재랭킹 로직 구현 가능
        
        # 간단한 점수 계산 (거리 기반)
        for result in results:
            distance = result.get("distance", float("inf"))
            # 거리를 점수로 변환 (작을수록 높은 점수)
            result["score"] = 1.0 / (1.0 + distance) if distance > 0 else 1.0
        
        # 점수 순으로 정렬
        reranked = sorted(
            results,
            key=lambda x: x.get("score", 0),
            reverse=True,
        )
        
        return reranked[:top_k]

