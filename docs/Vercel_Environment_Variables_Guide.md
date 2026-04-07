# Vercel Pro 환경 변수 및 배포 트러블슈팅 가이드

이 문서는 IBS 법률사무소 CRM 어플리케이션의 Vercel 배포 환경 변수 설정 내역과, 배포 후 발생할 수 있는 일반적인 장애 및 해결 절차를 기록하기 위해 작성되었습니다.

## 1. 현재 Vercel 운영 환경 정보
*   **플랜 (Plan):** Vercel Pro
*   **컴퓨팅 리소스 (Serverless Function):** 최대 실행 시간 300초(5분) 지원 (현재 API 코드는 180초로 세팅됨, 타임아웃 504 에러 발생 안 함)
*   **운영 체제:** Node.js 기반 (Edge runtime 미사용)

---

## 2. 등록된 환경 변수 (Environment Variables) 목록
Vercel 대시보드 (`Settings` > `Environment Variables`)에 등록되어 앱이 정상 작동하도록 하는 14가지 필수 키 셋업업입니다. (작성일: 2026년 4월 기준)

### 📌 데이터베이스 (Supabase) 연결
*   `NEXT_PUBLIC_SUPABASE_URL` : Supabase 프로젝트 엔드포인트 URL
*   `NEXT_PUBLIC_SUPABASE_ANON_KEY` : 클라이언트 접근용 익명 공개 키 (회원가입/로그인 등)
*   `SUPABASE_SERVICE_ROLE_KEY` : 서버사이드 어드민 전용 키 (관리자 모드, 데이터 무손실 수정 등)

### 📌 AI 분석 엔진
*   `OPENAI_API_KEY` : 메인 개인정보처리방침 법률 분석용 (GPT-4o 등 최신 모델 처리)
*   `ANTHROPIC_API_KEY` : (선택) 하위 호환 및 보조 모델용
*   `GOOGLE_GENERATIVE_AI_API_KEY` : (선택) Gemini-1.5-Pro 등 보조 모델용

### 📌 웹 크롤링 및 IP 우회 우회 (분석 타겟 차단 방어)
*   `SCRAPE_DO_API_KEY` : Scrape.do 우회 스크래핑 토큰 (메인 크롤링 파이프라인)
*   `SCRAPINGBEE_API_KEY` : ScrapingBee 우회 크롤링 토큰 (Scrape.do 실패 시 폴백 용도)

### 📌 이메일 알림 연동 (Naver Works SMTP)
*   `SMTP_HOST` : smtp.worksmobile.com
*   `SMTP_PORT` : 465 (일반적으로 SSL용 포트)
*   `SMTP_SECURE` : true/false 설정 
*   `SMTP_USER` : info@ibslaw.co.kr (발신자 이메일 계정)
*   `SMTP_PASS` : 이메일 계정 비밀번호
*   `SMTP_FROM_NAME` : 메일 수신 시 표기될 발신자 표시 이름 (예: IBS 법률사무소)

---

## 3. 대표적인 배포 에러 및 해결 방법 (Troubleshooting)

### 🚨 에러 1: `PGRST204` (스키마 캐시 에러)
**증상:**
로컬에서는 데이터베이스(Supabase)에 데이터가 정상적으로 저장되는데, Vercel 운영 서버에서는 "Could not find the '...' column of 'issues' in the schema cache" 등과 같은 에러를 뱉으며 분석 저장이 실패함.

**원인:**
데이터베이스 컬럼을 새로 추가/수정했을 때, Vercel 서버 내부 로직은 업데이트되었으나 **Supabase 내부의 API(PostgREST)가 낡은 테이블 스키마 캐시를 물고 있어서** 새 컬럼으로의 Insert/Update를 거부하는 현상.

**해결 방법:**
1. Supabase 대시보드 로그인
2. 좌측 메뉴에서 **SQL Editor** 접속
3. 아래의 명령어 실행:
   ```sql
   NOTIFY pgrst, 'reload schema';
   ```
4. (실행 직후 즉시 반영되며, Vercel 재배포 없이 바로 분석 버튼 클릭 시 성공함)

### 🚨 에러 2: 504 Timeout Error (Gateway Timeout)
**증상:**
사용자가 버튼을 클릭한 후 약 10초 ~ 15초 뒤에 서버 오류가 발생하며 하얗게 멈추거나 에러가 뜸.

**원인:**
Vercel Hobby(무료) 플랜은 최대 15초까지만 API 처리를 허용하나, 분석 소요 시간이 이를 초과함.

**해결 방법:**
현재 계정은 **Vercel Pro 플랜**을 사용 중이므로 발생하지 않아야 정상입니다. 만약 발생한다면, `route.ts` 파일 상단의 `export const maxDuration = 180;` 설정이 지워졌거나, 코드가 무한 루프(Hang)에 빠진 경우입니다.

---

*본 문서는 환경 변수 유실이나 데이터베이스 마이그레이션 중장비 오류를 빠르게 바로잡기 위해 보관용으로 작성되었습니다.*
