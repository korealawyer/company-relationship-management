# 날짜별 CRM 수정 사항 (Changelog)

## 2026-04-02
- feat: AI 기반 영업 메모요약 및 모델선택, 스크립트 자동화, 크롤러 고도화 적용
- fix: AI 자동화 실행 로그(addLog) 누락 수정
- feat(analyze): 다중 크롤링 폴백 로직 및 푸터 AI 파싱 적용
- Fix analysis API: accept homepageUrl and privacyUrl, fix param mismatch
- fix: update crawler fallback logic to prioritize Scrape.do and fallback to ScrapingBee
- Fix automation setup unresponsiveness, update email templates & CRM components
- feat: enhance automation UI toggle, implement optimistic update, and improve email sending logic

## 2026-04-01
- feat: 이메일 템플릿 업데이트, 영업 큐 파이프라인 최적화, 영업 테이블 필터 개선
- feat: separate bizType and franchiseType for company registration
- feat/fix: optimize UI response for manual logging and sync related changes
- fix(sales/auth): resolve Maximum update depth exceeded error & grant sales account permissions to privacy review page
- fix: resolve TS errors and Supabase null references
- feat: integrate live data to admin monthly report and optimize sales call and admin clients page
- feat: improve admin clients page, sales call panel and memo system bypass RLS
- fix: remove duplicate root middleware.ts causing redirect loop

## 2026-03-31
- fix(sales/call): add inline memo and fix table col widths, fix TS null check
- feat(crm): add admin inline edit capability and fix globe url linkage
- fix(excel): resolve bulk upload duplicate failures and Korean encoding corruption
- fix(email-preview): Make lawyer name dynamic and optional in preview html
- fix(email-preview): Fetch real lead data from Supabase instead of local leadStore
- fix(email-preview): sync subject with remote vars, fix custom newline rendering, dispatch custom subject to backend
- fix(email-preview): pass leadId dynamically, use Suspense and useSearchParams to resolve Vercel static rendering issue for email preview dispatch
- fix(privacy-review): useSearchParams hook instead of searchParams prop to avoid static rendering cache in production
- fix(privacy): ensure empty array on no AI issues found instead of demo data
- fix: pass leadId parameter in CompanyTableRow for privacy review dynamic fetching
- feat: use dynamic leadId and supabase data on Privacy Review page
- fix(api): attach standard UUIDs to AI generated issues to fix Supabase format error
- chore(api): enable Vercel Pro maxDuration and increase analyze timeouts to prevent 504
- fix(issues): map law to law_ref to fix 400 bad request in supabase persistence payload
- fix(persistence): strip aiDraftGenerated column from issues payload before Supabase insertion to fix 400 Bad Request error on production
- fix(analyzer): adjust schema to match Supabase issues table and UI

## 2026-03-30
- fix(supabase): add missing issue saving logic to supabaseCompanyStore.update
- fix: retrieve missing DB status update logic on AI analysis success and gracefully bypass Vercel IP blocks via Demomode fallback
- fix(crm): resolve ibsbase.com UI freeze and modal blocker
- fix: store AI analysis results on success to DB and update UI status
- fix: correct .vercelignore to target root folders only, fixing module resolution error
- fix: optimize AI analysis timeouts and regex for Vercel Edge Runtime limits
- chore: add .vercelignore to exclude long-named files from deploy
- Fix infinite loading: separate save/analyze buttons, add crawling reset, fix SWR cache race, improve tarpit defense
- Fix CRM legal analysis button missing actual API trigger
- fix(analyze): apply strict AbortController timeout to res.text and openai fetch
- feat(PhoneView): enhance sales phone view 대화형 인터페이스 및 AI 메모 통합
- feat(crm): enhance analyze API and update PhoneView
- fix(crm): resolve email API Turbopack build error and riskLevel type overlap
- feat: Admin 사용자 전용 상태 강제 변경 드롭다운 추가 (영업팀/관리자 CRM 연동)
- feat: AI-powered privacy policy analysis and CRM/Supabase integration
- feat: admin user management modal, UI alignment fixes, and mock data seeding
- feat: add CRM SlidePanel privacy policy management & db migrations

## 2026-03-29
- docs/feat: Add production readiness update log and complete RBAC/SEO/Performance monitoring implementation
- chore: final updates
- refactor: restructure root routes into next.js route groups (marketing/client/admin/auth)
- chore: consolidate duplicate routes (privacy, client-portal, client-signup)
- feat: 개인정보처리방침 원문 텍스트 입력 기능 추가 (admin/clients, sales/leads)
- feat: Add privacyUrl management UI and sync Supabase data layer
- fix: Supabase companies 테이블 누락 컬럼 25개 추가 및 supabaseStore 동기화

## 2026-03-27
- chore: add DB error debug info to API responses
- fix(auth): 토큰 갱신 및 무한 리다이렉트 버그 수정
- fix(excel): switch mock localStorage to real Supabase API
- feat: CRM 프로덕션 마이그레이션 완료 (보안 강화, 아키텍처 최적화 및 알림 시스템 연동)
- fix(auth): 배포 환경 로그인 오류 수정 및 테스트 버튼 삭제
