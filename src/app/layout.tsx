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
  title: "한국 1등 프랜차이즈 전문 로펌 | IBS 법률사무소",
  description: "12,000개 프랜차이즈 본부의 개인정보처리방침 리스크를 AI가 자동 분석합니다. 과징금 3,000만원을 월 99,000원으로 방어하세요.",
  keywords: "프랜차이즈 법률자문, 개인정보처리방침 검토, 가맹본부 법무, 프랜차이즈 전문 로펌, IBS 법률사무소",
  openGraph: {
    title: "한국 1등 프랜차이즈 전문 로펌 | IBS 법률사무소",
    description: "AI 기반 개인정보처리방침 자동 분석 · 전담 변호사 교차 검증 · 월 구독 법률 자문",
    locale: "ko_KR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={notoSansKR.variable}>
      <body className="antialiased min-h-screen flex flex-col" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>
        <Navbar />
        <AuthProvider>
          <main className="flex-1 pt-20">
            {children}
          </main>
          <FloatingChatbot />
        </AuthProvider>
      </body>
    </html>
  );
}
