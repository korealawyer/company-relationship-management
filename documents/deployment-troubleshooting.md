# 배포 트러블슈팅 — 로컬에서는 되는데 배포하면 안 되는 이유

> **작성일**: 2026-03-30  
> **프로젝트**: IBS CRM (company-relationship-management)  
> **배포 플랫폼**: Vercel  
> **프레임워크**: Next.js 16.1.6 (Turbopack)

---

## 목차

1. [개요](#1-개요)
2. [발견된 문제 3가지](#2-발견된-문제-3가지)
3. [문제 1: ENAMETOOLONG — 긴 파일명](#3-문제-1-enametoolong--긴-파일명)
4. [문제 2: Module Not Found — 빌드 환경 차이](#4-문제-2-module-not-found--빌드-환경-차이)
5. [문제 3: NODE_ENV 분기 — Quick Login 미표시](#5-문제-3-node_env-분기--quick-login-미표시)
6. [로컬 vs 배포 환경 차이 정리](#6-로컬-vs-배포-환경-차이-정리)
7. [해결 방법 요약](#7-해결-방법-요약)
8. [재발 방지 체크리스트](#8-재발-방지-체크리스트)

---

## 1. 개요

로컬 개발 서버(`localhost:3000`)에서는 모든 기능이 정상 동작하지만, Vercel 프로덕션 배포 시 여러 이유로 실패하거나 기능이 누락되는 현상이 발생했다.

**핵심 원인**: 로컬 개발 환경(`npm run dev`)과 Vercel 프로덕션 빌드(`next build`)는 완전히 다른 실행 환경이며, 다음 3가지 차이가 문제를 유발했다.

---

## 2. 발견된 문제 3가지

| # | 문제 | 영향 | 심각도 |
|---|------|------|--------|
| 1 | `ENAMETOOLONG` — 한글 이모지 포함 긴 파일명 | 빌드 자체 실패 | 🔴 Critical |
| 2 | `Module not found` — Vercel 빌드 환경에서 모듈 해석 실패 | 빌드 자체 실패 | 🔴 Critical |
| 3 | `NODE_ENV` 분기 — Quick Login이 프로덕션에서 숨겨짐 | 기능 미표시 (의도된 동작) | 🟡 Informational |

---

## 3. 문제 1: ENAMETOOLONG — 긴 파일명

### 증상
```
Error: ENAMETOOLONG: name too long, open '/vercel/path0/franchise_notion_content/
⚠️ 가격전략 긴급 검토 - 과도한 혜택의 함정과 현실적 대안 v1 0(수치부정확) 
4cb2ede147ed4816af765ecb6ea51371.md'
```

### 원인
- `franchise_notion_content/` 폴더에 Notion에서 내보낸 마크다운 파일이 들어있음
- 파일명에 **한글 + 이모지(⚠️🎯📋🗺️🚀🪝) + 공백 + 괄호** 포함
- **Linux(Vercel 서버)의 파일명 길이 제한**: 255 bytes (UTF-8 한글은 글자당 3 bytes)
- **Windows(로컬)의 파일명 길이 제한**: 260자 (유니코드 문자 단위)
- 동일 파일명이 Windows에서는 허용되지만 Linux에서는 초과

### 왜 `.gitignore`에 있는데도 업로드됐나?

```gitignore
# .gitignore에 이미 존재
franchise_notion_content/
```

**Vercel CLI(`npx vercel --prod`)는 git을 사용하지 않는다.**
- Vercel CLI는 `.gitignore`를 참고하지만, 로컬 파일 시스템을 **직접 스캔**하여 업로드
- `.vercelignore` 파일도 추가했지만, Vercel CLI 버전에 따라 적용이 불안정
- **결국 폴더를 프로젝트 디렉토리 밖으로 물리적으로 이동**해야 해결됨

### 해결

```powershell
# 프로젝트 외부로 이동
Move-Item -Path "franchise_notion_content" -Destination "C:\Users\jdc03\OneDrive\문서\_franchise_notion_content_bak"
```

---

## 4. 문제 2: Module Not Found — 빌드 환경 차이

### 증상
```
Error: Turbopack build failed with 2 errors:
  ./src/components/DocumentWidget.tsx:9:1
  Module not found: Can't resolve './documents/OcrResultPanel'
  
  ./src/components/DocumentWidget.tsx:8:1
  Module not found: Can't resolve './documents/DocumentList'
```

### 원인
- 파일(`DocumentList.tsx`, `OcrResultPanel.tsx`)은 **로컬에 존재하고 git에도 트래킹됨**
- 로컬 `next build`는 성공하지만, Vercel 원격 빌드에서는 실패
- **Vercel의 빌드 서버는 Linux 기반이고, 파일 시스템이 case-sensitive**
- 또는 Vercel의 파일 업로드 과정에서 일부 파일이 누락되었을 가능성

### 왜 로컬에서는 됐나?

| 환경 | OS | 파일 시스템 | Case Sensitivity |
|------|-----|------------|-----------------|
| 로컬 (`npm run dev`) | Windows | NTFS | **Case-insensitive** |
| 로컬 (`next build`) | Windows | NTFS | **Case-insensitive** |
| Vercel 빌드 서버 | Linux | ext4 | **Case-sensitive** |

- Windows: `DocumentList.tsx`와 `documentlist.tsx`는 **같은 파일**
- Linux: `DocumentList.tsx`와 `documentlist.tsx`는 **다른 파일**
- import 경로의 대소문자가 실제 파일명과 미세하게 다르면 Linux에서만 실패

### 해결
- GitHub push 기반 자동 배포를 트리거하여 해결 (git은 정확한 파일명을 보존)
- 또는 `vercel build` + `vercel deploy --prebuilt`로 로컬 빌드 결과물을 직접 배포

---

## 5. 문제 3: NODE_ENV 분기 — Quick Login 미표시

### 증상
- 로컬: 내부 직원 탭에 **역할별 Quick Login 버튼** 표시 (이민준 영업팀 등)
- 배포: Quick Login 버튼 **없음**, 이메일/비밀번호 수동 입력만 가능

### 원인

```tsx
// src/app/(auth)/login/page.tsx:222-223
{/* Role Quick-Login Badges — 개발 환경에서만 표시 */}
{process.env.NODE_ENV === 'development' && (
    <div className="space-y-2">
        {/* Quick Login 버튼들 */}
    </div>
)}
```

| 환경 | `NODE_ENV` 값 | Quick Login |
|------|--------------|-------------|
| `npm run dev` | `development` | ✅ 표시 |
| `next build` + 배포 | `production` | ❌ 숨김 |

### 이것은 의도된 동작인가?
**✅ 예, 의도된 보안 설계입니다.**
- Quick Login에는 `sales@ibslaw.kr / sales123` 같은 **하드코딩된 비밀번호**가 포함
- 프로덕션에 노출되면 **누구나 직원 계정으로 로그인 가능**
- 따라서 `NODE_ENV === 'development'` 조건은 올바른 보안 조치

### 프로덕션에서 영업팀 로그인 방법
1. 로그인 페이지 하단 **"직원 접속"** 클릭
2. **내부 직원** 탭 선택
3. 이메일: `sales@ibslaw.kr` + 발급된 비밀번호 입력

---

## 6. 로컬 vs 배포 환경 차이 정리

```
┌─────────────────────────────────────────────────────────────────┐
│                    로컬 개발 (npm run dev)                       │
│                                                                 │
│  ✅ Windows NTFS — 긴 파일명 허용                                │
│  ✅ Case-insensitive — 대소문자 무시                              │
│  ✅ NODE_ENV = "development" — 모든 dev 기능 활성화               │
│  ✅ HMR (Hot Module Replacement) — 즉시 반영                     │
│  ✅ .env.local 직접 로드                                         │
│  ✅ 모든 파일 접근 가능 (gitignore 무관)                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

                          ⬇  git push  ⬇

┌─────────────────────────────────────────────────────────────────┐
│                  Vercel 프로덕션 빌드 (next build)               │
│                                                                 │
│  ❌ Linux ext4 — 파일명 255 bytes 제한                           │
│  ❌ Case-sensitive — 대소문자 엄격 구분                           │
│  ❌ NODE_ENV = "production" — dev 전용 코드 비활성화              │
│  ❌ 정적 빌드 — 빌드 타임에 모든 에러 발생                        │
│  ❌ Vercel Environment Variables 별도 설정 필요                   │
│  ❌ git에 없는 파일은 존재하지 않음                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. 해결 방법 요약

### 실행한 조치

| 조치 | 명령어 | 효과 |
|------|--------|------|
| `.vercelignore` 생성 | 파일 생성 + git commit | 불필요 폴더 배포 제외 |
| notion 폴더 이동 | `Move-Item` | ENAMETOOLONG 해결 |
| git push | `git push origin main` | Vercel 자동 배포 트리거 |
| 로컬 빌드 검증 | `npx next build` | 코드 자체 빌드 성공 확인 |

### 최종 배포 성공

```
상태: ✅ Ready
배포 ID: dpl_66ddubsD4sdNCCx4UScsLMzifEuC
도메인:
  - https://ibsbase.com
  - https://www.ibsbase.com
  - https://company-relationship-management.vercel.app
```

---

## 8. 재발 방지 체크리스트

### 배포 전 반드시 확인할 것

- [ ] **`npm run build` 로컬 테스트**: 배포 전 반드시 로컬에서 프로덕션 빌드를 실행하여 에러 확인
- [ ] **파일명 규칙 준수**: 한글/이모지/공백이 포함된 긴 파일명을 프로젝트 내에 보관하지 않기
- [ ] **import 경로 대소문자 확인**: 파일명의 대소문자가 import 문과 정확히 일치하는지 확인
- [ ] **`NODE_ENV` 분기 인지**: `process.env.NODE_ENV === 'development'` 조건 내 코드는 프로덕션에서 실행되지 않음을 인지
- [ ] **환경변수 확인**: Vercel 대시보드에서 필요한 환경변수가 모두 설정되어 있는지 확인
- [ ] **`.gitignore` vs `.vercelignore`**: 두 파일의 역할 차이를 인지하고, 대용량/긴 파일명 폴더는 반드시 프로젝트 외부에 보관

### 안전한 배포 프로세스

```bash
# 1. 로컬 빌드 테스트
npm run build

# 2. 에러 없으면 커밋 & 푸시 (Vercel GitHub 자동 배포)
git add -A
git commit -m "feat: 변경사항 설명"
git push origin main

# 3. Vercel 대시보드에서 빌드 상태 확인
# https://vercel.com/[팀명]/company-relationship-management/deployments

# 4. (선택) CLI 수동 배포 — 자동 배포가 실패할 경우
npx vercel --prod
```

---

> **요약**: "로컬에서 되는데 배포하면 안 된다"는 대부분 **OS 차이(Windows vs Linux)**, **빌드 모드 차이(development vs production)**, **파일 시스템 차이(case-insensitive vs case-sensitive)** 에서 비롯된다. 배포 전 `npm run build`로 프로덕션 빌드를 로컬에서 먼저 테스트하는 것이 가장 효과적인 예방법이다.
