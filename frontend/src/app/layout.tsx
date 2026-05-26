import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AppToaster } from "@/components/layout/app-toaster";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VedaAI",
  description: "AI Assessment Generator",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col md:h-full md:overflow-hidden">
        <AppToaster />
        {children}
      </body>
    </html>
  );
}
