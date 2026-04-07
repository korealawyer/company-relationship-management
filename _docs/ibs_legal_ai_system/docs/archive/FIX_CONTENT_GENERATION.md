# 콘텐츠 생성 API 빈 콘텐츠 문제 해결

## 🔴 문제

콘텐츠 생성 API 호출 시 `content`가 빈 문자열로 반환됨

**요청:**
```json
{
  "topic": "사기죄에 대한 일반적 설명을 해줘",
  "content_type": "blog",
  "style": "string",
  "include_sections": ["string"],
  "keywords": ["string"],
  "document_types": ["string"]
}
```

**응답:**
```json
{
  "success": true,
  "content": "",  // 빈 문자열
  "title": null,
  "sections": null,
  ...
}
```

## 🔍 원인 분석

### 1. Swagger UI 기본값 문제

**원인:**
- Swagger UI가 기본 예시 값으로 `"string"`을 사용
- `document_types: ["string"]`이 그대로 전달되어 유효하지 않은 타입으로 필터링
- 검색 결과가 없어서 컨텍스트가 비어있음
- 빈 컨텍스트로는 콘텐츠 생성 불가

**영향:**
- `document_types: ["string"]` → 검색 결과 없음
- `include_sections: ["string"]` → 섹션 선택 오류 가능
- `keywords: ["string"]` → 키워드 필터링 오류 가능
- `style: "string"` → 스타일 설정 오류 가능

### 2. 빈 컨텍스트 처리 부족

**원인:**
- 검색 결과가 없을 때 컨텍스트가 비어있음
- 빈 컨텐스트로 LLM 호출 시 빈 응답 반환 가능
- 에러 처리 및 폴백 로직 부족

## ✅ 적용된 수정 사항

### 1. API 라우터에서 "string" 필터링

`src/api/routers/generate.py`:
- `document_types`에서 "string" 제거
- `include_sections`에서 "string" 제거
- `keywords`에서 "string" 제거
- `style`이 "string"이면 None으로 변환

### 2. 검색 단계 개선

`src/rag/content_workflow.py`의 `_search_documents_node`:
- `document_types`에서 "string" 제거
- 검색 결과가 없을 때 모든 타입으로 재검색 시도
- 컨텍스트가 비어있을 때 경고 로깅

### 3. 콘텐츠 생성 단계 개선

`src/rag/content_workflow.py`의 `_generate_draft_node`:
- 컨텍스트가 비어있을 때 기본 메시지 추가
- 빈 콘텐츠 반환 시 에러 처리
- 상세한 로깅 추가

### 4. 프롬프트 생성 단계 개선

`src/rag/content_workflow.py`의 `_generate_prompt_node`:
- `include_sections`에서 "string" 제거
- `keywords`에서 "string" 제거
- `style`이 "string"이면 None으로 변환

## 📝 수정된 파일

- `src/api/routers/generate.py`
  - Swagger UI 기본값 필터링 추가

- `src/rag/content_workflow.py`
  - `_search_documents_node`: "string" 필터링 및 재검색 로직
  - `_generate_draft_node`: 빈 컨텍스트 처리 및 에러 처리
  - `_generate_prompt_node`: "string" 필터링

## 🧪 테스트 방법

### 1. 올바른 요청 (권장)

```bash
curl -X POST "http://localhost:8000/api/v1/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "사기죄에 대한 일반적 설명을 해줘",
    "content_type": "blog",
    "n_references": 5
  }'
```

### 2. document_types 지정

```bash
curl -X POST "http://localhost:8000/api/v1/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "사기죄에 대한 일반적 설명을 해줘",
    "content_type": "blog",
    "document_types": ["statute", "case"],
    "n_references": 5
  }'
```

### 3. Swagger UI에서 테스트

1. http://localhost:8000/docs 접속
2. `POST /api/v1/generate` 엔드포인트 선택
3. Request body에서:
   - `style`: `null` 또는 실제 스타일 값
   - `include_sections`: `[]` 또는 실제 섹션 목록
   - `keywords`: `[]` 또는 실제 키워드 목록
   - `document_types`: `null` 또는 실제 타입 목록 (예: `["statute", "case"]`)

## 📊 예상 결과

수정 후:
- ✅ Swagger UI 기본값 "string"이 자동으로 필터링됨
- ✅ 검색 결과가 없을 때 모든 타입으로 재검색 시도
- ✅ 빈 컨텍스트일 때 기본 메시지로 콘텐츠 생성 시도
- ✅ 빈 콘텐츠 반환 시 명확한 에러 메시지

## ⚠️ 주의사항

1. **Swagger UI 사용 시**
   - 기본값 "string"은 자동으로 필터링되지만, 가능하면 `null` 또는 실제 값 사용 권장
   - `document_types`는 `null`이면 모든 타입 검색

2. **검색 결과 없음**
   - 검색 결과가 없으면 모든 타입으로 재검색 시도
   - 그래도 없으면 기본 메시지로 콘텐츠 생성 시도

3. **API 서버 재시작 필요**
   - 코드 변경을 반영하기 위해 서버 재시작 필요

## 🔄 다음 단계

1. API 서버 재시작
2. 올바른 요청으로 테스트 (기본값 제거)
3. Swagger UI에서 테스트
4. 로그 확인하여 검색 및 생성 과정 모니터링

