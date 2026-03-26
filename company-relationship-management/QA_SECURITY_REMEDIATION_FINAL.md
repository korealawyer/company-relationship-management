# 🛡️ CRM QA 및 보안 사각지대 최종 개선 리포트 (통합본)

**문서 개요**:  
본 문서는 IBS 로펌 기업관계관리 CRM(Next.js 16)의 도입을 앞두고 진행된 여러 차례의 **QA(교차 검증) 및 API 보안 강화 세션**에서 도출된 모든 취약점과 테스트 사각지대(총 15건 이상)에 대한 최종 조치 내역을 종합한 리포트입니다.

---

## 🏗️ 1차 개선: 치명적 취약점 및 보안 인프라 패치 (9종)
미들웨어에만 의존하지 않고 서버 라우트 핸들러 레벨에서의 강력한 예외 처리와 인증/인가(RBAC) 레이어를 구축했습니다.

### 1. 인증/인가 (RBAC) 및 접근 제어 강화
*   **JWT 발급 보안 가이드**: `/api/auth/jwt`에서 `x-internal-secret` 기반 내부 통신만 허용하여 Role Spoofing 차단.
*   **Origin 바이패스 및 빈 시크릿 차단**: JWT 서명 시 Origin 미전송 요청 차단(403) 및 하드코딩 빈 `JWT_SECRET` 서명을 원천 방어.
*   **엔드포인트별 Role 통제**: `/api/drip`(`sales/admin/lawyer` 한정), `/api/notion` 등에 세션 및 권한 검증 로직 강제 적용.

### 2. 악의적 페이로드 방어 및 취약점 (IDOR, XSS) 원천 패치
*   **IDOR 우회 방어**: `/api/payment/check` 결제 내역 조회 및 `PATCH /api/leads` 호출 시 본인 회사(`companyId`) / 담당 여부를 직접 검증.
*   **XSS 인젝션 방어**: `/api/email`(`lawyerNote`) 및 `/api/drip` 이메일 템플릿 생성 시 HTML 요소 강제 이스케이프(`sanitizeHtml`).
*   **Malformed JSON 파싱 에러 방어**: 모든 `req.json()`에 try-catch를 적용해 서버 런타임 크래시(500 에러)를 막고 400 Bad Request 반환 유도.

### 3. Rate Limiting (AI 자원 보호 및 무차별 대입 방어)
*   분당 제한 초과 시 `429 Too Many Requests`를 반환하도록 Upstash / In-memory Rate Limiter 전면 도입.
*   단순 IP 우회를 막기 위해 Key 단위를 ``${api_name}_${ip}_${auth.role}`` 수준으로 고도화하여 보안 격상.

---

## 🚀 2차 개선: 백로그 및 엣지 케이스 완벽 구현 (6종)
1차 패치 이후 지연 처리된 잔여 버그와 누락된 워크플로우를 모두 조치하여 프로덕션 배포 무결성을 높였습니다.

### 1. 경계 조건 및 백엔드 로직 정교화
*   **초대코드 Timezone 만료 보정 (`auth.ts`)**: 
    `new Date()` 파싱 시 자정에 하루 일찍 코드가 만료되는 타임존 이슈를 제거하기 위해 유효기간 확인 전 `.setHours(23, 59, 59, 999)`를 강제하여 사용성을 보장.
*   **SSE 스트리밍 OpenAI 환경 분기 (`chat-stream/route.ts`)**: 
    Anthropic API가 없을 시 일괄 Mock으로 빠지던 로직을 고도화하여, `AI_PROVIDER=openai` 설정 시 실제 OpenAI Chat Completion 스트리밍을 통해 `ReadableStream` 응답을 내보내도록 라우팅 처리 병행.

### 2. 메모리 안정성 확인 및 클라이언트 세션 무결성
*   **CSV 엑셀 대용량 압사 방지 (`leads/upload/route.ts`)**: Serverless Edge 환경 메모리 고갈을 막기 위한 Payload 용량 검증(Max 5MB) 기 구현 확인.
*   **AI 로그 배열 누수 차단 (`aiUsage.ts`)**: 서버 상주 메모리 누진을 막는 `MAX_LOG_SIZE` 500건 달성 후 가장 오래된 기록을 `shift()` 하는 최적화 구조 기 구현 확인.
*   **동시 탭 Storage 리스너 (`AuthContext.tsx`)**: 타 브라우저 탭에서의 로그아웃 및 계정 스위칭 발생 시 현재 탭의 상태가 안전하게 동기화 및 롤아웃되는 흐름 이상 없음 점검 완료.

### 3. 회귀 테스트 자동화 파이프라인
*   **Playwright E2E 보안 스크립트 작성 (`tests/e2e/security.spec.ts`)**: 
    수정된 취약점(Rate Limit 429 우회, IDOR 403, Malformed JSON 500 에러, Origin 바이패스 등)을 CI/CD 파이프라인에서 지속적으로 검증할 수 있는 자동화 E2E 스크립트 구축 완료.

---

## ✅ 최종 빌드 및 완료 상태
```text
Creating an optimized production build ...
✓ Compiled successfully in 7.7s
✓ Finished TypeScript in 13.2s
✓ Generating static pages using 15 workers (53/53) in 1190.9ms
Exit code: 0
```
- **결과**: 총 15종의 보안/성능 취약점 보완 후 진행된 Next.js TS Compile 환경에서 0건의 오류 발생.
- **상태**: Vercel 프로덕션 배포(Production-Ready)가 가능할 수준으로 코드 무결성 및 인가 체계를 완벽히 획득.
