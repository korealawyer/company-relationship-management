#!/usr/bin/env python3
"""형법 제101조 검색 디버깅 스크립트"""

import sys
from pathlib import Path
import asyncio

# 프로젝트 루트를 Python 경로에 추가
project_root = Path(__file__).parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

from src.rag.vector_store import VectorStore
from src.rag.embedding import EmbeddingGenerator
from src.rag.retriever import HybridRetriever
import chromadb
from chromadb.config import Settings


def check_direct_search():
    """직접 벡터 DB에서 형법 제101조 검색"""
    print("=" * 60)
    print("형법 제101조 직접 검색 테스트")
    print("=" * 60)
    
    # 1. ChromaDB에서 직접 검색
    print("\n1. ChromaDB 직접 검색")
    print("-" * 60)
    try:
        client = chromadb.PersistentClient(
            path=str(project_root / "data" / "vector_db"),
            settings=Settings(anonymized_telemetry=False)
        )
        collection = client.get_collection("legal_documents")
        
        # 형법 제101조 관련 문서 검색
        results = collection.get(
            where={"article_number": "101"},
            limit=10
        )
        
        print(f"article_number='101' 검색 결과: {len(results['ids'])}개")
        if results['ids']:
            for i, doc_id in enumerate(results['ids'][:5], 1):
                print(f"  {i}. {doc_id}")
                if results.get('metadatas'):
                    meta = results['metadatas'][i-1]
                    print(f"     제목: {meta.get('title', 'N/A')}")
                    print(f"     법률명: {meta.get('law_name', 'N/A')}")
                    print(f"     조문번호: {meta.get('article_number', 'N/A')}")
        else:
            print("  ❌ article_number='101'로 검색 결과 없음")
        
        # law_name으로 검색
        results2 = collection.get(
            where={"law_name": "형법"},
            limit=10
        )
        print(f"\nlaw_name='형법' 검색 결과: {len(results2['ids'])}개")
        
        # type으로 검색
        results3 = collection.get(
            where={"type": "statute"},
            limit=10
        )
        print(f"type='statute' 검색 결과: {len(results3['ids'])}개")
        
        # ID로 직접 검색
        results4 = collection.get(
            ids=["statute-형법-101_chunk_0"],
            limit=10
        )
        print(f"\nID='statute-형법-101_chunk_0' 검색 결과: {len(results4['ids'])}개")
        if results4['ids']:
            print("  ✅ 형법 제101조가 벡터 DB에 존재합니다!")
            if results4.get('documents'):
                print(f"  내용: {results4['documents'][0][:100]}...")
        else:
            print("  ❌ 형법 제101조가 벡터 DB에 없습니다!")
            
    except Exception as e:
        print(f"  ❌ 오류: {str(e)}")
        import traceback
        traceback.print_exc()
    
    # 2. 임베딩 검색 테스트
    print("\n2. 임베딩 검색 테스트")
    print("-" * 60)
    try:
        vector_store = VectorStore(collection_name="legal_documents")
        embedding_gen = EmbeddingGenerator()
        
        # 쿼리 임베딩 생성
        query = "형법 제101조"
        print(f"쿼리: '{query}'")
        
        query_embedding = asyncio.run(embedding_gen.embed_text(query))
        print(f"임베딩 생성 완료: {len(query_embedding)}차원")
        
        # 필터 없이 검색
        print("\n필터 없이 검색:")
        results = vector_store.search(
            query_embedding=query_embedding,
            n_results=10,
            where=None
        )
        print(f"결과: {len(results.get('ids', [])[0]) if results.get('ids') else 0}개")
        
        if results.get('ids') and len(results['ids'][0]) > 0:
            print("\n상위 5개 결과:")
            for i in range(min(5, len(results['ids'][0]))):
                doc_id = results['ids'][0][i]
                distance = results['distances'][0][i] if results.get('distances') else None
                metadata = results['metadatas'][0][i] if results.get('metadatas') else {}
                print(f"  {i+1}. {doc_id}")
                print(f"     거리: {distance:.4f if distance else 'N/A'}")
                print(f"     제목: {metadata.get('title', 'N/A')}")
                print(f"     조문번호: {metadata.get('article_number', 'N/A')}")
        
        # type='statute' 필터로 검색
        print("\ntype='statute' 필터로 검색:")
        results2 = vector_store.search(
            query_embedding=query_embedding,
            n_results=10,
            where={"type": "statute"}
        )
        print(f"결과: {len(results2.get('ids', [])[0]) if results2.get('ids') else 0}개")
        
        # article_number='101' 필터로 검색
        print("\narticle_number='101' 필터로 검색:")
        results3 = vector_store.search(
            query_embedding=query_embedding,
            n_results=10,
            where={"article_number": "101"}
        )
        print(f"결과: {len(results3.get('ids', [])[0]) if results3.get('ids') else 0}개")
        
    except Exception as e:
        print(f"  ❌ 오류: {str(e)}")
        import traceback
        traceback.print_exc()
    
    # 3. HybridRetriever로 검색 테스트
    print("\n3. HybridRetriever 검색 테스트")
    print("-" * 60)
    try:
        retriever = HybridRetriever(vector_store, embedding_gen)
        
        # 필터 없이 검색
        print("필터 없이 검색:")
        result = asyncio.run(retriever.search(
            query="형법 제101조",
            n_results=5,
            document_types=None,
            metadata_filters=None
        ))
        print(f"결과: {len(result.get('results', []))}개")
        if result.get('results'):
            for i, r in enumerate(result['results'][:3], 1):
                print(f"  {i}. {r.get('id', 'N/A')}")
                print(f"     제목: {r.get('metadata', {}).get('title', 'N/A')}")
        
        # document_types=['statute'] 필터로 검색
        print("\ndocument_types=['statute'] 필터로 검색:")
        result2 = asyncio.run(retriever.search(
            query="형법 제101조",
            n_results=5,
            document_types=["statute"],
            metadata_filters=None
        ))
        print(f"결과: {len(result2.get('results', []))}개")
        if result2.get('results'):
            for i, r in enumerate(result2['results'][:3], 1):
                print(f"  {i}. {r.get('id', 'N/A')}")
                print(f"     제목: {r.get('metadata', {}).get('title', 'N/A')}")
        else:
            print("  ❌ 결과 없음")
            if result2.get('error'):
                print(f"  에러: {result2.get('error')}")
                
    except Exception as e:
        print(f"  ❌ 오류: {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    check_direct_search()

