import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import { AppToaster } from "@/components/layout/app-toaster";
import { AuthProvider } from "@/providers/auth-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import { APP_URL } from "@/lib/app-metadata";
import { THEME_STORAGE_KEY } from "@/lib/preferences/theme";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: "ExamForge AI",
  description:
    "AI-powered assessment and exam generation platform with real-time processing, study material grounding, and PDF export.",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: "ExamForge AI",
    description:
      "AI-powered assessment and exam generation platform with real-time processing, study material grounding, and PDF export.",
    images: [
      {
        url: "/icon.png",
        width: 512,
        height: 512,
        alt: "ExamForge AI",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "ExamForge AI",
    description:
      "AI-powered assessment and exam generation platform with real-time processing, study material grounding, and PDF export.",
    images: ["/icon.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var k="${THEME_STORAGE_KEY}";var s=localStorage.getItem(k)||"system";var d=s==="dark"||(s==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);}catch(e){}})();`,
          }}
        />
      </head>
      <body className="flex min-h-full flex-col md:h-full md:overflow-hidden">
        <ThemeProvider>
          <AuthProvider>
            <AppToaster />
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
