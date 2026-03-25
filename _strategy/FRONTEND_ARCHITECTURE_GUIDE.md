# 📐 프론트엔드 아키텍처 가이드 (The Golden Ratio of Component Design)

프론트엔드 코드의 유지보수성을 극대화하고 버그 발생률을 '0'에 수렴하게 만드는 컴포넌트 설계 가이드라인입니다. 디자이너의 수정 요청이나 기획 변경 시, 코드를 찾는 데 1초, 수정하는 데 1분, 부작용(Side-effect)은 없게 만드는 **3단계 컴포넌트 분리 원칙**을 따릅니다.

## 1. 메인 뼈대 파일 (Page Container)
- **권장 크기**: 50줄 ~ 100줄 이내
- **파일 위치 (예시)**: `app/dashboard/page.tsx`
- **주요 역할**: 전체 화면의 레이아웃(구도)을 잡고, 하위 블록(기능 컴포넌트)들을 배치하는 '빈 껍데기' 역할만 수행합니다.
- **수정 체감 효과**: 화면의 좌우/상하 배치를 바꿀 때 이 파일 하나만 열면 컴포넌트 구조가 한눈에 파악되어 1초 만에 수정이 가능합니다.

**💡 팩트 기반 작성 규칙**
- 복잡한 상태 관리(`useState`, `useEffect`)를 최대한 배제합니다.
- 마크업(`<div className="flex...">`)은 전체 그리드를 나누는 용도로만 사용합니다.

```tsx
// ❌ 나쁜 예: 페이지 코드 안에 버튼, 목록 등 모든 코드가 들어있음 (500줄 이상)
// ⭕ 좋은 예: 블록의 '배치'만 담당 (50줄 이내)
export default function DashboardPage() {
  return (
    <main className="flex h-screen bg-gray-50">
      <Sidebar /> {/* 좌측 메뉴 */}
      
      <section className="flex-1 p-8 space-y-6">
        <Header title="대시보드" />
        
        <div className="grid grid-cols-2 gap-6">
          <ConsultManage /> {/* 핵심 기능 A: 상담 관리 */}
          <PaymentStatus /> {/* 핵심 기능 B: 수납 현황 */}
        </div>
      </section>
    </main>
  );
}
```

## 2. 핵심 기능 컴포넌트 (Feature Component)
- **권장 크기**: 150줄 ~ 250줄 이내
- **파일 위치 (예시)**: `src/features/ConsultManage.tsx`
- **주요 역할**: '상담 목록', '수납 현황 표' 등 사용자에게 의미 있는 기능을 제공하는 독립된 하나의 도메인 덩어리입니다.
- **수정 체감 효과**: "상담 목록 디자인을 리뉴얼해주세요"라는 요청 시, 정확히 이 250줄짜리 파일 하나만 열어 수정하면 됩니다. 코드가 분리되어 있어 다른 페이지 영역이 망가질 확률이 없습니다.

**💡 팩트 기반 작성 규칙**
- 하나의 파일이 250줄을 넘어가면 기능이 너무 많은 것입니다. 한 번 더 잘게 쪼갤 수 없는지 검토해야 합니다.
- 컴포넌트 내부의 비즈니스 로직(API 호출, 필터링 등)은 별도의 커스텀 훅(`useConsult.ts` 등)으로 빼면 길이를 더 줄일 수 있습니다.

```tsx
// ⭕ 좋은 예: 하나의 명확한 기능(상담 내역)만 책임짐 (150줄 내외)
'use client';

export function ConsultManage() {
  // 상태 관리 (이 기능에만 필요한 상태)
  const { consults, isLoading } = useConsultData();
  
  if (isLoading) return <LoadingSpinner />;
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h2 className="text-xl font-bold mb-4">최근 상담 내역</h2>
      
      <ul className="divide-y">
        {consults.map((consult) => (
          <li key={consult.id} className="py-3 flex justify-between items-center">
            <div>
              <p className="font-semibold">{consult.clientName}</p>
              <p className="text-sm text-gray-500">{consult.date}</p>
            </div>
            {/* 재사용 부품 컴포넌트 활용 */}
            <StatusBadge status={consult.status} /> 
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## 3. 재사용이 잦은 미니 부품 (UI Atom Component)
- **권장 크기**: 50줄 이내
- **파일 위치 (예시)**: `src/components/ui/StatusBadge.tsx`, `Button.tsx`
- **주요 역할**: 사이트 전반에서 공통으로 사용되는 가장 작은 단위의 시각적 요소입니다. (버튼, 뱃지, 입력창, 아이콘 등)
- **수정 체감 효과**: "포인트 컬러를 파란색에서 보라색으로 바꿔주세요"라는 요청 시, 미니 부품 하나만 수정하면 수십 개의 페이지에 100% 에러 없이 일괄 자동 반영됩니다.

**💡 팩트 기반 작성 규칙**
- 비즈니스 로직(API 등)을 절대 포함해서는 안 됩니다. 순수하게 props(데이터)를 받아 화면에 그려주기만(UI) 해야 합니다.
- 다양한 상황에 대응할 수 있도록 `variant`, `size` 등의 속성을 지원하게 만듭니다.

```tsx
// ⭕ 좋은 예: 어떤 상태(status)가 들어오냐에 따라 색상만 변경 (50줄 이내)
interface StatusBadgeProps {
  status: 'PENDING' | 'COMPLETED' | 'CANCELED';
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const styles = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    COMPLETED: 'bg-green-100 text-green-800',
    CANCELED: 'bg-red-100 text-red-800',
  };
  
  const labels = {
    PENDING: '대기중',
    COMPLETED: '완료됨',
    CANCELED: '취소됨',
  };
  
  return (
    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}
```

## 📝 요약 체크리스트 (설계 검증 및 리뷰 시)
- [ ] `page.tsx` 파일명은 화면 구조(레이아웃)만 파악할 수 있도록 100줄 이하로 가볍게 작성되었는가?
- [ ] 특정 기능(예: 결제 정보) 파일이 300줄을 넘어 방대해지지 않았는가?
- [ ] 이곳저곳 중복해서 복사/붙여넣기 되는 버튼이나 상태 뱃지 코드는 없는가? (있다면 `src/components/ui/` 부품 컴포넌트로 만들었는가?)

---

## 🚀 팀 단위 실무 적용 지침 (Action Item)

이 "황금 비율"이 팀 내에서 강제될 수 있도록 다음 환경이 이미 프로젝트에 구축되어 있습니다. 모든 팀원은 이를 준수하여 개발에 참여해 주시기 바랍니다.

1. **ESLint 룰 적용 (적용 완료)** 
   - 파일 길이를 제한하는 ESLint 규칙(`max-lines` 및 `max-lines-per-function`)이 프로젝트에 경고(warn) 수준으로 설정되어 있습니다. 
   - 빌드 과정에서 줄 수가 초과되었다는 경고가 나타난다면 과감히 코드를 기능별로 쪼개거나 Custom Hook으로 로직을 분리하세요.

2. **디렉토리 구조 표준화 (적용 완료)**
   - 전체 화면 배치를 위한 뼈대: `app/` 하위
   - 특정 도메인의 핵심 비즈니스 컴포넌트: `src/features/` 하위
   - 도메인과 무관한 재사용 가능한 순수 UI (버튼, 뱃지 등): `src/components/ui/` 하위
