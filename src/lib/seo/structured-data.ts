/**
 * Structured Data (JSON-LD) helpers for SEO, AEO, and GEO optimization
 * Helps search engines and AI assistants understand page content
 */

import { PLATFORM } from "@/config/platform";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";

export interface Organization {
  "@context": "https://schema.org";
  "@type": "Organization";
  name: string;
  url: string;
  logo: string;
  description: string;
  sameAs: string[];
  contactPoint: {
    "@type": "ContactPoint";
    email: string;
    contactType: string;
  };
}

export function getOrganizationSchema(): Organization {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: PLATFORM.brand,
    url: BASE_URL,
    logo: `${BASE_URL}/logo.png`,
    description: `${PLATFORM.tagline}. Platform for NEET UG medical entrance exam in ${PLATFORM.country} operated by ${PLATFORM.company}`,
    sameAs: [],
    contactPoint: {
      "@type": "ContactPoint",
      email: PLATFORM.contact.email,
      contactType: "Customer Support",
    },
  };
}

export interface Course {
  "@context": "https://schema.org";
  "@type": "Course";
  name: string;
  description: string;
  provider: {
    "@type": "Organization";
    name: string;
    url: string;
  };
  courseCode?: string;
  educationalLevel?: string;
  teaches?: string[];
  availableLanguage?: string;
  offers?: {
    "@type": "Offer";
    price: string;
    priceCurrency: string;
    availability: string;
    url: string;
  }[];
}

export function getCourseSchema(
  courseName: string,
  description: string,
  courseUrl: string,
  topics?: string[]
): Course {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: courseName,
    description,
    provider: {
      "@type": "Organization",
      name: PLATFORM.brand,
      url: BASE_URL,
    },
    educationalLevel: "Graduate",
    ...(topics && { teaches: topics }),
    availableLanguage: "English",
    offers: [
      {
        "@type": "Offer",
        price: "0",
        priceCurrency: "INR",
        availability: "https://schema.org/InStock",
        url: `${BASE_URL}${courseUrl}`,
      },
      {
        "@type": "Offer",
        price: "199",
        priceCurrency: "INR",
        availability: "https://schema.org/InStock",
        url: `${BASE_URL}/pricing`,
      },
    ],
  };
}

export interface BreadcrumbList {
  "@context": "https://schema.org";
  "@type": "BreadcrumbList";
  itemListElement: {
    "@type": "ListItem";
    position: number;
    name: string;
    item: string;
  }[];
}

export function getBreadcrumbSchema(
  items: { name: string; url: string }[]
): BreadcrumbList {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${BASE_URL}${item.url}`,
    })),
  };
}

export interface FAQPage {
  "@context": "https://schema.org";
  "@type": "FAQPage";
  mainEntity: {
    "@type": "Question";
    name: string;
    acceptedAnswer: {
      "@type": "Answer";
      text: string;
    };
  }[];
}

export function getFAQSchema(faqs: { question: string; answer: string }[]): FAQPage {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export interface WebPage {
  "@context": "https://schema.org";
  "@type": "WebPage";
  name: string;
  description: string;
  url: string;
  inLanguage: string;
  isPartOf: {
    "@type": "WebSite";
    name: string;
    url: string;
  };
}

export function getWebPageSchema(
  name: string,
  description: string,
  url: string
): WebPage {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name,
    description,
    url: `${BASE_URL}${url}`,
    inLanguage: "en-IN",
    isPartOf: {
      "@type": "WebSite",
      name: PLATFORM.brand,
      url: BASE_URL,
    },
  };
}

export function renderStructuredData(data: object): string {
  return JSON.stringify(data);
}
