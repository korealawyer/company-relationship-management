#!/usr/bin/env python3
"""인덱싱 진행 상황 모니터링"""

import sys
from pathlib import Path
import time

project_root = Path(__file__).parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

import chromadb
from chromadb.config import Settings

client = chromadb.PersistentClient(
    path=str(project_root / "data" / "vector_db"),
    settings=Settings(anonymized_telemetry=False)
)
collection = client.get_collection("legal_documents")

print("인덱싱 진행 상황 모니터링 (Ctrl+C로 중단)")
print("=" * 60)

prev_count = 0
prev_types = {}

try:
    while True:
        # 현재 상태 확인
        total = collection.count()
        all_docs = collection.get(limit=10000)
        
        types = {}
        if all_docs.get('metadatas'):
            for metadata in all_docs['metadatas']:
                doc_type = metadata.get('type', 'unknown')
                types[doc_type] = types.get(doc_type, 0) + 1
        
        # 변화 확인
        new_chunks = total - prev_count
        if new_chunks > 0 or prev_count == 0:
            print(f"\n[{time.strftime('%H:%M:%S')}] 총 청크 수: {total}개 (+{new_chunks if new_chunks > 0 else 0})")
            print("타입별 청크 수:")
            for doc_type in sorted(set(list(types.keys()) + list(prev_types.keys()))):
                current = types.get(doc_type, 0)
                prev = prev_types.get(doc_type, 0)
                diff = current - prev
                diff_str = f" (+{diff})" if diff > 0 else ""
                print(f"  {doc_type}: {current}개{diff_str}")
        
        prev_count = total
        prev_types = types.copy()
        
        # 5초마다 확인
        time.sleep(5)
        
except KeyboardInterrupt:
    print("\n\n모니터링 중단")
    print(f"최종 상태: 총 {total}개 청크")
    for doc_type, count in sorted(types.items()):
        print(f"  {doc_type}: {count}개 청크")

