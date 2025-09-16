import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/Sidebar";
import { UserProvider } from "@/contexts/UserContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Anxy - 불안한 감정을 위한 커뮤니티",
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background text-foreground`}
      >
        <UserProvider>
          <Header />
          <Sidebar />
          <main className="lg:ml-64 pt-16 lg:pt-24">
            {children}
          </main>
        </UserProvider>
      </body>
    </html>
  );
}
