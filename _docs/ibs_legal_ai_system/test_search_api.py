#!/usr/bin/env python3
"""검색 API 직접 테스트"""

import sys
from pathlib import Path
import asyncio
import requests
import json

project_root = Path(__file__).parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

from src.rag.vector_store import VectorStore
from src.rag.embedding import EmbeddingGenerator
from src.rag.retriever import HybridRetriever

def test_api():
    """API 직접 테스트"""
    print("=" * 60)
    print("검색 API 테스트")
    print("=" * 60)
    
    url = "http://localhost:8000/api/v1/search"
    data = {
        "query": "형법 제101조",
        "n_results": 5,
        "document_types": ["statute"]
    }
    
    try:
        print(f"\n요청: {json.dumps(data, ensure_ascii=False, indent=2)}")
        response = requests.post(url, json=data, timeout=30)
        
        print(f"\n응답 상태: {response.status_code}")
        result = response.json()
        print(f"결과 수: {result.get('total', 0)}개")
        
        if result.get('results'):
            print("\n검색 결과:")
            for i, r in enumerate(result['results'][:3], 1):
                print(f"  {i}. {r.get('id', 'N/A')}")
                print(f"     제목: {r.get('metadata', {}).get('title', 'N/A')}")
        else:
            print("\n❌ 검색 결과 없음")
            print(f"전체 응답: {json.dumps(result, ensure_ascii=False, indent=2)}")
            
    except requests.exceptions.ConnectionError:
        print("\n❌ 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인하세요.")
    except Exception as e:
        print(f"\n❌ 오류: {str(e)}")
        import traceback
        traceback.print_exc()

def test_direct():
    """직접 검색 테스트"""
    print("\n" + "=" * 60)
    print("직접 검색 테스트 (API 우회)")
    print("=" * 60)
    
    try:
        vector_store = VectorStore(collection_name="legal_documents")
        embedding_gen = EmbeddingGenerator()
        retriever = HybridRetriever(vector_store, embedding_gen)
        
        # 필터 없이 검색
        print("\n1. 필터 없이 검색:")
        result1 = asyncio.run(retriever.search(
            query="형법 제101조",
            n_results=5,
            document_types=None,
            metadata_filters=None
        ))
        print(f"   결과: {len(result1.get('results', []))}개")
        if result1.get('results'):
            for i, r in enumerate(result1['results'][:3], 1):
                print(f"   {i}. {r.get('id', 'N/A')}")
                print(f"      제목: {r.get('metadata', {}).get('title', 'N/A')}")
                print(f"      document_id: {r.get('metadata', {}).get('document_id', 'N/A')}")
        
        # document_types 필터만
        print("\n2. document_types=['statute'] 필터:")
        result2 = asyncio.run(retriever.search(
            query="형법 제101조",
            n_results=5,
            document_types=["statute"],
            metadata_filters=None
        ))
        print(f"   결과: {len(result2.get('results', []))}개")
        if result2.get('results'):
            for i, r in enumerate(result2['results'][:3], 1):
                print(f"   {i}. {r.get('id', 'N/A')}")
                print(f"      제목: {r.get('metadata', {}).get('title', 'N/A')}")
                print(f"      document_id: {r.get('metadata', {}).get('document_id', 'N/A')}")
        else:
            print("   ❌ 결과 없음")
            if result2.get('error'):
                print(f"   에러: {result2.get('error')}")
        
        # law_name 필터 추가
        print("\n3. law_name='형법' 필터 추가:")
        result3 = asyncio.run(retriever.search(
            query="형법 제101조",
            n_results=5,
            document_types=["statute"],
            metadata_filters={"law_name": "형법"}
        ))
        print(f"   결과: {len(result3.get('results', []))}개")
        if result3.get('results'):
            for i, r in enumerate(result3['results'][:3], 1):
                print(f"   {i}. {r.get('id', 'N/A')}")
                print(f"      제목: {r.get('metadata', {}).get('title', 'N/A')}")
                print(f"      document_id: {r.get('metadata', {}).get('document_id', 'N/A')}")
        else:
            print("   ❌ 결과 없음")
            if result3.get('error'):
                print(f"   에러: {result3.get('error')}")
                
    except Exception as e:
        print(f"\n❌ 오류: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_api()
    test_direct()

