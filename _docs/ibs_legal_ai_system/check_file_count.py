#!/usr/bin/env python3
"""파일 수 확인"""

from pathlib import Path

processed_dir = Path("data/processed")
json_files = list(processed_dir.rglob("*.json"))

print(f"총 JSON 파일: {len(json_files)}개")
print("\n타입별 파일 수:")

case_files = [f for f in json_files if f.name.startswith("case-")]
statute_files = [f for f in json_files if f.name.startswith("statute-")]
crime_files = [f for f in json_files if f.name.startswith("crime-")]

print(f"  case: {len(case_files)}개")
print(f"  statute: {len(statute_files)}개")
print(f"  crime: {len(crime_files)}개")

print("\n처음 10개 파일:")
for f in json_files[:10]:
    print(f"  {f.relative_to(processed_dir)}")

print("\n마지막 10개 파일:")
for f in json_files[-10:]:
    print(f"  {f.relative_to(processed_dir)}")

