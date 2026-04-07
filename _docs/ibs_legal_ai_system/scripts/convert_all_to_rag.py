#!/usr/bin/env python3
"""
data 폴더의 모든 데이터를 RAG 데이터로 변환하는 통합 스크립트

1. collected 폴더의 데이터를 processed로 전처리
2. processed 데이터를 벡터 DB에 인덱싱
"""

import sys
from pathlib import Path
import logging
from typing import Dict, List, Tuple

# 프로젝트 루트를 Python 경로에 추가
project_root = Path(__file__).parent.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

from src.processors.pipeline import BatchProcessor
from src.rag.indexer import DocumentIndexer

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# 데이터 타입 매핑
DATA_TYPE_MAPPING = {
    "statutes": "statute",
    "cases": "case",
    "crime_types": "statistics",  # 범죄 유형은 statistics로 처리
    "rag_crime_db_2025_dec": "statistics",  # 범죄 DB도 statistics로 처리
    "statistics": "statistics",
    "faqs": "faq",
    "manuals": "manual",
    "trends": "statistics",  # 트렌드도 statistics로 처리
    "procedures": "procedure",
    "templates": "template",
}


def get_data_directories(collected_dir: Path) -> List[Tuple[str, Path, str]]:
    """
    collected 디렉토리에서 처리할 데이터 디렉토리 목록을 반환
    
    Returns:
        [(디렉토리명, 경로, doc_type), ...]
    """
    directories = []
    
    if not collected_dir.exists():
        logger.warning(f"collected 디렉토리가 존재하지 않습니다: {collected_dir}")
        return directories
    
    for item in collected_dir.iterdir():
        if not item.is_dir():
            continue
        
        dir_name = item.name
        doc_type = DATA_TYPE_MAPPING.get(dir_name, "statistics")  # 기본값: statistics
        
        directories.append((dir_name, item, doc_type))
        logger.info(f"발견된 데이터 디렉토리: {dir_name} -> {doc_type}")
    
    return directories


def process_data_directory(
    processor: BatchProcessor,
    input_dir: Path,
    output_dir: Path,
    doc_type: str
) -> Tuple[int, int]:
    """
    단일 데이터 디렉토리를 전처리
    
    Returns:
        (성공 개수, 전체 개수)
    """
    logger.info(f"전처리 시작: {input_dir} -> {output_dir} (타입: {doc_type})")
    
    try:
        results = processor.process_directory(
            input_dir=str(input_dir),
            output_dir=str(output_dir),
            doc_type=doc_type,
            clean=True,
            validate=True,
            remove_duplicates=True,
        )
        
        total = len(results)
        success = sum(1 for success, _ in results.values() if success)
        failed = total - success
        
        logger.info(f"전처리 완료: 성공 {success}개, 실패 {failed}개 (전체 {total}개)")
        
        if failed > 0:
            logger.warning(f"실패한 파일 목록:")
            for filename, (success_flag, error) in results.items():
                if not success_flag:
                    logger.warning(f"  - {filename}: {error}")
        
        return success, total
        
    except Exception as e:
        logger.error(f"전처리 중 오류 발생: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return 0, 0


def index_data_directory(
    indexer: DocumentIndexer,
    directory: Path,
    name: str
) -> Dict[str, int]:
    """
    단일 데이터 디렉토리를 인덱싱
    
    Returns:
        {"total": ..., "success": ..., "failed": ..., "chunks": ...}
    """
    logger.info(f"인덱싱 시작: {directory} ({name})")
    
    try:
        results = indexer.index_directory(
            directory=directory,
            pattern="*.json",
            chunk=True,
            recursive=True,
        )
        
        # 청크 수 계산
        chunks = sum(
            detail.get("result", {}).get("chunks_count", 0)
            for detail in results.get("details", [])
            if detail.get("result", {}).get("success", False)
        )
        
        stats = {
            "total": results["total"],
            "success": results["success"],
            "failed": results["failed"],
            "chunks": chunks,
        }
        
        logger.info(
            f"인덱싱 완료: 파일 {stats['success']}/{stats['total']}개 성공, "
            f"청크 {stats['chunks']}개"
        )
        
        if stats["failed"] > 0:
            logger.warning(f"실패한 파일 목록:")
            for detail in results.get("details", []):
                if not detail.get("result", {}).get("success", False):
                    file_path = detail.get("file", "unknown")
                    error = detail.get("result", {}).get("error", "알 수 없는 오류")
                    logger.warning(f"  - {file_path}: {error}")
        
        return stats
        
    except Exception as e:
        logger.error(f"인덱싱 중 오류 발생: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return {"total": 0, "success": 0, "failed": 0, "chunks": 0}


def main():
    """메인 실행 함수"""
    print("=" * 80)
    print("전체 데이터 RAG 변환 시작")
    print("=" * 80)
    
    collected_dir = project_root / "data" / "collected"
    processed_dir = project_root / "data" / "processed"
    
    # 디렉토리 확인
    if not collected_dir.exists():
        print(f"❌ collected 디렉토리가 없습니다: {collected_dir}")
        return
    
    # 처리할 디렉토리 목록 가져오기
    data_dirs = get_data_directories(collected_dir)
    
    if not data_dirs:
        print("⚠️  처리할 데이터 디렉토리가 없습니다.")
        return
    
    print(f"\n발견된 데이터 디렉토리: {len(data_dirs)}개")
    for dir_name, _, doc_type in data_dirs:
        print(f"  - {dir_name} ({doc_type})")
    
    # 프로세서 및 인덱서 생성
    processor = BatchProcessor()
    indexer = DocumentIndexer(
        collection_name="legal_documents",
        chunk_size=1000,
        chunk_overlap=200,
    )
    
    # 전체 통계
    total_process_stats = {"success": 0, "total": 0}
    total_index_stats = {"total": 0, "success": 0, "failed": 0, "chunks": 0}
    
    # 1단계: 전처리
    print("\n" + "=" * 80)
    print("1단계: 데이터 전처리")
    print("=" * 80)
    
    for dir_name, input_dir, doc_type in data_dirs:
        output_dir = processed_dir / dir_name
        
        print(f"\n[{dir_name}] 전처리 중...")
        print(f"  입력: {input_dir}")
        print(f"  출력: {output_dir}")
        print(f"  타입: {doc_type}")
        
        success, total = process_data_directory(
            processor,
            input_dir,
            output_dir,
            doc_type
        )
        
        total_process_stats["success"] += success
        total_process_stats["total"] += total
        
        print(f"  ✅ 성공: {success}개 / 전체: {total}개")
    
    print(f"\n전처리 전체 결과:")
    print(f"  성공: {total_process_stats['success']}개")
    print(f"  전체: {total_process_stats['total']}개")
    
    # 2단계: 인덱싱
    print("\n" + "=" * 80)
    print("2단계: 벡터 DB 인덱싱")
    print("=" * 80)
    
    # processed 디렉토리의 모든 JSON 파일 인덱싱
    if processed_dir.exists():
        print(f"\n[processed 전체] 인덱싱 중...")
        stats = index_data_directory(
            indexer,
            processed_dir,
            "처리된 데이터 (processed)"
        )
        
        total_index_stats["total"] += stats["total"]
        total_index_stats["success"] += stats["success"]
        total_index_stats["failed"] += stats["failed"]
        total_index_stats["chunks"] += stats["chunks"]
    
    # collected 디렉토리도 인덱싱 (processed에 없는 경우를 위해)
    print(f"\n[collected 전체] 인덱싱 중...")
    stats = index_data_directory(
        indexer,
        collected_dir,
        "수집된 데이터 (collected)"
    )
    
    total_index_stats["total"] += stats["total"]
    total_index_stats["success"] += stats["success"]
    total_index_stats["failed"] += stats["failed"]
    total_index_stats["chunks"] += stats["chunks"]
    
    # 최종 결과
    print("\n" + "=" * 80)
    print("전체 변환 완료")
    print("=" * 80)
    print(f"전처리:")
    print(f"  성공: {total_process_stats['success']}개")
    print(f"  전체: {total_process_stats['total']}개")
    print(f"\n인덱싱:")
    print(f"  파일: {total_index_stats['success']}/{total_index_stats['total']}개 성공")
    print(f"  청크: {total_index_stats['chunks']}개")
    print(f"  실패: {total_index_stats['failed']}개")
    
    # 인덱스 상태 확인
    try:
        status = indexer.get_index_status()
        print(f"\n벡터 DB 상태:")
        print(f"  총 문서 수: {status.get('document_count', 0)}개")
    except Exception as e:
        logger.warning(f"인덱스 상태 확인 실패: {str(e)}")
    
    print("=" * 80)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n변환이 사용자에 의해 중단되었습니다.")
        sys.exit(1)
    except Exception as e:
        logger.error(f"변환 중 오류 발생: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        sys.exit(1)

