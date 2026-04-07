# 검색 예시 가이드

## 형법 제101조 검색

### ✅ 올바른 검색 방법

**방법 1: 필터 없이 검색 (권장)**
```json
{
  "query": "형법 제101조",
  "n_results": 5,
  "document_types": ["statute"]
}
```

**방법 2: 올바른 sub_category 사용**
```json
{
  "query": "형법 제101조",
  "n_results": 5,
  "document_types": ["statute"],
  "category": "형사",
  "sub_category": "외환의 죄"
}
```

**방법 3: category만 사용**
```json
{
  "query": "형법 제101조",
  "n_results": 5,
  "document_types": ["statute"],
  "category": "형사"
}
```

### ❌ 잘못된 검색 (결과 없음)

```json
{
  "query": "형법 제101조",
  "n_results": 5,
  "document_types": ["statute"],
  "category": "형사",
  "sub_category": "사기"  // ❌ 형법 제101조는 "외환의 죄"이지 "사기"가 아님
}
```

## 형법 제101조 데이터 정보

- **id**: `statute-형법-101`
- **category**: `형사`
- **sub_category**: `외환의 죄` (⚠️ "사기"가 아님)
- **title**: `형법 제101조(예비, 음모, 선동, 선전)`

## 필터 사용 팁

1. **필터 없이 검색**: 가장 넓은 범위로 검색
   ```json
   {
     "query": "형법 제101조",
     "n_results": 5
   }
   ```

2. **document_types만 사용**: 문서 타입으로만 필터링
   ```json
   {
     "query": "형법 제101조",
     "n_results": 5,
     "document_types": ["statute"]
   }
   ```

3. **category만 사용**: 카테고리로 필터링
   ```json
   {
     "query": "형법 제101조",
     "n_results": 5,
     "category": "형사"
   }
   ```

4. **sub_category 사용 시 주의**: 정확한 sub_category 값을 사용해야 함
   - 형법 제101조: `"외환의 죄"`
   - 형법 제347조: `"사기"`

## 자동 필터 완화 기능

시스템이 자동으로:
- 필터가 결과를 모두 제거하면 해당 필터를 무시하고 원본 결과 반환
- category/sub_category 필터는 부분 매칭도 시도
- 매칭되지 않으면 필터를 무시하고 경고만 출력

