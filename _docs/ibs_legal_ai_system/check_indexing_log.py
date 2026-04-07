#!/usr/bin/env python3
"""인덱싱 로그 확인 (processed 폴더 기반)"""

import sys
from pathlib import Path
from datetime import datetime

project_root = Path(__file__).parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

processed_dir = project_root / "data" / "processed"

# processed 폴더의 파일 수
json_files = list(processed_dir.rglob("*.json"))
total_files = len(json_files)

# 타입별 파일 수
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

print("=" * 60)
print("인덱싱 대상 파일 현황")
print("=" * 60)
print(f"\n총 JSON 파일 수: {total_files}개")
print(f"\n타입별 파일 수:")
for doc_type, count in sorted(type_files.items()):
    print(f"  {doc_type}: {count}개")

print(f"\n[INFO] 인덱싱이 진행 중입니다.")
print(f"       ChromaDB 인덱스가 업데이트되는 동안 접근이 불가능할 수 있습니다.")
print(f"       인덱싱이 완료되면 자동으로 해결됩니다.")

