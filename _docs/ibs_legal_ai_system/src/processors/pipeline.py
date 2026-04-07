"""배치 처리 파이프라인"""

import json
from pathlib import Path
from typing import Any, Dict, List, Optional
import logging

from .converter import JSONConverter
from .cleaner import DataCleaner
from .validator import DocumentValidator

logger = logging.getLogger(__name__)


class BatchProcessor:
    """배치 처리 파이프라인"""
    
    def __init__(self):
        self.converter = JSONConverter()
        self.cleaner = DataCleaner()
        self.validator = DocumentValidator()
    
    def process_file(
        self,
        input_path: Path | str,
        output_path: Path | str,
        doc_type: str,
        clean: bool = True,
        validate: bool = True,
    ) -> tuple[bool, Optional[str]]:
        """
        단일 파일을 처리합니다.
        배열 형태의 JSON인 경우 각 항목을 개별 파일로 저장합니다.
        
        Args:
            input_path: 입력 파일 경로
            output_path: 출력 파일 경로
            doc_type: 문서 타입
            clean: 정제 여부
            validate: 검증 여부
            
        Returns:
            (성공 여부, 오류 메시지 또는 None)
        """
        input_path = Path(input_path)
        output_path = Path(output_path)
        
        try:
            # 1. 원본 데이터 읽기
            with open(input_path, "r", encoding="utf-8") as f:
                raw_data = json.load(f)
            
            # 배열인 경우 각 항목을 개별 파일로 처리
            if isinstance(raw_data, list):
                output_path.parent.mkdir(parents=True, exist_ok=True)
                success_count = 0
                error_count = 0
                
                for idx, item in enumerate(raw_data):
                    if not isinstance(item, dict):
                        logger.warning(f"배열 항목 {idx}이 딕셔너리가 아닙니다. 건너뜁니다.")
                        error_count += 1
                        continue
                    
                    # 각 항목을 개별 파일로 저장
                    item_id = item.get("id", f"item_{idx}")
                    item_output_path = output_path.parent / f"{item_id}.json"
                    
                    # 표준 형식으로 변환
                    standard_data = self.converter.convert_to_standard_format(item, doc_type)
                    if not standard_data:
                        logger.warning(f"항목 {item_id} 변환 실패")
                        error_count += 1
                        continue
                    
                    # 데이터 정제
                    if clean:
                        standard_data = self.cleaner.clean(standard_data)
                        
                        # 필수 필드 검증
                        valid, errors = self.cleaner.validate_required_fields(standard_data)
                        if not valid:
                            logger.warning(f"항목 {item_id} 필수 필드 검증 실패: {', '.join(errors)}")
                            error_count += 1
                            continue
                    
                    # 최종 검증
                    if validate:
                        success, model = self.validator.validate(standard_data)
                        if not success:
                            logger.warning(f"항목 {item_id} 검증 실패: {', '.join(self.validator.get_errors())}")
                            error_count += 1
                            continue
                    
                    # 저장
                    with open(item_output_path, "w", encoding="utf-8") as f:
                        json.dump(standard_data, f, ensure_ascii=False, indent=2)
                    
                    success_count += 1
                    logger.info(f"항목 처리 완료: {item_id} -> {item_output_path.name}")
                
                if success_count > 0:
                    logger.info(f"배열 파일 처리 완료: {success_count}개 성공, {error_count}개 실패")
                    return True, None
                else:
                    return False, f"모든 항목 처리 실패 ({error_count}개 실패)"
            
            # 단일 객체인 경우 기존 로직 사용
            # 2. 표준 형식으로 변환
            standard_data = self.converter.convert_to_standard_format(raw_data, doc_type)
            if not standard_data:
                return False, "표준 형식 변환 실패"
            
            # 3. 데이터 정제
            if clean:
                standard_data = self.cleaner.clean(standard_data)
                
                # 필수 필드 검증
                valid, errors = self.cleaner.validate_required_fields(standard_data)
                if not valid:
                    return False, f"필수 필드 검증 실패: {', '.join(errors)}"
            
            # 4. 최종 검증
            if validate:
                success, model = self.validator.validate(standard_data)
                if not success:
                    return False, f"검증 실패: {', '.join(self.validator.get_errors())}"
            
            # 5. 저장
            output_path.parent.mkdir(parents=True, exist_ok=True)
            with open(output_path, "w", encoding="utf-8") as f:
                json.dump(standard_data, f, ensure_ascii=False, indent=2)
            
            logger.info(f"처리 완료: {input_path.name} -> {output_path.name}")
            return True, None
            
        except Exception as e:
            error_msg = f"파일 처리 중 오류: {str(e)}"
            logger.error(error_msg)
            return False, error_msg
    
    def process_directory(
        self,
        input_dir: Path | str,
        output_dir: Path | str,
        doc_type: str,
        pattern: str = "*.json",
        clean: bool = True,
        validate: bool = True,
        remove_duplicates: bool = True,
    ) -> Dict[str, tuple[bool, Optional[str]]]:
        """
        디렉토리 내 모든 파일을 처리합니다.
        
        Args:
            input_dir: 입력 디렉토리
            output_dir: 출력 디렉토리
            doc_type: 문서 타입
            pattern: 파일 패턴 (기본값: *.json)
            clean: 정제 여부
            validate: 검증 여부
            remove_duplicates: 중복 제거 여부
            
        Returns:
            {파일명: (성공 여부, 오류 메시지 또는 None)} 딕셔너리
        """
        input_dir = Path(input_dir)
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)
        
        results = {}
        all_data = []
        
        # 재귀적으로 모든 파일 처리 (하위 폴더 포함)
        # pattern이 "*.json"이면 "**/*.json"으로 변경
        recursive_pattern = pattern if "**" in pattern else f"**/{pattern}"
        
        # 모든 파일 처리
        for input_file in input_dir.glob(recursive_pattern):
            # 상대 경로 유지 (하위 폴더 구조 보존)
            relative_path = input_file.relative_to(input_dir)
            output_file = output_dir / relative_path
            success, error = self.process_file(
                input_file, output_file, doc_type, clean, validate
            )
            results[str(relative_path)] = (success, error)
            
            # 성공한 경우 데이터 수집 (중복 제거용)
            if success and remove_duplicates:
                try:
                    with open(output_file, "r", encoding="utf-8") as f:
                        all_data.append(json.load(f))
                except Exception as e:
                    logger.warning(f"데이터 수집 실패: {output_file.name} - {str(e)}")
        
        # 중복 제거
        if remove_duplicates and all_data:
            unique_data = self.cleaner.remove_duplicates(all_data)
            
            # 중복 제거된 데이터로 다시 저장
            if len(unique_data) < len(all_data):
                logger.info(f"중복 제거: {len(all_data)} -> {len(unique_data)}")
                for data in unique_data:
                    output_file = output_dir / f"{data['id']}.json"
                    with open(output_file, "w", encoding="utf-8") as f:
                        json.dump(data, f, ensure_ascii=False, indent=2)
        
        return results
    
    def get_statistics(self, results: Dict[str, tuple[bool, Optional[str]]]) -> Dict[str, Any]:
        """
        처리 결과 통계를 반환합니다.
        
        Args:
            results: process_directory 또는 process_file 결과
            
        Returns:
            통계 딕셔너리
        """
        total = len(results)
        success_count = sum(1 for success, _ in results.values() if success)
        failure_count = total - success_count
        
        return {
            "total": total,
            "success": success_count,
            "failure": failure_count,
            "success_rate": success_count / total if total > 0 else 0.0,
        }

