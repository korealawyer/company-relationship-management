#!/usr/bin/env python3
"""인덱싱 진행 상황 확인"""

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

print("=" * 60)
print("인덱싱 진행 상황 확인")
print("=" * 60)

# 전체 청크 수
total = collection.count()
print(f"\n총 청크 수: {total}개")

# 타입별 통계
print("\n타입별 청크 수:")
all_docs = collection.get(limit=10000)
if all_docs.get('metadatas'):
    types = {}
    for metadata in all_docs['metadatas']:
        doc_type = metadata.get('type', 'unknown')
        types[doc_type] = types.get(doc_type, 0) + 1
    
    for doc_type, count in sorted(types.items()):
        print(f"  {doc_type}: {count}개 청크")
else:
    print("  데이터 없음")

# document_id별 통계 (샘플)
print("\n문서별 청크 수 (샘플, 상위 10개):")
if all_docs.get('metadatas'):
    docs = {}
    for metadata in all_docs['metadatas']:
        doc_id = metadata.get('document_id', 'unknown')
        docs[doc_id] = docs.get(doc_id, 0) + 1
    
    sorted_docs = sorted(docs.items(), key=lambda x: x[1], reverse=True)[:10]
    for doc_id, chunk_count in sorted_docs:
        print(f"  {doc_id}: {chunk_count}개 청크")

# processed 폴더의 파일 수 확인
processed_dir = project_root / "data" / "processed"
json_files = list(processed_dir.rglob("*.json"))
print(f"\nprocessed 폴더의 JSON 파일 수: {len(json_files)}개")

# 타입별 파일 수 (파일명 기반 추정)
type_files = {}
for file_path in json_files:
    filename = file_path.name.lower()
    if filename.startswith("statute-"):
        type_files["statute"] = type_files.get("statute", 0) + 1
    elif filename.startswith("case-"):
        type_files["case"] = type_files.get("case", 0) + 1
    elif filename.startswith("crime-"):
        if "rag_crime_db" in str(file_path.parent):
            type_files["statistics"] = type_files.get("statistics", 0) + 1
        else:
            type_files["crime_type"] = type_files.get("crime_type", 0) + 1

print("\n파일 타입별 파일 수 (추정):")
for doc_type, count in sorted(type_files.items()):
    print(f"  {doc_type}: {count}개 파일")

