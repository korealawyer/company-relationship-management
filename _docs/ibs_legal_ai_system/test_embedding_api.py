"""임베딩 API 직접 테스트 스크립트"""

import asyncio
import time
import sys
import os
from pathlib import Path

# 프로젝트 루트를 경로에 추가
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from config.settings import settings
from langchain_openai import OpenAIEmbeddings


async def test_embedding_direct():
    """OpenAI API 직접 테스트"""
    print("=" * 80)
    print("임베딩 API 직접 테스트")
    print("=" * 80)
    
    print(f"\nAPI 키 확인: {settings.openai_api_key[:10]}..." if settings.openai_api_key else "API 키 없음!")
    print(f"모델: text-embedding-3-large")
    
    try:
        embeddings = OpenAIEmbeddings(
            model="text-embedding-3-large",
            openai_api_key=settings.openai_api_key,
            timeout=30.0,
            max_retries=2,
        )
        
        test_text = "사기죄와 특경법 적용 유무의 차이"
        print(f"\n테스트 텍스트: {test_text}")
        print(f"텍스트 길이: {len(test_text)}자")
        
        print("\n[1] 동기 방식 테스트 (embed_query)...")
        start_time = time.time()
        try:
            result = embeddings.embed_query(test_text)
            elapsed = time.time() - start_time
            print(f"✅ 성공! 소요 시간: {elapsed:.2f}초")
            print(f"   결과 차원: {len(result)}")
            print(f"   첫 5개 값: {result[:5]}")
        except Exception as e:
            elapsed = time.time() - start_time
            print(f"❌ 실패! 소요 시간: {elapsed:.2f}초")
            print(f"   오류: {type(e).__name__}: {str(e)}")
            return False
        
        print("\n[2] 비동기 방식 테스트 (asyncio.to_thread)...")
        start_time = time.time()
        try:
            result = await asyncio.wait_for(
                asyncio.to_thread(embeddings.embed_query, test_text),
                timeout=30.0
            )
            elapsed = time.time() - start_time
            print(f"✅ 성공! 소요 시간: {elapsed:.2f}초")
            print(f"   결과 차원: {len(result)}")
        except asyncio.TimeoutError:
            elapsed = time.time() - start_time
            print(f"❌ 타임아웃! 소요 시간: {elapsed:.2f}초 (30초 초과)")
            return False
        except Exception as e:
            elapsed = time.time() - start_time
            print(f"❌ 실패! 소요 시간: {elapsed:.2f}초")
            print(f"   오류: {type(e).__name__}: {str(e)}")
            return False
        
        print("\n[3] 짧은 텍스트 테스트...")
        short_text = "테스트"
        start_time = time.time()
        try:
            result = await asyncio.wait_for(
                asyncio.to_thread(embeddings.embed_query, short_text),
                timeout=30.0
            )
            elapsed = time.time() - start_time
            print(f"✅ 성공! 소요 시간: {elapsed:.2f}초")
            print(f"   결과 차원: {len(result)}")
        except Exception as e:
            elapsed = time.time() - start_time
            print(f"❌ 실패! 소요 시간: {elapsed:.2f}초")
            print(f"   오류: {type(e).__name__}: {str(e)}")
            return False
        
        print("\n" + "=" * 80)
        print("✅ 모든 테스트 통과!")
        print("=" * 80)
        return True
        
    except Exception as e:
        print(f"\n❌ 초기화 실패: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


async def test_openai_api_direct():
    """OpenAI API 직접 호출 테스트 (httpx 사용)"""
    print("\n" + "=" * 80)
    print("OpenAI API 직접 HTTP 호출 테스트")
    print("=" * 80)
    
    try:
        import httpx
        
        api_key = settings.openai_api_key
        if not api_key:
            print("❌ API 키가 없습니다!")
            return False
        
        url = "https://api.openai.com/v1/embeddings"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        data = {
            "model": "text-embedding-3-large",
            "input": "테스트"
        }
        
        print(f"\n요청 URL: {url}")
        print(f"모델: {data['model']}")
        print(f"입력: {data['input']}")
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            print("\nHTTP 요청 전송 중...")
            start_time = time.time()
            try:
                response = await client.post(url, headers=headers, json=data)
                elapsed = time.time() - start_time
                
                print(f"응답 수신! 소요 시간: {elapsed:.2f}초")
                print(f"상태 코드: {response.status_code}")
                
                if response.status_code == 200:
                    result = response.json()
                    embedding = result.get("data", [{}])[0].get("embedding", [])
                    print(f"✅ 성공!")
                    print(f"   임베딩 차원: {len(embedding)}")
                    print(f"   첫 5개 값: {embedding[:5]}")
                    return True
                else:
                    print(f"❌ 실패! 상태 코드: {response.status_code}")
                    print(f"   응답: {response.text[:500]}")
                    return False
                    
            except httpx.TimeoutException:
                elapsed = time.time() - start_time
                print(f"❌ 타임아웃! 소요 시간: {elapsed:.2f}초 (30초 초과)")
                print("   네트워크 연결 문제이거나 API 서버가 응답하지 않습니다.")
                return False
            except Exception as e:
                elapsed = time.time() - start_time
                print(f"❌ 오류 발생! 소요 시간: {elapsed:.2f}초")
                print(f"   오류: {type(e).__name__}: {str(e)}")
                import traceback
                traceback.print_exc()
                return False
                
    except ImportError:
        print("❌ httpx가 설치되지 않았습니다.")
        print("   설치: pip install httpx")
        return False
    except Exception as e:
        print(f"❌ 테스트 실패: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


async def main():
    """메인 함수"""
    print("\n" + "=" * 80)
    print("임베딩 API 문제 진단 도구")
    print("=" * 80)
    
    # 테스트 1: LangChain OpenAIEmbeddings 테스트
    result1 = await test_embedding_direct()
    
    # 테스트 2: OpenAI API 직접 HTTP 호출
    result2 = await test_openai_api_direct()
    
    print("\n" + "=" * 80)
    print("진단 결과 요약")
    print("=" * 80)
    print(f"LangChain OpenAIEmbeddings: {'✅ 정상' if result1 else '❌ 실패'}")
    print(f"OpenAI API 직접 호출: {'✅ 정상' if result2 else '❌ 실패'}")
    
    if not result1 and not result2:
        print("\n⚠️ 두 테스트 모두 실패했습니다.")
        print("가능한 원인:")
        print("1. 네트워크 연결 문제")
        print("2. OpenAI API 서버 문제")
        print("3. API 키 문제")
        print("4. 방화벽/프록시 설정 문제")
    elif not result1:
        print("\n⚠️ LangChain을 통한 호출만 실패했습니다.")
        print("LangChain 라이브러리 문제일 수 있습니다.")
    elif not result2:
        print("\n⚠️ 직접 HTTP 호출만 실패했습니다.")
        print("네트워크 또는 API 서버 문제일 수 있습니다.")


if __name__ == "__main__":
    asyncio.run(main())

