# 콘텐츠 생성 디버그 가이드

## 📋 디버그 스크립트 목록

### 1. `debug_content_generation.py` - 단계별 상세 디버그

각 노드를 하나씩 실행하면서 상태를 확인합니다.

**사용 방법:**
```bash
python debug_content_generation.py
```

**특징:**
- 각 단계마다 Enter 키를 눌러 진행
- 각 단계의 상태 정보를 상세히 출력
- 어느 단계에서 문제가 발생하는지 명확히 확인 가능
- 상태를 `debug_content_generation_state.json`에 저장

**출력 정보:**
- 각 노드 실행 전후 상태
- 검색 결과 상세
- 프롬프트 미리보기
- 초안 미리보기
- 평가 점수 및 피드백
- 재작성 루프 진행 상황

### 2. `debug_workflow_simple.py` - 전체 워크플로우 실행

전체 워크플로우를 한 번에 실행하되, 결과를 상세히 분석합니다.

**사용 방법:**
```bash
python debug_workflow_simple.py
```

**특징:**
- 전체 워크플로우를 자동으로 실행
- 각 단계의 로그를 실시간으로 확인
- 최종 결과를 분석하여 출력
- 결과를 `debug_workflow_result.json`에 저장

**출력 정보:**
- 최종 콘텐츠 길이
- 평가 점수
- 재시도 횟수
- 에러 메시지
- 피드백 목록

### 3. `debug_search_only.py` - 검색 단계만 디버그

검색이 제대로 작동하는지 확인합니다.

**사용 방법:**
```bash
python debug_search_only.py
```

**특징:**
- 검색 단계만 실행
- 벡터 DB 상태 확인
- 검색 결과 상세 출력
- 타입별 문서 수 확인

**출력 정보:**
- 벡터 DB 총 문서 수
- 타입별 문서 존재 여부
- 검색 결과 상세
- 컨텍스트 미리보기

## 🔍 문제 진단 방법

### 문제 1: 콘텐츠가 비어있음

**확인 사항:**
1. 검색 결과가 있는지 확인
   ```bash
   python debug_search_only.py
   ```

2. 초안 작성 단계에서 LLM 호출이 성공했는지 확인
   ```bash
   python debug_content_generation.py
   # Step 5 (초안 작성)에서 확인
   ```

3. 컨텍스트가 비어있는지 확인
   - `debug_content_generation.py`의 Step 3에서 확인

### 문제 2: 재귀 제한 오류

**확인 사항:**
1. 재작성 루프가 몇 번 반복되는지 확인
   ```bash
   python debug_content_generation.py
   # Step 11 (재작성 루프)에서 확인
   ```

2. 점수가 개선되는지 확인
   - 각 재작성 후 평가 점수 비교
   - `previous_score`와 현재 점수 비교

3. `revision_count`가 제대로 증가하는지 확인
   - 각 재작성 후 `revision_count` 값 확인

### 문제 3: 검색 결과가 없음

**확인 사항:**
1. 벡터 DB에 문서가 인덱싱되어 있는지 확인
   ```bash
   python debug_search_only.py
   ```

2. 검색 쿼리와 문서의 유사도 확인
   - 검색 결과의 `distance` 값 확인
   - 거리가 너무 크면 유사도가 낮음

3. `document_types` 필터 확인
   - 필터가 너무 제한적이면 결과가 없을 수 있음

## 🛠️ 디버그 팁

### 1. 로그 파일 확인

모든 디버그 스크립트는 콘솔에 로그를 출력합니다.
`debug_content_generation.py`는 추가로 `debug_content_generation.log` 파일에도 저장합니다.

### 2. 상태 저장 파일 확인

- `debug_content_generation_state.json`: 단계별 디버그의 최종 상태
- `debug_workflow_result.json`: 전체 워크플로우 실행 결과

이 파일들을 확인하여 문제가 발생한 시점의 상태를 분석할 수 있습니다.

### 3. 특정 단계만 디버그

`debug_content_generation.py`를 수정하여 특정 단계만 실행할 수 있습니다:

```python
# 예: 초안 작성 단계만 실행
# Step 1-4는 생략하고 Step 5부터 시작
```

### 4. 재작성 루프 제한

디버그 시 `max_revisions`를 1 또는 2로 설정하여 재작성 루프를 제한할 수 있습니다:

```python
max_revisions = 1  # 재작성 1회만
```

## 📊 예상 출력 예시

### 정상 실행 시

```
[초안 작성 완료] 상태 정보:
  - draft 길이: 1280자
  - evaluation_score: 51.7
  - revision_count: 0
  - should_rewrite: True
  ...

[임계값 체크 완료] 상태 정보:
  - evaluation_score: 51.7/100.0
  - 재작성 필요: True
  - 재시도 횟수: 1/3
```

### 문제 발생 시

```
[초안 작성 완료] 상태 정보:
  - draft 길이: 0자  ← 문제!
  - error: "프롬프트가 없습니다."
  ...
```

## 🔄 다음 단계

1. **검색 문제인 경우**
   - `debug_search_only.py` 실행
   - 벡터 DB 재인덱싱 필요 여부 확인

2. **초안 작성 문제인 경우**
   - `debug_content_generation.py` 실행
   - Step 5 (초안 작성)에서 LLM 호출 확인
   - 프롬프트와 컨텍스트 확인

3. **재작성 루프 문제인 경우**
   - `debug_content_generation.py` 실행
   - Step 11 (재작성 루프)에서 점수 변화 확인
   - `revision_count` 증가 확인

