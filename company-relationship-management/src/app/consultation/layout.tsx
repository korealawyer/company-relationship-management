import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "법률 상담 의뢰",
    description: "계약서 검토, 개인정보처리방침 작성, 내용증명, 법률 의견서, 노무 상담. 회원가입 없이 단건으로 의뢰하세요. 24~48시간 답변 보장.",
    keywords: ["법률 상담", "계약서 검토", "개인정보처리방침 작성", "내용증명", "노무 상담", "단건 법률 서비스"],
    openGraph: {
        title: "법률 상담 의뢰 | IBS 법률사무소",
        description: "필요한 법률 서비스만 골라서, 지금 바로. 결제 후 즉시 변호사 배정, 24~48시간 답변 보장.",
        url: "https://ibslaw.co.kr/consultation",
    },
    alternates: { canonical: "/consultation" },
};

export default function ConsultationLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
