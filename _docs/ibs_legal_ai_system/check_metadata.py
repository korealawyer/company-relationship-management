#!/usr/bin/env python3
"""형법 제101조 메타데이터 확인"""

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

# 형법 제101조 ID로 직접 가져오기
results = collection.get(
    ids=["statute-형법-101_chunk_0"],
    limit=1
)

if results['ids']:
    print("=" * 60)
    print("형법 제101조 메타데이터 확인")
    print("=" * 60)
    print(f"\nID: {results['ids'][0]}")
    print(f"\n메타데이터:")
    if results.get('metadatas'):
        metadata = results['metadatas'][0]
        for key, value in sorted(metadata.items()):
            print(f"  {key}: {value}")
    
    print(f"\n문서 내용 (처음 200자):")
    if results.get('documents'):
        print(f"  {results['documents'][0][:200]}...")
else:
    print("형법 제101조를 찾을 수 없습니다.")

# 모든 형법 조문의 article_number 확인
print("\n" + "=" * 60)
print("형법 조문들의 article_number 확인")
print("=" * 60)
results2 = collection.get(
    where={"law_name": "형법"},
    limit=20
)

if results2.get('metadatas'):
    print(f"\n총 {len(results2['metadatas'])}개 형법 문서 중 article_number가 있는 것:")
    has_article = 0
    for i, meta in enumerate(results2['metadatas']):
        article_num = meta.get('article_number')
        if article_num:
            has_article += 1
            if has_article <= 10:
                print(f"  {meta.get('id', 'N/A')}: article_number='{article_num}'")
    print(f"\narticle_number가 있는 문서: {has_article}/{len(results2['metadatas'])}개")

