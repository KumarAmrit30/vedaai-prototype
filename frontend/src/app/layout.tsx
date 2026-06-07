import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AppToaster } from "@/components/layout/app-toaster";
import { AuthProvider } from "@/providers/auth-provider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ExamForge AI",
  description:
    "AI-powered assessment and exam generation platform with real-time processing, study material grounding, and PDF export.",
  openGraph: {
    title: "ExamForge AI",
    description:
      "AI-powered assessment and exam generation platform with real-time processing, study material grounding, and PDF export.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col md:h-full md:overflow-hidden">
        <AuthProvider>
          <AppToaster />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
