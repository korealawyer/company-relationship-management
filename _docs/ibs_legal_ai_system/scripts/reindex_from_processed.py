#!/usr/bin/env python3
"""
processed 폴더의 JSON 파일을 벡터 DB에 재인덱싱하는 스크립트

1. 벡터 DB 초기화 (기존 데이터 삭제)
2. processed 폴더의 모든 JSON 파일을 구조에 맞게 인덱싱
"""

import sys
from pathlib import Path
import asyncio
import logging
import json
from typing import Dict, Any

# 프로젝트 루트를 Python 경로에 추가
project_root = Path(__file__).parent.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

from src.rag.indexer import DocumentIndexer
from src.rag.vector_store import VectorStore
from src.processors.validator import DocumentValidator
from src.models import BaseDocument

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def reset_vector_db(collection_name: str = "legal_documents"):
    """벡터 DB 초기화 (모든 데이터 삭제)"""
    print("=" * 80)
    print("벡터 DB 초기화")
    print("=" * 80)
    
    try:
        vector_store = VectorStore(collection_name=collection_name)
        count_before = vector_store.get_count()
        print(f"기존 문서 수: {count_before}개")
        
        # 컬렉션 삭제 및 재생성
        vector_store.reset()
        print("[OK] 벡터 DB 초기화 완료")
        
        count_after = vector_store.get_count()
        print(f"초기화 후 문서 수: {count_after}개")
        
        return True
    except Exception as e:
        logger.error(f"벡터 DB 초기화 실패: {str(e)}", exc_info=True)
        return False


def detect_document_type(file_path: Path, content: Dict[str, Any]) -> str:
    """
    JSON 파일의 구조를 보고 문서 타입을 자동 감지
    
    Returns:
        문서 타입 (statute, case, crime_type, statistics, etc.)
    """
    # type 필드가 있으면 사용 (가장 우선)
    if "type" in content and content["type"]:
        return content["type"]
    
    # 파일명 패턴으로 추정
    filename = file_path.name.lower()
    if filename.startswith("statute-"):
        return "statute"
    elif filename.startswith("case-"):
        return "case"
    elif filename.startswith("crime-"):
        # rag_crime_db_2025_dec 폴더의 crime- 파일들은 statistics 타입
        if "rag_crime_db" in str(file_path.parent):
            return "statistics"
        return "crime_type"
    elif "statistics" in str(file_path.parent):
        return "statistics"
    elif "rag_crime_db" in str(file_path.parent):
        # rag_crime_db 폴더는 범죄 통계 데이터
        return "statistics"
    elif "faq" in str(file_path.parent):
        return "faq"
    elif "manual" in str(file_path.parent):
        return "manual"
    elif "procedure" in str(file_path.parent):
        return "procedure"
    elif "template" in str(file_path.parent):
        return "template"
    elif "trend" in str(file_path.parent):
        return "trend"
    
    # 기본값
    return "statute"


def index_processed_files(
    processed_dir: Path,
    collection_name: str = "legal_documents",
    chunk_size: int = 1000,
    chunk_overlap: int = 200,
):
    """
    processed 폴더의 모든 JSON 파일을 인덱싱
    
    Args:
        processed_dir: processed 폴더 경로
        collection_name: 벡터 DB 컬렉션 이름
        chunk_size: 청크 크기
        chunk_overlap: 청크 겹침
    """
    print("\n" + "=" * 80)
    print("processed 폴더 인덱싱 시작")
    print("=" * 80)
    sys.stdout.flush()
    
    # 인덱서 생성
    indexer = DocumentIndexer(
        collection_name=collection_name,
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
    )
    
    validator = DocumentValidator()
    
    # 모든 JSON 파일 찾기
    json_files = list(processed_dir.rglob("*.json"))
    total_files = len(json_files)
    
    print(f"\n발견된 JSON 파일: {total_files}개", flush=True)
    sys.stdout.flush()
    
    if total_files == 0:
        print("[WARNING] 인덱싱할 파일이 없습니다.")
        return
    
    # 통계
    stats = {
        "total": total_files,
        "success": 0,
        "failed": 0,
        "skipped": 0,
        "total_chunks": 0,
        "by_type": {}
    }
    
    failed_files = []
    
    # 파일별로 인덱싱
    for i, file_path in enumerate(json_files, 1):
        relative_path = file_path.relative_to(processed_dir)
        print(f"\n[{i}/{total_files}] 처리 중: {relative_path}", flush=True)
        sys.stdout.flush()  # 출력 버퍼 강제 플러시
        
        try:
            # JSON 파일 읽기
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # 문서 타입 감지
            doc_type = detect_document_type(file_path, data)
            
            # rag_crime_db 폴더의 파일은 type 필드가 statistics인지 확인
            if "rag_crime_db" in str(file_path.parent):
                if "type" in data and data["type"] != "statistics":
                    logger.warning(f"rag_crime_db 파일이지만 type이 '{data.get('type')}'입니다. 'statistics'로 변경합니다.")
                    data["type"] = "statistics"
                    doc_type = "statistics"
            
            # 문서 검증
            # validate 메서드는 (성공 여부, 모델 인스턴스) 튜플을 반환
            success, document = validator.validate(data)
            
            if not success:
                errors = validator.get_errors()
                error_msg = "; ".join(errors) if errors else "검증 실패"
                logger.warning(f"문서 검증 실패 (스킵): {error_msg}")
                stats["skipped"] += 1
                failed_files.append((file_path, error_msg))
                continue
            
            if document is None:
                logger.warning(f"문서 검증 성공했지만 모델이 None입니다 (스킵)")
                stats["skipped"] += 1
                failed_files.append((file_path, "검증 성공했지만 모델이 None"))
                continue
            
            # 인덱싱
            result = indexer.index_document(document, chunk=True)
            
            if result.get("success", False):
                chunks_count = result.get("chunks_count", 0)
                stats["success"] += 1
                stats["total_chunks"] += chunks_count
                
                # 타입별 통계
                if doc_type not in stats["by_type"]:
                    stats["by_type"][doc_type] = {"count": 0, "chunks": 0}
                stats["by_type"][doc_type]["count"] += 1
                stats["by_type"][doc_type]["chunks"] += chunks_count
                
                print(f"  [OK] 성공: {chunks_count}개 청크", flush=True)
            else:
                error = result.get("error", "알 수 없는 오류")
                stats["failed"] += 1
                failed_files.append((file_path, error))
                print(f"  [FAIL] 실패: {error}", flush=True)
            sys.stdout.flush()  # 출력 버퍼 강제 플러시
                
        except json.JSONDecodeError as e:
            logger.error(f"JSON 파싱 오류: {str(e)}")
            stats["failed"] += 1
            failed_files.append((file_path, f"JSON 파싱 오류: {str(e)}"))
        except Exception as e:
            logger.error(f"인덱싱 중 오류: {str(e)}", exc_info=True)
            stats["failed"] += 1
            failed_files.append((file_path, f"오류: {str(e)}"))
    
    # 결과 출력
    print("\n" + "=" * 80)
    print("인덱싱 완료")
    print("=" * 80)
    print(f"총 파일: {stats['total']}개")
    print(f"성공: {stats['success']}개")
    print(f"실패: {stats['failed']}개")
    print(f"스킵: {stats['skipped']}개")
    print(f"총 청크 수: {stats['total_chunks']}개")
    
    if stats["by_type"]:
        print("\n문서 타입별 통계:")
        for doc_type, type_stats in sorted(stats["by_type"].items()):
            print(f"  {doc_type}: {type_stats['count']}개 파일, {type_stats['chunks']}개 청크")
    
    if failed_files:
        print(f"\n실패한 파일 ({len(failed_files)}개):")
        for file_path, error in failed_files[:20]:  # 최대 20개만 출력
            print(f"  - {file_path.relative_to(processed_dir)}: {error}")
        if len(failed_files) > 20:
            print(f"  ... 외 {len(failed_files) - 20}개")
    
    # 벡터 DB 최종 상태 확인
    try:
        vector_store = VectorStore(collection_name=collection_name)
        final_count = vector_store.get_count()
        print(f"\n벡터 DB 최종 문서 수: {final_count}개")
    except Exception as e:
        logger.warning(f"벡터 DB 상태 확인 실패: {str(e)}")


def main():
    """메인 함수"""
    import argparse
    
    parser = argparse.ArgumentParser(
        description="processed 폴더의 JSON 파일을 벡터 DB에 재인덱싱"
    )
    parser.add_argument(
        "--processed-dir",
        type=str,
        default="data/processed",
        help="processed 폴더 경로 (기본값: data/processed)"
    )
    parser.add_argument(
        "--collection-name",
        type=str,
        default="legal_documents",
        help="벡터 DB 컬렉션 이름 (기본값: legal_documents)"
    )
    parser.add_argument(
        "--chunk-size",
        type=int,
        default=1000,
        help="청크 크기 (기본값: 1000)"
    )
    parser.add_argument(
        "--chunk-overlap",
        type=int,
        default=200,
        help="청크 겹침 (기본값: 200)"
    )
    parser.add_argument(
        "--no-reset",
        action="store_true",
        help="벡터 DB 초기화하지 않음 (기존 데이터 유지)"
    )
    
    args = parser.parse_args()
    
    processed_dir = project_root / args.processed_dir
    
    if not processed_dir.exists():
        print(f"[ERROR] processed 폴더가 존재하지 않습니다: {processed_dir}")
        sys.exit(1)
    
    print("=" * 80)
    print("processed 폴더 재인덱싱 스크립트")
    print("=" * 80)
    print(f"processed 폴더: {processed_dir}")
    print(f"컬렉션 이름: {args.collection_name}")
    print(f"청크 크기: {args.chunk_size}")
    print(f"청크 겹침: {args.chunk_overlap}")
    
    # 벡터 DB 초기화
    if not args.no_reset:
        if not reset_vector_db(args.collection_name):
            print("[ERROR] 벡터 DB 초기화 실패. 계속 진행하시겠습니까? (y/n)")
            response = input().strip().lower()
            if response != 'y':
                print("중단되었습니다.")
                sys.exit(1)
    else:
        print("\n[SKIP] 벡터 DB 초기화를 건너뜁니다 (--no-reset 옵션)")
    
    # 인덱싱 실행
    try:
        index_processed_files(
            processed_dir=processed_dir,
            collection_name=args.collection_name,
            chunk_size=args.chunk_size,
            chunk_overlap=args.chunk_overlap,
        )
        print("\n[OK] 재인덱싱 완료!")
    except KeyboardInterrupt:
        print("\n\n[WARNING] 사용자에 의해 중단되었습니다.")
        sys.exit(1)
    except Exception as e:
        logger.error(f"재인덱싱 중 오류 발생: {str(e)}", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    main()

