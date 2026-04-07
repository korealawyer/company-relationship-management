#!/usr/bin/env python3
"""
검색 단계만 디버그하는 스크립트

검색이 제대로 작동하는지 확인합니다.
"""

import sys
from pathlib import Path

# 프로젝트 루트를 Python 경로에 추가
project_root = Path(__file__).parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

from src.rag import VectorStore, EmbeddingGenerator
from src.rag.workflow import RAGWorkflow
from config.settings import settings

import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
)
logger = logging.getLogger(__name__)


def debug_search():
    """검색 디버그"""
    
    print("=" * 80)
    print("검색 디버그")
    print("=" * 80)
    
    query = "사기죄와 특경법 적용 유무의 차이 설명해줘"
    document_types = None  # 모든 타입 검색
    
    print(f"\n검색 쿼리: {query}")
    print(f"문서 타입 필터: {document_types}")
    
    # 초기화
    print("\n[1] 컴포넌트 초기화 중...")
    try:
        vector_store = VectorStore()
        embedding_generator = EmbeddingGenerator()
        rag_workflow = RAGWorkflow(vector_store, embedding_generator)
        print("✅ 초기화 완료")
    except Exception as e:
        print(f"❌ 초기화 실패: {str(e)}")
        import traceback
        traceback.print_exc()
        return
    
    # 벡터 DB 상태 확인
    print("\n[2] 벡터 DB 상태 확인...")
    try:
        total_docs = vector_store.get_count()
        print(f"  - 총 문서 수: {total_docs}개")
        
        # 타입별 문서 수 확인
        for doc_type in ["statute", "case", "statistics"]:
            try:
                # ChromaDB에서 직접 확인
                results = vector_store.collection.get(
                    where={"type": doc_type},
                    limit=1
                )
                count = len(results.get("ids", []))
                if count > 0:
                    # 전체 개수는 get으로는 알 수 없으므로 샘플만 확인
                    print(f"  - {doc_type} 타입: 샘플 확인됨 (최소 1개 이상)")
                else:
                    print(f"  - {doc_type} 타입: 없음")
            except Exception as e:
                print(f"  - {doc_type} 타입 확인 실패: {str(e)}")
    except Exception as e:
        print(f"⚠️ 벡터 DB 상태 확인 실패: {str(e)}")
    
    # 검색 실행
    print("\n[3] 검색 실행 중...")
    try:
        result = rag_workflow.run(
            query=query,
            metadata_filters=None,
            document_types=document_types,
            n_results=10,
        )
        
        print("\n검색 결과:")
        print(f"  - 총 결과 수: {len(result.get('reranked_results', []))}개")
        print(f"  - 컨텍스트 길이: {len(result.get('context', ''))}자")
        print(f"  - 에러: {result.get('error', 'None')}")
        
        reranked_results = result.get("reranked_results", [])
        if reranked_results:
            print(f"\n검색 결과 상세 (최대 5개):")
            for i, res in enumerate(reranked_results[:5], 1):
                metadata = res.get("metadata", {})
                print(f"\n  {i}. ID: {res.get('id', 'N/A')}")
                print(f"     타입: {metadata.get('type', 'N/A')}")
                print(f"     제목: {metadata.get('title', 'N/A')[:60]}...")
                print(f"     거리: {res.get('distance', 'N/A')}")
                print(f"     문서 내용: {res.get('document', '')[:100]}...")
        else:
            print("\n❌ 검색 결과가 없습니다!")
            print("가능한 원인:")
            print("  1. 벡터 DB에 문서가 인덱싱되지 않음")
            print("  2. 검색 쿼리와 문서의 유사도가 너무 낮음")
            print("  3. document_types 필터가 너무 제한적")
        
        # 컨텍스트 확인
        context = result.get("context", "")
        if context:
            print(f"\n컨텍스트 미리보기 (처음 500자):")
            print("-" * 80)
            print(context[:500] + "..." if len(context) > 500 else context)
            print("-" * 80)
        else:
            print("\n⚠️ 컨텍스트가 비어있습니다!")
        
    except Exception as e:
        print(f"\n❌ 검색 실패: {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    try:
        debug_search()
    except KeyboardInterrupt:
        print("\n\n⚠️ 사용자에 의해 중단되었습니다.")
        sys.exit(0)
    except Exception as e:
        print(f"\n\n❌ 치명적 오류 발생: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

