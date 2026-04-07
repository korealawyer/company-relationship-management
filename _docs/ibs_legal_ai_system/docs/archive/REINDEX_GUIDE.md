# processed 폴더 재인덱싱 가이드

## 개요

`scripts/reindex_from_processed.py` 스크립트는 `data/processed` 폴더의 모든 JSON 파일을 벡터 DB에 재인덱싱합니다.

## 주요 기능

1. **벡터 DB 초기화**: 기존 데이터를 모두 삭제하고 새로 시작
2. **자동 문서 타입 감지**: JSON 파일 구조를 보고 문서 타입 자동 감지
3. **구조별 인덱싱**: 각 문서 타입에 맞게 청킹 및 인덱싱
4. **상세 통계**: 인덱싱 결과 및 문서 타입별 통계 제공

## 사용 방법

### 기본 사용 (벡터 DB 초기화 후 재인덱싱)

```bash
python scripts/reindex_from_processed.py
```

### 옵션 사용

```bash
# 커스텀 설정으로 재인덱싱
python scripts/reindex_from_processed.py \
    --processed-dir data/processed \
    --collection-name legal_documents \
    --chunk-size 1000 \
    --chunk-overlap 200

# 벡터 DB 초기화 없이 추가 인덱싱 (기존 데이터 유지)
python scripts/reindex_from_processed.py --no-reset
```

## 옵션 설명

- `--processed-dir`: processed 폴더 경로 (기본값: `data/processed`)
- `--collection-name`: 벡터 DB 컬렉션 이름 (기본값: `legal_documents`)
- `--chunk-size`: 청크 크기 (기본값: 1000)
- `--chunk-overlap`: 청크 겹침 (기본값: 200)
- `--no-reset`: 벡터 DB 초기화하지 않음 (기존 데이터 유지)

## 문서 타입 자동 감지

스크립트는 다음 방법으로 문서 타입을 자동 감지합니다:

1. **JSON의 `type` 필드**: 가장 우선적으로 사용
2. **파일명 패턴**:
   - `statute-*.json` → `statute`
   - `case-*.json` → `case`
   - `crime-*.json` → `crime_type`
3. **폴더 경로**:
   - `statistics/` → `statistics`
   - `faqs/` → `faq`
   - `manuals/` → `manual`
   - `procedures/` → `procedure`
   - `templates/` → `template`
   - `trends/` → `trend`

## 지원하는 문서 구조

### 1. 법령 (statute)
```json
{
  "id": "statute-형법-101",
  "category": "형사",
  "sub_category": "외환의 죄",
  "type": "statute",
  "title": "형법 제101조(예비, 음모, 선동, 선전)",
  "content": "...",
  "metadata": {
    "law_name": "형법",
    "article_number": "101",
    "topics": [...],
    "source": "법제처",
    "updated_at": "2025-04-08"
  }
}
```

### 2. 판례 (case)
```json
{
  "id": "case-2005고합694",
  "category": "형사",
  "sub_category": "사기",
  "type": "case",
  "title": "대구지법 2005고합694 판결",
  "content": "...",
  "metadata": {
    "court": "대구지법",
    "year": 2006,
    "case_number": "2005고합694",
    "keywords": [...],
    "holding": "...",
    "updated_at": "2025-12-11",
    "judgment_date": "2006-10-11",
    "panji_items": [...],
    "reference_articles": [...],
    "reference_cases": [...]
  }
}
```

### 3. 범죄 유형 (crime_type)
```json
{
  "id": "fraud-property-general",
  "category": "형사",
  "sub_category": "형사",
  "type": "statistics",
  "title": "사기죄 (일반)",
  "content": "...",
  "metadata": {
    "domain": "crime-statistics",
    "source": "",
    "date": "",
    "crime_category_main": "형사",
    ...
  }
}
```

## 실행 예시

```bash
# 1. 벡터 DB 초기화 및 재인덱싱
python scripts/reindex_from_processed.py

# 2. 실행 중 출력 예시
# ================================================================================
# 벡터 DB 초기화
# ================================================================================
# 기존 문서 수: 15823개
# ✅ 벡터 DB 초기화 완료
# 초기화 후 문서 수: 0개
#
# ================================================================================
# processed 폴더 인덱싱 시작
# ================================================================================
#
# 발견된 JSON 파일: 1439개
#
# [1/1439] 처리 중: statutes/형법/statute-형법-101.json
#   ✅ 성공: 4개 청크
# [2/1439] 처리 중: cases/case-2005고합694.json
#   ✅ 성공: 87개 청크
# ...
#
# ================================================================================
# 인덱싱 완료
# ================================================================================
# 총 파일: 1439개
# 성공: 1435개
# 실패: 4개
# 스킵: 0개
# 총 청크 수: 15234개
#
# 문서 타입별 통계:
#   case: 43개 파일, 1234개 청크
#   crime_type: 102개 파일, 234개 청크
#   statute: 396개 파일, 1587개 청크
#   ...
#
# 벡터 DB 최종 문서 수: 15234개
```

## 주의사항

1. **벡터 DB 초기화**: 기본적으로 기존 데이터를 모두 삭제합니다. 백업이 필요하면 `--no-reset` 옵션을 사용하세요.

2. **실행 시간**: 파일 수에 따라 시간이 오래 걸릴 수 있습니다 (1000개 파일 기준 약 30분~1시간).

3. **OpenAI API 키**: 임베딩 생성에 OpenAI API가 필요합니다. `.env` 파일에 `OPENAI_API_KEY`를 설정하세요.

4. **메모리 사용량**: 대량의 파일을 처리할 때 메모리 사용량이 증가할 수 있습니다.

## 문제 해결

### Q1: "문서 검증 실패" 오류

**원인**: JSON 파일의 구조가 예상과 다름

**해결**: 
- JSON 파일의 `type` 필드가 올바른지 확인
- 필수 필드(`id`, `title`, `content`)가 있는지 확인

### Q2: "벡터 DB 초기화 실패" 오류

**원인**: ChromaDB 파일이 사용 중이거나 권한 문제

**해결**:
- 서버가 실행 중이면 중지
- `data/vector_db` 폴더의 권한 확인
- 수동으로 폴더 삭제 후 재시도

### Q3: 인덱싱이 너무 느림

**원인**: 파일 수가 많거나 네트워크 지연

**해결**:
- 배치 처리로 나누어 실행
- 청크 크기를 늘려 청크 수 감소 (처리 속도 향상)

## 다음 단계

인덱싱 완료 후:

1. **검색 테스트**:
   ```bash
   python test_search_api.py
   ```

2. **벡터 DB 상태 확인**:
   ```bash
   python scripts/check_indexed_data.py
   ```

3. **API 서버 실행**:
   ```bash
   python -m src.api.main
   ```

4. **Swagger UI에서 테스트**:
   ```
   http://localhost:8000/docs
   ```

