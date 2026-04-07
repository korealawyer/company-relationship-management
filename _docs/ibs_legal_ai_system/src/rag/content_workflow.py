"""LangGraph 워크플로우 - 콘텐츠 생성"""

from typing import TypedDict, List, Dict, Any, Optional
from langgraph.graph import StateGraph, END
import logging
import re
from datetime import datetime

from .vector_store import VectorStore
from .embedding import EmbeddingGenerator
from .llm_manager import LLMManager
from .workflow import RAGWorkflow
from .content_templates import BLOG_SECTIONS, REQUIRED_SECTIONS, SECTION_ORDER
from .prompt_loader import get_prompt_loader

logger = logging.getLogger(__name__)


class ContentWorkflowState(TypedDict):
    """콘텐츠 생성 워크플로우 상태"""
    # 입력
    topic: str  # 생성할 콘텐츠 주제/키워드
    content_type: str  # 콘텐츠 타입 (blog, article, opinion, analysis, faq)
    style: Optional[str]  # 작성 스타일
    target_length: Optional[int]  # 목표 글자 수
    include_sections: Optional[List[str]]  # 포함할 섹션
    keywords: Optional[List[str]]  # 포함할 키워드
    document_types: Optional[List[str]]  # 참고할 문서 타입
    
    # 검색 단계
    search_results: List[Dict[str, Any]]  # RAG 검색 결과
    context: str  # 검색된 문서로 구성한 컨텍스트
    summarized_context: Optional[str]  # 요약된 문서 컨텍스트 (문서 요약 단계 후 생성)
    references: List[Dict[str, Any]]  # 참고 문서 목록
    
    # 생성 단계
    prompt: Optional[str]  # 생성된 프롬프트
    draft: Optional[str]  # 생성된 초안
    structured_content: Optional[Dict[str, str]]  # 구조화된 콘텐츠 (섹션별)
    
    # 평가 단계
    structure_score: Optional[float]  # 구조 평가 점수 (0-30)
    content_quality_score: Optional[float]  # 내용 품질 평가 점수 (0-40)
    legal_accuracy_score: Optional[float]  # 법적 정확성 평가 점수 (0-30)
    evaluation_score: Optional[float]  # 총 평가 점수 (0-100)
    evaluation_feedback: List[str]  # 평가 피드백 목록
    
    # 후처리 단계
    metadata: Dict[str, Any]  # 메타데이터 (SEO 제목, 키워드, 카테고리 등)
    reusable_blocks: Dict[str, Any]  # 재사용 블록 (TL;DR, 체크리스트, Q&A 등)
    version: str  # 버전 정보 (YYYYMMDD)
    
    # 제어
    n_references: int  # 참고할 문서 수
    revision_count: int  # 재작성 횟수
    max_revisions: int  # 최대 재시도 횟수
    should_rewrite: bool  # 재작성 필요 여부
    previous_score: Optional[float]  # 이전 평가 점수 (점수 개선 확인용)
    error: Optional[str]  # 오류 메시지


class ContentWorkflow:
    """콘텐츠 생성 워크플로우 관리자"""
    
    def __init__(
        self,
        vector_store: VectorStore,
        embedding_generator: EmbeddingGenerator,
        llm_manager: LLMManager,
    ):
        """
        콘텐츠 생성 워크플로우 초기화
        
        Args:
            vector_store: 벡터 스토어 (문서 검색용)
            embedding_generator: 임베딩 생성기 (검색 쿼리 임베딩용)
            llm_manager: LLM 관리자 (콘텐츠 생성 및 평가용)
        """
        self.vector_store = vector_store
        self.embedding_generator = embedding_generator
        self.llm_manager = llm_manager
        # RAG 워크플로우를 검색에 활용
        self.rag_workflow = RAGWorkflow(vector_store, embedding_generator)
        self.graph = None  # _build_graph()에서 초기화
        # 프롬프트 로더 초기화 (필수 파일 검증 포함)
        try:
            self.prompt_loader = get_prompt_loader()
            logger.info("ContentWorkflow 초기화 완료")
        except FileNotFoundError as e:
            logger.error(f"프롬프트 파일 검증 실패: {str(e)}")
            raise
    
    @staticmethod
    def _get_text_length_without_spaces(text: str) -> int:
        """공백(스페이스, 탭, 줄바꿈 등)을 제외한 텍스트 길이 계산"""
        if not text:
            return 0
        # 모든 공백 문자 제거 (스페이스, 탭, 줄바꿈, 캐리지 리턴 등)
        return len(re.sub(r'\s+', '', text))
    
    def _build_graph(self) -> StateGraph:
        """워크플로우 그래프 구성"""
        workflow = StateGraph(ContentWorkflowState)
        
        # 노드 추가 (인포그래픽 구조에 맞게 통합)
        workflow.add_node("search_documents", self._search_documents_node)
        workflow.add_node("summarize_documents", self._summarize_documents_node)  # 문서 요약 노드 추가
        workflow.add_node("generate_prompt", self._generate_prompt_node)
        workflow.add_node("generate_draft", self._generate_draft_node)
        workflow.add_node("evaluate", self._evaluate_node)  # 통합 평가 노드
        workflow.add_node("comprehensive_evaluate", self._comprehensive_evaluate_node)  # 통합 종합 평가 노드
        workflow.add_node("rewrite_topic", self._rewrite_topic_node)
        workflow.add_node("adjust_prompt", self._adjust_prompt_node)
        workflow.add_node("re_search", self._re_search_node)
        workflow.add_node("finalize_content", self._finalize_content_node)
        workflow.add_node("generate_metadata", self._generate_metadata_node)
        workflow.add_node("extract_reusable_blocks", self._extract_reusable_blocks_node)
        
        # 엣지 정의 (인포그래픽 구조에 맞게)
        workflow.set_entry_point("search_documents")
        workflow.add_edge("search_documents", "summarize_documents")  # 문서 검색 → 문서 요약
        workflow.add_edge("summarize_documents", "generate_prompt")  # 문서 요약 → 프롬프트 생성
        workflow.add_edge("generate_prompt", "generate_draft")
        workflow.add_edge("generate_draft", "evaluate")  # 답변 생성 → 평가자
        
        # 평가자에서 조건부 분기 (인포그래픽 구조: 평가자 → 프롬프트 작성, 평가자 → 문서 검색, 평가자 → 종합 평가)
        workflow.add_conditional_edges(
            "evaluate",
            self._evaluate_decision,
            {
                "to_prompt": "generate_prompt",  # 프롬프트 작성으로 (경미한 문제)
                "to_search": "search_documents",  # 문서 검색으로 (심각한 문제)
                "to_comprehensive": "comprehensive_evaluate",  # 종합 평가로 (정상)
            }
        )
        
        # 종합 평가자에서 조건부 분기
        workflow.add_conditional_edges(
            "comprehensive_evaluate",
            self._should_rewrite,
            {
                "pass": "finalize_content",
                "rewrite": "rewrite_topic",
                "max_revisions": "finalize_content",
            }
        )
        
        # 재작성 루프 (질문 재작성 → 프롬프트 조정 → 재검색 → 프롬프트 작성)
        workflow.add_edge("rewrite_topic", "adjust_prompt")
        workflow.add_edge("adjust_prompt", "re_search")
        workflow.add_edge("re_search", "generate_prompt")
        
        # 최종 처리
        workflow.add_edge("finalize_content", "generate_metadata")
        workflow.add_edge("generate_metadata", "extract_reusable_blocks")
        workflow.add_edge("extract_reusable_blocks", END)
        
        # 재귀 제한 설정 (기본값 25, 재작성 루프를 고려하여 증가)
        # 재작성 루프: rewrite_topic -> adjust_prompt -> re_search -> generate_prompt -> generate_draft -> ... -> check_threshold
        # 각 재작성마다 약 10개 노드를 거치므로, max_revisions=3일 때 최대 30개 노드 필요
        # 안전을 위해 50으로 설정
        compiled = workflow.compile()
        return compiled
    
    def _evaluate_decision(self, state: ContentWorkflowState) -> str:
        """평가 노드에서의 분기 결정 (인포그래픽 구조: 평가자 → 프롬프트/검색/종합평가)"""
        evaluation_feedback = state.get("evaluation_feedback", [])
        critical_issues = [fb for fb in evaluation_feedback if any(keyword in fb.lower() for keyword in ["심각", "critical", "거부", "절대"])]
        
        # 심각한 문제가 있으면 문서 검색으로 돌아감
        if critical_issues:
            logger.warning(f"심각한 문제 발견, 문서 검색으로 복귀: {critical_issues[:2]}")
            return "to_search"
        
        # 경미한 문제가 있으면 프롬프트 작성으로 돌아감
        if evaluation_feedback and len(evaluation_feedback) > 0:
            # 프롬프트 관련 문제인 경우
            prompt_related = any(keyword in " ".join(evaluation_feedback).lower() for keyword in ["프롬프트", "지시", "요구사항"])
            if prompt_related:
                logger.info("프롬프트 관련 문제 발견, 프롬프트 작성으로 복귀")
                return "to_prompt"
        
        # 정상이면 종합 평가로 진행
        return "to_comprehensive"
    
    def _should_rewrite(self, state: ContentWorkflowState) -> str:
        """재작성 필요 여부 판단 (종합 평가자에서)"""
        revision_count = state.get("revision_count", 0)
        max_revisions = state.get("max_revisions", 3)
        
        # 최대 재시도 횟수 체크 (먼저 체크하여 무한 루프 방지)
        if revision_count >= max_revisions:
            logger.warning(f"최대 재시도 횟수 도달: {revision_count} >= {max_revisions}, 재작성 중단")
            return "max_revisions"
        
        # 재작성 필요 여부 체크
        if state.get("should_rewrite", False):
            logger.info(f"재작성 진행: 재시도={revision_count + 1}/{max_revisions}")
            return "rewrite"
        
        return "pass"
    
    # 노드 구현
    def _search_documents_node(self, state: ContentWorkflowState) -> ContentWorkflowState:
        """문서 검색 노드 - RAG 검색 수행 및 결과를 state에 저장"""
        try:
            topic = state.get("topic", "")
            document_types = state.get("document_types")
            n_references = state.get("n_references", 5)
            
            logger.info(f"문서 검색 시작: 주제='{topic}', 문서 타입={document_types}, 참고 문서 수={n_references}")
            
            # document_types에서 "string" 제거 (Swagger UI 기본값)
            if document_types:
                document_types = [dt for dt in document_types if dt and dt != "string"]
                if not document_types:
                    document_types = None
            
            # document_types가 None이면 주제를 분석하여 자동으로 타입 추출
            if document_types is None:
                import re
                topic_lower = topic.lower()
                
                # 법령 관련 키워드 확인
                has_statute_keyword = any(kw in topic_lower for kw in ["법령", "조문", "법률", "특경법", "특정경제범죄"]) or \
                                     re.search(r'제\s*\d+\s*조', topic)
                
                # 판례 관련 키워드 확인
                has_case_keyword = any(kw in topic_lower for kw in ["판례", "판결", "사건", "재판"])
                
                # 범죄 관련 키워드 확인 (차이, 비교, 적용 등과 함께 있으면 판례도 필요)
                has_crime_keyword = any(kw in topic_lower for kw in ["사기", "절도", "배임", "횡령", "공갈"])
                has_comparison_keyword = any(kw in topic_lower for kw in ["차이", "비교", "구분", "적용", "유무"])
                
                # 타입 자동 추출
                auto_types = []
                
                # 법령 관련 키워드
                if has_statute_keyword:
                    auto_types.append("statute")
                
                # 판례 관련 키워드
                if has_case_keyword or (has_statute_keyword and (has_crime_keyword or has_comparison_keyword)):
                    auto_types.append("case")
                
                # 절차/실무 관련 키워드
                has_procedure_keyword = any(kw in topic_lower for kw in ["절차", "신청", "제출", "처리", "진행", "수속", "절차서"])
                if has_procedure_keyword:
                    auto_types.append("procedure")
                
                # 매뉴얼/가이드 관련 키워드
                has_manual_keyword = any(kw in topic_lower for kw in ["매뉴얼", "가이드", "안내", "방법", "절차서", "실무"])
                if has_manual_keyword:
                    auto_types.append("manual")
                
                # FAQ 관련 키워드
                has_faq_keyword = any(kw in topic_lower for kw in ["질문", "답변", "faq", "궁금", "묻", "물어"])
                if has_faq_keyword:
                    auto_types.append("faq")
                
                # 통계 관련 키워드
                has_statistics_keyword = any(kw in topic_lower for kw in ["통계", "데이터", "수치", "비율", "현황", "분석"])
                if has_statistics_keyword:
                    auto_types.append("statistics")
                
                # 템플릿 관련 키워드
                has_template_keyword = any(kw in topic_lower for kw in ["템플릿", "양식", "서식", "서류", "문서"])
                if has_template_keyword:
                    auto_types.append("template")
                
                # 타입이 추출되었으면 우선 타입으로 설정, 없으면 None (모든 타입 검색)
                if auto_types:
                    # 중복 제거 및 정렬
                    auto_types = sorted(list(set(auto_types)))
                    document_types = auto_types
                    logger.info(f"주제 분석으로 문서 타입 자동 추출 (우선 타입): {document_types} (주제: {topic[:50]})")
                    logger.info(f"다른 문서 타입(procedure, template, manual, faq, statistics)도 함께 검색됩니다.")
                else:
                    logger.info(f"문서 타입 필터 없음: 모든 타입 검색 (주제: {topic[:50]})")
            
            # RAG 워크플로우를 사용하여 검색
            # 법령 우선 검색: 주제에 법령 관련 키워드가 있으면 법령을 우선 검색
            search_n_results = max(n_references * 3, 20)  # 최소 20개, n_references의 3배
            logger.info(f"문서 검색 시작: 주제={topic[:50]}, 요청 결과 수={search_n_results}")
            
            # 주제 분석: 법령 우선 검색 필요 여부 확인
            topic_lower = topic.lower()
            has_statute_keyword = any(kw in topic_lower for kw in ["법령", "조문", "법률", "특경법", "특정경제범죄"]) or \
                                 re.search(r'제\s*\d+\s*조', topic)
            
            # 1. 법령 우선 검색 (법령 관련 키워드가 있는 경우)
            statute_results = []
            if has_statute_keyword:
                logger.info(f"법령 우선 검색 수행: 주제에 법령 관련 키워드 감지")
                statute_search = self.rag_workflow.run(
                    query=topic,
                    metadata_filters=None,
                    document_types=["statute"],  # 법령만 검색
                    n_results=max(5, n_references // 2),  # 법령을 충분히 확보
                )
                statute_results = statute_search.get("reranked_results", [])
                logger.info(f"법령 검색 결과: {len(statute_results)}개")
            
            # 2. 전체 검색 (모든 타입)
            search_result = self.rag_workflow.run(
                query=topic,
                metadata_filters=None,
                document_types=None,  # 항상 모든 타입 검색
                n_results=search_n_results,  # 더 많은 결과 검색하여 다양한 타입 확보
            )
            
            # 2. 각 타입별로 별도 검색하여 균등하게 확보
            all_document_types = ["case", "statute", "procedure", "template", "manual", "faq", "statistics"]
            type_specific_results = {}
            
            for doc_type in all_document_types:
                type_search = self.rag_workflow.run(
                    query=topic,
                    metadata_filters=None,
                    document_types=[doc_type],
                    n_results=max(3, n_references // len(all_document_types) + 2),  # 타입당 최소 3개
                )
                type_results = type_search.get("reranked_results", [])
                if type_results:
                    type_specific_results[doc_type] = type_results
                    logger.info(f"'{doc_type}' 타입 별도 검색: {len(type_results)}개 발견")
            
            # 3. 전체 검색 결과와 타입별 검색 결과 병합 (법령 우선 결과 포함)
            all_results = search_result.get("reranked_results", [])
            existing_ids = {r.get("id") for r in all_results}
            
            # 법령 우선 검색 결과 추가 (중복 제거)
            for result in statute_results:
                if result.get("id") not in existing_ids:
                    all_results.insert(0, result)  # 법령을 앞에 배치
                    existing_ids.add(result.get("id"))
            
            for doc_type, type_results in type_specific_results.items():
                for result in type_results:
                    if result.get("id") not in existing_ids:
                        all_results.append(result)
                        existing_ids.add(result.get("id"))
            
            # distance 기준으로 정렬
            all_results = sorted(
                all_results,
                key=lambda x: x.get("distance", float("inf"))
            )
            
            # 검색 결과 업데이트
            search_result["reranked_results"] = all_results
            logger.info(f"전체 검색 + 타입별 검색 병합 완료: 총 {len(all_results)}개")
            
            # 자동 추출된 타입이 있으면, 검색 결과에서 해당 타입을 우선적으로 선택 (우선순위만)
            priority_types = document_types if document_types else None
            if priority_types:
                logger.info(f"우선 타입 설정: {priority_types} (검색은 모든 타입 포함)")
            
            # 검색 결과 추출
            reranked_results = search_result.get("reranked_results", [])
            context = search_result.get("context", "")
            
            # 검색 결과의 타입 분포 확인 (균등 분배 전)
            if reranked_results:
                initial_types = {}
                for result in reranked_results:
                    doc_type = result.get("metadata", {}).get("type", "unknown")
                    initial_types[doc_type] = initial_types.get(doc_type, 0) + 1
                logger.info(f"검색 결과 타입 분포 (균등 분배 전): {initial_types}, 총 {len(reranked_results)}개")
            
            # 모든 타입을 균등하게 분배
            # 1. 타입별로 그룹화
            results_by_type = {}
            for result in reranked_results:
                doc_type = result.get("metadata", {}).get("type", "unknown")
                if doc_type not in results_by_type:
                    results_by_type[doc_type] = []
                results_by_type[doc_type].append(result)
            
            # 2. 각 타입별로 distance 기준 정렬
            for doc_type in results_by_type:
                results_by_type[doc_type] = sorted(
                    results_by_type[doc_type],
                    key=lambda x: x.get("distance", float("inf"))
                )
            
            # 3. 타입별로 균등 분배 (모든 타입을 균등하게 포함)
            all_types = list(results_by_type.keys())
            if all_types:
                logger.info(f"검색된 모든 타입: {all_types}, 각 타입별 결과 수: {[len(results_by_type[t]) for t in all_types]}")
                
                # 각 타입당 최소 1개씩은 포함, 나머지는 균등 분배
                per_type_min = 1
                per_type_max = max(1, n_references // len(all_types) + 1)  # 타입당 최대 개수
                
                # 판례(case) 타입은 최대 2개로 제한
                MAX_CASE_LIMIT = 2
                
                balanced_results = []
                type_counts = {t: 0 for t in all_types}
                
                # 라운드 로빈 방식으로 각 타입에서 순차적으로 선택
                round_robin_index = 0
                while len(balanced_results) < n_references:
                    # 아직 선택 가능한 타입이 있는지 확인 (판례는 2개 제한 고려)
                    available_types = [
                        t for t in all_types 
                        if results_by_type[t] and 
                        (type_counts[t] < (MAX_CASE_LIMIT if t == "case" else per_type_max))
                    ]
                    if not available_types:
                        break
                    
                    # 모든 타입을 한 번씩 순회
                    for doc_type in all_types:
                        if len(balanced_results) >= n_references:
                            break
                        if not results_by_type[doc_type]:
                            continue
                        
                        # 타입당 최대 개수 제한 (판례는 최대 2개)
                        type_max_limit = MAX_CASE_LIMIT if doc_type == "case" else per_type_max
                        if type_counts[doc_type] >= type_max_limit:
                            continue
                        
                        result = results_by_type[doc_type].pop(0)
                        # 중복 체크
                        if result.get("id") not in [r.get("id") for r in balanced_results]:
                            balanced_results.append(result)
                            type_counts[doc_type] += 1
                
                # 남은 슬롯이 있으면 distance 기준으로 추가 (판례는 최대 2개 제한)
                if len(balanced_results) < n_references:
                    remaining = []
                    for doc_type in results_by_type:
                        # 판례 타입은 이미 2개에 도달했으면 제외
                        if doc_type == "case" and type_counts.get("case", 0) >= MAX_CASE_LIMIT:
                            continue
                        remaining.extend(results_by_type[doc_type])
                    remaining = sorted(
                        remaining,
                        key=lambda x: x.get("distance", float("inf"))
                    )
                    for result in remaining:
                        if len(balanced_results) >= n_references:
                            break
                        # 판례 타입 체크
                        result_type = result.get("metadata", {}).get("type", "unknown")
                        if result_type == "case" and type_counts.get("case", 0) >= MAX_CASE_LIMIT:
                            continue
                        if result.get("id") not in [r.get("id") for r in balanced_results]:
                            balanced_results.append(result)
                            type_counts[result_type] = type_counts.get(result_type, 0) + 1
                
                reranked_results = balanced_results
                final_type_distribution = {t: sum(1 for r in reranked_results if r.get("metadata", {}).get("type") == t) for t in all_types}
                logger.info(f"타입별 균등 분배 완료: {len(reranked_results)}개, 타입 분포={final_type_distribution}")
            else:
                # 타입이 없으면 distance 기준으로 제한
                reranked_results = reranked_results[:n_references]
            
            # 검색 결과의 타입 분포 확인
            if reranked_results and priority_types and len(priority_types) > 1:
                result_types = {}
                for result in reranked_results:
                    doc_type = result.get("metadata", {}).get("type", "unknown")
                    result_types[doc_type] = result_types.get(doc_type, 0) + 1
                
                logger.info(f"초기 검색 결과 타입 분포: {result_types}, 우선 타입: {priority_types}")
                
                # 우선 타입 중 하나라도 결과에 없으면 재검색 시도 (하지만 모든 타입 검색)
                missing_types = [dt for dt in priority_types if dt not in result_types or result_types[dt] == 0]
                if missing_types:
                    logger.warning(f"검색 결과에 일부 우선 타입이 없음: 우선 타입={priority_types}, 결과={list(result_types.keys())}, 누락={missing_types}")
                    logger.info(f"누락된 타입을 포함하여 재검색 시도 (모든 타입 검색): {missing_types}")
                    
                    # 누락된 타입을 찾기 위해 모든 타입으로 재검색 (특정 타입만 검색하지 않음)
                    additional_search = self.rag_workflow.run(
                        query=topic,
                        metadata_filters=None,
                        document_types=None,  # 모든 타입 검색
                        n_results=max(5, n_references // len(priority_types) + 2) * len(missing_types),  # 누락된 타입 수만큼 더 검색
                    )
                    additional_results = additional_search.get("reranked_results", [])
                    if additional_results:
                        # 누락된 타입의 결과만 필터링
                        missing_type_results = [r for r in additional_results if r.get("metadata", {}).get("type") in missing_types]
                        logger.info(f"재검색 결과: 전체 {len(additional_results)}개, 누락 타입 {len(missing_type_results)}개 발견")
                        
                        # 기존 결과와 병합 (중복 제거)
                        existing_ids = {r.get("id") for r in reranked_results}
                        added_count = 0
                        for add_result in missing_type_results:
                            if add_result.get("id") not in existing_ids:
                                reranked_results.append(add_result)
                                existing_ids.add(add_result.get("id"))
                                added_count += 1
                                if len(reranked_results) >= n_references * 2:  # 충분한 결과 확보
                                    break
                        logger.info(f"누락 타입 {added_count}개 추가됨. 현재 총 {len(reranked_results)}개")
                    else:
                        logger.warning(f"재검색 결과 없음. 누락된 타입({missing_types}) 문서가 DB에 없을 수 있습니다.")
                    
                    # 재검색 후에도 타입별 균등 분배 적용
                    # 모든 타입을 균등하게 포함하도록 재분배
                    all_types_after_rerank = set(r.get("metadata", {}).get("type", "unknown") for r in reranked_results)
                    if len(all_types_after_rerank) > 1:
                        # 타입별로 그룹화
                        results_by_type = {}
                        for result in reranked_results:
                            doc_type = result.get("metadata", {}).get("type", "unknown")
                            if doc_type not in results_by_type:
                                results_by_type[doc_type] = []
                            results_by_type[doc_type].append(result)
                        
                        # 각 타입별로 distance 기준 정렬
                        for doc_type in results_by_type:
                            results_by_type[doc_type] = sorted(
                                results_by_type[doc_type],
                                key=lambda x: x.get("distance", float("inf"))
                            )
                        
                        # 타입별로 균등 분배 (모든 타입을 균등하게 포함)
                        per_type_max = max(1, n_references // len(all_types_after_rerank) + 1)
                        
                        # 판례(case) 타입은 최대 2개로 제한
                        MAX_CASE_LIMIT = 2
                        
                        balanced_results = []
                        type_counts = {t: 0 for t in all_types_after_rerank}
                        
                        # 라운드 로빈 방식으로 각 타입에서 순차적으로 선택
                        while len(balanced_results) < n_references:
                            # 아직 선택 가능한 타입이 있는지 확인 (판례는 2개 제한 고려)
                            available_types = [
                                t for t in all_types_after_rerank 
                                if results_by_type.get(t) and 
                                (type_counts[t] < (MAX_CASE_LIMIT if t == "case" else per_type_max))
                            ]
                            if not available_types:
                                break
                            
                            for doc_type in all_types_after_rerank:
                                if len(balanced_results) >= n_references:
                                    break
                                if not results_by_type.get(doc_type):
                                    continue
                                # 타입당 최대 개수 제한 (판례는 최대 2개)
                                type_max_limit = MAX_CASE_LIMIT if doc_type == "case" else per_type_max
                                if type_counts[doc_type] >= type_max_limit:
                                    continue
                                
                                result = results_by_type[doc_type].pop(0)
                                # 중복 체크
                                if result.get("id") not in [r.get("id") for r in balanced_results]:
                                    balanced_results.append(result)
                                    type_counts[doc_type] += 1
                        
                        # 남은 슬롯이 있으면 distance 기준으로 추가 (판례는 최대 2개 제한)
                        if len(balanced_results) < n_references:
                            remaining = []
                            for doc_type in results_by_type:
                                # 판례 타입은 이미 2개에 도달했으면 제외
                                if doc_type == "case" and type_counts.get("case", 0) >= MAX_CASE_LIMIT:
                                    continue
                                remaining.extend(results_by_type[doc_type])
                            remaining = sorted(
                                remaining,
                                key=lambda x: x.get("distance", float("inf"))
                            )
                            for result in remaining:
                                if len(balanced_results) >= n_references:
                                    break
                                # 판례 타입 체크
                                result_type = result.get("metadata", {}).get("type", "unknown")
                                if result_type == "case" and type_counts.get("case", 0) >= MAX_CASE_LIMIT:
                                    continue
                                if result.get("id") not in [r.get("id") for r in balanced_results]:
                                    balanced_results.append(result)
                                    type_counts[result_type] = type_counts.get(result_type, 0) + 1
                        
                        reranked_results = balanced_results
                        # 타입 분포 계산 (모든 타입 포함)
                        final_type_distribution = {t: sum(1 for r in reranked_results if r.get('metadata', {}).get('type') == t) for t in all_types_after_rerank}
                        logger.info(f"재검색 후 타입별 균등 분배 완료: {len(reranked_results)}개, 타입 분포={final_type_distribution}")
                    else:
                        # 단일 타입이면 distance 기준 정렬
                        reranked_results = sorted(
                            reranked_results,
                            key=lambda x: x.get("distance", float("inf"))
                        )[:n_references]
                    
                    # 컨텍스트 재구성
                    context_parts = []
                    for i, result in enumerate(reranked_results, 1):
                        doc_text = result.get("document", "")
                        metadata = result.get("metadata", {})
                        context_parts.append(
                            f"[문서 {i}]\n"
                            f"제목: {metadata.get('title', 'N/A')}\n"
                            f"타입: {metadata.get('type', 'N/A')}\n"
                            f"내용: {doc_text}\n"
                        )
                    context = "\n".join(context_parts)
                    
                    # 재검색 후 타입 분포 재계산
                    final_result_types = {}
                    for result in reranked_results:
                        doc_type = result.get("metadata", {}).get("type", "unknown")
                        final_result_types[doc_type] = final_result_types.get(doc_type, 0) + 1
                    logger.info(f"재검색 후 결과: 총 {len(reranked_results)}개, 타입 분포={final_result_types}")
            
            # 컨텍스트가 비어있으면 경고
            if not context or len(context.strip()) == 0:
                logger.warning(f"검색 결과가 없거나 컨텍스트가 비어있습니다. 주제='{topic}', 문서 타입={document_types}")
                if reranked_results:
                    logger.warning(f"검색 결과는 {len(reranked_results)}개 있지만 컨텍스트가 비어있습니다.")
                else:
                    logger.warning("검색 결과가 없습니다. 모든 타입으로 재검색을 시도합니다.")
                    # 모든 타입으로 재검색 시도
                    search_result = self.rag_workflow.run(
                        query=topic,
                        metadata_filters=None,
                        document_types=None,  # 모든 타입 검색
                        n_results=n_references * 2,
                    )
                    reranked_results = search_result.get("reranked_results", [])[:n_references]
                    context = search_result.get("context", "")
            
            # 참고 문서 정보 정리
            import re
            references = []
            for result in reranked_results:
                metadata = result.get("metadata", {})
                doc_id = result.get("id", "")
                doc_type = metadata.get("type", "")
                title = metadata.get("title", "")
                document = result.get("document", "")
                
                # article_number 추출 (개선된 로직: 우선순위 1. 메타데이터 2. 제목 3. 문서 내용 4. document_id)
                article_number = None
                if doc_type == "statute":
                    # 1. 메타데이터에서 직접 추출 (우선)
                    article_number = metadata.get("article_number")
                    if article_number:
                        article_number = str(article_number).strip()
                        # "제347조" 형식이면 숫자만 추출
                        num_match = re.search(r'(\d+)', str(article_number))
                        if num_match:
                            article_number = num_match.group(1)
                    
                    # 2. 제목에서 추출: "형법 제347조" 또는 "제347조"
                    if not article_number:
                        title_pattern = r'제\s*(\d+)\s*조'
                        title_match = re.search(title_pattern, title)
                        if title_match:
                            article_number = title_match.group(1)
                            logger.debug(f"제목에서 article_number 추출: {title} -> {article_number}")
                    
                    # 3. 문서 내용에서 추출 (처음 500자만 검색)
                    if not article_number and document:
                        doc_pattern = r'제\s*(\d+)\s*조'
                        doc_match = re.search(doc_pattern, document[:500])
                        if doc_match:
                            article_number = doc_match.group(1)
                            logger.debug(f"문서 내용에서 article_number 추출: {doc_id} -> {article_number}")
                    
                    # 4. document_id에서 추출 (마지막 수단, 신뢰도 낮음)
                    if not article_number:
                        doc_id_match = re.search(r'-(\d+)(?:_chunk_|$)', doc_id)
                        if doc_id_match:
                            article_number = doc_id_match.group(1)
                            logger.warning(f"document_id에서 article_number 추출 (신뢰도 낮음): {doc_id} -> {article_number}")
                
                # case_number 추출 (metadata 또는 document_id에서)
                case_number = metadata.get("case_number")
                if not case_number and doc_type == "case":
                    # document_id에서 추출 시도: "case-2019고합980" 또는 "case-2019고합980_chunk_0"
                    case_match = re.search(r'case-(\d{4}[도나가다라마바사아자차카타노]\d+)', doc_id)
                    if case_match:
                        case_number = case_match.group(1)
                        logger.debug(f"document_id에서 case_number 추출: {doc_id} -> {case_number}")
                
                logger.debug(f"참고 문서 정보: type={doc_type}, article_number={article_number}, case_number={case_number}, doc_id={doc_id}")
                
                references.append({
                    "id": doc_id,
                    "title": metadata.get("title", "N/A"),
                    "type": doc_type,
                    "court": metadata.get("court", None),
                    "case_number": case_number,
                    "law_name": metadata.get("law_name", None),
                    "article_number": article_number,
                    "relevance": 1 - result.get("distance", 1) if result.get("distance") else None,
                })
            
            # 상태 업데이트
            state["search_results"] = reranked_results
            state["context"] = context
            state["references"] = references
            
            logger.info(f"문서 검색 완료: {len(reranked_results)}개 결과, 컨텍스트 길이={len(context)}자")
            
        except Exception as e:
            logger.error(f"문서 검색 실패: {str(e)}")
            state["error"] = f"문서 검색 실패: {str(e)}"
            state["search_results"] = []
            state["context"] = ""
            state["references"] = []
        
        return state
    
    def _summarize_documents_node(self, state: ContentWorkflowState) -> ContentWorkflowState:
        """문서 요약 노드 - 검색된 문서를 GPT를 통해 핵심만 왜곡 없이 요약 (무조건 실행)"""
        logger.info("문서 요약 노드 실행 시작 (무조건 실행)")
        try:
            context = state.get("context", "")
            topic = state.get("topic", "")
            references = state.get("references", [])
            
            logger.debug(f"요약 노드 상태 확인: context 길이={len(context) if context else 0}, topic={topic[:50] if topic else 'None'}...")
            
            # 컨텍스트가 비어있으면 요약 생략
            if not context or len(context.strip()) == 0:
                logger.warning("컨텍스트가 비어있어 문서 요약을 생략합니다.")
                state["summarized_context"] = None
                return state
            
            # 무조건 요약 실행 (임계값 체크 제거)
            context_length = len(context)
            target_length = state.get("target_length")
            
            # 목표 길이에 따른 최소 요약 길이 계산
            # 원본의 30% 이상, 최소 2000자 (초안 작성에 충분한 정보 제공)
            # 초안이 1000자를 넘기지 못하는 문제 해결을 위해 더 충실한 요약 필요
            min_summary_length = max(int(context_length * 0.3), 2000)
            if target_length:
                # 목표 길이가 있으면 그에 맞춰 요약 길이 조정
                # 목표 길이의 2.5배 정도의 컨텍스트가 필요하다고 가정 (더 충실한 정보 제공)
                ideal_summary_length = max(int(target_length * 2.5), min_summary_length)
                min_summary_length = min(ideal_summary_length, int(context_length * 0.7))  # 최대 원본의 70%
            else:
                # 목표 길이가 없어도 초안 작성에 충분한 정보 제공을 위해 최소 2500자 보장
                min_summary_length = max(min_summary_length, 2500)
            
            logger.info(f"문서 요약 시작: 주제='{topic[:50]}...', 컨텍스트 길이={context_length}자, 최소 요약 목표={min_summary_length}자")
            
            # 요약 프롬프트 템플릿 로드
            try:
                summarization_template = self.prompt_loader.load_template("summarization_prompt.txt", required=True)
            except FileNotFoundError:
                logger.warning("summarization_prompt.txt 파일을 찾을 수 없어 기본 요약 프롬프트를 사용합니다.")
                summarization_template = """아래 검색된 법률 문서들을 주제 "{TOPIC}"에 맞게 핵심만 요약해주세요.

요약 원칙:
1. 왜곡 없이 정확히 요약
2. 법령 조문 번호, 판례 번호는 반드시 포함
3. 법정형, 구성요건 등 핵심 법률 정보는 누락하지 않음
4. 참고 문서의 내용만 요약, 추가 해석 금지
5. 각 문서의 핵심 내용을 간결하게 정리

검색된 문서:
{CONTEXT}
"""
            
            # 프롬프트 생성 (최소 길이 요구사항 추가)
            summarization_prompt = summarization_template.replace("{TOPIC}", topic).replace("{CONTEXT}", context)
            summarization_prompt += f"""

## 🚨 절대 필수 요구사항 (최우선) 🚨

### 1. 요약 길이 (절대 준수)
- **요약 길이는 반드시 {min_summary_length}자 이상이어야 합니다.**
- 이 요약본을 바탕으로 **최소 1000자 이상의 상세한 원고를 작성**할 수 있도록 충분한 정보를 제공해야 합니다.
- 요약이 짧으면 초안 작성 시 정보 부족으로 원고가 1000자를 넘기지 못합니다.

### 2. 정보 충실도 (초안 작성 지원)
- 주제 "{topic}"와 관련된 **모든 핵심 정보**를 포함해야 합니다.
- 법령 조문 번호, 판례 번호, 법정형, 구성요건, 사실관계, 판결 요지 등을 **상세히** 포함하세요.
- 각 문서의 핵심 내용을 **충실하게** 요약하되, 초안 작성 시 확장할 수 있도록 **구체적인 정보**를 포함하세요.
- 예시, 사례, 구체적인 숫자(기한, 금액, 형량 등)를 반드시 포함하세요.

### 3. 확장 가능성
- 이 요약본을 읽고 **각 내용을 3배 이상 확장**하여 상세한 원고를 작성할 수 있도록 충분한 정보를 제공하세요.
- 법령 조문의 경우: 구성요건을 각각 상세히 설명할 수 있도록 충분한 정보 포함
- 판례의 경우: 사실관계를 단계별로 설명할 수 있도록 충분한 정보 포함
- 개념의 경우: 예시와 함께 구체적으로 설명할 수 있도록 충분한 정보 포함

### 4. 정보 보존
- 법령 조문 번호, 판례 번호는 **반드시 정확히** 포함하세요.
- 법정형(징역, 벌금 등)과 범위를 **구체적으로** 포함하세요.
- 구성요건을 **상세히** 포함하세요.
- 예외 사항이나 단서 조항도 **반드시** 포함하세요.
"""
            
            # 시스템 프롬프트 (요약 전용, 강화)
            system_prompt = f"""당신은 법률 문서 요약 전문가입니다. 검색된 법률 문서들을 주제에 맞게 핵심을 정확하고 충실하게 요약하는 것이 목표입니다.

**절대 원칙 (최우선)**:
1. **요약 길이는 반드시 {min_summary_length}자 이상**이어야 합니다. 이는 절대 필수입니다.
2. 이 요약본을 바탕으로 **최소 1000자 이상의 상세한 원고를 작성**할 수 있도록 충분한 정보를 제공해야 합니다.
3. 왜곡 없이 정확히 요약하되, **초안 작성 시 확장할 수 있도록 구체적이고 상세한 정보**를 포함하세요.

**핵심 원칙**:
- 법령 조문 번호, 판례 번호는 반드시 정확히 포함
- 법정형, 구성요건, 사실관계, 판결 요지를 상세히 포함
- 예시, 사례, 구체적인 숫자(기한, 금액, 형량 등)를 반드시 포함
- 참고 문서의 내용만 요약, 추가 해석 금지
- 각 내용을 3배 이상 확장하여 상세한 원고를 작성할 수 있도록 충분한 정보 제공

**요약 품질 기준**:
- 요약본을 읽고 각 내용을 상세하게 확장할 수 있어야 함
- 법령 조문의 구성요건을 각각 상세히 설명할 수 있어야 함
- 판례의 사실관계를 단계별로 설명할 수 있어야 함
- 개념을 예시와 함께 구체적으로 설명할 수 있어야 함"""
            
            # 요약은 gpt-3.5-turbo 사용 (비용 절감, 요약에는 충분)
            # LLMManager의 기본 모델을 임시로 변경하거나, 별도 인스턴스 사용
            # 여기서는 기존 LLMManager를 사용하되, 요약 전용 설정 고려
            original_model = self.llm_manager.model_name
            original_temperature = self.llm_manager.temperature
            
            try:
                # 요약에는 더 낮은 temperature 사용 (정확성 중시)
                self.llm_manager.temperature = 0.3
                # 모델은 그대로 사용 (gpt-4-turbo-preview 또는 설정된 모델)
                # 필요시 gpt-3.5-turbo로 변경 가능하지만, 일단 기존 모델 사용
                
                # LLM 인스턴스 재초기화 (temperature 변경 반영)
                self.llm_manager._initialize()
                
                # 요약 수행
                summarized_context = self.llm_manager.generate_response(
                    context="",  # 요약 프롬프트에 이미 context 포함
                    query=summarization_prompt,
                    system_prompt=system_prompt,
                    document_types=None,
                )
                
                # 요약 결과 검증 및 재요약 (필요시)
                if not summarized_context or len(summarized_context.strip()) == 0:
                    logger.warning("문서 요약 결과가 비어있습니다. 원본 컨텍스트를 사용합니다.")
                    state["summarized_context"] = None
                else:
                    summary_length = len(summarized_context)
                    
                    # 요약이 너무 짧으면 재요약 시도
                    if summary_length < min_summary_length:
                        logger.warning(
                            f"요약 결과가 최소 길이({min_summary_length}자)보다 짧습니다. "
                            f"현재: {summary_length}자. 재요약을 시도합니다."
                        )
                        
                        # 재요약 프롬프트 (더 명확한 지시)
                        retry_prompt = f"""이전 요약이 너무 짧았습니다. 아래 검색된 법률 문서들을 주제 "{topic}"에 맞게 더 상세하고 충실하게 요약해주세요.

이전 요약 (참고용):
{summarized_context[:500]}...

원본 문서:
{context[:5000]}... (전체 {len(context)}자)

## 🚨 재요약 절대 필수 요구사항 🚨

### 1. 요약 길이 (절대 준수)
- **요약 길이는 반드시 {min_summary_length}자 이상이어야 합니다.**
- 이전 요약이 너무 짧았으므로, 이번에는 **더 상세하고 충실하게** 요약하세요.
- 이 요약본을 바탕으로 **최소 1000자 이상의 상세한 원고를 작성**할 수 있도록 충분한 정보를 제공해야 합니다.

### 2. 정보 충실도 강화
- 주제와 관련된 **모든 핵심 정보**를 빠짐없이 포함하세요.
- 법령 조문 번호, 판례 번호, 법정형, 구성요건, 사실관계, 판결 요지를 **상세히** 포함하세요.
- 예시, 사례, 구체적인 숫자(기한, 금액, 형량 등)를 **반드시** 포함하세요.
- 각 문서의 핵심 내용을 **충실하게** 요약하되, 초안 작성 시 확장할 수 있도록 **구체적인 정보**를 포함하세요.

### 3. 확장 가능성 보장
- 이 요약본을 읽고 **각 내용을 3배 이상 확장**하여 상세한 원고를 작성할 수 있도록 충분한 정보를 제공하세요.
- 법령 조문의 경우: 구성요건을 각각 상세히 설명할 수 있도록 충분한 정보 포함
- 판례의 경우: 사실관계를 단계별로 설명할 수 있도록 충분한 정보 포함
- 개념의 경우: 예시와 함께 구체적으로 설명할 수 있도록 충분한 정보 포함

### 4. 원본 문서 활용
- 원본 문서의 내용을 **충실히** 반영하세요.
- 불필요한 반복은 제거하되, **핵심 정보는 누락하지 마세요**.
- 원본 문서의 구체적인 내용을 **상세히** 포함하세요.
"""
                        
                        try:
                            retry_summary = self.llm_manager.generate_response(
                                context="",
                                query=retry_prompt,
                                system_prompt=system_prompt,
                                document_types=None,
                            )
                            
                            if retry_summary and len(retry_summary) >= min_summary_length:
                                summarized_context = retry_summary
                                logger.info(f"재요약 성공: {len(retry_summary)}자")
                            else:
                                logger.warning(f"재요약도 최소 길이를 만족하지 못했습니다. 기존 요약 사용: {len(retry_summary) if retry_summary else 0}자")
                        except Exception as retry_e:
                            logger.error(f"재요약 중 오류 발생: {str(retry_e)}. 기존 요약 사용")
                    
                    # 최종 검증
                    if len(summarized_context) < min_summary_length * 0.8:  # 최소 길이의 80% 미만이면 경고
                        logger.warning(
                            f"요약 결과가 권장 최소 길이({min_summary_length}자)의 80% 미만입니다. "
                            f"현재: {len(summarized_context)}자. 초안 작성에 정보가 부족할 수 있습니다."
                        )
                    
                    state["summarized_context"] = summarized_context
                    logger.info(
                        f"문서 요약 완료: 원본 {context_length}자 → 요약 {len(summarized_context)}자 "
                        f"({(1 - len(summarized_context)/context_length)*100:.1f}% 감소, "
                        f"최소 목표: {min_summary_length}자)"
                    )
                    
            except Exception as e:
                logger.error(f"문서 요약 중 오류 발생: {str(e)}. 원본 컨텍스트를 사용합니다.")
                state["summarized_context"] = None
            finally:
                # 원래 설정으로 복원
                self.llm_manager.temperature = original_temperature
                self.llm_manager._initialize()
            
        except Exception as e:
            logger.error(f"문서 요약 실패: {str(e)}. 원본 컨텍스트를 사용합니다.")
            state["summarized_context"] = None
        
        return state
    
    def _generate_prompt_node(self, state: ContentWorkflowState) -> ContentWorkflowState:
        """프롬프트 생성 노드 - 구조화된 블로그 템플릿 기반 프롬프트 생성"""
        try:
            topic = state.get("topic", "")
            content_type = state.get("content_type", "blog")
            style = state.get("style")
            target_length = state.get("target_length")
            include_sections = state.get("include_sections", [])
            keywords = state.get("keywords", [])
            context = state.get("context", "")
            revision_count = state.get("revision_count", 0)
            
            # Swagger UI 기본값 "string" 필터링
            if include_sections:
                include_sections = [s for s in include_sections if s and s != "string"]
                if not include_sections:
                    include_sections = []
            
            if keywords:
                keywords = [k for k in keywords if k and k != "string"]
                if not keywords:
                    keywords = []
            
            if style == "string":
                style = None
            
            logger.info(f"프롬프트 생성 시작: 타입={content_type}, 주제='{topic[:50]}...', 재작성 횟수={revision_count}")
            
            # summarized_context가 있으면 우선 사용, 없으면 원본 context 사용
            summarized_context = state.get("summarized_context")
            if summarized_context:
                logger.info(f"요약된 컨텍스트 사용: 원본 {len(context)}자 → 요약 {len(summarized_context)}자")
                context = summarized_context
            else:
                logger.info(f"원본 컨텍스트 사용: {len(context)}자")
            
            # 블로그 타입인 경우 구조화된 템플릿 사용
            if content_type == "blog":
                references = state.get("references", [])
                prompt = self._build_structured_blog_prompt(
                    topic=topic,
                    context=context,
                    references=references,
                    style=style,
                    target_length=target_length,
                    include_sections=include_sections,
                    keywords=keywords,
                    revision_count=revision_count,  # 재작성 횟수 전달
                )
            else:
                # 다른 타입은 기본 프롬프트 사용
                prompt = self._build_basic_prompt(
                    topic=topic,
                    context=context,
                    content_type=content_type,
                    style=style,
                    target_length=target_length,
                )
            
            state["prompt"] = prompt
            logger.info(f"프롬프트 생성 완료: 길이={len(prompt)}자")
            
        except Exception as e:
            logger.error(f"프롬프트 생성 실패: {str(e)}")
            state["error"] = f"프롬프트 생성 실패: {str(e)}"
        
        return state
    
    def _select_content_style(
        self,
        references: List[Dict[str, Any]],
        topic: str,
    ) -> Dict[str, str]:
        """참고 문서와 주제를 바탕으로 콘텐츠 작성 형식을 랜덤 선택"""
        import random
        
        # 참고 문서 타입 분석
        has_case = any(ref.get("type") == "case" for ref in references)
        has_statute = any(ref.get("type") == "statute" for ref in references)
        
        # 주제 키워드 분석
        topic_lower = topic.lower()
        has_comparison_keyword = any(kw in topic_lower for kw in ["차이", "비교", "구분", "적용", "유무"])
        has_question_keyword = any(kw in topic_lower for kw in ["질문", "궁금", "묻", "물어"])
        has_example_keyword = any(kw in topic_lower for kw in ["예시", "사례", "상황"])
        
        # 콘텐츠 형식 정의
        content_styles = []
        
        # 1. 서술형 (기본)
        content_styles.append({
            "name": "서술형",
            "description": "법령 조문과 개념을 논리적으로 서술하는 형식입니다.",
            "guidance": """
- 법령 조문의 의미를 논리적으로 설명하세요.
- 개념 간 관계를 명확히 제시하세요.
- "~에 따르면", "~의 경우", "~하지만" 등의 표현을 사용하여 자연스럽게 연결하세요.
- 예시: "형법 제332조에 따르면, 사기죄는 타인을 기망하여 재산상의 이익을 취득하는 범죄입니다. 여기서 기망이란 상대방을 속이는 행위를 의미하며, 이로 인해 상대방이 착오에 빠지게 됩니다. 그 결과 재물을 교부하거나 재산상의 이익을 제공하게 되면 사기죄가 성립합니다."
"""
        })
        
        # 2. 판례 설명형 (판례가 있는 경우)
        if has_case:
            content_styles.append({
                "name": "판례 설명형",
                "description": "판례의 사실관계와 판결 요지를 중심으로 설명하는 형식입니다.",
                "guidance": """
- 판례의 사실관계를 구체적으로 설명하세요 (참고 문서에 있는 내용만).
- **판례 인용 시 필수 포함**:
  * 판례 번호와 법원명을 정확히 명시
  * **구체적인 사안(사실관계) 설명**: "이 판례에서는 [구체적인 사안 설명, 예: A가 B에게 거짓 투자 정보를 제공하여 1억원을 편취한 사안]"
  * **법원의 판단 내용**: "법원은 [어떤 법리를 적용하여] [어떻게 인정/불인정했는지] 판단했습니다"
  * 판결 요지와 법리
- "이 판례에서는", "법원은", "판결에 따르면" 등의 표현을 사용하세요.
- 예시: "서울중앙지방법원 2019고합980 판결을 살펴보면, 피고인 A는 다수의 피해자에게 거짓 투자 정보를 제공하여 총 5억원을 편취한 사안입니다. 법원은 이 사건에서 피고인의 행위가 반복적이고 계획적이며 대규모 피해를 유발했다고 판단하여, 특정경제범죄 가중처벌 등에 관한 법률 제3조에 따라 특경법 적용을 인정하고 가중처벌했습니다. 이 판결은 사기죄와 특경법 적용의 차이를 명확히 보여주는 사례입니다."
"""
            })
        
        # 3. 사례 제시 후 서술형 (판례나 예시 키워드가 있는 경우)
        if has_case or has_example_keyword:
            content_styles.append({
                "name": "사례 제시 후 서술형",
                "description": "구체적인 사례를 먼저 제시한 후 법리와 적용을 설명하는 형식입니다.",
                "guidance": """
- 먼저 구체적인 사례를 스토리텔링 형식으로 제시하세요.
- 사례 제시 후 "이 경우", "이러한 상황에서", "이 사안은" 등의 표현으로 법리 설명으로 자연스럽게 전환하세요.
- 예시: "A씨는 B씨에게 거짓 투자 정보를 제공하여 1억원을 받았습니다. A씨는 고의로 거짓 정보를 제공했고, B씨는 이를 믿고 투자했습니다. 이 경우 형법 제332조에 따른 사기죄가 성립합니다. 그런데 A씨가 이런 행위를 반복하여 다수의 피해자로부터 5억원 이상을 편취했다면, 특정경제범죄 가중처벌 등에 관한 법률에 따라 가중처벌됩니다."
"""
            })
        
        # 4. 비교 대조형 (비교 키워드가 있는 경우)
        if has_comparison_keyword:
            content_styles.append({
                "name": "비교 대조형",
                "description": "두 개념을 비교하여 차이점을 명확히 설명하는 형식입니다.",
                "guidance": """
- 두 개념을 나란히 비교하여 설명하세요.
- "반면", "다만", "그러나", "한편" 등의 표현을 사용하여 차이점을 명확히 하세요.
- **법정형 비교 시 필수**: 법정형을 비교할 때는 반드시 구체적인 숫자와 범위로 차이를 명확히 설명하세요:
  * 각 법정형의 구체적 내용(징역 기간, 벌금 액수 등)을 나란히 제시
  * 어떤 경우에 어떤 법정형이 적용되는지 명확히 구분
  * 차이점을 숫자나 구체적 범위로 명확히 비교
  * 적용 요건의 차이도 함께 설명
- 예시: "사기죄는 형법 제347조에 따라 '10년 이하의 징역 또는 2천만원 이하의 벌금'으로 처벌되는 일반적인 범죄입니다. 반면, 특경법 제3조는 경제질서에 큰 영향을 끼치는 범죄에 대해 가중처벌을 규정하며, 5억원 이상의 재산상 이익을 편취한 경우 '무기징역 또는 5년 이상의 징역'으로 처벌합니다. 여기서 차이점을 명확히 하면, 일반 사기죄는 최대 10년 징역이지만 특경법 적용 시 최소 5년 이상의 징역이 선고되며 무기징역까지 가능합니다. 또한 일반 사기죄는 벌금형 선택이 가능하지만, 특경법 적용 시에는 징역형만 선고됩니다."
"""
            })
        
        # 5. 질문 답변형 (질문 키워드가 있는 경우)
        if has_question_keyword:
            content_styles.append({
                "name": "질문 답변형",
                "description": "독자가 가질 수 있는 질문을 제시하고 답변하는 형식입니다.",
                "guidance": """
- 자연스러운 문장으로 질문을 제시하세요 (예: "많은 분들이 궁금해하시는 질문이 있습니다. '사기죄와 특경법 적용 사이에 어떤 차이가 있나요?'라는 질문에 대해...").
- 질문에 대해 상세하고 구체적으로 답변하세요.
- 법령 조문 번호나 판례 번호를 인용하고, 구체적인 예시를 포함하세요.
- 여러 질문을 자연스럽게 연결하여 작성하세요.
"""
            })
        
        # 기본 형식이 없으면 서술형 추가
        if not content_styles:
            content_styles.append({
                "name": "서술형",
                "description": "법령 조문과 개념을 논리적으로 서술하는 형식입니다.",
                "guidance": """
- 법령 조문의 의미를 논리적으로 설명하세요.
- 개념 간 관계를 명확히 제시하세요.
- "~에 따르면", "~의 경우", "~하지만" 등의 표현을 사용하여 자연스럽게 연결하세요.
"""
            })
        
        # 랜덤 선택
        selected_style = random.choice(content_styles)
        logger.info(f"콘텐츠 형식 선택: {selected_style['name']} (주제: {topic[:50]}, 판례: {has_case}, 법령: {has_statute})")
        
        return selected_style
    
    def _select_sections_based_on_rag(
        self,
        references: List[Dict[str, Any]],
        topic: str,
        include_sections: Optional[List[str]] = None,
    ) -> List[str]:
        """RAG 검색 결과를 분석하여 적합한 섹션 선택"""
        # 필수 섹션 (항상 포함)
        required_section_ids = ["title"]  # disclaimer 제거
        
        # 사용자가 명시적으로 요청한 섹션이 있으면 우선 사용
        if include_sections:
            selected_sections = required_section_ids.copy()
            for section_id in SECTION_ORDER:
                if section_id not in required_section_ids and section_id in include_sections:
                    selected_sections.append(section_id)
            logger.info(f"사용자 지정 섹션 사용: {selected_sections}")
            return selected_sections
        
        # RAG 검색 결과 분석
        document_types = {}
        has_case = False
        has_statute = False
        has_procedure = False
        has_manual = False
        
        for ref in references:
            doc_type = ref.get("type", "")
            if doc_type:
                document_types[doc_type] = document_types.get(doc_type, 0) + 1
                if doc_type == "case":
                    has_case = True
                elif doc_type == "statute":
                    has_statute = True
                elif doc_type == "procedure":
                    has_procedure = True
                elif doc_type == "manual":
                    has_manual = True
        
        # 주제 키워드 분석
        topic_lower = topic.lower()
        has_how_keyword = any(kw in topic_lower for kw in ["어떻게", "방법", "절차", "순서"])
        has_question_keyword = any(kw in topic_lower for kw in ["질문", "궁금", "묻", "물어"])
        has_punishment_keyword = any(kw in topic_lower for kw in ["처벌", "벌금", "형량", "벌"])
        has_statute_keyword = any(kw in topic_lower for kw in ["법령", "법률", "특경법", "특정경제범죄", "조문", "제", "조"])
        has_difference_keyword = any(kw in topic_lower for kw in ["차이", "차별", "구분", "비교", "적용", "유무"])
        
        # 섹션 선택 로직
        selected_sections = required_section_ids.copy()
        optional_sections = []
        
        # 1. 문서 타입 기반 선택
        if has_case:
            # 판례가 있으면 상황 예시와 Q&A 유용
            optional_sections.extend(["situation_example", "qa"])
        
        if has_statute:
            # 법령이 있으면 핵심 개념 정리 유용
            optional_sections.append("core_concepts")
        
        # 주제에 법령 관련 키워드가 있으면 핵심 개념 정리 섹션 추가 (법령 문서가 없어도)
        if has_statute_keyword and "core_concepts" not in optional_sections:
            optional_sections.append("core_concepts")
            logger.info(f"주제에 법령 키워드가 있어 core_concepts 섹션 추가: {topic[:50]}")
        
        if has_procedure or has_manual:
            # 절차나 실무 매뉴얼이 있으면 체크리스트와 주의할 점 유용
            optional_sections.extend(["checklist", "warnings"])
        
        # 2. 주제 키워드 기반 선택
        if has_how_keyword:
            # "어떻게", "방법" 키워드가 있으면 체크리스트 유용
            if "checklist" not in optional_sections:
                optional_sections.append("checklist")
        
        if has_question_keyword:
            # "질문" 키워드가 있으면 Q&A 유용
            if "qa" not in optional_sections:
                optional_sections.append("qa")
        
        if has_punishment_keyword:
            # "처벌" 키워드가 있으면 주의할 점과 마무리 유용
            optional_sections.extend(["warnings", "summary"])
        
        # "차이", "비교", "적용" 키워드가 있으면 핵심 개념 정리와 주의할 점 유용
        if has_difference_keyword:
            if "core_concepts" not in optional_sections:
                optional_sections.append("core_concepts")
            if "warnings" not in optional_sections:
                optional_sections.append("warnings")
            logger.info(f"주제에 비교/차이 키워드가 있어 core_concepts와 warnings 섹션 추가: {topic[:50]}")
        
        # 3. 기본 섹션 (항상 유용)
        if "tldr" not in optional_sections:
            optional_sections.append("tldr")
        if "core_concepts" not in optional_sections and has_statute:
            optional_sections.append("core_concepts")
        if "summary" not in optional_sections:
            optional_sections.append("summary")
        
        # 4. 중복 제거 및 순서 유지
        seen = set()
        for section_id in SECTION_ORDER:
            if section_id in required_section_ids:
                continue
            if section_id in optional_sections and section_id not in seen:
                selected_sections.append(section_id)
                seen.add(section_id)
        
        # 5. 최소 5개, 최대 7개 선택적 섹션 유지 (토큰 절약)
        if len(selected_sections) > 9:  # 필수 2개 + 선택적 7개 초과 시
            # 우선순위에 따라 선택
            priority_sections = ["tldr", "core_concepts", "qa", "checklist", "warnings", "summary", "situation_example"]
            selected_optional = []
            for section_id in priority_sections:
                if section_id in selected_sections and section_id not in required_section_ids:
                    selected_optional.append(section_id)
                if len(selected_optional) >= 7:
                    break
            
            # 최종 선택 (필수 + 우선순위 선택적)
            final_sections = required_section_ids.copy()
            for section_id in SECTION_ORDER:
                if section_id in selected_optional:
                    final_sections.append(section_id)
            selected_sections = final_sections
        
        logger.info(f"RAG 기반 섹션 선택 ({len(selected_sections)}개): {', '.join(selected_sections)}")
        logger.info(f"검색된 문서 타입: {document_types}")
        
        return selected_sections
    
    def _build_structured_blog_prompt(
        self,
        topic: str,
        context: str,
        references: Optional[List[Dict[str, Any]]] = None,
        style: Optional[str] = None,
        target_length: Optional[int] = None,
        include_sections: Optional[List[str]] = None,
        keywords: Optional[List[str]] = None,
        revision_count: int = 0,
    ) -> str:
        """구조화된 블로그 프롬프트 생성 - 템플릿 상수 및 파일 기반"""
        # 기본 지시사항 (파일에서 로드, 필수 파일)
        instructions = self.prompt_loader.load_template("blog_base.txt", required=True)
        
        # 콘텐츠 형식 랜덤 선택 (섹션 지정 대신)
        content_style = self._select_content_style(references or [], topic)
        
        # 콘텐츠 형식 가이드 (간소화)
        content_guide = f"\n**📝 작성 형식: {content_style['name']}**\n{content_style['description']}\n{content_style['guidance']}\n"
        
        # 스타일 지정
        if style:
            instructions += f"\n## 추가 스타일 요구사항\n{style}\n"
        
        # 목표 길이 (최우선 강조 - 프롬프트 맨 앞에 배치)
        min_length = max(1800, int((target_length or 1800) * 0.8))  # 최소 1800자 보장
        if target_length:
            instructions = f"""## 🚨 최우선 필수 요구사항: 글자수

**절대 필수**: 반드시 최소 {min_length}자 이상 (공백 제외) 작성하세요. 
- 목표: 약 {target_length}자 (공백 제외)
- 최소: {min_length}자 이상 (공백 제외)
- **이 요구사항을 만족하지 않으면 콘텐츠가 즉시 거부되고 재작성이 필요합니다.**

각 섹션을 충분히 상세하게 작성하여 전체 글자수를 확보하세요:
- 핵심 개념: 최소 400자 이상
- 상황 예시: 최소 400자 이상  
- Q&A: 각 답변 최소 200자 이상
- 주의사항: 최소 300자 이상

""" + instructions
        else:
            instructions = f"""## 🚨 최우선 필수 요구사항: 글자수

**절대 필수**: 반드시 최소 {min_length}자 이상 (공백 제외) 작성하세요.
- **이 요구사항을 만족하지 않으면 콘텐츠가 즉시 거부되고 재작성이 필요합니다.**

각 섹션을 충분히 상세하게 작성하여 전체 글자수를 확보하세요:
- 핵심 개념: 최소 400자 이상
- 상황 예시: 최소 400자 이상
- Q&A: 각 답변 최소 200자 이상
- 주의사항: 최소 300자 이상

""" + instructions
        
        # 포함할 섹션
        if include_sections:
            instructions += f"\n## 반드시 포함할 섹션\n{', '.join(include_sections)}\n"
        
        # 키워드
        if keywords:
            instructions += f"\n## 반드시 포함할 키워드\n{', '.join(keywords)}\n"
            instructions += "키워드는 자연스럽게 문맥에 맞게 배치하세요.\n"
        
        # 콘텐츠 형식 정보 제거 (content_guide에 이미 포함됨)
        content_style_info = ""
        
        # 법령/판례 인용 형식 및 마무리 지시사항 (파일에서 로드, 필수 파일)
        instructions_template = self.prompt_loader.load_template("blog_instructions.txt", required=True)
        
        # 참고 문서에서 법령/판례 번호 추출하여 명시 (최상단에 배치)
        reference_info = ""
        mandatory_citations = ""
        statutes = []  # 초기화 (references가 None이거나 빈 리스트일 때를 대비)
        cases = []  # 초기화 (references가 None이거나 빈 리스트일 때를 대비)
        if references:
            for ref in references:
                doc_type = ref.get("type", "")
                if doc_type == "statute":
                    law_name = ref.get("law_name", "")
                    article_num = ref.get("article_number", "")
                    if article_num:
                        # article_number 정규화: 숫자만 추출 후 "제XXX조" 형식으로 변환
                        import re
                        num_match = re.search(r'(\d+)', str(article_num))
                        if num_match:
                            article_num_clean = num_match.group(1)
                            # "제XXX조" 형식으로 변환
                            if law_name:
                                statutes.append(f"{law_name} 제{article_num_clean}조")
                            else:
                                statutes.append(f"제{article_num_clean}조")
                        else:
                            # 숫자가 없으면 원본 그대로 사용 (이미 "제XXX조" 형식일 수 있음)
                            if article_num.startswith("제") and article_num.endswith("조"):
                                if law_name:
                                    statutes.append(f"{law_name} {article_num}")
                                else:
                                    statutes.append(article_num)
                            else:
                                # 형식이 이상하면 경고하고 스킵
                                logger.warning(f"법령 조문 번호 형식 오류: {article_num} (law_name={law_name})")
                elif doc_type == "case":
                    case_num = ref.get("case_number", "")
                    court = ref.get("court", "")
                    if case_num:
                        case_str = f"{court} {case_num} 판결" if court else f"{case_num} 판결"
                        cases.append(case_str)
            
            # 간소화된 인용 정보
            if statutes or cases:
                mandatory_citations = "\n## 참고 문서의 법령 및 판례\n\n"
                mandatory_citations += "아래 법령과 판례를 본문에 정확히 인용하세요.\n\n"
                
                if statutes:
                    mandatory_citations += "**법령**:\n"
                    for statute in statutes:
                        mandatory_citations += f"- {statute}\n"
                    mandatory_citations += "\n"
                
                if cases:
                    mandatory_citations += "**판례**:\n"
                    for case_str in cases:
                        mandatory_citations += f"- {case_str}\n"
                    mandatory_citations += "\n"
                    mandatory_citations += "⚠️ **판례 인용 시**: 구체적인 사안(사실관계)과 법원의 판단 내용을 포함하세요.\n\n"
            
            # reference_info는 mandatory_citations에 이미 포함되므로 제거 (중복 방지)
            reference_info = ""
        
        # Few-shot 예시 로드 (간소화) - 재작성 시에만 포함하거나 첫 생성 시에는 간단한 예시만
        example_template = self.prompt_loader.load_template("blog_example.txt", required=False)
        example_section = ""
        if example_template:
            # 재작성 시에만 전체 예시 포함, 첫 생성 시에는 간단한 요약만
            if revision_count > 0:
                # 재작성 시에는 핵심 예시만 포함 (전체 예시 대신)
                example_section = """
## 📝 참고 예시 (핵심)

완성된 콘텐츠는 다음 특징을 가져야 합니다:
- 모든 섹션이 최소 길이 요구사항을 만족
- 기준 시점 명시 (예: "2024년 12월 기준")
"""
            else:
                # 첫 생성 시에는 예시 생략 (프롬프트 길이 절약)
                example_section = ""
        
        # 플레이스홀더 치환 (reference_info는 mandatory_citations에 이미 포함됨)
        instructions_end = instructions_template.replace("{TOPIC}", topic).replace("{CONTEXT}", context)
        
        # 품질 요구사항 (간소화 - 중복 제거)
        quality_requirements = """
## ⚠️ 필수 요구사항

1. **법정형 상세 설명**: 법령 조문 번호가 언급되면 **조건**과 **처벌 내용**을 모두 명시하세요.
   - ✅ "특경법 제3조 제1항 제1호에 따라 5억원 이상의 재산상 이익을 편취한 경우에는 '무기징역 또는 5년 이상의 징역'으로 가중처벌됩니다"
   - ❌ "특경법 제3조에 따라 가중처벌됩니다" (조건과 처벌 내용 없음)

2. **구체적 예시**: "예를 들어, A가 B에게..." 형식의 구체적 사례를 포함하세요.
"""
        
        # 재작성 시 글자수 요구사항 강화
        if revision_count > 0:
            min_length = max(1800, int((target_length or 1800) * 0.8))
            quality_requirements += f"""

## 🚨 재작성 필수 요구사항 (이전 초안이 거부된 이유)

**⚠️ 최우선 필수**: 이전 초안이 글자수 부족으로 거부되었습니다. 반드시 다음 요구사항을 만족하세요:

1. **최소 글자수**: 반드시 최소 {min_length}자 이상 (공백 제외) 작성하세요. 이 요구사항을 만족하지 않으면 다시 거부됩니다.
2. **각 섹션 확장**: 모든 섹션을 더 상세하게 확장하세요:
   - 핵심 개념 정리: 최소 400자 이상 (법령 조문 번호, 구성요건, 구체적 예시 포함)
   - 상황 예시: 최소 400자 이상 (상세한 사실관계, 법적 쟁점, 결말 포함)
   - Q&A: 각 답변 최소 200자 이상
   - 주의사항: 최소 300자 이상
3. **구체적 설명 강화**: 추상적인 설명을 피하고 구체적인 예시와 사례를 더 많이 추가하세요.
4. **법령/판례 상세 설명**: 법령 조문과 판례를 단순히 인용하는 것이 아니라, 각각의 의미와 적용 방법을 상세히 설명하세요.

**절대 금지**: 짧은 문장으로 채우거나 반복적인 내용으로 글자수만 채우는 것은 금지됩니다. 모든 내용은 의미 있고 상세한 설명이어야 합니다.
"""
        
        # 프롬프트 조합 (중복 제거 및 최적화)
        prompt = f"""{instructions}

{mandatory_citations}

{content_guide}

{quality_requirements}

{example_section}

{instructions_end}
"""
        
        return prompt
    
    def _build_basic_prompt(
        self,
        topic: str,
        context: str,
        content_type: str,
        style: Optional[str] = None,
        target_length: Optional[int] = None,
    ) -> str:
        """기본 프롬프트 생성 (블로그 외 타입용) - 파일 기반"""
        # 템플릿 파일에서 로드 (필수 파일)
        base_prompt = self.prompt_loader.format_template(
            "basic_template.txt",
            required=True,
            CONTENT_TYPE=content_type,
            TOPIC=topic,
            CONTEXT=context
        )
        
        if style:
            base_prompt += f"\n작성 스타일: {style}\n"
        if target_length:
            min_length = max(1800, int(target_length * 0.8))  # 최소 1800자 보장
            base_prompt += f"\n목표 글자 수: 약 {target_length}자 (공백 제외)\n"
            base_prompt += f"**중요**: 최소 {min_length}자 이상 (공백 제외) 작성하세요.\n"
        else:
            base_prompt += f"\n목표 글자 수: 최소 1800자 이상 (공백 제외) 작성하세요.\n"
        
        return base_prompt
    
    def _generate_draft_node(self, state: ContentWorkflowState) -> ContentWorkflowState:
        """초안 작성 노드 - LLM을 사용한 블로그 초안 생성"""
        try:
            prompt = state.get("prompt")
            context = state.get("context", "")
            document_types = state.get("document_types")
            
            if not prompt:
                state["error"] = "프롬프트가 없습니다."
                state["draft"] = ""
                return state
            
            # 컨텍스트가 비어있으면 경고
            if not context or len(context.strip()) == 0:
                logger.warning("컨텍스트가 비어있습니다. 검색 결과가 없을 수 있습니다.")
                # 컨텍스트가 없어도 기본 정보로 콘텐츠 생성 시도
                if not context:
                    context = "검색된 관련 문서가 없습니다. 일반적인 법률 지식을 바탕으로 작성해주세요."
            
            logger.info(f"초안 작성 시작: 프롬프트 길이={len(prompt)}자, 컨텍스트 길이={len(context)}자")
            
            # 시스템 프롬프트 생성
            system_prompt = self._build_system_prompt(state)
            
            # LLM으로 콘텐츠 생성
            # 콘텐츠 생성 시 더 높은 temperature와 max_tokens 사용
            # 기존 LLM 인스턴스의 temperature를 임시로 조정
            original_temperature = self.llm_manager.temperature
            try:
                # 콘텐츠 생성 시 temperature를 0.7로 설정 (더 창의적이고 상세한 콘텐츠 생성)
                # 재작성 시에는 더 높은 temperature 사용
                revision_count = state.get("revision_count", 0)
                if revision_count > 0:
                    # 재작성 시에는 더 창의적인 접근을 위해 temperature 상향
                    self.llm_manager.temperature = 0.8
                else:
                    self.llm_manager.temperature = 0.7  # 기존 0.6에서 증가
                
                # LLM 인스턴스 재초기화 (temperature 변경 반영)
                self.llm_manager._initialize()
                
                # LLMManager.generate_response는 동기 메서드이므로 직접 호출
                # 상세한 콘텐츠 생성을 위해 max_tokens는 LLMManager에서 이미 충분히 설정되어 있음 (4096)
                # 프롬프트에 상세 요구사항을 포함하여 더 긴 응답을 유도
                draft = self.llm_manager.generate_response(
                    context=context,
                    query=prompt,
                    system_prompt=system_prompt,
                    document_types=document_types,
                )
            finally:
                # 원래 temperature로 복원
                self.llm_manager.temperature = original_temperature
                self.llm_manager._initialize()
            
            # 생성된 콘텐츠 검증 (강화)
            if not draft or len(draft.strip()) == 0:
                logger.error("LLM이 빈 콘텐츠를 반환했습니다.")
                state["error"] = "콘텐츠 생성 실패: LLM이 빈 응답을 반환했습니다."
                state["draft"] = ""
            else:
                # 포괄적인 자동 검증 수행
                validation_result = self._comprehensive_validation(draft, state.get("references", []))
                
                # 콘텐츠 품질 검증 추가 (피상적 내용 체크)
                quality_check = self._check_content_quality(draft, state.get("references", []))
                if quality_check["is_too_superficial"]:
                    validation_result["has_critical_issues"] = True
                    validation_result["issues"].extend(quality_check["issues"])
                    logger.warning(f"콘텐츠가 너무 피상적: {quality_check['issues']}")
                
                # 콘텐츠 길이 재검증 (더 엄격) - 공백 제외 길이로 체크
                target_length = state.get("target_length") or 1800
                min_length = max(1800, int(target_length * 0.8))  # 최소 1800자 보장
                if draft:
                    text_length_no_spaces = self._get_text_length_without_spaces(draft)
                    text_length_total = len(draft)
                    
                    # 공백 제외 길이 검증
                    if text_length_no_spaces < min_length:
                        validation_result["has_critical_issues"] = True
                        validation_result["issues"].append(
                            f"❌ 콘텐츠가 너무 짧습니다. 현재 공백 제외 {text_length_no_spaces}자, 전체 {text_length_total}자입니다. "
                            f"최소 {min_length}자 이상 (공백 제외) 작성해야 합니다. 재작성이 필요합니다."
                        )
                    # 전체 길이도 함께 확인 (공백 포함 최소 길이)
                    elif text_length_total < min_length:
                        validation_result["has_critical_issues"] = True
                        validation_result["issues"].append(
                            f"❌ 콘텐츠 전체 길이가 너무 짧습니다. 현재 전체 {text_length_total}자입니다. "
                            f"최소 {min_length}자 이상 작성해야 합니다. 재작성이 필요합니다."
                        )
                
                if validation_result["has_critical_issues"]:
                    # 필수 항목 미충족 시 즉시 재생성 트리거
                    logger.warning(f"필수 항목 미충족: 즉시 재생성 필요. 발견된 문제: {validation_result['issues']}")
                    state["evaluation_feedback"].extend(validation_result["issues"])
                    # 재생성 트리거를 위해 should_rewrite 플래그 직접 설정
                    state["has_critical_validation_issues"] = True  # 플래그 설정
                    # 점수는 나중에 comprehensive_evaluate에서 계산되지만, critical issues가 있으면 재작성 필요
                elif validation_result["has_warnings"]:
                    # 경고 사항은 피드백에만 추가
                    logger.info(f"경고 사항 발견: {validation_result['warnings']}")
                    state["evaluation_feedback"].extend(validation_result["warnings"])
                
                state["draft"] = draft
                text_length_no_spaces = self._get_text_length_without_spaces(draft) if draft else 0
                logger.info(f"초안 작성 완료: 전체 길이={len(draft)}자, 공백 제외={text_length_no_spaces}자, 검증 결과: critical={validation_result['has_critical_issues']}, warnings={len(validation_result.get('warnings', []))}")
            
        except Exception as e:
            logger.error(f"초안 작성 실패: {str(e)}", exc_info=True)
            state["error"] = f"초안 작성 실패: {str(e)}"
            state["draft"] = ""
        
        return state
    
    def _check_content_quality(self, draft: str, references: List[Dict[str, Any]] = None) -> Dict[str, Any]:
        """콘텐츠 품질 검증: 피상적 내용 체크"""
        import re
        issues = []
        is_too_superficial = False
        
        # 피상적 설명 패턴 체크
        superficial_patterns = [
            r'[^다]에\s+규정되어\s+있습니다[^.]*\.',  # "형법에 규정되어 있습니다" 같은 피상적 설명
            r'[^다]에\s+따르면[^.]*\.\s*$',  # "형법에 따르면." 같은 짧은 설명
            r'[^다]에\s+의해\s+처벌됩니다[^.]*\.',  # "형법에 의해 처벌됩니다" 같은 피상적 설명
        ]
        
        # 핵심 개념 정리 섹션 추출
        core_concepts_match = re.search(r'##\s*(?:핵심\s*개념|개념\s*정리).*?(?=##|$)', draft, re.DOTALL | re.IGNORECASE)
        if core_concepts_match:
            core_concepts_text = core_concepts_match.group(0)
            # 피상적 설명 체크
            for pattern in superficial_patterns:
                if re.search(pattern, core_concepts_text):
                    is_too_superficial = True
                    issues.append("핵심 개념 정리 섹션에 피상적인 설명이 있습니다. 구체적인 구성요건과 예시를 포함하여 상세히 설명하세요.")
                    break
            
            # 구체적 설명 여부 체크 (법령 조문 번호 + 설명이 함께 있는지)
            has_detailed_explanation = re.search(r'제\d+조에\s+따르면[^.]{50,}', core_concepts_text)
            if not has_detailed_explanation:
                is_too_superficial = True
                issues.append("핵심 개념 정리 섹션에 구체적인 설명이 부족합니다. 법령 조문 번호와 함께 구성요건을 상세히 설명하세요.")
            
            # 법률 조항의 구체적 처벌 내용 및 조건 확인
            # 예: "제3조 제1항 제1호에 따라 5억원 이상의 재산상 이익을 편취한 경우에는 '무기징역 또는 5년 이상의 징역'으로 가중처벌"
            # 법령 조문 번호가 있는 경우, 그 다음에 조건과 구체적인 처벌 내용이 모두 있는지 확인
            statute_with_article_pattern = r'제\s*\d+\s*조(?:\s*제\s*\d+\s*항)?(?:\s*제\s*\d+\s*호)?'
            statute_matches = list(re.finditer(statute_with_article_pattern, core_concepts_text))
            
            if statute_matches:
                # 각 법령 조문 번호 다음에 조건과 구체적인 처벌 내용이 모두 있는지 확인
                has_specific_punishment = False
                punishment_patterns = [
                    r'무기징역',
                    r'\d+\s*년\s*이상\s*(?:의\s*)?징역',
                    r'\d+\s*년\s*이하\s*(?:의\s*)?징역',
                    r'\d+\s*년\s*이상\s*\d+\s*년\s*이하\s*(?:의\s*)?징역',
                    r'\d+\s*만원\s*이상\s*(?:의\s*)?벌금',
                    r'\d+\s*억원\s*이상\s*(?:의\s*)?벌금',
                    r'가중처벌',
                    r'처벌\s*(?:된다|됩니다|받는다|받습니다)',
                ]
                
                # 조건 패턴 (금액, 행위, 상황 등)
                condition_patterns = [
                    r'\d+\s*(?:억|만|천)\s*원\s*이상',  # 금액 조건
                    r'재산상\s*(?:이익|손해)',  # 재산상 이익/손해
                    r'편취',  # 편취 행위
                    r'취득',  # 취득 행위
                    r'상습',  # 상습성
                    r'조직',  # 조직적 범죄
                    r'피해액',  # 피해액 관련
                    r'경우',  # "~한 경우" 같은 조건 표현
                ]
                
                for match in statute_matches:
                    # 법령 조문 번호 다음 300자 내에 조건과 처벌 내용이 있는지 확인 (범위 확대)
                    start_pos = match.end()
                    next_text = core_concepts_text[start_pos:start_pos + 300]
                    
                    # 조건 패턴 확인 (예: "5억원 이상의 재산상 이익을 편취한 경우")
                    has_condition = any(re.search(pattern, next_text) for pattern in condition_patterns)
                    
                    # 처벌 내용 패턴 확인
                    has_punishment = any(re.search(pattern, next_text) for pattern in punishment_patterns)
                    
                    # 검증 1: 조건이 있으면 반드시 처벌 내용도 있어야 함
                    if has_condition and not has_punishment:
                        is_too_superficial = True
                        issues.append(
                            f"법령 조문({match.group()})에 조건(예: '5억원 이상의 재산상 이익을 편취한 경우')은 언급되었지만 "
                            f"구체적인 처벌 내용(예: '무기징역 또는 5년 이상의 징역', '징역', '벌금' 등)이 명시되지 않았습니다. "
                            f"반드시 구체적인 처벌 내용을 명확하게 명시하세요. "
                            f"예: '특경법 제3조 제1항 제1호에 따라 5억원 이상의 재산상 이익을 편취한 경우에는 무기징역 또는 5년 이상의 징역으로 가중처벌됩니다'"
                        )
                        break
                    
                    # 검증 2: 처벌 내용이 있으면 반드시 조건도 명시되어야 함
                    if has_punishment and not has_condition:
                        is_too_superficial = True
                        issues.append(
                            f"법령 조문({match.group()})에 처벌 내용은 언급되었지만 "
                            f"구체적인 조건(예: '5억원 이상의 재산상 이익을 편취한 경우', '상습적으로', '조직적으로' 등)이 명시되지 않았습니다. "
                            f"반드시 어떤 조건에서 해당 처벌이 적용되는지 명확하게 명시하세요. "
                            f"예: '특경법 제3조 제1항 제1호에 따라 5억원 이상의 재산상 이익을 편취한 경우에는 무기징역 또는 5년 이상의 징역으로 가중처벌됩니다'"
                        )
                        break
                    
                    # 검증 3: 조건과 처벌 내용이 모두 있어야 완전한 설명
                    if has_condition and has_punishment:
                        has_specific_punishment = True
                
                # 법령 조문이 여러 개 있는데 조건과 처벌 내용이 모두 없는 경우
                if len(statute_matches) >= 2 and not has_specific_punishment:
                    is_too_superficial = True
                    issues.append(
                        "법령 조문이 여러 개 인용되었지만 구체적인 조건과 처벌 내용이 명시되지 않았습니다. "
                        "각 법령 조문에 따른 구체적인 조건(예: '5억원 이상의 재산상 이익을 편취한 경우')과 "
                        "처벌 내용(예: '무기징역 또는 5년 이상의 징역', '징역', '벌금' 등)을 반드시 명시하세요."
                    )
        
        # Q&A 섹션 체크
        qa_match = re.search(r'##\s*(?:Q&A|FAQ|자주\s*묻는|질문).*?(?=##|$)', draft, re.DOTALL | re.IGNORECASE)
        if qa_match:
            qa_text = qa_match.group(0)
            # 짧은 답변 체크 (각 답변이 최소 50자 이상인지)
            answers = re.findall(r'A\d+[.:]\s*(.+?)(?=Q\d+|$)', qa_text, re.DOTALL | re.IGNORECASE)
            for i, answer in enumerate(answers, 1):
                answer_clean = re.sub(r'\s+', ' ', answer.strip())
                if len(answer_clean) < 100:
                    is_too_superficial = True
                    issues.append(f"Q&A 섹션의 A{i} 답변이 너무 짧습니다 (현재 {len(answer_clean)}자). 최소 100자 이상으로 상세히 설명하세요.")
        
        # 디스클레이머 문구 체크 (절대 금지)
        disclaimer_patterns = [
            r'본\s*글은\s*일반적인\s*법률\s*정보\s*제공',
            r'개별\s*사건에\s*대한\s*법률\s*자문',
            r'구체적인\s*사안은\s*반드시\s*전문가',
            r'디스클레이머',
            r'면책',
        ]
        for pattern in disclaimer_patterns:
            if re.search(pattern, draft, re.IGNORECASE):
                is_too_superficial = True
                issues.append("디스클레이머 문구가 포함되어 있습니다. '본 글은 일반적인 법률 정보 제공을 위한 것이며...' 같은 문구를 절대 포함하지 마세요.")
                break
        
        # 전체 콘텐츠 길이 검증 (최소 글자수 요구사항)
        text_length_no_spaces = len(re.sub(r'\s+', '', draft))
        text_length_total = len(draft)
        min_required_length = 1800  # 최소 1800자 요구
        
        if text_length_no_spaces < min_required_length:
            is_too_superficial = True
            issues.append(
                f"❌ 콘텐츠 총 글자수가 너무 부족합니다. 현재 공백 제외 {text_length_no_spaces}자, 전체 {text_length_total}자입니다. "
                f"최소 {min_required_length}자 이상 (공백 제외) 작성해야 합니다. 재작성이 필요합니다."
            )
        elif text_length_total < min_required_length:
            is_too_superficial = True
            issues.append(
                f"❌ 콘텐츠 전체 길이가 너무 부족합니다. 현재 전체 {text_length_total}자입니다. "
                f"최소 {min_required_length}자 이상 작성해야 합니다. 재작성이 필요합니다."
            )
        
        return {
            "is_too_superficial": is_too_superficial,
            "issues": issues
        }
    
    def _comprehensive_validation(self, draft: str, references: List[Dict[str, Any]] = None) -> Dict[str, Any]:
        """포괄적인 자동 검증: 섹션 길이, 법령/판례 인용, 법률 용어 설명, 기준 시점 확인
        
        Returns:
            Dict with keys:
                - has_critical_issues: bool - 필수 항목 미충족 여부
                - has_warnings: bool - 경고 사항 존재 여부
                - issues: List[str] - 필수 항목 미충족 문제점
                - warnings: List[str] - 경고 사항
        """
        import re
        issues = []
        warnings = []
        
        # 1. 빈 섹션 검증
        section_validation = self._validate_draft_sections(draft, references)
        if section_validation["has_empty_sections"]:
            issues.extend(section_validation["issues"])
        
        # 2. 법령 조문 번호 인용 검증 (개선: 참고 문서의 조문 번호와 일치하는지 확인)
        statute_pattern = r'제\s*(\d+)\s*조'
        statute_matches = re.findall(statute_pattern, draft)
        
        # 참고 문서에서 법령 조문 번호 추출
        reference_statutes = set()
        if references:
            for ref in references:
                if ref.get("type") == "statute":
                    article_num = ref.get("article_number")
                    if article_num:
                        # 숫자만 추출
                        num_match = re.search(r'(\d+)', str(article_num))
                        if num_match:
                            reference_statutes.add(num_match.group(1))
        
        if len(statute_matches) == 0:
            issues.append("법령 조문 번호 인용이 없습니다. 참고 문서에 나온 법령 조문을 반드시 인용하세요.")
        else:
            # 인용된 조문 번호가 참고 문서의 조문 번호와 일치하는지 확인
            draft_statutes = set(statute_matches)
            if reference_statutes:
                intersection = draft_statutes.intersection(reference_statutes)
                if not intersection:
                    issues.append(
                        f"인용된 법령 조문 번호({list(draft_statutes)[:3]})가 참고 문서의 조문 번호({list(reference_statutes)[:3]})와 일치하지 않습니다. "
                        f"참고 문서에 나온 정확한 조문 번호를 인용하세요."
                    )
                elif len(statute_matches) < 2:
                    warnings.append(f"법령 조문 번호 인용이 부족합니다. 현재 {len(statute_matches)}개만 인용되었습니다. 최소 2개 이상 권장합니다.")
            elif len(statute_matches) < 2:
                warnings.append(f"법령 조문 번호 인용이 부족합니다. 현재 {len(statute_matches)}개만 인용되었습니다. 최소 2개 이상 권장합니다.")
        
        # 3. 판례 번호 인용 검증 (선택사항이지만 권장)
        case_pattern = r'(\d{4}[도나가다라마바사아자차카타노]\d+)'
        case_matches = re.findall(case_pattern, draft)
        if len(case_matches) == 0:
            warnings.append("판례 번호 인용이 없습니다. 참고 문서에 판례가 있으면 인용하는 것을 권장합니다.")
        
        # 4. 법률 용어 설명 검증
        legal_terms = [
            "기망", "처분행위", "재산상 손해", "사기죄", "특가법", "특경법",
            "편취", "상습성", "경제질서", "구성요건", "법정형", "가중처벌"
        ]
        explained_terms = 0
        for term in legal_terms:
            pattern = rf"{re.escape(term)}\s*\([^)]+\)"
            if re.search(pattern, draft, re.IGNORECASE):
                explained_terms += 1
        
        if explained_terms == 0:
            issues.append("법률 용어 설명이 없습니다. 최소 2개 이상의 법률 용어를 '용어(설명)' 형식으로 포함하세요.")
        elif explained_terms < 2:
            warnings.append(f"법률 용어 설명이 부족합니다. 현재 {explained_terms}개만 설명되었습니다. 최소 2개 이상 권장합니다.")
        
        # 5. 기준 시점 명시 검증
        freshness_patterns = [
            r'\d{4}년\s*\d{1,2}월\s*기준',
            r'\d{4}년\s*기준',
            r'본\s*글은\s*\d{4}년',
            r'\d{4}년\s*\d{1,2}월\s*현재',
        ]
        has_freshness = any(re.search(pattern, draft) for pattern in freshness_patterns)
        if not has_freshness:
            issues.append("기준 시점이 명시되지 않았습니다. 반드시 '2024년 12월 기준' 또는 '2025년 기준' 형식으로 명시하세요.")
        
        return {
            "has_critical_issues": len(issues) > 0,
            "has_warnings": len(warnings) > 0,
            "issues": issues,
            "warnings": warnings
        }
    
    def _validate_draft_sections(self, draft: str, references: List[Dict[str, Any]] = None) -> Dict[str, Any]:
        """초안의 빈 섹션 검증 및 상세 분석
        
        Returns:
            Dict with keys:
                - has_empty_sections: bool
                - issues: List[str] - 구체적인 문제점 목록
                - empty_sections: List[Tuple[str, int]] - (섹션명, 라인번호) 튜플 리스트
        """
        import re
        from src.rag.content_templates import BLOG_SECTIONS
        
        # 헤더 패턴 찾기 (H1, H2, H3 구분)
        header_pattern = r'^(#{1,3})\s+(.+?)$'
        lines = draft.split('\n')
        
        empty_sections = []
        current_header = None
        current_header_level = None  # 현재 섹션의 헤더 레벨 (1, 2, 3)
        current_content_lines = []
        issues = []
        
        # 섹션별 최소 길이 요구사항 매핑
        section_min_lengths = {
            "핵심 개념 정리": 200,
            "자주 묻는 질문": 150,  # Q&A는 질문+답변 합쳐서
            "상황 예시": 100,
            "주의할 점": 100,
            "마무리": 100,
            "요약": 100,
        }
        
        for i, line in enumerate(lines):
            header_match = re.match(header_pattern, line.strip())
            
            if header_match:
                header_level = len(header_match.group(1))  # #의 개수 (1, 2, 3)
                header_text = header_match.group(2).strip()
                
                # H2 이하의 헤더만 섹션으로 인식 (H3는 하위 섹션이므로 내용으로 처리)
                if header_level <= 2:
                    # 이전 섹션 검증
                    if current_header and current_header_level and current_header_level <= 2:
                        content_text = ''.join(current_content_lines).strip()
                        content_length = len(content_text)
                        
                        # 섹션별 최소 길이 확인
                        min_length = 20  # 기본값
                        if current_header:  # None 체크 추가
                            for section_key, min_len in section_min_lengths.items():
                                # 섹션명 매칭 개선: "자주 묻는 질문 (Q&A)"도 "자주 묻는 질문"으로 인식
                                if section_key in current_header or current_header.replace(" (Q&A)", "").replace("(Q&A)", "") == section_key:
                                    min_length = min_len
                                    break
                        
                        if content_length < min_length:
                            empty_sections.append((current_header, i))
                            issues.append(
                                f"'{current_header}' 섹션이 최소 길이 요구사항({min_length}자 이상)을 만족하지 않습니다. "
                                f"현재 {content_length}자입니다. 반드시 {min_length}자 이상의 상세한 내용을 작성하세요."
                            )
                    
                    # 새 섹션 시작
                    current_header = header_text
                    current_header_level = header_level
                    current_content_lines = []
                else:
                    # H3는 현재 섹션의 내용으로 처리
                    if current_header:
                        current_content_lines.append(line)
            elif current_header:
                # 현재 섹션의 내용
                if line.strip():
                    current_content_lines.append(line)
        
        # 마지막 섹션 검증
        if current_header and current_header_level and current_header_level <= 2:
            content_text = ''.join(current_content_lines).strip()
            content_length = len(content_text)
            
            min_length = 20  # 기본값
            if current_header:  # None 체크 추가
                for section_key, min_len in section_min_lengths.items():
                    # 섹션명 매칭 개선: "자주 묻는 질문 (Q&A)"도 "자주 묻는 질문"으로 인식
                    if section_key in current_header or current_header.replace(" (Q&A)", "").replace("(Q&A)", "") == section_key:
                        min_length = min_len
                        break
            
            if content_length < min_length:
                empty_sections.append((current_header, len(lines)))
                issues.append(
                    f"'{current_header}' 섹션이 최소 길이 요구사항({min_length}자 이상)을 만족하지 않습니다. "
                    f"현재 {content_length}자입니다. 반드시 {min_length}자 이상의 상세한 내용을 작성하세요."
                )
        
        # 중복 헤더 검증
        headers = []
        for line in lines:
            header_match = re.match(header_pattern, line.strip())
            if header_match:
                header_text = header_match.group(2).strip()
                if header_text in headers:
                    issues.append(f"중복된 섹션 헤더: '{header_text}' - 각 섹션은 한 번만 작성해야 합니다.")
                headers.append(header_text)
        
        return {
            "has_empty_sections": len(empty_sections) > 0 or len(issues) > 0,
            "issues": issues,
            "empty_sections": empty_sections
        }
    
    def _build_system_prompt(self, state: ContentWorkflowState) -> str:
        """시스템 프롬프트 생성 - 파일 기반"""
        content_type = state.get("content_type", "blog")
        style = state.get("style")
        
        # 파일에서 로드 (필수 파일)
        if content_type == "blog":
            base_prompt = self.prompt_loader.load_template("system_blog.txt", required=True)
        else:
            base_prompt = self.prompt_loader.load_template("system_base.txt", required=True)
        
        if style:
            base_prompt += f"\n작성 스타일: {style}\n"
        
        return base_prompt
    
    def _evaluate_node(self, state: ContentWorkflowState) -> ContentWorkflowState:
        """통합 평가 노드 - 구조/내용/법적 정확성을 모두 평가 (인포그래픽 구조에 맞게 통합)"""
        try:
            draft = state.get("draft", "")
            content_type = state.get("content_type", "blog")
            references = state.get("references", [])
            search_results = state.get("search_results", [])
            
            if not draft:
                state["error"] = "평가할 초안이 없습니다."
                state["structure_score"] = 0.0
                state["content_quality_score"] = 0.0
                state["legal_accuracy_score"] = 0.0
                return state
            
            text_length_no_spaces = self._get_text_length_without_spaces(draft) if draft else 0
            logger.info(f"통합 평가 시작: 초안 전체 길이={len(draft)}자, 공백 제외={text_length_no_spaces}자")
            
            # LLM 기반 평가 사용 (구조와 내용 품질을 함께 평가)
            if "_llm_evaluation_result" not in state:
                evaluation_result = self._evaluate_with_llm(draft, references)
                state["_llm_evaluation_result"] = evaluation_result
            else:
                evaluation_result = state["_llm_evaluation_result"]
            
            # 구조 평가 점수
            state["structure_score"] = evaluation_result.get("structure_score", 0.0)
            
            # 내용 품질 평가 점수
            state["content_quality_score"] = evaluation_result.get("content_quality_score", 0.0)
            
            # 법적 정확성 평가 (규칙 기반)
            legal_score, legal_feedback = self._evaluate_legal_accuracy(draft, references, search_results)
            state["legal_accuracy_score"] = legal_score
            
            # 피드백 통합
            state["evaluation_feedback"].extend(evaluation_result.get("feedback", []))
            state["evaluation_feedback"].extend(legal_feedback)
            
            # critical_issues가 있으면 즉시 재생성 트리거
            if evaluation_result.get("critical_issues"):
                state["evaluation_feedback"].extend(evaluation_result["critical_issues"])
                state["has_critical_validation_issues"] = True  # 플래그 설정
                logger.warning(f"심각한 문제 발견: {evaluation_result['critical_issues']}")
            
            if evaluation_result.get("warnings"):
                state["evaluation_feedback"].extend(evaluation_result["warnings"])
            
            logger.info(
                f"통합 평가 완료: 구조={evaluation_result.get('structure_score', 0.0):.1f}/30, "
                f"내용={evaluation_result.get('content_quality_score', 0.0):.1f}/40, "
                f"법적={legal_score:.1f}/30"
            )
            
        except Exception as e:
            logger.error(f"통합 평가 실패: {str(e)}")
            # 실패 시 기존 규칙 기반 평가로 폴백
            logger.warning("LLM 평가 실패, 규칙 기반 평가로 폴백")
            if content_type == "blog":
                structure_score, structure_feedback = self._evaluate_blog_structure(draft)
            else:
                structure_score, structure_feedback = self._evaluate_basic_structure(draft)
            
            content_score, content_feedback = self._evaluate_content_quality(draft, references)
            legal_score, legal_feedback = self._evaluate_legal_accuracy(draft, references, search_results)
            
            state["structure_score"] = structure_score
            state["content_quality_score"] = content_score
            state["legal_accuracy_score"] = legal_score
            state["evaluation_feedback"].extend(structure_feedback)
            state["evaluation_feedback"].extend(content_feedback)
            state["evaluation_feedback"].extend(legal_feedback)
        
        return state
    
    def _evaluate_blog_structure(self, draft: str) -> tuple[float, List[str]]:
        """블로그 구조 평가"""
        score = 0.0
        feedback = []
        max_score = 30.0
        
        # 1. 필수 섹션 존재 여부 체크 (15점) - title만 필수 (disclaimer 제거됨)
        section_scores = {}
        for section_id in REQUIRED_SECTIONS:
            section_info = BLOG_SECTIONS[section_id]
            section_name = section_info["name"]
            
            # 섹션 존재 여부 확인 (간단한 키워드 기반)
            found = self._check_section_exists(draft, section_id, section_name)
            if found:
                section_scores[section_id] = True
                score += 15.0 / len(REQUIRED_SECTIONS)
            else:
                section_scores[section_id] = False
                feedback.append(f"필수 섹션 누락: {section_name}")
        
        logger.debug(f"필수 섹션 체크 완료: {REQUIRED_SECTIONS}, 점수={score:.1f}/15.0")
        
        # 2. H1/H2/H3 마크다운 구조 검증 (10점)
        h1_count = draft.count("# ")
        h2_count = draft.count("## ")
        h3_count = draft.count("### ")
        
        if h1_count >= 1:
            score += 3.0
        else:
            feedback.append("H1 제목이 없습니다.")
        
        if h2_count >= 3:
            score += 4.0
        elif h2_count >= 1:
            score += 2.0
            feedback.append("H2 섹션이 부족합니다 (최소 3개 권장).")
        else:
            feedback.append("H2 섹션이 없습니다.")
        
        if h3_count >= 1:
            score += 3.0
        else:
            feedback.append("H3 하위 섹션이 없습니다.")
        
        # 3. 각 섹션 최소 길이 검증 (5점)
        min_length_ok = 0
        for section_id in REQUIRED_SECTIONS:
            section_info = BLOG_SECTIONS[section_id]
            min_length = section_info.get("requirements", {}).get("min_length", 0)
            
            if min_length > 0:
                section_text = self._extract_section_text(draft, section_id, section_info["name"])
                if section_text and len(section_text) >= min_length:
                    min_length_ok += 1
        
        if min_length_ok >= len([s for s in REQUIRED_SECTIONS if BLOG_SECTIONS[s].get("requirements", {}).get("min_length", 0) > 0]) * 0.7:
            score += 5.0
        else:
            feedback.append("일부 섹션이 최소 길이 요구사항을 만족하지 않습니다.")
        
        # 점수는 최대 30점으로 제한
        score = min(score, max_score)
        
        return score, feedback
    
    def _check_section_exists(self, draft: str, section_id: str, section_name: str) -> bool:
        """섹션 존재 여부 확인"""
        import re
        
        # 섹션별 키워드 패턴
        keywords = {
            "title": [r"^#\s+", r"제목", r"Title"],
            "tldr": [r"TL;DR", r"요약", r"핵심", r"간단히"],
            "situation_example": [r"상황", r"예시", r"사례", r"시나리오"],
            "core_concepts": [r"핵심\s*개념", r"법령", r"조문", r"판례"],
            "qa": [r"Q\s*[1-9]", r"질문", r"FAQ", r"자주\s*묻는"],
            "checklist": [r"체크리스트", r"체크", r"To-do", r"할\s*일"],
            "warnings": [r"주의", r"예외", r"주의사항", r"경고"],
            "summary": [r"마무리", r"요약", r"정리", r"권장"],
            "disclaimer": [r"디스클레이머", r"면책", r"법률\s*자문", r"전문가"],
        }
        
        patterns = keywords.get(section_id, [])
        for pattern in patterns:
            if re.search(pattern, draft, re.IGNORECASE | re.MULTILINE):
                return True
        
        return False
    
    def _extract_section_text(self, draft: str, section_id: str, section_name: str) -> Optional[str]:
        """섹션 텍스트 추출 (간단한 구현)"""
        import re
        
        # 마크다운 헤더 기반으로 섹션 추출 시도
        patterns = [
            rf"##\s*{re.escape(section_name)}.*?\n(.*?)(?=##|$)",
            rf"###\s*{re.escape(section_name)}.*?\n(.*?)(?=##|###|$)",
        ]
        
        for pattern in patterns:
            match = re.search(pattern, draft, re.DOTALL | re.IGNORECASE)
            if match:
                return match.group(1).strip()
        
        return None
    
    def _evaluate_basic_structure(self, draft: str) -> tuple[float, List[str]]:
        """기본 구조 평가 (블로그 외 타입용)"""
        score = 20.0  # 기본 점수
        feedback = []
        
        # 기본적인 구조만 확인
        if len(draft) < 100:
            score -= 10.0
            feedback.append("콘텐츠가 너무 짧습니다 (최소 100자 권장).")
        
        return score, feedback
    
    
    def _evaluate_with_llm(self, draft: str, references: List[Dict[str, Any]]) -> Dict[str, Any]:
        """LLM을 사용한 콘텐츠 평가"""
        import json
        import re
        
        # 참고 문서 정보 포맷팅
        references_text = ""
        if references:
            statutes = []
            cases = []
            for ref in references:
                if ref.get("type") == "statute":
                    article_num = ref.get("article_number", "")
                    title = ref.get("title", "")
                    statutes.append(f"{title} 제{article_num}조" if article_num else title)
                elif ref.get("type") == "case":
                    case_num = ref.get("case_number", "")
                    title = ref.get("title", "")
                    cases.append(f"{title} {case_num}" if case_num else title)
            
            references_text = "**법령**:\n" + "\n".join([f"- {s}" for s in statutes]) + "\n\n"
            references_text += "**판례**:\n" + "\n".join([f"- {c}" for c in cases]) + "\n"
        else:
            references_text = "참고 문서가 없습니다."
        
        # 평가 프롬프트 로드
        evaluation_prompt_template = self.prompt_loader.load_template("evaluation_prompt.txt", required=False)
        if not evaluation_prompt_template:
            # 프롬프트 파일이 없으면 기본 템플릿 사용
            evaluation_prompt_template = """당신은 법률 콘텐츠 품질 평가 전문가입니다. 다음 콘텐츠를 평가하고 JSON 형식으로 결과를 반환하세요.

평가 기준:
- 구조 평가 (30점): 필수 섹션, 마크다운 구조, 섹션 길이
- 내용 품질 평가 (40점): 법령 조문 인용 정확성, 법률 용어 설명, 구체적 예시

반환 형식:
{{
  "structure_score": 0-30,
  "content_quality_score": 0-40,
  "total_score": 0-70,
  "feedback": ["피드백 항목"],
  "critical_issues": ["심각한 문제"],
  "warnings": ["경고 사항"]
}}

콘텐츠:
{draft}

참고 문서:
{references}
"""
        
        # 프롬프트 생성
        evaluation_prompt = evaluation_prompt_template.replace("{draft}", draft[:8000])  # 토큰 제한 고려
        evaluation_prompt = evaluation_prompt.replace("{references}", references_text)
        
        # LLM으로 평가 요청
        try:
            evaluation_response = self.llm_manager.generate_response(
                context="",
                query=evaluation_prompt,
                system_prompt="당신은 법률 콘텐츠 품질 평가 전문가입니다. JSON 형식으로만 응답하세요.",
                document_types=[],
            )
            
            # JSON 추출 (마크다운 코드 블록 제거)
            json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', evaluation_response, re.DOTALL)
            if json_match:
                json_str = json_match.group(1)
            else:
                # 코드 블록이 없으면 전체를 JSON으로 시도
                json_str = evaluation_response.strip()
            
            # JSON 파싱
            evaluation_result = json.loads(json_str)
            
            # 기본값 설정
            result = {
                "structure_score": float(evaluation_result.get("structure_score", 0)),
                "content_quality_score": float(evaluation_result.get("content_quality_score", 0)),
                "total_score": float(evaluation_result.get("total_score", 0)),
                "feedback": evaluation_result.get("feedback", []),
                "critical_issues": evaluation_result.get("critical_issues", []),
                "warnings": evaluation_result.get("warnings", []),
            }
            
            logger.info(f"LLM 평가 결과: 구조={result['structure_score']:.1f}/30, 내용={result['content_quality_score']:.1f}/40, 총점={result['total_score']:.1f}/70")
            
            return result
            
        except json.JSONDecodeError as e:
            logger.error(f"LLM 평가 응답 JSON 파싱 실패: {str(e)}, 응답: {evaluation_response[:200]}")
            # JSON 파싱 실패 시 기본값 반환
            return {
                "structure_score": 0.0,
                "content_quality_score": 0.0,
                "total_score": 0.0,
                "feedback": ["LLM 평가 응답 파싱 실패"],
                "critical_issues": [],
                "warnings": [],
            }
        except Exception as e:
            logger.error(f"LLM 평가 실패: {str(e)}")
            raise
    
    def _evaluate_content_quality(self, draft: str, references: List[Dict[str, Any]]) -> tuple[float, List[str]]:
        """내용 품질 평가 (강화: 피상적 내용 체크 추가)"""
        import re
        score = 0.0
        feedback = []
        max_score = 40.0
        
        # 0. 피상적 내용 체크 (가장 중요)
        quality_check = self._check_content_quality(draft, references)
        if quality_check["is_too_superficial"]:
            feedback.extend(quality_check["issues"])
            # 피상적 내용이 있으면 점수 감점
            score -= 10.0  # 감점
        
        # 1. 법령 조문 번호 인용 정확성 (20점) - 필수 항목
        statute_pattern = r'제\s*(\d+)\s*조'
        statute_matches = re.findall(statute_pattern, draft)
        
        # 참고 문서의 조문 번호와 일치하는지 확인
        reference_statutes = set()
        if references:
            for ref in references:
                if ref.get("type") == "statute":
                    article_num = ref.get("article_number")
                    if article_num:
                        num_match = re.search(r'(\d+)', str(article_num))
                        if num_match:
                            reference_statutes.add(num_match.group(1))
        
        if len(statute_matches) >= 2:
            # 인용된 조문이 참고 문서와 일치하는지 확인
            draft_statutes = set(statute_matches)
            if reference_statutes:
                intersection = draft_statutes.intersection(reference_statutes)
                if intersection:
                    score += 20.0  # 정확한 조문 인용 시 만점
                else:
                    score += 5.0  # 조문은 인용했지만 잘못된 번호
                    feedback.append(f"인용된 법령 조문 번호({list(draft_statutes)[:3]})가 참고 문서의 조문 번호({list(reference_statutes)[:3]})와 일치하지 않습니다.")
            else:
                score += 15.0  # 참고 문서에 조문 번호가 없으면 부분 점수
        elif len(statute_matches) >= 1:
            score += 10.0  # 1개만 인용 시 절반 점수
            feedback.append("법령 조문 번호 인용이 부족합니다. 최소 2개 이상 인용하세요.")
        else:
            score += 0.0  # 인용이 없으면 점수 없음
            feedback.append("법령 조문 번호 인용이 없습니다. 참고 문서에 나온 법령 조문을 반드시 인용하세요.")
        
        # 2. 판례 번호 인용 (선택사항, 점수 없음)
        # 판례 번호는 필수가 아니므로 점수에 반영하지 않음
        case_pattern = r'(\d{4}[도나가다라마바사아자차카타노]\d+)'
        case_matches = re.findall(case_pattern, draft)
        if len(case_matches) == 0:
            feedback.append("판례 번호 인용이 없습니다 (선택사항).")
        
        # 3. 법률 용어 설명 포함 여부 (15점) - 판례 점수를 여기로 재분배
        # 주제에 따라 관련 법률 용어 목록 확장
        legal_terms = [
            "기망", "처분행위", "재산상 손해", "사기죄", "특가법", "특경법",
            "편취", "상습성", "경제질서", "구성요건", "법정형", "가중처벌",
            "퇴직금", "평균임금", "지체 없이", "손해배상", "지연이자"
        ]
        explained_terms = 0
        explained_term_list = []
        for term in legal_terms:
            # 용어(설명) 형식 확인 - 다양한 패턴 지원
            patterns = [
                rf"{re.escape(term)}\s*\([^)]+\)",  # 기망(설명)
                rf"{re.escape(term)}\s*\(\s*[^)]+\s*\)",  # 공백 포함
                rf"{re.escape(term)}\s*:\s*[^)]+",  # 기망: 설명 (대체 형식)
            ]
            for pattern in patterns:
                if re.search(pattern, draft, re.IGNORECASE):
                    explained_terms += 1
                    explained_term_list.append(term)
                    break  # 중복 카운트 방지
        
        if explained_terms >= 2:
            score += 15.0
        elif explained_terms >= 1:
            score += 8.0
            feedback.append(f"법률 용어 설명이 부족합니다. 현재 {explained_terms}개만 설명되었습니다. 최소 2개 이상 필요합니다.")
        else:
            score += 0.0  # 법률 용어 설명이 없으면 점수 없음
            feedback.append("법률 용어 설명이 없습니다. 최소 2개 이상의 법률 용어를 '용어(설명)' 형식으로 포함하세요.")
        
        # 4. 예시의 적절성 (5점) - 구체적 예시 존재 여부 확인
        example_keywords = ["예:", "예를 들어", "예시", "사례", "상황"]
        has_example = any(keyword in draft for keyword in example_keywords)
        
        # 구체적 예시인지 확인 (단순 키워드만 있는 게 아니라 실제 예시 내용이 있는지)
        if has_example:
            # 예시 섹션이 최소 50자 이상인지 확인
            example_section_match = re.search(r'(?:예:|예를\s+들어|예시|사례|상황)[^.]{30,}', draft, re.IGNORECASE)
            if example_section_match:
                score += 5.0
            else:
                score += 2.0  # 예시 키워드는 있지만 내용이 부족
                feedback.append("예시가 있지만 내용이 부족합니다. 구체적인 사례를 상세히 설명하세요.")
        else:
            score += 0.0
            feedback.append("예시가 없습니다. 구체적인 사례나 예시를 포함하세요.")
        
        # 점수는 0 이상으로 제한
        score = max(0.0, min(score, max_score))
        return score, feedback
    
    
    def _evaluate_legal_accuracy(self, draft: str, references: List[Dict[str, Any]], search_results: List[Dict[str, Any]]) -> tuple[float, List[str]]:
        """법적 정확성 평가"""
        import re
        score = 0.0
        feedback = []
        max_score = 30.0
        
        # 1. 법령 조문 번호 검증 (15점) - RAG 검색 결과와 대조
        statute_pattern = r'제(\d+)조(?:\s*의\s*(\d+))?'
        draft_statutes_raw = re.findall(statute_pattern, draft)
        # 조문 번호만 추출 (숫자만)
        draft_statutes = set()
        for match in draft_statutes_raw:
            main_num = match[0] if isinstance(match, tuple) else match
            draft_statutes.add(str(main_num))
        
        # 참고 문서에서 법령 정보 추출 (숫자만 추출)
        reference_statutes = set()
        for ref in references:
            article_num = ref.get("article_number")
            if article_num:
                # 문자열에서 숫자만 추출
                if isinstance(article_num, str):
                    # "347", "제347조", "347조" 등 다양한 형식 지원
                    num_match = re.search(r'(\d+)', str(article_num))
                    if num_match:
                        reference_statutes.add(num_match.group(1))
                else:
                    reference_statutes.add(str(article_num))
        
        logger.info(f"법령 조문 비교: 초안={draft_statutes}, 참고문서={reference_statutes}, references 수={len(references)}")
        
        if draft_statutes and reference_statutes:
            # 일치하는 조문이 있으면 점수 부여
            intersection = draft_statutes.intersection(reference_statutes)
            if intersection:
                score += 15.0
                logger.info(f"법령 조문 일치 확인: {intersection}")
            else:
                score += 5.0
                feedback.append(f"인용된 법령 조문({draft_statutes})이 참고 문서({reference_statutes})와 일치하지 않습니다.")
                logger.warning(f"법령 조문 불일치: 초안={draft_statutes}, 참고문서={reference_statutes}")
        elif not reference_statutes:
            # 참고 문서에 article_number가 없으면 참고 문서 정보 로깅
            logger.warning(f"참고 문서에 article_number가 없음. references={[r.get('id') for r in references[:3]]}")
        elif draft_statutes:
            score += 5.0
            feedback.append("법령 조문이 인용되었지만 참고 문서와 대조할 수 없습니다.")
        else:
            feedback.append("법령 조문 번호가 인용되지 않았습니다.")
        
        # 2. 판례 번호 검증 (선택사항, 점수 없음)
        # 판례 번호는 필수가 아니므로 점수에 반영하지 않음
        case_pattern = r'(\d{4}[도나가다라마바사아자차카타노]\d+)'
        draft_cases_raw = re.findall(case_pattern, draft)
        # 정규화: 공백 제거
        draft_cases = set(case.replace(" ", "").replace("-", "") for case in draft_cases_raw)
        
        reference_cases = set()
        for ref in references:
            case_num = ref.get("case_number")
            if case_num:
                # 문자열 정규화 (공백 제거, 형식 통일)
                case_num_clean = str(case_num).replace(" ", "").replace("-", "").replace(".", "")
                reference_cases.add(case_num_clean)
        
        logger.info(f"판례 번호 비교: 초안={draft_cases}, 참고문서={reference_cases}, references 수={len(references)}")
        
        if draft_cases and reference_cases:
            intersection = draft_cases.intersection(reference_cases)
            if intersection:
                logger.info(f"판례 번호 일치 확인: {intersection}")
            else:
                feedback.append(f"인용된 판례 번호({draft_cases})가 참고 문서({reference_cases})와 일치하지 않습니다 (선택사항).")
                logger.warning(f"판례 번호 불일치: 초안={draft_cases}, 참고문서={reference_cases}")
        elif not reference_cases and draft_cases:
            feedback.append("판례 번호가 인용되었지만 참고 문서와 대조할 수 없습니다 (선택사항).")
            logger.warning(f"참고 문서에 case_number가 없음. references={[r.get('id') for r in references[:3]]}")
        # 판례 번호가 없어도 점수 감점 없음
        
        # 3. 최신성 확인 (15점) - 기준 시점 명시 여부 (판례 점수를 여기로 재분배)
        # 더 엄격한 기준 시점 패턴 검증
        freshness_patterns = [
            r'\d{4}년\s*\d{1,2}월\s*기준',  # 2024년 12월 기준
            r'\d{4}\.\s*\d{1,2}\.\s*기준',  # 2024. 12. 기준
            r'\d{4}년\s*기준',  # 2024년 기준
            r'\d{4}\.\s*기준',  # 2024. 기준
            r'본\s*글은\s*\d{4}년',  # 본 글은 2024년
            r'\d{4}년\s*\d{1,2}월\s*현재',  # 2024년 12월 현재
            r'\d{4}년\s*\d{1,2}월\s*기준으로',  # 2024년 12월 기준으로
        ]
        
        has_freshness = any(re.search(pattern, draft) for pattern in freshness_patterns)
        if has_freshness:
            score += 15.0
        else:
            score += 0.0  # 기준 시점이 없으면 점수 없음
            feedback.append("기준 시점이 명시되지 않았습니다. 반드시 '2024년 12월 기준' 또는 '2025년 기준' 형식으로 명시하세요.")
        
        score = min(score, max_score)
        return score, feedback
    
    def _comprehensive_evaluate_node(self, state: ContentWorkflowState) -> ContentWorkflowState:
        """통합 종합 평가 노드 - 점수 계산 및 임계값 체크 (인포그래픽 구조에 맞게 통합)"""
        try:
            structure_score = state.get("structure_score", 0.0) or 0.0
            content_quality_score = state.get("content_quality_score", 0.0) or 0.0
            legal_accuracy_score = state.get("legal_accuracy_score", 0.0) or 0.0
            
            # 총점 계산
            total_score = structure_score + content_quality_score + legal_accuracy_score
            state["evaluation_score"] = total_score
            
            # 임계값 체크
            revision_count = state.get("revision_count", 0)
            max_revisions = state.get("max_revisions", 3)
            previous_score = state.get("previous_score", None)
            threshold = 70.0
            
            # critical validation issues 체크 (generate_draft에서 설정된 플래그)
            has_critical_validation_issues = state.get("has_critical_validation_issues", False)
            
            # 최대 재시도 횟수 체크
            if revision_count >= max_revisions:
                state["should_rewrite"] = False
                logger.warning(f"최대 재시도 횟수 도달: 점수={total_score:.1f}, 재시도={revision_count}")
                state["evaluation_feedback"].append(f"최대 재시도 횟수({max_revisions}회)에 도달했습니다. 현재 점수: {total_score:.1f}/100")
                return state
            
            # 점수 개선 확인 (critical issues가 없을 때만 체크)
            if not has_critical_validation_issues and previous_score is not None and total_score <= previous_score:
                logger.warning(f"점수 개선 없음: 이전={previous_score:.1f}, 현재={total_score:.1f}, 재작성 중단")
                state["should_rewrite"] = False
                state["evaluation_feedback"].append(f"재작성 후 점수가 개선되지 않아 중단했습니다. (이전: {previous_score:.1f}, 현재: {total_score:.1f})")
                return state
            
            # Critical validation issues가 있으면 무조건 재작성 필요
            if has_critical_validation_issues:
                state["previous_score"] = total_score
                state["should_rewrite"] = True
                logger.warning(f"Critical validation issues 발견: 재작성 필요. 점수={total_score:.1f}, 재시도={revision_count + 1}/{max_revisions}")
                # 플래그 초기화 (다음 재작성 시 다시 체크)
                state["has_critical_validation_issues"] = False
            elif total_score >= threshold:
                state["should_rewrite"] = False
                logger.info(f"평가 통과: 점수={total_score:.1f} >= {threshold}")
            else:
                state["previous_score"] = total_score
                state["should_rewrite"] = True
                logger.info(f"재작성 필요: 점수={total_score:.1f} < {threshold}, 재시도={revision_count + 1}/{max_revisions}")
            
            logger.info(
                f"종합 평가 완료: 구조={structure_score:.1f}/30, "
                f"내용={content_quality_score:.1f}/40, "
                f"법적={legal_accuracy_score:.1f}/30, "
                f"총점={total_score:.1f}/100, "
                f"재작성 필요={state.get('should_rewrite', False)}"
            )
            
        except Exception as e:
            logger.error(f"종합 평가 실패: {str(e)}")
            state["evaluation_score"] = 0.0
            state["should_rewrite"] = False
        
        return state
    
    def _rewrite_topic_node(self, state: ContentWorkflowState) -> ContentWorkflowState:
        """질문 재작성 노드 - 주제 구체화 및 키워드 조정"""
        try:
            topic = state.get("topic", "")
            evaluation_feedback = state.get("evaluation_feedback", [])
            revision_count = state.get("revision_count", 0)
            
            logger.info(f"질문 재작성 시작: 재시도={revision_count + 1}")
            
            # 재시도 횟수 증가
            state["revision_count"] = revision_count + 1
            
            # 피드백을 바탕으로 주제 구체화 (간단한 구현)
            if evaluation_feedback:
                # 피드백에서 키워드 추출하여 주제 보강
                feedback_text = " ".join(evaluation_feedback[:3])  # 최근 3개 피드백만 사용
                # 주제는 그대로 유지하되, 키워드 추가 가능
                logger.info(f"피드백 기반 주제 조정: {topic}")
            
            # 주제는 그대로 유지 (실제로는 LLM을 사용하여 개선 가능)
            logger.info("질문 재작성 완료")
            
        except Exception as e:
            logger.error(f"질문 재작성 실패: {str(e)}")
        
        return state
    
    def _adjust_prompt_node(self, state: ContentWorkflowState) -> ContentWorkflowState:
        """프롬프트 조정 노드 - 평가 피드백 반영하여 프롬프트 수정"""
        try:
            prompt = state.get("prompt", "")
            evaluation_feedback = state.get("evaluation_feedback", [])
            draft = state.get("draft", "")
            references = state.get("references", [])
            
            logger.info("프롬프트 조정 시작")
            
            # 피드백을 구체적인 개선 지시사항으로 변환
            if evaluation_feedback:
                improvement_instructions = []
                
                for fb in evaluation_feedback:
                    fb_lower = fb.lower()
                    
                    # 빈 섹션 관련 피드백
                    if "빈 섹션" in fb or "내용이 부족" in fb or "최소 길이" in fb or "피상적" in fb:
                        if "핵심 개념 정리" in fb or "피상적" in fb:
                            improvement_instructions.append(
                                "⚠️ '핵심 개념 정리' 섹션이 최소 길이 요구사항(200자 이상)을 만족하지 않거나 피상적입니다. "
                                "반드시 200자 이상의 **상세한** 내용을 작성하세요. "
                                "❌ 금지: '사기죄는 형법에 규정되어 있습니다' 같은 피상적 설명 "
                                "✅ 필수: '형법 제347조에 따르면, 사기죄는 타인을 기망하여 재산상의 이익을 취득하는 범죄입니다. "
                                "여기서 기망(상대방을 속이는 행위)은...' 형식으로 구성요건을 구체적으로 설명하세요."
                            )
                        elif "자주 묻는 질문" in fb or "q&a" in fb:
                            improvement_instructions.append(
                                "⚠️ '자주 묻는 질문 (Q&A)' 섹션이 최소 길이 요구사항을 만족하지 않습니다. "
                                "반드시 3개 이상의 질문과 각 질문에 대한 상세한 답변(각 답변 최소 100자 이상)을 작성하세요."
                            )
                        elif "상황 예시" in fb:
                            improvement_instructions.append(
                                "⚠️ '상황 예시' 섹션이 최소 길이 요구사항(100자 이상)을 만족하지 않거나 결말이 없습니다. "
                                "반드시 상황 묘사와 함께 결말이나 법적 결과를 포함하여 작성하세요. "
                                "현실적인 사례를 스토리텔링 형식으로 최소 100자 이상 작성하세요."
                            )
                        else:
                            improvement_instructions.append(
                                f"⚠️ {fb} - 해당 섹션의 최소 길이 요구사항을 반드시 만족하세요."
                            )
                    
                    # 법령 인용 관련 피드백
                    elif "법령 조문" in fb or "조문 번호" in fb:
                        # 참고 문서에서 법령 정보 추출
                        statute_list = []
                        for ref in references:
                            if ref.get("type") == "statute":
                                law_name = ref.get("law_name", "")
                                article_num = ref.get("article_number", "")
                                if law_name and article_num:
                                    statute_list.append(f"{law_name} 제{article_num}조")
                                elif article_num:
                                    statute_list.append(f"제{article_num}조")
                        
                        if statute_list:
                            improvement_instructions.append(
                                f"⚠️ 법령 조문 번호 인용이 부족합니다. 다음 법령을 반드시 본문에 인용하세요: "
                                f"{', '.join(statute_list)}. 각 법령은 \"[법령명] 제[조문번호]조에 따르면...\" 형식으로 인용하세요."
                            )
                        else:
                            improvement_instructions.append(
                                "⚠️ 법령 조문 번호 인용이 부족합니다. 참고 문서에 나온 법령 조문 번호를 반드시 본문에 인용하세요."
                            )
                    
                    # 판례 인용 관련 피드백
                    elif "판례 번호" in fb or "판례" in fb:
                        # 참고 문서에서 판례 정보 추출
                        case_list = []
                        for ref in references:
                            if ref.get("type") == "case":
                                case_num = ref.get("case_number", "")
                                court = ref.get("court", "")
                                if case_num:
                                    case_str = f"{court} {case_num} 판결" if court else f"{case_num} 판결"
                                    case_list.append(case_str)
                        
                        if case_list:
                            improvement_instructions.append(
                                f"⚠️ 판례 번호 인용이 없습니다. 다음 판례를 최소 1개 이상 본문에 인용하세요: "
                                f"{', '.join(case_list[:3])}. 각 판례는 다음 형식으로 상세히 인용하세요: "
                                f"\"[법원명] [판례번호] 판결에서는 [구체적인 사안 설명]. 법원은 [어떤 법리를 적용하여] [어떻게 인정/불인정했는지] 판단했습니다.\" "
                                f"판례 인용 시 반드시 구체적인 사안(사실관계)과 법원의 판단 내용을 포함하세요."
                            )
                        else:
                            improvement_instructions.append(
                                "⚠️ 판례 번호 인용이 없습니다. 참고 문서에 나온 판례 번호를 최소 1개 이상 본문에 인용하세요."
                            )
                    
                    # 법률 용어 설명 관련 피드백
                    elif "법률 용어" in fb or "용어 설명" in fb:
                        improvement_instructions.append(
                            "⚠️ 법률 용어 설명이 없습니다. 최소 2개 이상의 법률 용어를 \"용어(간단 설명)\" 형식으로 설명하세요. "
                            "예: \"기망(상대방을 속이는 행위)\", \"처분행위(재산을 처분하는 행위)\", \"사기죄(형법 제347조에 규정된 범죄)\" 등."
                        )
                    
                    # 글자수 부족 관련 피드백 (최우선 처리)
                    elif "글자수" in fb or "글자 수" in fb or "너무 짧" in fb or "부족" in fb or "재작성이 필요" in fb:
                        # 현재 글자수 추출
                        import re
                        current_length_match = re.search(r'현재.*?(\d+)\s*자', fb)
                        min_length_match = re.search(r'최소\s*(\d+)\s*자', fb)
                        
                        current_length = current_length_match.group(1) if current_length_match else "알 수 없음"
                        min_length = min_length_match.group(1) if min_length_match else "1800"
                        
                        improvement_instructions.insert(0,  # 최우선으로 맨 앞에 추가
                            f"🚨 **최우선 필수**: 콘텐츠 글자수가 심각하게 부족합니다! "
                            f"현재 {current_length}자인데, 반드시 최소 {min_length}자 이상 (공백 제외) 작성해야 합니다. "
                            f"이 요구사항을 만족하지 않으면 콘텐츠가 거부됩니다.\n"
                            f"**해결 방법**:\n"
                            f"1. 각 섹션을 더 상세하게 확장하세요 (예: 핵심 개념 정리 섹션을 300자 이상으로)\n"
                            f"2. 구체적인 예시와 사례를 더 많이 추가하세요\n"
                            f"3. 법령 조문의 구성요건을 더 상세히 설명하세요\n"
                            f"4. 판례의 사실관계와 판결 요지를 더 자세히 설명하세요\n"
                            f"5. Q&A 섹션을 추가하거나 각 답변을 더 길게 작성하세요\n"
                            f"6. 주의사항이나 예외 사항을 더 상세히 설명하세요\n"
                            f"**절대 금지**: 짧은 문장으로 채우거나 반복적인 내용으로 글자수만 채우는 것은 금지됩니다. "
                            f"모든 내용은 의미 있고 상세한 설명이어야 합니다."
                        )
                    
                    # 기준 시점 관련 피드백
                    elif "기준 시점" in fb or "시점" in fb:
                        improvement_instructions.append(
                            "⚠️ 기준 시점이 명시되지 않았습니다. 반드시 본문 어딘가에 \"2024년 12월 기준\" 또는 \"2025년 기준\" "
                            "형식으로 기준 시점을 명시하세요."
                        )
                    
                    # H3 하위 섹션 관련 피드백
                    elif "h3" in fb_lower or "하위 섹션" in fb:
                        improvement_instructions.append(
                            "⚠️ H3 하위 섹션(###)이 없습니다. 최소 1개 이상의 H3 하위 섹션을 사용하세요. "
                            "예: \"### 사기죄의 구성요건\", \"### 특경법 적용 요건\" 등."
                        )
                    
                    # 기타 피드백
                    else:
                        improvement_instructions.append(f"⚠️ {fb}")
                
                # 개선 지시사항을 프롬프트에 추가
                if improvement_instructions:
                    improvement_text = "\n".join([f"{idx + 1}. {inst}" for idx, inst in enumerate(improvement_instructions)])
                    adjusted_prompt = f"""{prompt}

## ⚠️ 이전 평가 피드백 및 필수 개선 사항

**중요**: 아래 문제점들을 반드시 해결하여 콘텐츠를 개선하세요. 이전 초안에서 발견된 문제점입니다.

{improvement_text}

**개선 확인 체크리스트** (모두 만족해야 함):
- [ ] 모든 섹션이 최소 길이 요구사항을 만족하는가? (핵심 개념 정리: 200자 이상, Q&A: 각 답변 100자 이상)
- [ ] 참고 문서에 나온 모든 법령 조문 번호를 **정확히** 인용했는가? (조문 번호 오류 없음)
- [ ] 참고 문서에 나온 판례 번호를 최소 1개 이상 **정확히** 인용했는가?
- [ ] 최소 2개 이상의 법률 용어를 "용어(설명)" 형식으로 포함했는가?
- [ ] 기준 시점을 명시했는가?
- [ ] 빈 섹션이 없는가?
- [ ] **피상적인 설명 없이 구체적이고 상세한 설명을 했는가?** (가장 중요)
  - ❌ 금지: "사기죄는 형법에 규정되어 있습니다"
  - ✅ 필수: "형법 제347조에 따르면, 사기죄는 타인을 기망하여 재산상의 이익을 취득하는 범죄입니다. 여기서 기망(상대방을 속이는 행위)은..."

**⚠️ 위 체크리스트를 모두 만족하지 않으면 콘텐츠가 거부됩니다. 반드시 상세하고 구체적인 내용으로 다시 작성하세요.**
"""
                    state["prompt"] = adjusted_prompt
                    logger.info(f"프롬프트 조정 완료: 피드백 {len(evaluation_feedback)}개를 {len(improvement_instructions)}개 개선 지시사항으로 변환")
            
        except Exception as e:
            logger.error(f"프롬프트 조정 실패: {str(e)}")
        
        return state
    
    def _re_search_node(self, state: ContentWorkflowState) -> ContentWorkflowState:
        """재검색 노드 - 평가 결과에 따라 관련 문서 재검색"""
        try:
            topic = state.get("topic", "")
            evaluation_feedback = state.get("evaluation_feedback", [])
            
            logger.info("재검색 시작")
            
            # 피드백을 바탕으로 검색 쿼리 개선 (간단한 구현)
            # 실제로는 피드백에서 키워드를 추출하여 검색 쿼리 보강 가능
            # 여기서는 기존 검색 노드 재사용
            search_state = self._search_documents_node(state)
            state.update(search_state)
            
            logger.info("재검색 완료")
            
        except Exception as e:
            logger.error(f"재검색 실패: {str(e)}")
        
        return state
    
    def _finalize_content_node(self, state: ContentWorkflowState) -> ContentWorkflowState:
        """최종 정리 노드 - 구조화된 블로그 형식으로 변환"""
        try:
            draft = state.get("draft", "")
            content_type = state.get("content_type", "blog")
            
            logger.info("최종 정리 시작")
            
            if content_type == "blog" and draft:
                # 구조화된 콘텐츠 추출
                structured_content = self._parse_structured_content(draft)
                state["structured_content"] = structured_content
                logger.info(f"최종 정리 완료: {len(structured_content)}개 섹션 추출")
            else:
                state["structured_content"] = {"content": draft}
            
        except Exception as e:
            logger.error(f"최종 정리 실패: {str(e)}")
            state["structured_content"] = {"content": draft}
        
        return state
    
    def _parse_structured_content(self, draft: str) -> Dict[str, str]:
        """구조화된 콘텐츠 파싱 - 9개 섹션 정확히 추출"""
        import re
        structured = {}
        
        # 섹션별 키워드 매핑 (다양한 헤더 형식 지원)
        section_keywords = {
            "title": [r"^#\s+", r"제목", r"Title", r"##\s+제목"],
            "tldr": [r"##\s+(요약|TL;DR|TLDR|핵심)", r"^#\s+요약", r"요약\s*:", r"TL;DR"],
            "situation_example": [r"##\s+(상황|예시|사례|시나리오)", r"상황\s*예시", r"실제\s*사례"],
            "core_concepts": [r"##\s+(핵심\s*개념|법령|판례|개념\s*정리)", r"핵심\s*개념", r"법적\s*기준"],
            "qa": [r"##\s+(Q&A|FAQ|자주\s*묻는|질문)", r"Q&A", r"질문과\s*답변"],
            "checklist": [r"##\s+(체크리스트|체크|To-do|할\s*일)", r"체크리스트", r"체크\s*사항"],
            "warnings": [r"##\s+(주의|예외|주의사항|경고)", r"주의\s*할\s*점", r"예외\s*사항"],
            "summary": [r"##\s+(마무리|요약|정리|권장)", r"마무리", r"결론"],
            "disclaimer": [r"##\s+(디스클레이머|면책|고지)", r"디스클레이머", r"면책\s*사항"],
        }
        
        # 마크다운 헤더로 섹션 분리
        # 패턴: # 또는 ## 또는 ###로 시작하는 헤더
        header_pattern = r'^(#{1,3})\s+(.+?)$'
        lines = draft.split('\n')
        
        current_section_id = None
        current_content = []
        current_header_level = 0
        
        for line in lines:
            header_match = re.match(header_pattern, line.strip())
            
            if header_match:
                # 헤더 발견
                header_level = len(header_match.group(1))
                header_text = header_match.group(2).strip()
                
                # 이전 섹션 저장
                if current_section_id and current_content:
                    structured[current_section_id] = '\n'.join(current_content).strip()
                
                # 새 섹션 매칭
                current_section_id = None
                for section_id, keywords in section_keywords.items():
                    for keyword_pattern in keywords:
                        if re.search(keyword_pattern, header_text, re.IGNORECASE):
                            current_section_id = section_id
                            current_content = []
                            current_header_level = header_level
                            break
                    if current_section_id:
                        break
                
                # 매칭되지 않으면 제목으로 간주 (H1인 경우)
                if not current_section_id and header_level == 1:
                    current_section_id = "title"
                    current_content = []
                    current_header_level = 1
                
            elif current_section_id:
                # 현재 섹션의 내용 추가
                # 다음 헤더가 나오기 전까지 계속 추가
                if line.strip() or current_content:  # 빈 줄도 유지 (의미 있는 경우)
                    current_content.append(line)
        
        # 마지막 섹션 저장
        if current_section_id and current_content:
            structured[current_section_id] = '\n'.join(current_content).strip()
        
        # 제목이 없으면 첫 줄을 제목으로 사용
        if "title" not in structured:
            first_line = draft.split('\n')[0].strip()
            if first_line.startswith('#'):
                structured["title"] = first_line.replace('#', '').strip()
            else:
                structured["title"] = first_line[:100]  # 첫 100자
        
        return structured
    
    def _generate_metadata_node(self, state: ContentWorkflowState) -> ContentWorkflowState:
        """메타데이터 생성 노드 - SEO 제목, 메타 디스크립션, 키워드, 카테고리 생성"""
        try:
            draft = state.get("draft", "")
            topic = state.get("topic", "")
            structured_content = state.get("structured_content", {})
            
            logger.info("메타데이터 생성 시작")
            
            metadata = {}
            
            # SEO 제목 (간단한 구현)
            title = structured_content.get("# " + topic, topic)
            metadata["seo_title"] = title[:120] if len(title) > 120 else title
            
            # 메타 디스크립션 (TL;DR 또는 첫 120자)
            tldr = structured_content.get("## 요약", "") or structured_content.get("## TL;DR", "")
            if tldr:
                metadata["meta_description"] = tldr[:120] if len(tldr) > 120 else tldr
            else:
                metadata["meta_description"] = draft[:120] if len(draft) > 120 else draft
            
            # 키워드 추출 (간단한 구현)
            import re
            keywords = re.findall(r'\b\w{2,}\b', topic)
            metadata["keywords"] = keywords[:5]
            
            # 카테고리 (간단한 분류)
            category_keywords = {
                "노무": ["퇴직금", "근로", "임금", "연차"],
                "개인정보": ["개인정보", "정보보호", "개인정보보호법"],
                "계약": ["계약", "계약서", "약관"],
                "분쟁": ["분쟁", "소송", "손해배상"],
            }
            
            category = "기타"
            for cat, keywords_list in category_keywords.items():
                if any(kw in topic for kw in keywords_list):
                    category = cat
                    break
            
            metadata["category"] = category
            metadata["tags"] = keywords[:3]
            
            # 버전 정보
            metadata["version"] = state.get("version", datetime.now().strftime("%Y%m%d"))
            
            state["metadata"] = metadata
            logger.info(f"메타데이터 생성 완료: 카테고리={category}, 키워드={len(metadata['keywords'])}개")
            
        except Exception as e:
            logger.error(f"메타데이터 생성 실패: {str(e)}")
            state["metadata"] = {}
        
        return state
    
    def _extract_reusable_blocks_node(self, state: ContentWorkflowState) -> ContentWorkflowState:
        """재사용 블록 추출 노드 - TL;DR, 체크리스트, Q&A, 숫자 팩트 추출"""
        try:
            draft = state.get("draft", "")
            structured_content = state.get("structured_content", {})
            
            logger.info("재사용 블록 추출 시작")
            
            reusable_blocks = {}
            
            # TL;DR 추출
            tldr = structured_content.get("## 요약", "") or structured_content.get("## TL;DR", "")
            if tldr:
                reusable_blocks["tldr"] = tldr.strip()
            
            # 체크리스트 추출
            import re
            checklist_pattern = r'[-*]\s*(.+?)(?=\n[-*]|\n\n|$)'
            checklist_items = re.findall(checklist_pattern, draft, re.MULTILINE)
            if checklist_items:
                reusable_blocks["checklist"] = checklist_items[:7]
            
            # Q&A 추출
            qa_pattern = r'(Q\d*[.:]\s*.+?)(?=Q\d*[.:]|$)'
            qa_matches = re.findall(qa_pattern, draft, re.DOTALL | re.IGNORECASE)
            if qa_matches:
                reusable_blocks["qa"] = qa_matches[:5]
            
            # 숫자 팩트 추출
            number_patterns = [
                r'(\d+일\s*이내)',
                r'(\d+년)',
                r'(\d+만\s*원)',
                r'(\d+개월)',
            ]
            facts = []
            for pattern in number_patterns:
                matches = re.findall(pattern, draft)
                facts.extend(matches[:2])
            
            if facts:
                reusable_blocks["facts"] = facts[:3]
            
            state["reusable_blocks"] = reusable_blocks
            logger.info(f"재사용 블록 추출 완료: {len(reusable_blocks)}개 블록")
            
        except Exception as e:
            logger.error(f"재사용 블록 추출 실패: {str(e)}")
            state["reusable_blocks"] = {}
        
        return state
    
    def run(
        self,
        topic: str,
        content_type: str = "blog",
        style: Optional[str] = None,
        target_length: Optional[int] = None,
        include_sections: Optional[List[str]] = None,
        keywords: Optional[List[str]] = None,
        document_types: Optional[List[str]] = None,
        n_references: int = 6,
        max_revisions: int = 3,
    ) -> Dict[str, Any]:
        """
        콘텐츠 생성 워크플로우 실행
        
        Args:
            topic: 생성할 콘텐츠 주제/키워드
            content_type: 콘텐츠 타입 (blog, article, opinion, analysis, faq)
            style: 작성 스타일
            target_length: 목표 글자 수
            include_sections: 포함할 섹션
            keywords: 포함할 키워드
            document_types: 참고할 문서 타입
            n_references: 참고할 문서 수
            max_revisions: 최대 재시도 횟수
            
        Returns:
            워크플로우 실행 결과
        """
        # 초기 상태 설정
        initial_state: ContentWorkflowState = {
            "topic": topic,
            "content_type": content_type,
            "style": style,
            "target_length": target_length,
            "include_sections": include_sections or [],
            "keywords": keywords or [],
            "document_types": document_types,
            "search_results": [],
            "context": "",
            "summarized_context": None,  # 문서 요약 단계 후 생성됨
            "references": [],
            "prompt": None,
            "draft": None,
            "structured_content": None,
            "structure_score": None,
            "content_quality_score": None,
            "legal_accuracy_score": None,
            "evaluation_score": None,
            "evaluation_feedback": [],
            "metadata": {},
            "reusable_blocks": {},
            "version": datetime.now().strftime("%Y%m%d"),
            "n_references": n_references,
            "revision_count": 0,
            "max_revisions": max_revisions,
            "should_rewrite": False,
            "previous_score": None,
            "error": None,
        }
        
        # 그래프가 아직 빌드되지 않았으면 빌드
        if self.graph is None:
            self.graph = self._build_graph()
        
        # 워크플로우 실행
        try:
            # 재귀 제한 설정과 함께 실행
            result = self.graph.invoke(
                initial_state,
                config={"recursion_limit": 50}  # 재작성 루프를 고려한 재귀 제한
            )
            
            # draft가 비어있으면 에러로 처리
            if not result.get("draft") or len(result.get("draft", "").strip()) == 0:
                logger.warning("생성된 콘텐츠가 비어있습니다.")
                # 최소한의 기본 콘텐츠라도 반환
                if result.get("error"):
                    result["draft"] = f"콘텐츠 생성 중 오류가 발생했습니다: {result.get('error')}"
                else:
                    result["draft"] = "콘텐츠 생성에 실패했습니다. 검색 결과가 부족하거나 평가 기준을 만족하지 못했습니다."
            
            return result
            
        except Exception as e:
            error_msg = str(e)
            logger.error(f"워크플로우 실행 실패: {error_msg}", exc_info=True)
            
            # 재귀 제한 오류인 경우 특별 처리
            if "recursion limit" in error_msg.lower():
                logger.error("재귀 제한에 도달했습니다. 재작성 루프가 너무 많이 반복되었습니다.")
                initial_state["error"] = "재작성 루프가 최대 횟수를 초과했습니다. 현재까지 생성된 콘텐츠를 반환합니다."
                # 최소한의 기본 메시지라도 반환
                if not initial_state.get("draft"):
                    initial_state["draft"] = "콘텐츠 생성 중 재작성 루프가 최대 횟수에 도달했습니다. 검색 결과를 기반으로 콘텐츠를 생성해주세요."
            else:
                initial_state["error"] = error_msg
                if not initial_state.get("draft"):
                    initial_state["draft"] = f"콘텐츠 생성 중 오류가 발생했습니다: {error_msg}"
            
            return initial_state

