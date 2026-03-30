import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "로그인",
    description: "IBS 법률사무소 CRM 로그인. 직원 이메일 또는 고객사 사업자번호로 로그인하세요.",
    robots: { index: false, follow: false },
    openGraph: {
        title: "로그인 | IBS 법률사무소",
        description: "IBS 법률사무소 고객 포털 로그인",
        url: "https://ibsbase.com/login",
    },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
