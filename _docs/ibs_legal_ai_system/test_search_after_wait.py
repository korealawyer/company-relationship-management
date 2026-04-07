#!/usr/bin/env python3
"""인덱싱 완료 후 검색 테스트 (대기 후 재시도)"""

import sys
from pathlib import Path
import asyncio
import time

project_root = Path(__file__).parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

from src.rag.vector_store import VectorStore
from src.rag.embedding import EmbeddingGenerator
from src.rag.retriever import HybridRetriever

async def test_with_retry():
    print("=" * 60)
    print("검색 테스트 (ChromaDB 안정화 대기)")
    print("=" * 60)
    
    # ChromaDB가 안정화될 때까지 대기
    print("\nChromaDB 안정화 대기 중... (10초)")
    time.sleep(10)
    
    vector_store = VectorStore(collection_name="legal_documents")
    embedding_gen = EmbeddingGenerator()
    retriever = HybridRetriever(vector_store, embedding_gen)
    
    # case 타입 검색
    print("\n1. case 타입 검색:")
    try:
        result1 = await retriever.search(
            query="사기",
            n_results=5,
            document_types=["case"],
            metadata_filters=None
        )
        print(f"   결과: {len(result1.get('results', []))}개")
        if result1.get('results'):
            for i, r in enumerate(result1['results'][:3], 1):
                print(f"   {i}. {r.get('id', 'N/A')}")
                print(f"      제목: {r.get('metadata', {}).get('title', 'N/A')[:60]}...")
        else:
            if result1.get('error'):
                print(f"   에러: {result1.get('error')}")
    except Exception as e:
        print(f"   검색 실패: {str(e)}")
    
    # 필터 없이 검색
    print("\n2. 필터 없이 검색:")
    try:
        result2 = await retriever.search(
            query="형법",
            n_results=5,
            document_types=None,
            metadata_filters=None
        )
        print(f"   결과: {len(result2.get('results', []))}개")
        if result2.get('results'):
            for i, r in enumerate(result2['results'][:3], 1):
                print(f"   {i}. {r.get('id', 'N/A')}")
                print(f"      타입: {r.get('metadata', {}).get('type', 'N/A')}")
                print(f"      제목: {r.get('metadata', {}).get('title', 'N/A')[:60]}...")
        else:
            if result2.get('error'):
                print(f"   에러: {result2.get('error')}")
    except Exception as e:
        print(f"   검색 실패: {str(e)}")

if __name__ == "__main__":
    asyncio.run(test_with_retry())

