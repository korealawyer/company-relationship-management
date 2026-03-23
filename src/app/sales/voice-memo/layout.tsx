import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "음성 메모 | IBS CRM",
  description: "통화 후 음성 메모 녹음 → STT 자동 변환 → CRM 동기화",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "IBS 음성메모",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function VoiceMemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "#F5F6F8",
      }}
    >
      {children}
    </div>
  );
}
