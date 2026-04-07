#!/usr/bin/env python3
"""현재 인덱싱된 문서로 검색 테스트"""

import sys
from pathlib import Path
import asyncio

project_root = Path(__file__).parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

from src.rag.vector_store import VectorStore
from src.rag.embedding import EmbeddingGenerator
from src.rag.retriever import HybridRetriever

async def test():
    print("=" * 60)
    print("현재 인덱싱된 문서로 검색 테스트")
    print("=" * 60)
    
    vector_store = VectorStore(collection_name="legal_documents")
    embedding_gen = EmbeddingGenerator()
    retriever = HybridRetriever(vector_store, embedding_gen)
    
    # 1. case 타입 검색 (인덱싱 완료)
    print("\n1. case 타입 검색 (인덱싱 완료):")
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
    
    # 2. statute 타입 검색 (인덱싱 진행 중)
    print("\n2. statute 타입 검색 (인덱싱 진행 중):")
    result2 = await retriever.search(
        query="형법 제101조",
        n_results=5,
        document_types=["statute"],
        metadata_filters=None
    )
    print(f"   결과: {len(result2.get('results', []))}개")
    if result2.get('results'):
        for i, r in enumerate(result2['results'][:3], 1):
            print(f"   {i}. {r.get('id', 'N/A')}")
            print(f"      제목: {r.get('metadata', {}).get('title', 'N/A')[:60]}...")
    else:
        print("   [INFO] 아직 인덱싱되지 않았거나 검색 결과가 없습니다.")
    
    # 3. 필터 없이 검색 (모든 타입)
    print("\n3. 필터 없이 검색 (모든 타입):")
    result3 = await retriever.search(
        query="형법",
        n_results=5,
        document_types=None,
        metadata_filters=None
    )
    print(f"   결과: {len(result3.get('results', []))}개")
    if result3.get('results'):
        for i, r in enumerate(result3['results'][:3], 1):
            print(f"   {i}. {r.get('id', 'N/A')}")
            print(f"      타입: {r.get('metadata', {}).get('type', 'N/A')}")
            print(f"      제목: {r.get('metadata', {}).get('title', 'N/A')[:60]}...")
    
    # 4. statistics 타입 검색 (아직 시작 안 함)
    print("\n4. statistics 타입 검색 (아직 시작 안 함):")
    result4 = await retriever.search(
        query="교통범죄",
        n_results=5,
        document_types=["statistics"],
        metadata_filters=None
    )
    print(f"   결과: {len(result4.get('results', []))}개")
    if result4.get('results'):
        for i, r in enumerate(result4['results'][:3], 1):
            print(f"   {i}. {r.get('id', 'N/A')}")
    else:
        print("   [INFO] 아직 인덱싱되지 않았습니다.")

if __name__ == "__main__":
    asyncio.run(test())

