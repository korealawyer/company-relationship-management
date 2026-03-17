import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "도입 상담",
    description: "프랜차이즈 전문 법률·경영·심리 통합 플랫폼 무료 도입 상담. 1,000+ 가맹본부, 45,000명 임직원 지원. 외부 법무비용 70% 절감.",
    keywords: ["프랜차이즈 법률 도입", "리테이너 상담", "가맹본부 법무 플랫폼", "무료 도입 상담"],
    openGraph: {
        title: "도입 상담 | IBS 법률사무소",
        description: "법률·경영·심리, 하나의 플랫폼으로 해결. 무료 도입 상담 신청.",
        url: "https://ibslaw.co.kr/sales",
    },
    alternates: { canonical: "/sales" },
};

export default function SalesLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
