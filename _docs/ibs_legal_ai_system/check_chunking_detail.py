#!/usr/bin/env python3
"""청킹 상세 확인"""

import sys
from pathlib import Path

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

print("=" * 60)
print("청킹 상태 상세 확인")
print("=" * 60)

# 전체 청크 수
total = collection.count()
print(f"\n총 청크 수: {total}개")

# 샘플 문서 가져오기
all_results = collection.get(limit=100)
if all_results.get('ids'):
    print(f"\n샘플 문서 확인 (최대 100개):")
    
    # document_id별로 그룹화
    docs = {}
    for i, chunk_id in enumerate(all_results['ids']):
        metadata = all_results['metadatas'][i] if all_results.get('metadatas') and i < len(all_results['metadatas']) else {}
        doc_id = metadata.get('document_id', 'unknown')
        chunk_idx = metadata.get('chunk_index', 'N/A')
        doc_type = metadata.get('type', 'N/A')
        
        if doc_id not in docs:
            docs[doc_id] = {
                'type': doc_type,
                'chunks': []
            }
        docs[doc_id]['chunks'].append({
            'chunk_id': chunk_id,
            'chunk_index': chunk_idx
        })
    
    print(f"\n고유 문서 수: {len(docs)}개")
    print("\n문서별 청크 정보:")
    for doc_id, info in sorted(docs.items())[:20]:
        chunk_count = len(info['chunks'])
        chunk_indices = sorted([c['chunk_index'] for c in info['chunks'] if c['chunk_index'] != 'N/A'])
        print(f"\n  문서 ID: {doc_id}")
        print(f"    타입: {info['type']}")
        print(f"    청크 수: {chunk_count}개")
        if chunk_indices:
            print(f"    청크 인덱스: {min(chunk_indices)} ~ {max(chunk_indices)}")
        
        # 첫 번째 청크 내용 확인
        if info['chunks']:
            first_chunk_id = info['chunks'][0]['chunk_id']
            chunk_idx = all_results['ids'].index(first_chunk_id) if first_chunk_id in all_results['ids'] else -1
            if chunk_idx >= 0 and all_results.get('documents') and chunk_idx < len(all_results['documents']):
                content_preview = all_results['documents'][chunk_idx][:150]
                print(f"    첫 청크 미리보기: {content_preview}...")

# 타입별 통계
print("\n" + "=" * 60)
print("타입별 통계")
print("=" * 60)

types = {}
all_docs = collection.get(limit=10000)
if all_docs.get('metadatas'):
    for metadata in all_docs['metadatas']:
        doc_type = metadata.get('type', 'unknown')
        types[doc_type] = types.get(doc_type, 0) + 1

for doc_type, count in sorted(types.items()):
    print(f"  {doc_type}: {count}개 청크")

