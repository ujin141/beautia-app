import type { Metadata } from "next";
import { Manrope, Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "../contexts/LanguageContext";
import { NotificationPromptWrapper } from "../components/NotificationPromptWrapper";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const notoSansKr = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["100", "300", "400", "500", "700", "900"],
  variable: "--font-noto-sans-kr",
  display: "swap",
});

export const metadata: Metadata = {
  title: "BEAUTIA - Premium K-Beauty Booking",
  description: "아시아 어디서든, 가장 안전하고 프리미엄하게 Glow Up 예약을 끝내는 K-뷰티 예약 플랫폼",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="scroll-smooth" suppressHydrationWarning>
      <body className={`${manrope.variable} ${notoSansKr.variable} font-sans antialiased bg-background text-primary overflow-x-hidden`} suppressHydrationWarning>
        <ErrorBoundary>
          <LanguageProvider>
            {children}
            <NotificationPromptWrapper />
          </LanguageProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}

// Simple Error Boundary for Server-Side Rendering
function ErrorBoundary({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
