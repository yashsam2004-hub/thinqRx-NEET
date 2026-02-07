/**
 * ThinqRx Platform Configuration
 * Single source of truth for branding, exams, and platform metadata
 */

export const PLATFORM = {
  // Branding
  brand: "ThinqRx",
  company: "Thinqr (OPC) Pvt Ltd",
  domain: "GPAT Exam Preparation",
  tagline: "AI-Powered GPAT Exam Preparation",
  
  // Primary exam
  primaryExam: "GPAT",
  
  // Geographic focus
  country: "India",
  
  // SEO Keywords (Primary Cluster)
  keywords: [
    "GPAT Preparation",
    "GPAT Exam Preparation",
    "Graduate Pharmacy Aptitude Test",
    "M.Pharm Entrance Exam",
    "Pharmacy Entrance Preparation India",
    "GPAT Mock Tests",
    "PCI Syllabus",
  ],
  
  // Contact & Social
  contact: {
    email: "support@thinqrx.com",
    website: "https://thinqrx.com",
  },
  
  // Legal
  legal: {
    companyName: "Thinqr (OPC) Pvt Ltd",
    brandNotice: "ThinqRx is a registered brand operated by Thinqr (OPC) Pvt Ltd.",
    platformDescription: "AI-powered preparation platform for GPAT (Graduate Pharmacy Aptitude Test) in India. Content aligned with PCI syllabus for M.Pharm entrance preparation.",
    disclaimer: "An educational technology platform for GPAT exam preparation. Not affiliated with NTA, AICTE, or any government examination authority.",
  },
} as const;

