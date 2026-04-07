#!/usr/bin/env python3
"""청킹 상태 확인 스크립트"""

import sys
from pathlib import Path

project_root = Path(__file__).parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

import chromadb
from chromadb.config import Settings

# ChromaDB 연결
client = chromadb.PersistentClient(
    path=str(project_root / "data" / "vector_db"),
    settings=Settings(anonymized_telemetry=False)
)
collection = client.get_collection("legal_documents")

# 전체 문서 수
total_count = collection.count()
print(f"벡터 DB 총 청크 수: {total_count}개")

# 샘플 문서 확인 (형법 제101조)
print("\n" + "=" * 60)
print("형법 제101조 청크 확인")
print("=" * 60)

results = collection.get(
    where={"document_id": "statute-형법-101"},
    limit=10
)

if results.get('ids'):
    print(f"\n발견된 청크 수: {len(results['ids'])}개")
    print("\n청크 목록:")
    for i, chunk_id in enumerate(results['ids'], 1):
        metadata = results['metadatas'][i-1] if results.get('metadatas') else {}
        chunk_index = metadata.get('chunk_index', 'N/A')
        title = metadata.get('title', 'N/A')
        print(f"  {i}. {chunk_id}")
        print(f"     청크 인덱스: {chunk_index}")
        print(f"     제목: {title}")
        if results.get('documents'):
            doc_preview = results['documents'][i-1][:100] if i-1 < len(results['documents']) else 'N/A'
            print(f"     내용 미리보기: {doc_preview}...")
        print()
else:
    print("\n형법 제101조를 찾을 수 없습니다.")

# 문서 타입별 청크 수 확인
print("\n" + "=" * 60)
print("문서 타입별 청크 수")
print("=" * 60)

doc_types = ["statute", "case", "statistics", "crime_type"]
for doc_type in doc_types:
    results = collection.get(
        where={"type": doc_type},
        limit=1
    )
    # 전체 개수를 정확히 세기 위해 count 사용
    try:
        # ChromaDB의 count는 where 절을 지원하지 않으므로 샘플링
        all_results = collection.get(
            where={"type": doc_type},
            limit=10000  # 최대 10000개까지
        )
        count = len(all_results['ids']) if all_results.get('ids') else 0
        print(f"{doc_type}: {count}개 청크 (샘플링)")
    except:
        print(f"{doc_type}: 확인 불가")

# document_id별 청크 수 확인
print("\n" + "=" * 60)
print("문서별 청크 수 (샘플)")
print("=" * 60)

# 모든 document_id 가져오기 (중복 제거)
all_results = collection.get(limit=1000)
if all_results.get('metadatas'):
    document_ids = {}
    for metadata in all_results['metadatas']:
        doc_id = metadata.get('document_id', 'unknown')
        if doc_id not in document_ids:
            document_ids[doc_id] = 0
        document_ids[doc_id] += 1
    
    print(f"\n총 고유 문서 수: {len(document_ids)}개")
    print("\n문서별 청크 수 (상위 10개):")
    sorted_docs = sorted(document_ids.items(), key=lambda x: x[1], reverse=True)[:10]
    for doc_id, chunk_count in sorted_docs:
        print(f"  {doc_id}: {chunk_count}개 청크")

