#!/usr/bin/env python3
"""필터링 디버깅"""

import sys
from pathlib import Path
import asyncio
import re

project_root = Path(__file__).parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

from src.rag.vector_store import VectorStore
from src.rag.embedding import EmbeddingGenerator
from src.rag.retriever import HybridRetriever

async def test():
    vector_store = VectorStore(collection_name="legal_documents")
    embedding_gen = EmbeddingGenerator()
    
    # 쿼리 임베딩 생성
    query = "형법 제101조"
    query_embedding = await embedding_gen.embed_text(query)
    
    # 필터 없이 벡터 검색
    results = vector_store.search(
        query_embedding=query_embedding,
        n_results=10,
        where={"law_name": "형법"}
    )
    
    print("=" * 60)
    print("벡터 검색 결과 (law_name='형법' 필터)")
    print("=" * 60)
    print(f"결과 수: {len(results.get('ids', [])[0]) if results.get('ids') else 0}개\n")
    
    if results.get('ids') and len(results['ids'][0]) > 0:
        print("상위 10개 결과의 document_id:")
        for i in range(min(10, len(results['ids'][0]))):
            doc_id = results['ids'][0][i]
            metadata = results['metadatas'][0][i] if results.get('metadatas') else {}
            document_id = metadata.get('document_id', 'N/A')
            article_number = metadata.get('article_number', 'N/A')
            title = metadata.get('title', 'N/A')
            print(f"  {i+1}. ID: {doc_id}")
            print(f"     document_id: {document_id}")
            print(f"     article_number: {article_number}")
            print(f"     제목: {title[:50]}...")
            print()
        
        # article_number 필터 테스트
        print("\n" + "=" * 60)
        print("article_number='101' 필터 테스트")
        print("=" * 60)
        
        article_num = re.search(r'\d+', "101")
        if article_num:
            article_num_str = article_num.group()
            print(f"추출된 조문번호: {article_num_str}")
            
            filtered = []
            for i in range(len(results['ids'][0])):
                metadata = results['metadatas'][0][i] if results.get('metadatas') else {}
                document_id = metadata.get('document_id', '')
                if article_num_str in document_id:
                    filtered.append({
                        'id': results['ids'][0][i],
                        'document_id': document_id,
                        'title': metadata.get('title', 'N/A')
                    })
            
            print(f"\n필터링 결과: {len(filtered)}개")
            for i, r in enumerate(filtered[:5], 1):
                print(f"  {i}. {r['id']}")
                print(f"     document_id: {r['document_id']}")
                print(f"     제목: {r['title'][:50]}...")

if __name__ == "__main__":
    asyncio.run(test())

