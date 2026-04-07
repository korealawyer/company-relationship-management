#!/usr/bin/env python3
"""검색 API를 통해 인덱싱 완료 여부 확인"""

import sys
from pathlib import Path
import requests
import json

project_root = Path(__file__).parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

print("=" * 60)
print("검색 API를 통한 인덱싱 완료 여부 확인")
print("=" * 60)

# API 서버 URL
api_url = "http://localhost:8000/api/v1/search"

# 테스트 쿼리들
test_queries = [
    {"query": "형법", "n_results": 5, "document_types": None},
    {"query": "사기", "n_results": 5, "document_types": ["case"]},
    {"query": "형법 제101조", "n_results": 5, "document_types": ["statute"]},
]

print(f"\nAPI 서버 확인: {api_url}")
print("=" * 60)

for i, test_query in enumerate(test_queries, 1):
    print(f"\n{i}. 테스트 쿼리: {test_query['query']}")
    print(f"   타입 필터: {test_query.get('document_types', '모든 타입')}")
    
    try:
        response = requests.post(
            api_url,
            json=test_query,
            timeout=10
        )
        
        if response.status_code == 200:
            result = response.json()
            results = result.get('results', [])
            print(f"   [OK] 검색 성공: {len(results)}개 결과")
            
            if results:
                print(f"   상위 3개 결과:")
                for j, r in enumerate(results[:3], 1):
                    metadata = r.get('metadata', {})
                    print(f"     {j}. {metadata.get('title', 'N/A')[:50]}...")
                    print(f"        타입: {metadata.get('type', 'N/A')}")
            else:
                print(f"   [INFO] 결과 없음 (인덱싱 미완료 또는 검색어 불일치)")
        else:
            print(f"   [ERROR] HTTP {response.status_code}: {response.text[:100]}")
            
    except requests.exceptions.ConnectionError:
        print(f"   [ERROR] API 서버에 연결할 수 없습니다.")
        print(f"          API 서버가 실행 중인지 확인하세요: python -m src.api.main")
        break
    except Exception as e:
        print(f"   [ERROR] {str(e)[:100]}")

print("\n" + "=" * 60)
print("결론:")
print("  - 검색이 정상 작동하면 인덱싱이 완료된 것입니다.")
print("  - 검색이 실패하면 인덱싱이 미완료이거나 API 서버 문제입니다.")
print("=" * 60)

