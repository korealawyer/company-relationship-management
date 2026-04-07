#!/usr/bin/env python3
"""인덱싱 상태 확인 (간단 버전)"""

import sys
from pathlib import Path
import time

project_root = Path(__file__).parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

print("=" * 60)
print("인덱싱 상태 확인")
print("=" * 60)

# 1. processed 폴더 파일 수
processed_dir = project_root / "data" / "processed"
json_files = list(processed_dir.rglob("*.json"))
total_files = len(json_files)

print(f"\n1. processed 폴더:")
print(f"   총 JSON 파일 수: {total_files}개")

# 2. ChromaDB 접근 시도 (재시도 포함)
print(f"\n2. 벡터 DB 상태:")
vector_db_path = project_root / "data" / "vector_db"

if not vector_db_path.exists():
    print("   [ERROR] vector_db 폴더가 없습니다.")
    sys.exit(1)

# ChromaDB 파일 크기 확인
chroma_files = list(vector_db_path.rglob("*"))
total_size = sum(f.stat().st_size for f in chroma_files if f.is_file())
print(f"   벡터 DB 크기: {total_size / (1024*1024):.2f} MB")

# ChromaDB 접근 시도
import chromadb
from chromadb.config import Settings

max_retries = 5
retry_delay = 3

for attempt in range(max_retries):
    try:
        print(f"\n   ChromaDB 접근 시도 ({attempt + 1}/{max_retries})...")
        client = chromadb.PersistentClient(
            path=str(vector_db_path),
            settings=Settings(anonymized_telemetry=False)
        )
        collection = client.get_collection("legal_documents")
        
        # count() 시도
        try:
            total_chunks = collection.count()
            print(f"   [OK] 총 청크 수: {total_chunks}개")
        except Exception as e:
            print(f"   [WARNING] count() 실패: {str(e)[:100]}...")
            # get()으로 대체
            try:
                all_docs = collection.get(limit=100000)
                total_chunks = len(all_docs.get('ids', []))
                print(f"   [OK] get()으로 확인: {total_chunks}개 청크")
            except Exception as e2:
                raise e2
        
        # 타입별 통계
        all_docs = collection.get(limit=100000)
        if all_docs.get('metadatas'):
            types = {}
            for metadata in all_docs['metadatas']:
                doc_type = metadata.get('type', 'unknown')
                types[doc_type] = types.get(doc_type, 0) + 1
            
            print(f"\n   타입별 청크 수:")
            for doc_type, count in sorted(types.items()):
                print(f"     {doc_type}: {count}개")
        
        # 완료 여부 판단
        print(f"\n3. 완료 여부:")
        if total_chunks > 0:
            print(f"   [OK] 인덱싱이 완료되었거나 진행 중입니다.")
            print(f"   총 {total_chunks}개 청크가 인덱싱되었습니다.")
        else:
            print(f"   [진행중] 아직 인덱싱이 시작되지 않았습니다.")
        
        break
        
    except Exception as e:
        if attempt < max_retries - 1:
            print(f"   [WARNING] 접근 실패: {str(e)[:100]}...")
            print(f"   {retry_delay}초 후 재시도...")
            time.sleep(retry_delay)
        else:
            print(f"\n   [ERROR] 최종 실패: {str(e)[:100]}...")
            print(f"\n   [INFO] 인덱싱이 진행 중이거나 ChromaDB가 업데이트 중일 수 있습니다.")
            print(f"         잠시 후 다시 시도하거나, 인덱싱 프로세스가 완료될 때까지 기다려주세요.")
            sys.exit(1)

