-- 032_enforce_active_status_rls.sql
-- 회원 탈퇴(status = 'deleted') 처리된 계정의 세션 탈취/WebSocket 누출 방지
-- (모든 클라이언트 주요 테이블에 적용하기 전, 대표적으로 consultations 예시 반영)

-- 예시: consultations 테이블 SELECT 정책
-- 주의: 이 스크립트를 적용하기 전에 실제 존재하는 정책명('Enable read access for users based on user_id')과 맞추어야 합니다.

-- ALTER POLICY "Enable read access for users based on user_id" 
-- ON consultations
-- USING ( 
--   company_id = auth.uid() 
--   AND EXISTS (SELECT 1 FROM companies WHERE id = auth.uid() AND status = 'active')
-- );
