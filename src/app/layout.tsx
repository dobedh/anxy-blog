import type { Metadata } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import ConditionalHeader from "@/components/layout/ConditionalHeader";

// useSearchParams Suspense boundary 에러 해결을 위해 전체 앱을 dynamic rendering으로 설정
export const dynamic = 'force-dynamic';

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  weight: ["400", "600"],
});

export const metadata: Metadata = {
  title: "Anxy Blog - 불안한 감정을 위한 커뮤니티",
  description: "불안한 감정을 느끼는 사람들을 위한 안전한 공간",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${inter.variable} ${sourceSerif.variable} antialiased min-h-screen bg-background text-foreground`}
      >
          <ConditionalHeader />
          <main className="pt-16">
            {children}
          </main>
      </body>
    </html>
  );
}
