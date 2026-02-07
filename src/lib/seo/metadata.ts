import { Metadata } from "next";

interface SEOConfig {
  title: string;
  description: string;
  keywords?: string[];
  canonical?: string;
  ogImage?: string;
  noindex?: boolean;
}

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://thinqr.com";
const DEFAULT_OG_IMAGE = "/og-image.jpg";

export function generateMetadata(config: SEOConfig): Metadata {
  const {
    title,
    description,
    keywords = [],
    canonical,
    ogImage = DEFAULT_OG_IMAGE,
    noindex = false,
  } = config;

  const fullTitle = title.includes("ThinqR") ? title : `${title} | ThinqR`;
  const url = canonical ? `${BASE_URL}${canonical}` : BASE_URL;
  const imageUrl = ogImage.startsWith("http") ? ogImage : `${BASE_URL}${ogImage}`;

  return {
    title: fullTitle,
    description,
    keywords: keywords.join(", "),
    authors: [{ name: "ThinqR Team" }],
    creator: "ThinqR",
    publisher: "ThinqR",
    robots: noindex
      ? { index: false, follow: false }
      : { index: true, follow: true, googleBot: { index: true, follow: true } },
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: "website",
      url,
      title: fullTitle,
      description,
      siteName: "ThinqR",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: "en_IN",
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [imageUrl],
      creator: "@ThinqRApp",
    },
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION,
    },
  };
}

export function generateCourseMetadata(courseName: string, year: string): Metadata {
  return generateMetadata({
    title: `${courseName} ${year} Preparation - AI-Powered Learning`,
    description: `Ace ${courseName} ${year} with ThinqR's AI-powered platform. Get personalized notes, adaptive tests, mock exams, and rank prediction. Join 10,000+ students preparing smarter.`,
    keywords: [
      `${courseName} ${year}`,
      `${courseName} preparation`,
      `${courseName} online coaching`,
      `${courseName} mock test`,
      `${courseName} study material`,
      "AI learning platform",
      "pharmacy entrance exam",
      "GPAT coaching",
    ],
    canonical: `/courses/${courseName.toLowerCase()}`,
  });
}
