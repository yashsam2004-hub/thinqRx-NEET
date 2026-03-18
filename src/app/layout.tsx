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
    default: "NEET UG Preparation Online | AI Medical Entrance Exam Platform",
    template: "%s | NEET Prep",
  },
  description:
    "Prepare for NEET UG exam with AI-powered notes, mock tests & analytics. Trusted by medical aspirants across India. NCERT-aligned content for MBBS/BDS admission.",
  keywords: [
    "NEET UG preparation online",
    "NEET exam preparation",
    "AI NEET preparation",
    "medical entrance exam India",
    "NEET mock tests",
    "MBBS entrance",
    "medical exam preparation",
    "NEET UG",
    "medical competitive exams",
    "National Eligibility cum Entrance Test",
    "NCERT syllabus",
    "NEET Physics Chemistry Biology",
  ],
  authors: [{ name: "Thinqr (OPC) Pvt Ltd" }],
  creator: "Thinqr (OPC) Pvt Ltd",
  publisher: "Thinqr (OPC) Pvt Ltd",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001"),
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "/",
    title: "NEET UG Preparation Online | AI Medical Entrance Exam Platform",
    description:
      "Prepare for NEET UG exam with AI-powered notes, mock tests & analytics. Trusted by medical aspirants across India. NCERT-aligned content for MBBS/BDS admission.",
    siteName: "NEET Prep Platform",
  },
  twitter: {
    card: "summary_large_image",
    title: "NEET UG Preparation Online | AI Medical Entrance Exam Platform",
    description:
      "AI-powered NEET UG preparation for medical aspirants in India. Smart notes, mock tests & personalized analytics.",
    creator: "@neetprep",
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
