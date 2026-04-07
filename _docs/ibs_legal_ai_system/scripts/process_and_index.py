"""데이터 전처리 및 인덱싱 실행 스크립트"""

import sys
from pathlib import Path

# 프로젝트 루트를 Python 경로에 추가
project_root = Path(__file__).parent.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

from src.processors.pipeline import BatchProcessor
from src.rag import DocumentIndexer
import argparse
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(levelname)s:%(name)s:%(message)s'
)
logger = logging.getLogger(__name__)


def process_data(input_dir: str, output_dir: str, doc_type: str):
    """데이터 전처리"""
    print("=" * 60)
    print("1단계: 데이터 전처리")
    print("=" * 60)
    
    processor = BatchProcessor()
    
    results = processor.process_directory(
        input_dir=input_dir,
        output_dir=output_dir,
        doc_type=doc_type,
        clean=True,
        validate=True,
        remove_duplicates=True,
    )
    
    # 통계 계산
    total = len(results)
    success = sum(1 for success, _ in results.values() if success)
    failed = total - success
    
    print(f"\n처리 결과:")
    print(f"  총 파일: {total}개")
    print(f"  성공: {success}개")
    print(f"  실패: {failed}개")
    
    if failed > 0:
        print(f"\n실패한 파일:")
        for filename, (success, error) in results.items():
            if not success:
                print(f"  - {filename}: {error}")
    
    return success, total


def index_data(directory: str, collection_name: str = "legal_documents", chunk: bool = True):
    """데이터 인덱싱"""
    print("\n" + "=" * 60)
    print("2단계: 벡터 인덱싱")
    print("=" * 60)
    
    indexer = DocumentIndexer(
        collection_name=collection_name,
        chunk_size=1000,
        chunk_overlap=200,
    )
    
    results = indexer.index_directory(
        directory=Path(directory),
        pattern="*.json",
        chunk=chunk,
        recursive=True,
    )
    
    print(f"\n인덱싱 결과:")
    print(f"  총 파일: {results['total']}개")
    print(f"  성공: {results['success']}개")
    print(f"  실패: {results['failed']}개")
    
    # 총 청크 수 계산
    total_chunks = sum(
        r.get('chunks_count', 0) 
        for r in results['details'] 
        if isinstance(r, dict) and r.get('result', {}).get('success', False)
    )
    print(f"  총 청크 수: {total_chunks}개")
    
    if results['failed'] > 0:
        print(f"\n실패한 파일:")
        for detail in results['details']:
            if isinstance(detail, dict):
                file_path = detail.get('file', 'unknown')
                result = detail.get('result', {})
                if not result.get('success', False):
                    error = result.get('error', '알 수 없는 오류')
                    print(f"  - {file_path}: {error}")
    
    return results['success'], results['total']


def main():
    parser = argparse.ArgumentParser(description="데이터 전처리 및 인덱싱")
    parser.add_argument(
        "--input-dir",
        type=str,
        required=True,
        help="입력 디렉토리 (예: data/collected/statutes)"
    )
    parser.add_argument(
        "--output-dir",
        type=str,
        help="출력 디렉토리 (예: data/processed/statutes). 생략 시 입력 디렉토리와 동일"
    )
    parser.add_argument(
        "--doc-type",
        type=str,
        required=True,
        choices=["statute", "case", "procedure", "template", "manual", "faq", "statistics"],
        help="문서 타입"
    )
    parser.add_argument(
        "--collection-name",
        type=str,
        default="legal_documents",
        help="벡터 DB 컬렉션 이름 (기본값: legal_documents)"
    )
    parser.add_argument(
        "--skip-process",
        action="store_true",
        help="전처리 단계 건너뛰기 (이미 전처리된 데이터가 있는 경우)"
    )
    parser.add_argument(
        "--skip-index",
        action="store_true",
        help="인덱싱 단계 건너뛰기"
    )
    parser.add_argument(
        "--no-chunk",
        action="store_true",
        help="청킹 비활성화 (전체 문서를 하나의 벡터로 인덱싱)"
    )
    
    args = parser.parse_args()
    
    # 출력 디렉토리 기본값 설정
    if not args.output_dir:
        args.output_dir = args.input_dir.replace("collected", "processed")
    
    print(f"\n📁 입력 디렉토리: {args.input_dir}")
    print(f"📁 출력 디렉토리: {args.output_dir}")
    print(f"📄 문서 타입: {args.doc_type}")
    print(f"🗄️  컬렉션 이름: {args.collection_name}")
    print()
    
    # 1단계: 전처리
    if not args.skip_process:
        process_success, process_total = process_data(
            args.input_dir,
            args.output_dir,
            args.doc_type
        )
        
        if process_success == 0:
            print("\n⚠️  전처리된 파일이 없습니다. 인덱싱을 건너뜁니다.")
            return
    else:
        print("⏭️  전처리 단계 건너뛰기")
        process_output_dir = args.output_dir
        if not Path(process_output_dir).exists():
            print(f"⚠️  출력 디렉토리가 없습니다: {process_output_dir}")
            return
    
    # 2단계: 인덱싱
    if not args.skip_index:
        index_success, index_total = index_data(
            args.output_dir,
            args.collection_name,
            chunk=not args.no_chunk
        )
    else:
        print("⏭️  인덱싱 단계 건너뛰기")
    
    print("\n" + "=" * 60)
    print("✅ 전체 프로세스 완료!")
    print("=" * 60)


if __name__ == "__main__":
    main()

