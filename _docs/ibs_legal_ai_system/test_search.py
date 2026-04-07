#!/usr/bin/env python3
"""검색 기능 테스트 스크립트"""

import sys
from pathlib import Path
import requests
import json

# 프로젝트 루트를 Python 경로에 추가
project_root = Path(__file__).parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

BASE_URL = "http://localhost:8000"


def test_health():
    """헬스체크 테스트"""
    print("=" * 60)
    print("1. 헬스체크 테스트")
    print("=" * 60)
    
    try:
        response = requests.get(f"{BASE_URL}/api/v1/health", timeout=5)
        if response.status_code == 200:
            print("✅ 서버가 실행 중입니다")
            print(f"   응답: {response.json()}")
            return True
        else:
            print(f"❌ 서버 응답 오류: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ 서버에 연결할 수 없습니다.")
        print("   서버를 실행하세요: python -m src.api.main")
        return False
    except Exception as e:
        print(f"❌ 오류 발생: {str(e)}")
        return False


def test_search(query: str, n_results: int = 5, document_types=None):
    """검색 테스트"""
    print(f"\n{'=' * 60}")
    print(f"2. 검색 테스트: '{query}'")
    print("=" * 60)
    
    url = f"{BASE_URL}/api/v1/search"
    data = {
        "query": query,
        "n_results": n_results,
    }
    
    if document_types:
        data["document_types"] = document_types
    
    try:
        print(f"요청 URL: {url}")
        print(f"요청 데이터: {json.dumps(data, ensure_ascii=False, indent=2)}")
        
        response = requests.post(url, json=data, timeout=30)
        
        print(f"\n응답 상태 코드: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ 검색 성공!")
            print(f"   총 결과 수: {result.get('total', 0)}개")
            
            results = result.get('results', [])
            if results:
                print(f"\n검색 결과 (상위 {len(results)}개):")
                for i, r in enumerate(results, 1):
                    print(f"\n  [{i}] ID: {r.get('id', 'N/A')}")
                    print(f"      제목: {r.get('metadata', {}).get('title', 'N/A')}")
                    print(f"      타입: {r.get('metadata', {}).get('type', 'N/A')}")
                    print(f"      거리: {r.get('distance', 'N/A')}")
                    doc_preview = r.get('document', '')[:100]
                    print(f"      내용 미리보기: {doc_preview}...")
            else:
                print("⚠️  검색 결과가 없습니다.")
                print(f"   전체 응답: {json.dumps(result, ensure_ascii=False, indent=2)}")
            
            return True
        else:
            print(f"❌ 검색 실패: {response.status_code}")
            try:
                error_detail = response.json()
                print(f"   오류 상세: {json.dumps(error_detail, ensure_ascii=False, indent=2)}")
            except:
                print(f"   응답 본문: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ 서버에 연결할 수 없습니다.")
        return False
    except Exception as e:
        print(f"❌ 오류 발생: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """메인 테스트 함수"""
    print("\n" + "=" * 60)
    print("검색 기능 테스트")
    print("=" * 60)
    
    # 1. 헬스체크
    if not test_health():
        print("\n서버를 먼저 실행하세요:")
        print("  python -m src.api.main")
        return
    
    # 2. 검색 테스트
    test_queries = [
        ("형법 제101조", None),
        ("형법 제101조", ["statute"]),
        ("사기죄", None),
    ]
    
    for query, doc_types in test_queries:
        test_search(query, n_results=5, document_types=doc_types)
    
    print("\n" + "=" * 60)
    print("테스트 완료")
    print("=" * 60)


if __name__ == "__main__":
    main()

