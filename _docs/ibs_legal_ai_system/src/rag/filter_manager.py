"""공통 필터링 로직 관리"""

from typing import List, Dict, Any, Optional
import logging
import re

logger = logging.getLogger(__name__)


class FilterManager:
    """메타데이터 필터링 관리자"""
    
    # 유효한 문서 타입
    VALID_DOCUMENT_TYPES = {"case", "statute", "procedure", "template", "manual", "faq", "statistics"}
    
    @classmethod
    def filter_by_document_types(
        cls,
        results: List[Dict[str, Any]],
        document_types: Optional[List[str]]
    ) -> List[Dict[str, Any]]:
        """
        문서 타입으로 필터링합니다.
        
        Args:
            results: 필터링할 검색 결과 리스트
            document_types: 문서 타입 리스트 (None이면 필터링하지 않음)
            
        Returns:
            필터링된 결과 리스트
        """
        if not document_types:
            return results
        
        # "string"이나 빈 문자열 제거
        cleaned_doc_types = [dt for dt in document_types if dt and dt != "string"]
        if not cleaned_doc_types:
            return results
        
        # 유효한 타입만 필터링
        valid_types = [dt for dt in cleaned_doc_types if dt in cls.VALID_DOCUMENT_TYPES]
        if not valid_types:
            logger.warning(f"유효하지 않은 문서 타입: {cleaned_doc_types}, 모든 결과 반환")
            return results
        
        before_count = len(results)
        filtered = [
            r for r in results
            if r.get("metadata", {}).get("type") in valid_types
        ]
        logger.info(f"문서 타입 필터링: {before_count}개 -> {len(filtered)}개 (타입: {valid_types})")
        return filtered
    
    @classmethod
    def filter_by_metadata(
        cls,
        results: List[Dict[str, Any]],
        metadata_filters: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        메타데이터 필터로 필터링합니다.
        
        Args:
            results: 필터링할 검색 결과 리스트
            metadata_filters: 메타데이터 필터 딕셔너리
            
        Returns:
            필터링된 결과 리스트
        """
        if not metadata_filters:
            return results
        
        filtered = results.copy()
        before_count = len(filtered)
        
        for key, value in metadata_filters.items():
            if key == "type":  # 타입은 이미 필터링됨
                continue
            
            if key == "court_exclude":
                # 법원 제외 필터 (하급심 검색 시)
                filtered = [
                    r for r in filtered
                    if r.get("metadata", {}).get("court", "") != "대법원"
                ]
                logger.info(f"court_exclude 필터링: {before_count}개 -> {len(filtered)}개")
                
            elif key == "court_include":
                # 법원 포함 필터
                filtered = [
                    r for r in filtered
                    if r.get("metadata", {}).get("court", "") == value
                ]
                logger.info(f"court_include 필터링: {before_count}개 -> {len(filtered)}개 (값: {value})")
                
            elif key == "article_number":
                # article_number 필터는 document_id로 필터링
                article_num = re.search(r'\d+', str(value))
                if article_num:
                    article_num_str = article_num.group()
                    filtered = [
                        r for r in filtered
                        if article_num_str in r.get("metadata", {}).get("document_id", "")
                    ]
                    logger.info(f"article_number 필터링: {before_count}개 -> {len(filtered)}개 (값: {value}, 조문번호: {article_num_str})")
                else:
                    logger.warning(f"article_number 필터 '{value}'에서 숫자를 추출할 수 없어 필터를 무시합니다.")
                    
            elif key == "sub_category":
                # sub_category 필터링: 정확 매칭 또는 필드가 없는 문서 포함
                exact_match = [
                    r for r in filtered
                    if r.get("metadata", {}).get(key) == value or 
                       not r.get("metadata", {}).get(key)  # 필드가 없거나 빈 값인 경우도 포함
                ]
                if exact_match:
                    filtered = exact_match
                    matched_count = len([r for r in exact_match if r.get("metadata", {}).get(key) == value])
                    empty_count = len([r for r in exact_match if not r.get("metadata", {}).get(key)])
                    logger.info(f"{key} 필터링 (정확 매칭 + 필드 없음 포함): {before_count}개 -> {len(filtered)}개 "
                              f"(정확 매칭: {matched_count}개, 필드 없음: {empty_count}개, 값: {value})")
                else:
                    logger.warning(f"{key} 필터 '{value}'에 매칭되는 결과가 없어 필터를 무시합니다. "
                                 f"원본 결과 {before_count}개 유지")
                    
            elif key == "category":
                # category 필터링: 정확 매칭 우선, 없으면 부분 매칭
                exact_match = [
                    r for r in filtered
                    if r.get("metadata", {}).get(key) == value
                ]
                if exact_match:
                    filtered = exact_match
                    logger.info(f"{key} 필터링 (정확 매칭): {before_count}개 -> {len(filtered)}개 (값: {value})")
                else:
                    # 정확한 매칭이 없으면 부분 매칭 시도
                    partial_match = [
                        r for r in filtered
                        if value in str(r.get("metadata", {}).get(key, ""))
                    ]
                    if partial_match:
                        filtered = partial_match
                        logger.info(f"{key} 필터링 (부분 매칭): {before_count}개 -> {len(filtered)}개 (값: {value})")
                    else:
                        logger.warning(f"{key} 필터 '{value}'에 매칭되는 결과가 없어 필터를 무시합니다. "
                                     f"원본 결과 {before_count}개 유지")
            else:
                # 일반 필터 (정확한 매칭)
                filtered = [
                    r for r in filtered
                    if r.get("metadata", {}).get(key) == value
                ]
                logger.info(f"{key} 필터링: {before_count}개 -> {len(filtered)}개 (값: {value})")
            
            before_count = len(filtered)
        
        return filtered
    
    @classmethod
    def apply_filters(
        cls,
        results: List[Dict[str, Any]],
        document_types: Optional[List[str]] = None,
        metadata_filters: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        모든 필터를 적용합니다.
        
        Args:
            results: 필터링할 검색 결과 리스트
            document_types: 문서 타입 필터
            metadata_filters: 메타데이터 필터
            
        Returns:
            필터링된 결과 리스트
        """
        filtered = results.copy()
        
        # 문서 타입 필터링
        if document_types:
            filtered = cls.filter_by_document_types(filtered, document_types)
        
        # 메타데이터 필터링
        if metadata_filters:
            filtered = cls.filter_by_metadata(filtered, metadata_filters)
        
        return filtered
    
    @classmethod
    def relax_filters_on_empty(
        cls,
        filtered_results: List[Dict[str, Any]],
        original_results: List[Dict[str, Any]],
        metadata_filters: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        필터링 후 결과가 없을 때 필터를 완화합니다.
        
        Args:
            filtered_results: 필터링된 결과
            original_results: 원본 결과
            metadata_filters: 적용된 메타데이터 필터
            
        Returns:
            완화된 필터 결과
        """
        if len(filtered_results) == 0 and len(original_results) > 0:
            logger.warning(
                f"필터링 후 결과가 없습니다. 원본 결과: {len(original_results)}개"
            )
            
            # category나 sub_category 필터만 제거하고 재시도
            if metadata_filters and ("category" in metadata_filters or "sub_category" in metadata_filters):
                logger.info("category/sub_category 필터를 제거하고 원본 결과 반환")
                return original_results
        
        return filtered_results

