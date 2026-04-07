"""LangGraph 워크플로우 - 검색 및 질의응답"""

from typing import TypedDict, List, Dict, Any, Optional, Annotated
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages
import logging
import asyncio
import re
from .vector_store import VectorStore
from .embedding import EmbeddingGenerator
from .filter_manager import FilterManager
from config.settings import settings

logger = logging.getLogger(__name__)


class GraphState(TypedDict):
    """워크플로우 상태"""
    query: str
    query_embedding: Optional[List[float]]
    search_results: List[Dict[str, Any]]
    filtered_results: List[Dict[str, Any]]
    reranked_results: List[Dict[str, Any]]
    context: str
    response: Optional[str]
    metadata_filters: Optional[Dict[str, Any]]
    document_types: Optional[List[str]]
    n_results: Optional[int]  # 반환할 결과 수
    error: Optional[str]


class RAGWorkflow:
    """RAG 워크플로우 관리자"""
    
    def __init__(
        self,
        vector_store: VectorStore,
        embedding_generator: EmbeddingGenerator,
    ):
        self.vector_store = vector_store
        self.embedding_generator = embedding_generator
        self.graph = self._build_graph()
    
    def _build_graph(self) -> StateGraph:
        """워크플로우 그래프 구성"""
        workflow = StateGraph(GraphState)
        
        # 노드 추가
        workflow.add_node("analyze_query", self._analyze_query_node)
        workflow.add_node("vector_search", self._vector_search_node)
        workflow.add_node("filter_metadata", self._filter_metadata_node)
        workflow.add_node("rerank_results", self._rerank_results_node)
        workflow.add_node("build_context", self._build_context_node)
        
        # 엣지 정의
        workflow.set_entry_point("analyze_query")
        workflow.add_edge("analyze_query", "vector_search")
        workflow.add_edge("vector_search", "filter_metadata")
        workflow.add_edge("filter_metadata", "rerank_results")
        workflow.add_edge("rerank_results", "build_context")
        workflow.add_edge("build_context", END)
        
        return workflow.compile()
    
    def _analyze_query_node(self, state: GraphState) -> GraphState:
        """쿼리 분석 노드"""
        try:
            query = state.get("query", "")
            
            # 쿼리 임베딩 생성 (비동기 메서드를 동기적으로 실행)
            # LangGraph는 동기적으로 실행되므로, 새 이벤트 루프를 생성하여 실행
            try:
                # 이미 실행 중인 루프가 있는지 확인
                loop = asyncio.get_running_loop()
                # 실행 중인 루프가 있으면 새 스레드에서 새 루프 생성
                import concurrent.futures
                def run_in_new_loop():
                    return asyncio.run(self.embedding_generator.embed_text(query))
                with concurrent.futures.ThreadPoolExecutor() as executor:
                    future = executor.submit(run_in_new_loop)
                    query_embedding = future.result()
            except RuntimeError:
                # 이벤트 루프가 없으면 새로 생성
                query_embedding = asyncio.run(
                    self.embedding_generator.embed_text(query)
                )
            
            # 메타데이터 필터 추출 (간단한 키워드 기반 + 사건번호 추출)
            extracted_filters = self._extract_filters(query)
            
            # 외부에서 전달된 필터와 병합 (외부 필터가 우선)
            external_filters = state.get("metadata_filters")
            if external_filters:
                # 외부 필터가 있으면 병합 (외부 필터 우선)
                metadata_filters = {**extracted_filters, **external_filters}
            else:
                metadata_filters = extracted_filters if extracted_filters else None
            
            # 문서 타입 추출
            # 외부에서 전달된 document_types 처리
            external_doc_types = state.get("document_types")
            valid_document_types = {"case", "statute", "procedure", "template", "manual", "faq", "statistics"}
            
            # document_types가 명시적으로 None이면 모든 타입 검색 (타입 추출 안 함)
            if external_doc_types is None:
                document_types = None
                logger.info(f"문서 타입 필터 없음: 모든 타입 검색 (명시적 None)")
            elif external_doc_types:
                # "string"이나 빈 문자열 제거 (Swagger UI 기본값)
                cleaned_doc_types = [dt for dt in external_doc_types if dt and dt != "string"]
                if not cleaned_doc_types:
                    # 유효한 타입이 없으면 모든 타입 검색
                    document_types = None
                    logger.info(f"문서 타입 필터 없음: 모든 타입 검색 (유효한 타입 없음)")
                else:
                    # 유효한 문서 타입만 사용
                    document_types = [dt for dt in cleaned_doc_types if dt in valid_document_types]
                    if not document_types:  # 유효한 타입이 없으면 쿼리에서 추출
                        document_types = self._extract_document_types(query)
                        logger.info(f"문서 타입 필터: {document_types} (쿼리에서 추출)")
                    else:
                        logger.info(f"문서 타입 필터: {document_types} (외부에서 전달)")
            else:
                # 빈 리스트인 경우 쿼리에서 추출
                document_types = self._extract_document_types(query)
                logger.info(f"문서 타입 필터: {document_types} (쿼리에서 추출)")
            
            logger.info(f"최종 문서 타입 필터: {document_types}")
            
            state["query_embedding"] = query_embedding
            state["metadata_filters"] = metadata_filters
            state["document_types"] = document_types
            
            logger.debug(f"쿼리 분석 완료: {query[:50]}...")
            
        except Exception as e:
            logger.error(f"쿼리 분석 실패: {str(e)}")
            state["error"] = f"쿼리 분석 실패: {str(e)}"
        
        return state
    
    def _vector_search_node(self, state: GraphState) -> GraphState:
        """벡터 검색 노드"""
        try:
            query_embedding = state.get("query_embedding")
            if not query_embedding:
                state["error"] = "쿼리 임베딩이 없습니다."
                return state
            
            # 검색 수행 (동기 메서드 직접 호출)
            # 더 많은 결과를 검색하여 다양한 타입 확보
            requested_n_results = state.get("n_results", settings.search_rerank_top_k)
            n_results = max(requested_n_results * 2, 20)  # 최소 20개, 요청한 결과의 2배
            metadata_filters = state.get("metadata_filters", {})
            document_types = state.get("document_types")
            logger.info(f"벡터 검색: 요청 결과 수={requested_n_results}, 실제 검색 수={n_results} (다양한 타입 확보)")
            
            # ChromaDB where 절 구성
            # 사건번호가 있으면 정확한 매칭으로 검색 범위 축소
            # 주의: court_exclude, court_include는 ChromaDB where 절에서 직접 지원하지 않으므로
            # 벡터 검색 후 필터링 단계에서 처리
            where = None
            where_conditions = {}
            
            # document_types 필터를 where 절에 추가
            if document_types:
                # "string"이나 빈 문자열 제거
                cleaned_doc_types = [dt for dt in document_types if dt and dt != "string"]
                if cleaned_doc_types:
                    # 유효한 문서 타입만 필터링
                    valid_document_types = {"case", "statute", "procedure", "template", "manual", "faq", "statistics"}
                    valid_types = [dt for dt in cleaned_doc_types if dt in valid_document_types]
                    if valid_types:
                        if len(valid_types) == 1:
                            # 단일 타입이면 단순 필터
                            where_conditions["type"] = valid_types[0]
                            logger.info(f"벡터 검색에 document_types 필터 적용: {valid_types[0]}")
                        else:
                            # 여러 타입이면 $in 연산자 사용 (ChromaDB 0.4.0+ 지원)
                            # 만약 $in이 작동하지 않으면 벡터 검색 후 필터링으로 폴백
                            where_conditions["type"] = {"$in": valid_types}
                            logger.info(f"벡터 검색에 document_types 필터 적용 (여러 타입): {valid_types}")
            
            if metadata_filters:
                # ChromaDB where 절 형식으로 변환 (단순 형식 사용)
                # 단일 조건: {"case_number": "2005고합694"}
                # 여러 조건: {"$and": [{"case_number": "2005고합694"}, {"category": "형사"}]}
                # 주의: where_conditions는 document_types에서 이미 초기화되었을 수 있으므로 재초기화하지 않음
                article_number_filter = None
                
                for key, value in metadata_filters.items():
                    # court_exclude, court_include는 where 절에서 제외 (나중에 필터링)
                    # sub_category도 벡터 검색 단계에서 제외 (statute 타입 문서는 sub_category가 없을 수 있음)
                    # 필터링 단계에서 처리
                    if value and key not in ("court_exclude", "court_include", "sub_category"):
                        if key == "article_number":
                            # article_number는 별도로 처리
                            article_number_filter = value
                        else:
                            # 기존 where_conditions에 추가 (document_types와 병합)
                            where_conditions[key] = value
                
                # article_number 필터가 있으면 document_id 패턴으로 where 절에 추가
                if article_number_filter:
                    law_name = metadata_filters.get("law_name")
                    if law_name:
                        import re
                        article_num = re.search(r'\d+', str(article_number_filter))
                        if article_num:
                            article_num_str = article_num.group()
                            # document_id 패턴: "statute-형법-101" 또는 "statute-형법-101_chunk_0"
                            # ChromaDB의 $contains 연산자를 사용할 수 없으므로, 벡터 검색 후 필터링에서 처리
                            # 하지만 더 많은 결과를 가져오기 위해 n_results를 늘림
                            n_results = min(n_results * 3, 50)  # 더 많은 결과 가져오기
                            logger.info(f"article_number 필터 '{article_number_filter}' 적용: n_results를 {n_results}로 증가")
                    else:
                        logger.warning(f"article_number 필터가 있지만 law_name이 없어 필터를 무시합니다.")
                
            # where_conditions가 있으면 where 절 구성
            if where_conditions:
                # 단일 조건이면 단순 형식, 여러 조건이면 $and 사용
                if len(where_conditions) == 1:
                    where = where_conditions
                else:
                    # 여러 조건을 $and로 결합
                    and_conditions = [{k: v} for k, v in where_conditions.items()]
                    where = {"$and": and_conditions}
                logger.info(f"ChromaDB where 절: {where}")
            else:
                logger.debug("메타데이터 필터와 document_types 필터가 없어 where 절을 사용하지 않음")
            
            # article_number 필터가 있으면 document_id로 직접 검색 시도
            article_number_filter = metadata_filters.get("article_number") if metadata_filters else None
            if article_number_filter:
                law_name = metadata_filters.get("law_name") if metadata_filters else None
                if law_name:
                    import re
                    article_num = re.search(r'\d+', str(article_number_filter))
                    if article_num:
                        article_num_str = article_num.group()
                        # document_id 패턴으로 직접 검색
                        document_id_pattern = f"{law_name}-{article_num_str}"
                        logger.info(f"article_number 필터로 document_id 패턴 검색: '{document_id_pattern}'")
                        
                        # ChromaDB에서 document_id로 직접 검색
                        # ChromaDB는 $regex를 지원하지 않으므로 모든 문서를 가져온 후 필터링
                        try:
                            # 먼저 law_name으로 필터링
                            direct_results = self.vector_store.collection.get(
                                where={"law_name": law_name},
                                limit=1000  # 충분히 많은 문서 가져오기
                            )
                            
                            # document_id에 article_num_str이 포함된 것만 필터링
                            if direct_results.get('ids'):
                                filtered_ids = []
                                filtered_docs = []
                                filtered_metas = []
                                
                                for i, doc_id in enumerate(direct_results['ids']):
                                    metadata = direct_results['metadatas'][i] if direct_results.get('metadatas') and i < len(direct_results['metadatas']) else {}
                                    document_id = metadata.get('document_id', '')
                                    if article_num_str in document_id:
                                        filtered_ids.append(doc_id)
                                        if direct_results.get('documents') and i < len(direct_results['documents']):
                                            filtered_docs.append(direct_results['documents'][i])
                                        if direct_results.get('metadatas') and i < len(direct_results['metadatas']):
                                            filtered_metas.append(direct_results['metadatas'][i])
                                
                                if filtered_ids:
                                    direct_results = {
                                        'ids': filtered_ids,
                                        'documents': filtered_docs,
                                        'metadatas': filtered_metas
                                    }
                                else:
                                    direct_results = {'ids': [], 'documents': [], 'metadatas': []}
                            else:
                                direct_results = {'ids': [], 'documents': [], 'metadatas': []}
                            
                            if direct_results.get('ids') and len(direct_results['ids']) > 0:
                                # 직접 검색 결과를 벡터 검색 결과 형식으로 변환
                                # 임베딩으로 유사도 계산은 생략하고 거리 0으로 설정
                                results = {
                                    "ids": [direct_results['ids']],
                                    "documents": [direct_results.get('documents', [])],
                                    "metadatas": [direct_results.get('metadatas', [])],
                                    "distances": [[0.0] * len(direct_results['ids'])]  # 직접 검색이므로 거리 0
                                }
                                logger.info(f"document_id 패턴 검색 성공: {len(direct_results['ids'])}개 결과")
                            else:
                                # 직접 검색 실패 시 벡터 검색으로 폴백
                                logger.warning(f"document_id 패턴 검색 실패, 벡터 검색으로 폴백")
                                search_n_results = min(n_results * 3, 50)
                                results = self.vector_store.search(
                                    query_embedding=query_embedding,
                                    n_results=search_n_results,
                                    where=where,
                                )
                        except Exception as e:
                            logger.warning(f"document_id 패턴 검색 중 오류 발생, 벡터 검색으로 폴백: {str(e)}")
                            search_n_results = min(n_results * 3, 50)
                            results = self.vector_store.search(
                                query_embedding=query_embedding,
                                n_results=search_n_results,
                                where=where,
                            )
                    else:
                        # 숫자 추출 실패 시 벡터 검색
                        search_n_results = min(n_results * 3, 50)
                        results = self.vector_store.search(
                            query_embedding=query_embedding,
                            n_results=search_n_results,
                            where=where,
                        )
                else:
                    # law_name이 없으면 벡터 검색
                    search_n_results = min(n_results * 3, 50)
                    results = self.vector_store.search(
                        query_embedding=query_embedding,
                        n_results=search_n_results,
                        where=where,
                    )
            else:
                # article_number 필터가 없으면 일반 벡터 검색
                results = self.vector_store.search(
                    query_embedding=query_embedding,
                    n_results=n_results,
                    where=where,
                )
            
            # 결과 포맷팅
            search_results = []
            if results.get("ids") and len(results["ids"][0]) > 0:
                for i in range(len(results["ids"][0])):
                    search_results.append({
                        "id": results["ids"][0][i],
                        "document": results["documents"][0][i],
                        "metadata": results["metadatas"][0][i] if results.get("metadatas") else {},
                        "distance": results["distances"][0][i] if results.get("distances") else None,
                    })
            
            state["search_results"] = search_results
            logger.info(f"벡터 검색 완료: {len(search_results)}개 결과 (where: {where})")
            
            # 검색 결과가 없을 때 디버깅 정보
            if len(search_results) == 0:
                logger.warning(f"검색 결과가 없습니다. 쿼리: '{query_embedding[:50] if query_embedding else 'None'}...', where: {where}")
                # 벡터 DB 상태 확인
                try:
                    total_docs = self.vector_store.get_count()
                    logger.warning(f"벡터 DB 총 문서 수: {total_docs}개")
                except Exception as e:
                    logger.warning(f"벡터 DB 상태 확인 실패: {str(e)}")
            
        except Exception as e:
            logger.error(f"벡터 검색 실패: {str(e)}")
            state["error"] = f"벡터 검색 실패: {str(e)}"
            state["search_results"] = []
        
        return state
    
    def _filter_metadata_node(self, state: GraphState) -> GraphState:
        """
        메타데이터 필터링 노드
        
        Args:
            state: 워크플로우 상태
            
        Returns:
            필터링된 상태
        """
        try:
            search_results = state.get("search_results", [])
            document_types = state.get("document_types")
            metadata_filters = state.get("metadata_filters", {})
            
            # FilterManager를 사용하여 필터링
            filtered_results = FilterManager.apply_filters(
                results=search_results,
                document_types=document_types,
                metadata_filters=metadata_filters
            )
            
            # 필터링 후 결과가 없을 때 필터 완화
            filtered_results = FilterManager.relax_filters_on_empty(
                filtered_results=filtered_results,
                original_results=search_results,
                metadata_filters=metadata_filters
            )
            
            state["filtered_results"] = filtered_results
            logger.info(f"메타데이터 필터링 완료: {len(search_results)}개 -> {len(filtered_results)}개 결과")
            
        except Exception as e:
            logger.error(f"메타데이터 필터링 실패: {str(e)}")
            state["error"] = f"메타데이터 필터링 실패: {str(e)}"
            state["filtered_results"] = state.get("search_results", [])
        
        return state
    
    def _rerank_results_node(self, state: GraphState) -> GraphState:
        """결과 재랭킹 노드"""
        try:
            filtered_results = state.get("filtered_results", [])
            query = state.get("query", "")
            n_results = state.get("n_results", settings.search_rerank_top_k)
            
            # 거리 기반 정렬 (작을수록 유사)
            reranked = sorted(
                filtered_results,
                key=lambda x: x.get("distance", float("inf"))
            )
            
            # 상위 결과만 선택 (n_results 사용)
            reranked = reranked[:n_results]
            
            state["reranked_results"] = reranked
            logger.info(f"재랭킹 완료: {len(reranked)}개 결과 (요청: {n_results}개)")
            
        except Exception as e:
            logger.error(f"재랭킹 실패: {str(e)}")
            state["error"] = f"재랭킹 실패: {str(e)}"
            n_results = state.get("n_results", settings.search_rerank_top_k)
            state["reranked_results"] = state.get("filtered_results", [])[:n_results]
        
        return state
    
    def _build_context_node(self, state: GraphState) -> GraphState:
        """컨텍스트 구성 노드 - 관련 청크 병합하여 문맥 보강"""
        try:
            reranked_results = state.get("reranked_results", [])
            
            # 같은 document_id를 가진 청크들을 그룹화하여 병합
            from collections import defaultdict
            document_groups = defaultdict(list)
            
            for result in reranked_results:
                metadata = result.get("metadata", {})
                document_id = metadata.get("document_id", "")
                # document_id에서 기본 문서 ID 추출 (chunk 번호 제거)
                # 예: "statute-형법-347_chunk_0" -> "statute-형법-347"
                base_doc_id = document_id.split("_chunk_")[0] if "_chunk_" in document_id else document_id
                document_groups[base_doc_id].append(result)
            
            # 컨텍스트 구성 - 같은 문서의 청크들을 병합
            context_parts = []
            doc_counter = 1
            
            for base_doc_id, chunks in document_groups.items():
                if len(chunks) == 1:
                    # 단일 청크인 경우 기존 방식 유지
                    result = chunks[0]
                    doc_text = result.get("document", "")
                    metadata = result.get("metadata", {})
                    
                    context_parts.append(
                        f"[문서 {doc_counter}]\n"
                        f"제목: {metadata.get('title', 'N/A')}\n"
                        f"타입: {metadata.get('type', 'N/A')}\n"
                        f"내용: {doc_text}\n"
                    )
                else:
                    # 여러 청크가 있는 경우 병합
                    # 거리 기준으로 정렬하여 관련성 높은 순서로 병합
                    sorted_chunks = sorted(chunks, key=lambda x: x.get("distance", float("inf")))
                    
                    # 첫 번째 청크의 메타데이터 사용
                    first_metadata = sorted_chunks[0].get("metadata", {})
                    
                    # 모든 청크의 텍스트를 병합 (중복 제거 및 자연스러운 연결)
                    merged_texts = []
                    seen_texts = set()
                    
                    for chunk in sorted_chunks:
                        chunk_text = chunk.get("document", "").strip()
                        # 중복 제거 (동일한 텍스트가 이미 포함된 경우 제외)
                        if chunk_text and chunk_text not in seen_texts:
                            # 짧은 텍스트(20자 미만)는 제외 (노이즈 제거)
                            if len(chunk_text) >= 20:
                                merged_texts.append(chunk_text)
                                seen_texts.add(chunk_text)
                    
                    # 병합된 텍스트를 자연스럽게 연결
                    merged_content = "\n\n".join(merged_texts)
                    
                    context_parts.append(
                        f"[문서 {doc_counter}]\n"
                        f"제목: {first_metadata.get('title', 'N/A')}\n"
                        f"타입: {first_metadata.get('type', 'N/A')}\n"
                        f"내용: {merged_content}\n"
                    )
                
                doc_counter += 1
            
            context = "\n".join(context_parts)
            state["context"] = context
            
            logger.debug(f"컨텍스트 구성 완료: {len(context)}자, 문서 그룹 수={len(document_groups)}, 총 청크 수={len(reranked_results)}")
            
        except Exception as e:
            logger.error(f"컨텍스트 구성 실패: {str(e)}")
            state["error"] = f"컨텍스트 구성 실패: {str(e)}"
            state["context"] = ""
        
        return state
    
    def _extract_filters(self, query: str) -> Dict[str, Any]:
        """쿼리에서 필터 추출"""
        import re
        filters = {}
        
        # 법률명과 조문번호 패턴 추출 (예: "형법 1조", "형법 제1조", "민법 100조" 등)
        # 패턴 1: "법률명 + (제) + 숫자 + 조"
        law_article_pattern = r'([가-힣]+법)\s*(?:제)?\s*(\d+)\s*조'
        law_article_matches = re.findall(law_article_pattern, query)
        if law_article_matches:
            law_name, article_number = law_article_matches[0]
            filters["law_name"] = law_name
            filters["article_number"] = article_number
            logger.info(f"법률 조문 필터 추출: {law_name} 제{article_number}조 (원본 쿼리: {query[:50]})")
        
        # 간단한 키워드 기반 필터 추출
        if "형사" in query:
            filters["category"] = "형사"
        elif "민사" in query:
            filters["category"] = "민사"
        
        # "사기" 키워드가 있으면 sub_category 필터 추가
        # 단, "특경법", "법률", "법령", "조문" 같은 키워드가 있으면 완화 (statute 타입 문서는 sub_category가 없을 수 있음)
        if "사기" in query:
            # 법령 관련 키워드가 있으면 sub_category 필터를 완화하거나 제외
            if "특경법" in query or "법률" in query or "법령" in query or "조문" in query:
                # 법령 관련 키워드가 있으면 sub_category 필터를 적용하지 않음
                # (statute 타입 문서는 sub_category가 없을 수 있음)
                logger.info(f"법령 관련 키워드 감지: sub_category 필터를 적용하지 않음 (원본 쿼리: {query[:50]})")
            else:
                filters["sub_category"] = "사기"
        
        # 하급심 판례 필터 추출
        if "하급심" in query or "지방법원" in query or "지법" in query or "고등법원" in query or "고법" in query:
            # 하급심 판례만 검색 (대법원 제외)
            filters["court_exclude"] = "대법원"
            logger.info(f"하급심 판례 필터 적용 (원본 쿼리: {query[:50]})")
        
        # 대법원 판례 필터 추출
        if "대법원" in query and "하급심" not in query:
            filters["court_include"] = "대법원"
            logger.info(f"대법원 판례 필터 적용 (원본 쿼리: {query[:50]})")
        
        # 사건번호 패턴 추출 (예: 2005고합694, 2010도2810 등)
        # 패턴: 4자리 숫자 + 한글(1자 이상) + 숫자(1자 이상)
        # 공백을 제거한 후 매칭 시도
        query_no_spaces = query.replace(" ", "").replace("\t", "")
        case_number_pattern = r'(\d{4}[가-힣]+\d+)'
        case_number_matches = re.findall(case_number_pattern, query_no_spaces)
        if case_number_matches:
            # 첫 번째 매칭된 사건번호 사용
            filters["case_number"] = case_number_matches[0]
            logger.info(f"쿼리에서 사건번호 추출: {case_number_matches[0]} (원본 쿼리: {query[:50]})")
        else:
            # 공백이 있는 경우에도 시도 (예: "2005 고합 694")
            case_number_pattern_with_spaces = r'(\d{4})\s*([가-힣]+)\s*(\d+)'
            spaced_matches = re.findall(case_number_pattern_with_spaces, query)
            if spaced_matches:
                # 공백 제거하여 결합
                case_number = ''.join(spaced_matches[0])
                filters["case_number"] = case_number
                logger.info(f"쿼리에서 사건번호 추출 (공백 포함): {case_number} (원본 쿼리: {query[:50]})")
        
        return filters
    
    def _extract_document_types(self, query: str) -> Optional[List[str]]:
        """쿼리에서 문서 타입 추출"""
        types = []
        
        # "제N조" 패턴이 있으면 법령으로 추정
        # "특경법", "법률", "법령", "조문" 등의 키워드도 statute 타입으로 인식
        has_statute_keyword = ("법령" in query or "조문" in query or "법률" in query or 
                               "특경법" in query or "특정경제범죄" in query or 
                               re.search(r'제\s*\d+\s*조', query))
        
        if has_statute_keyword:
            types.append("statute")
        
        # "판례"나 "판결" 키워드가 있으면 case 타입 추가
        if "판례" in query or "판결" in query:
            types.append("case")
        # "특경법"과 범죄 관련 키워드("사기", "절도" 등)가 함께 있으면 비교 설명이 필요하므로 판례도 추가
        elif has_statute_keyword and ("사기" in query or "절도" in query or "배임" in query or 
                                       "횡령" in query or "공갈" in query or "차이" in query or 
                                       "적용" in query or "유무" in query):
            types.append("case")
            logger.info(f"법령과 범죄 키워드가 함께 있어 판례도 검색: {query[:50]}")
        
        if "절차" in query:
            types.append("procedure")
        if "템플릿" in query:
            types.append("template")
        
        return types if types else None
    
    def run(self, query: str, **kwargs) -> Dict[str, Any]:
        """
        워크플로우 실행
        
        Args:
            query: 사용자 쿼리
            **kwargs: 추가 옵션
                - metadata_filters: 메타데이터 필터
                - document_types: 문서 타입 필터
                - n_results: 반환할 결과 수 (기본값: settings.search_rerank_top_k)
            
        Returns:
            실행 결과
        """
        logger.info(f"워크플로우 실행 시작: query='{query}', kwargs={kwargs}")
        
        # n_results 기본값 설정
        n_results = kwargs.get("n_results", settings.search_rerank_top_k)
        
        initial_state: GraphState = {
            "query": query,
            "query_embedding": None,
            "search_results": [],
            "filtered_results": [],
            "reranked_results": [],
            "context": "",
            "response": None,
            "metadata_filters": kwargs.get("metadata_filters"),
            "document_types": kwargs.get("document_types"),
            "n_results": n_results,
            "error": None,
        }
        
        # 추가 옵션 병합
        initial_state.update(kwargs)
        
        # 워크플로우 실행
        try:
            final_state = self.graph.invoke(initial_state)
            
            # 결과 확인 및 로깅
            reranked_results = final_state.get("reranked_results", [])
            error = final_state.get("error")
            
            logger.info(f"워크플로우 실행 완료: 결과 {len(reranked_results)}개, "
                       f"에러: {error if error else 'None'}")
            
            if error:
                logger.error(f"워크플로우 에러: {error}")
            
            if len(reranked_results) == 0 and not error:
                logger.warning(
                    f"검색 결과가 없습니다. "
                    f"query='{query}', "
                    f"document_types={final_state.get('document_types')}, "
                    f"metadata_filters={final_state.get('metadata_filters')}, "
                    f"search_results={len(final_state.get('search_results', []))}개, "
                    f"filtered_results={len(final_state.get('filtered_results', []))}개"
                )
            
            return final_state
        except Exception as e:
            logger.error(f"워크플로우 실행 중 예외 발생: {str(e)}", exc_info=True)
            final_state["error"] = f"워크플로우 실행 실패: {str(e)}"
            final_state["reranked_results"] = []
            return final_state

