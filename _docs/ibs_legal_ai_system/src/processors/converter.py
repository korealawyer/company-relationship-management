"""JSON 변환기 - 원본 데이터를 표준 JSON 형식으로 변환"""

import json
from pathlib import Path
from typing import Any, Dict, List, Optional
import logging

from ..models import BaseDocument
from .validator import DocumentValidator

logger = logging.getLogger(__name__)


class JSONConverter:
    """원본 데이터를 표준 JSON 형식으로 변환하는 클래스"""
    
    def __init__(self):
        self.validator = DocumentValidator()
    
    def convert_to_standard_format(
        self,
        raw_data: Dict[str, Any],
        doc_type: str,
    ) -> Optional[Dict[str, Any]]:
        """
        원본 데이터를 표준 JSON 형식으로 변환합니다.
        
        Args:
            raw_data: 원본 데이터 딕셔너리
            doc_type: 문서 타입 (statute, case, procedure 등)
            
        Returns:
            표준 형식의 JSON 딕셔너리 또는 None (변환 실패 시)
        """
        try:
            # 기본 필드 추출
            metadata = raw_data.get("metadata", {}).copy() if isinstance(raw_data.get("metadata"), dict) else {}
            
            # 문서 타입별 필수 메타데이터 필드 자동 추가
            if doc_type == "manual" and "manual_type" not in metadata:
                # manual_type이 없으면 sub_category나 fraud_category를 사용
                metadata["manual_type"] = raw_data.get("sub_category") or metadata.get("fraud_category") or "일반"
            
            if doc_type == "procedure" and "stage" not in metadata:
                metadata["stage"] = metadata.get("stage") or "일반"
            
            if doc_type == "faq" and "question" not in metadata:
                # FAQ의 경우 question 필드가 없으면 title을 사용
                metadata["question"] = raw_data.get("title", "")
            
            # statistics 타입의 경우 특별 처리
            if doc_type == "statistics":
                # content는 text 필드에서 가져옴
                content = raw_data.get("text", raw_data.get("content", ""))
                
                # 메타데이터 변환 (한글 필드명 → 영문 필드명)
                stats_metadata = {
                    "domain": raw_data.get("domain", "crime-statistics"),
                    "source": raw_data.get("source", ""),
                    "date": raw_data.get("date", ""),
                    "crime_category_main": metadata.get("범죄대분류", raw_data.get("category", "")),
                    "crime_category_mid": metadata.get("범죄중분류"),
                    "crime_category_sub": metadata.get("범죄소분류"),
                    "occurrence": metadata.get("발생"),
                    "arrest": metadata.get("검거"),
                    "arrest_rate": metadata.get("검거율"),
                    "arrest_male": metadata.get("검거인원(남)"),
                    "arrest_female": metadata.get("검거인원(여)"),
                    "arrest_unknown": metadata.get("불상"),
                    "arrest_corporate": metadata.get("법인체"),
                    "tags": raw_data.get("tags", []),
                    "embedding_text": raw_data.get("embedding_text"),
                    "updated_at": raw_data.get("date", ""),
                }
                
                standard_data = {
                    "id": raw_data.get("id", ""),
                    "category": "형사",  # 범죄 통계는 모두 형사 카테고리
                    "sub_category": raw_data.get("category", ""),  # 범죄 대분류를 sub_category로
                    "type": doc_type,
                    "title": raw_data.get("title", ""),
                    "content": content,
                    "metadata": stats_metadata,
                }
            else:
                standard_data = {
                    "id": raw_data.get("id", ""),
                    "category": raw_data.get("category", ""),
                    "sub_category": raw_data.get("sub_category", ""),
                    "type": doc_type,
                    "title": raw_data.get("title", ""),
                    "content": raw_data.get("content", ""),
                    "metadata": metadata,
                }
            
            # 필수 필드 검증
            if not standard_data["id"]:
                logger.warning("id 필드가 없습니다.")
                return None
            
            if not standard_data["title"]:
                logger.warning("title 필드가 없습니다.")
                return None
            
            # 검증
            success, model = self.validator.validate(standard_data)
            if not success:
                logger.error(f"변환된 데이터 검증 실패: {self.validator.get_errors()}")
                return None
            
            return standard_data
            
        except Exception as e:
            logger.error(f"데이터 변환 중 오류 발생: {str(e)}")
            return None
    
    def convert_file(
        self,
        input_path: Path | str,
        output_path: Path | str,
        doc_type: str,
    ) -> bool:
        """
        파일을 읽어서 표준 형식으로 변환하여 저장합니다.
        
        Args:
            input_path: 입력 파일 경로
            output_path: 출력 파일 경로
            doc_type: 문서 타입
            
        Returns:
            성공 여부
        """
        input_path = Path(input_path)
        output_path = Path(output_path)
        
        if not input_path.exists():
            logger.error(f"입력 파일이 존재하지 않습니다: {input_path}")
            return False
        
        try:
            # 원본 데이터 읽기
            with open(input_path, "r", encoding="utf-8") as f:
                raw_data = json.load(f)
            
            # 변환
            standard_data = self.convert_to_standard_format(raw_data, doc_type)
            if not standard_data:
                return False
            
            # 출력 디렉토리 생성
            output_path.parent.mkdir(parents=True, exist_ok=True)
            
            # 저장
            with open(output_path, "w", encoding="utf-8") as f:
                json.dump(standard_data, f, ensure_ascii=False, indent=2)
            
            logger.info(f"변환 완료: {input_path} -> {output_path}")
            return True
            
        except json.JSONDecodeError as e:
            logger.error(f"JSON 파싱 오류: {str(e)}")
            return False
        except Exception as e:
            logger.error(f"파일 변환 중 오류 발생: {str(e)}")
            return False
    
    def convert_batch(
        self,
        input_files: List[Path | str],
        output_dir: Path | str,
        doc_type: str,
    ) -> Dict[str, bool]:
        """
        여러 파일을 일괄 변환합니다.
        
        Args:
            input_files: 입력 파일 경로 리스트
            output_dir: 출력 디렉토리
            doc_type: 문서 타입
            
        Returns:
            {파일명: 성공 여부} 딕셔너리
        """
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)
        
        results = {}
        
        for input_file in input_files:
            input_path = Path(input_file)
            output_path = output_dir / input_path.name
            
            success = self.convert_file(input_path, output_path, doc_type)
            results[input_path.name] = success
        
        return results

