# 프롬프트 템플릿 파일

이 폴더에는 콘텐츠 생성에 사용되는 프롬프트 템플릿 파일들이 저장되어 있습니다.

## 파일 구조

### 블로그 콘텐츠용

- **`blog_base.txt`**: 블로그 기본 지시사항
  - 타깃 독자 정의
  - 문체 및 스타일 가이드라인
  - 필수 구조 안내

- **`blog_instructions.txt`**: 블로그 상세 지시사항
  - 법령/판례 인용 형식
  - 중요 사항
  - 플레이스홀더: `{TOPIC}`, `{CONTEXT}`

### 시스템 프롬프트

- **`system_blog.txt`**: 블로그용 시스템 프롬프트
  - 블로그 포스팅 작성 규칙

- **`system_base.txt`**: 기본 시스템 프롬프트
  - 블로그 외 타입(article, opinion, analysis, faq)용

### 기본 템플릿

- **`basic_template.txt`**: 기본 프롬프트 템플릿
  - 블로그 외 콘텐츠 타입용
  - 플레이스홀더: `{CONTENT_TYPE}`, `{TOPIC}`, `{CONTEXT}`

## 플레이스홀더

템플릿 파일에서 사용 가능한 플레이스홀더:

- `{TOPIC}`: 생성할 콘텐츠 주제/키워드
- `{CONTEXT}`: RAG 검색 결과로 구성된 참고 문서
- `{CONTENT_TYPE}`: 콘텐츠 타입 (article, opinion, analysis, faq)

## 수정 방법

1. 텍스트 에디터로 파일 열기
2. 원하는 내용 수정
3. UTF-8 인코딩으로 저장
4. 애플리케이션 재시작 (캐시 사용 시)

## 주의사항

- 파일은 UTF-8 인코딩으로 저장해야 합니다
- 플레이스홀더는 대문자로 작성: `{TOPIC}`, `{CONTEXT}`
- 파일 수정 후 애플리케이션 재시작을 권장합니다 (캐시 사용 시)
- **필수 파일**: 다음 파일들은 반드시 존재해야 하며, 없으면 프로그램이 시작되지 않습니다:
  - `blog_base.txt`
  - `blog_instructions.txt`
  - `system_blog.txt`
  - `system_base.txt`
  - `basic_template.txt`

