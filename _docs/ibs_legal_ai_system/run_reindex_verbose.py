#!/usr/bin/env python3
"""인덱싱 스크립트 실행 (상세 출력)"""

import sys
import subprocess
from pathlib import Path

project_root = Path(__file__).parent

# Python 스크립트 직접 실행 (버퍼링 없이)
cmd = [
    sys.executable,
    "-u",  # unbuffered 출력
    str(project_root / "scripts" / "reindex_from_processed.py"),
    "--no-reset"
]

print("=" * 80)
print("인덱싱 스크립트 실행 (상세 출력)")
print("=" * 80)
print(f"명령: {' '.join(cmd)}")
print("=" * 80)
print()

# 실시간 출력
process = subprocess.Popen(
    cmd,
    stdout=subprocess.PIPE,
    stderr=subprocess.STDOUT,
    text=True,
    bufsize=1,  # line buffered
    universal_newlines=True
)

try:
    for line in process.stdout:
        print(line, end='', flush=True)
    
    process.wait()
    print(f"\n\n인덱싱 완료 (종료 코드: {process.returncode})")
except KeyboardInterrupt:
    print("\n\n사용자에 의해 중단되었습니다.")
    process.terminate()
    process.wait()

