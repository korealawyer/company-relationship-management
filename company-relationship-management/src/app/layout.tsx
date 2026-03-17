import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import Navbar from "@/components/layout/Navbar";
import FloatingChatbot from "@/components/layout/FloatingChatbot";
import { AuthProvider } from "@/lib/AuthContext";
import "./globals.css";

const notoSansKR = Noto_Sans_KR({
  weight: ["400", "500", "600", "700", "800", "900"],
  subsets: ["latin"],
  variable: "--font-noto",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "한국 1등 프랜차이즈 전문 로펌 | IBS 법률사무소",
    template: "%s | IBS 법률사무소",
  },
  description: "12,000개 프랜차이즈 본부의 개인정보처리방침 리스크를 AI가 자동 분석합니다. 과징금 3,000만원을 월 99,000원으로 방어하세요.",
  keywords: ["프랜차이즈 법률자문", "개인정보처리방침 검토", "가맹본부 법무", "프랜차이즈 전문 로펌", "IBS 법률사무소", "가맹사업법", "AI 법률 분석"],
  authors: [{ name: "IBS 법률사무소" }],
  creator: "IBS 법률사무소",
  metadataBase: new URL("https://ibslaw.co.kr"),
  openGraph: {
    title: "한국 1등 프랜차이즈 전문 로펌 | IBS 법률사무소",
    description: "AI 기반 개인정보처리방침 자동 분석 · 전담 변호사 교차 검증 · 월 구독 법률 자문",
    url: "https://ibslaw.co.kr",
    siteName: "IBS 법률사무소",
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "한국 1등 프랜차이즈 전문 로펌 | IBS 법률사무소",
    description: "AI 기반 개인정보처리방침 자동 분석 · 전담 변호사 교차 검증 · 월 구독 법률 자문",
  },
  alternates: {
    canonical: "https://ibslaw.co.kr",
  },
};

// ── JSON-LD 구조화 데이터 (Organization + LegalService) ────
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "LegalService",
  name: "IBS 법률사무소",
  description: "프랜차이즈 전문 법률 자문 · AI 기반 개인정보처리방침 분석 · 월 구독형 리테이너 서비스",
  url: "https://ibslaw.co.kr",
  telephone: "+82-2-555-1234",
  email: "contact@ibslaw.co.kr",
  areaServed: { "@type": "Country", name: "KR" },
  priceRange: "₩990,000 - ₩4,990,000/월",
  serviceType: ["프랜차이즈 법률자문", "개인정보처리방침 검토", "가맹사업법 자문", "노무 상담", "EAP 심리상담"],
  address: {
    "@type": "PostalAddress",
    addressLocality: "서울",
    addressCountry: "KR",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={notoSansKR.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased min-h-screen flex flex-col">
        <AuthProvider>
          <Navbar />
          <main className="flex-1 pt-20">
            {children}
          </main>
          <FloatingChatbot />
        </AuthProvider>
      </body>
    </html>
  );
}
