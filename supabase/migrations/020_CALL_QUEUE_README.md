# 020_call_queue_locks 마이그레이션 안내

이 마이그레이션은 영업 담당자들이 동일한 고객사(Company)에 중복으로 통화를 거는 상황을 방지하기 위한 분산 락(Distributed Lock) 기반의 콜큐(Call Queue) 시스템을 구축합니다.

## 새로운 테이블: `call_locks`
영업 대상 기업의 통화 상태 선점 정보를 저장합니다.
- `company_id`: UUID (Primary Key), `companies` 테이블을 참조하며 기업 삭제 시 락 정보도 함께 삭제(CASCADE)됩니다.
- `user_id`: UUID (해당 고객에 선점을 요청한 유저의 고유 식별자)
- `user_name`: TEXT (선점을 요청한 유저의 표시 이름)
- `locked_at`: 락이 생성된 시간 (기본값 NOW())
- `locked_until`: 락의 만료 시간 (필수)

## 새로운 PostgreSQL 함수 (RPC)

1. **`claim_company_call`**
   - 역할: 특정 고객사에 대한 콜 락(선점)을 요청합니다.
   - 파라미터: `p_company_id` (UUID), `p_user_id` (UUID), `p_user_name` (텍스트), `p_lock_minutes` (정수, 기본값 30분)
   - 반환값: `JSONB` 반환
   - 로직: 
     1. 해당 회사의 만료된 락(`locked_until < NOW()`)을 즉시 제거합니다.
     2. 새로운 락 등록을 시도합니다.
     3. 성공 시 `{"success": true, "locked_until": "..."}` 형식으로 반환합니다.
     4. 고유키 제약조건(`unique_violation`) 발생 시, 타인이 락을 선점 중인 상태이므로 `{"success": false, "locked_by": "이름", "locked_until": "..."}` 를 반환합니다.

2. **`release_company_call`**
   - 역할: 통화 종료 시 수동으로 락을 해제합니다.
   - 파라미터: `p_company_id` (UUID), `p_user_id` (UUID) 
   - 반환값: `{"success": true}` 
   - 로직: 권한(`user_id` 매칭)을 확인하고 해당하는 락 엔트리를 안전하게 삭제합니다.

3. **`get_call_locks_status`**
   - 역할: 전체 활성 락 목록을 조회합니다.
   - 파라미터: 없음
   - 반환값: `call_locks` 데이터의 집합(`SETOF call_locks`)
   - 로직: 호출될 때마다 만료 시간이 지난 락 전체를 정리(Delete)한 뒤, 유효한 락 리스트만 모아 반환합니다. 큐 상태 대시보드에서 활용됩니다.

## 정책 (RLS)
- 인증된 사용자(`authenticated`) 전원에게 `SELECT`, `INSERT`, `DELETE` 권한이 부여되어 클라이언트 앱 내에서 자유롭게 락 열람 및 점유, 해제가 가능합니다.

---

## 실행/반영 방법

이 마이그레이션 파일을 Supabase 로컬/리모트 환경에 적용하려면 다음 명령어를 사용합니다.

**로컬 환경 적용:**
```bash
npx supabase db push
```

**운영 서버 (Production / Link 된 프로젝트) 적용:**
```bash
npx supabase db push --linked
```
