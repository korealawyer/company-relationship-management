#!/usr/bin/env python3
"""인덱싱 완료 여부 확인"""

import sys
from pathlib import Path

project_root = Path(__file__).parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

import chromadb
from chromadb.config import Settings

# processed 폴더의 파일 수
processed_dir = project_root / "data" / "processed"
json_files = list(processed_dir.rglob("*.json"))
total_files = len(json_files)

# 타입별 파일 수 추정
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

# 벡터 DB 상태
client = chromadb.PersistentClient(
    path=str(project_root / "data" / "vector_db"),
    settings=Settings(anonymized_telemetry=False)
)
collection = client.get_collection("legal_documents")

# 인덱싱 중일 때 count()가 실패할 수 있으므로 예외 처리
try:
    total_chunks = collection.count()
except Exception as e:
    print(f"[WARNING] count() 실패 (인덱싱 진행 중일 수 있음): {str(e)}")
    print("         collection.get()으로 대체 시도 중...")
    # get()으로 대체 시도
    try:
        all_docs_temp = collection.get(limit=100000)  # 충분히 큰 limit
        total_chunks = len(all_docs_temp.get('ids', []))
        print(f"         get()으로 확인된 청크 수: {total_chunks}개")
    except Exception as e2:
        print(f"[ERROR] get()도 실패: {str(e2)}")
        print("        인덱싱이 완료될 때까지 기다려주세요.")
        total_chunks = 0

# all_docs 가져오기 (재시도 로직 포함)
max_retries = 3
retry_delay = 2
all_docs = None
for attempt in range(max_retries):
    try:
        all_docs = collection.get(limit=10000)
        break
    except Exception as e:
        if attempt < max_retries - 1:
            print(f"[WARNING] get() 실패 (시도 {attempt + 1}/{max_retries}): {str(e)}")
            print(f"         {retry_delay}초 후 재시도...")
            import time
            time.sleep(retry_delay)
        else:
            print(f"[ERROR] get() 최종 실패: {str(e)}")
            print("        인덱싱이 완료될 때까지 기다려주세요.")
            all_docs = {'ids': [], 'metadatas': []}

# 타입별 청크 수
types = {}
if all_docs and all_docs.get('metadatas'):
    for metadata in all_docs['metadatas']:
        doc_type = metadata.get('type', 'unknown')
        types[doc_type] = types.get(doc_type, 0) + 1

# document_id별 개수 (고유 문서 수)
document_ids = set()
if all_docs and all_docs.get('metadatas'):
    for metadata in all_docs['metadatas']:
        doc_id = metadata.get('document_id', '')
        if doc_id:
            document_ids.add(doc_id)

print("=" * 60)
print("인덱싱 완료 여부 확인")
print("=" * 60)

print(f"\nprocessed 폴더:")
print(f"  총 JSON 파일 수: {total_files}개")
print(f"  타입별 파일 수:")
for doc_type, count in sorted(type_files.items()):
    print(f"    {doc_type}: {count}개")

print(f"\n벡터 DB:")
print(f"  총 청크 수: {total_chunks}개")
print(f"  고유 문서 수: {len(document_ids)}개")
print(f"  타입별 청크 수:")
for doc_type, count in sorted(types.items()):
    print(f"    {doc_type}: {count}개 청크")

# 완료 여부 판단
print(f"\n완료 여부:")
all_indexed = True
for doc_type, file_count in type_files.items():
    chunk_count = types.get(doc_type, 0)
    if chunk_count == 0:
        print(f"  {doc_type}: [미완료] {file_count}개 파일, 0개 청크")
        all_indexed = False
    else:
        print(f"  {doc_type}: [진행중/완료] {file_count}개 파일, {chunk_count}개 청크")

if all_indexed and len(document_ids) >= total_files * 0.9:  # 90% 이상 인덱싱되면 완료로 간주
    print("\n[OK] 인덱싱이 거의 완료되었습니다!")
else:
    print("\n[진행중] 인덱싱이 아직 진행 중입니다.")

