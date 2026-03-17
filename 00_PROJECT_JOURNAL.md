# 📔 00_PROJECT_JOURNAL — CRM 플랫폼

> **세션마다 중요한 결정, 아이디어, 배운 것을 여기에 기록합니다.**
> 모든 에이전트가 세션 마무리 시 Today 행을 추가합니다.

---

## 2026-03-09 — 프로젝트 에이전트 시스템 구축

**Today:**
- IBS 로펌 프로젝트에서 에이전트 시스템 구조를 CRM 플랫폼으로 이식
- `_agents/` 폴더 구조 생성 완료 (ceo, pm, dev, antigravity_save_rules)
- `/저장` 워크플로우 CRM 버전으로 수정 완료
- 마스터 플레이북 & 태스크 보드 초안 완성

**핵심 결정:**
- 기술 스택: Next.js + Supabase (기존 유지)
- 멀티 테넌트 전략: Supabase RLS (Row Level Security) 기반 데이터 격리
- 저장 폴더 구조: `_strategy/`, `_docs/`, `_logs/` (IBS와 동일 구조 채택)

**다음 세션 할 일:**
- ESLint 에러 전수 수정 (eslint-out.json 기준)
- 모바일 반응형 UX 점검

---

*이 줄 아래에 새 날짜로 계속 추가해 주세요.*
