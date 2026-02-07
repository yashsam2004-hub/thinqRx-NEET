import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "katex/dist/katex.min.css";
import "@/styles/katex-custom.css";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "GPAT Preparation Online | AI Pharmacy Exam Platform – ThinqRx",
    template: "%s | ThinqRx",
  },
  description:
    "Prepare for GPAT exam with AI-powered notes, mock tests & analytics. Trusted by 5,000+ pharmacy students across India. PCI-aligned content for M.Pharm entrance.",
  keywords: [
    "GPAT preparation online",
    "GPAT exam preparation",
    "AI GPAT preparation",
    "pharmacy entrance exam India",
    "GPAT mock tests",
    "M.Pharm entrance",
    "pharmacy exam preparation",
    "GPAT",
    "pharma competitive exams",
    "Graduate Pharmacy Aptitude Test",
    "PCI syllabus",
  ],
  authors: [{ name: "Thinqr (OPC) Pvt Ltd" }],
  creator: "Thinqr (OPC) Pvt Ltd",
  publisher: "Thinqr (OPC) Pvt Ltd",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "/",
    title: "GPAT Preparation Online | AI Pharmacy Exam Platform – ThinqRx",
    description:
      "Prepare for GPAT exam with AI-powered notes, mock tests & analytics. Trusted by pharmacy students across India. PCI-aligned content for M.Pharm entrance.",
    siteName: "ThinqRx",
  },
  twitter: {
    card: "summary_large_image",
    title: "GPAT Preparation Online | AI Pharmacy Exam Platform – ThinqRx",
    description:
      "AI-powered GPAT preparation for pharmacy students in India. Smart notes, mock tests & personalized analytics.",
    creator: "@thinqrx",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
