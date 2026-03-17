# 🧹 프로젝트 정리 대상 파일 목록
> 작성일: 2026-03-12 | 목적: 추가 개발을 위한 코드베이스 정리

---

## 1. 이미지 파일 (루트) — 삭제
| 파일명 | 크기 | 사유 |
|---|---|---|
| `5D6A5307.JPG` | 1.2MB | 코드와 무관한 사진 |
| `5D6A5318.JPG` | 1.4MB | 코드와 무관한 사진 |
| `5D6A5342.JPG` | 1.2MB | 코드와 무관한 사진 |
| `5D6A5346.JPG` | 0.8MB | 코드와 무관한 사진 |
| `building picture.JPG` | 1.4MB | 코드와 무관한 사진 |

---

## 2. ESLint 로그 파일 — 삭제
| 파일명 | 크기 | 사유 |
|---|---|---|
| `eslint-out.json` | 819KB | 일회성 디버깅 산출물 |
| `eslint-raw.txt` | 90KB | 일회성 디버깅 산출물 |
| `eslint-round2.txt` | 58KB | 일회성 디버깅 산출물 |
| `eslint-round3.txt` | 28KB | 일회성 디버깅 산출물 |

---

## 3. 스크립트/배치 파일 — 삭제
| 파일명 | 사유 |
|---|---|
| `check_grep.ps1` | 일회성 디버깅 스크립트 |
| `git_push.bat` | 일회성 스크립트 |
| `deploy-functions.bat` | 일회성 스크립트 |

---

## 4. 중첩 디렉토리 — 삭제
| 경로 | 사유 |
|---|---|
| `company-relationship-management/` | GitHub 커밋용 중첩 복사본. 원본은 이미 `src/`에 복원 완료. eslint 로그, 노션 내보내기 등 포함 |

---

## 5. 노션 내보내기 — 삭제 또는 `_docs/`로 이동
| 경로 | 파일 수 | 사유 |
|---|---|---|
| `franchise_notion_content/` | **471개** | 노션 DB 전체 내보내기. 개발에 불필요 |
| `franchise_notion_export/` | 1개 (zip) | 노션 내보내기 zip |

---

## 6. 확장자 없는 프롬프트 파일 (루트) — `_docs/prompts/`로 이동
| 파일명 | 크기 |
|---|---|
| `Corporate Dashboard Prompt` | 8.5KB |
| `Crm Organic Flow Design` | 13.4KB |
| `DocComment Vibe Prompt` | 38.8KB |
| `Esign Vibe Prompt 전자계약` | 34.7KB |
| `Feature Status` | 7.4KB |
| `Franchise Analysis` | 11.7KB |
| `Helpme Corporate Registration Intel` | 11.8KB |
| `Lawtop Benchmark Research` | 18.3KB |
| `Legal Automation Items` | 11.6KB |
| `Legal Automation Items자동화 아이템` | 11.6KB (중복) |
| `Platform Dev Spec` | 15.5KB |
| `Platform Gap Analysis` | 11KB |
| `Sv Pipeline실리콘밸리 1% AI 개발 파이프라인` | 3.5KB |

---

## 7. 한글 문서 (루트) — `_docs/`로 이동
| 파일명 | 크기 |
|---|---|
| `DEV_MASTER송무계약서관련.md` | 14KB |
| `DEV_송무_기능_리서치.md` | 17.2KB |
| `DEV_통합_기능_재정리.md` | 16.9KB |
| `FRANCHISE_NEWSLETTER_SYSTEM.md` | 15.3KB |
| `LAWTOP_IA_DEEP_RESEARCH.md` | 39.6KB |
| `LEGAL_AGENT_DEV_PROMPT.md` | 27.9KB |
| `프랜차이즈 법률지원 패키지 상품 정의서.pdf` | 1.6MB |
| `프랜차이즈_상품정의서_v1.2_...docx` | 39KB |

---

## 8. 참고 디렉토리 — `_docs/`로 이동
| 경로 | 사유 |
|---|---|
| `로탑 사용하는 메뉴 전달용/` | 로탑 UI 스크린샷 참고자료 |

---

## 9. 마스터 문서 (루트) — `_docs/master/`로 이동
| 파일명 | 사유 |
|---|---|
| `00_MASTER_PLAYBOOK.md` | 운영 문서 |
| `00_MASTER_PROMPT.md` | 프롬프트 문서 |
| `00_MASTER_TASK.md` | 태스크 문서 |
| `00_PROJECT_JOURNAL.md` | 프로젝트 일지 |
| `00_SYSTEM_MAP.md` | 시스템 맵 |

---

## 10. 유지할 파일 목록 (건드리지 않음)
- `src/` — 소스 코드 전체
- `supabase/` — DB 마이그레이션
- `public/` — 정적 파일
- `_agents/` — 에이전트 설정
- `_docs/` — 기존 문서
- `_logs/` — 로그
- `_strategy/` — 전략 문서
- `documents/` — 코드리뷰, 변경이력
- `.git/`, `.next/`, `node_modules/` — 시스템 디렉토리
- `package.json`, `tsconfig.json`, `next.config.ts` 등 설정 파일
- `.env.*`, `.gitignore` — 환경 설정
- `README.md` — 프로젝트 README
