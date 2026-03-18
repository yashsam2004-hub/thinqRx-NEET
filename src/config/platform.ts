/**
 * NEET Prep Platform Configuration
 * Single source of truth for branding, exams, and platform metadata
 */

export const PLATFORM = {
  // Branding
  brand: "NEET Prep Platform",
  company: "Thinqr (OPC) Pvt Ltd",
  domain: "NEET UG Exam Preparation",
  tagline: "AI-Powered NEET UG Exam Preparation",
  
  // Primary exam
  primaryExam: "NEET UG",
  
  // Geographic focus
  country: "India",
  
  // SEO Keywords (Primary Cluster)
  keywords: [
    "NEET UG Preparation",
    "NEET Exam Preparation",
    "National Eligibility cum Entrance Test",
    "MBBS Entrance Exam",
    "Medical Entrance Preparation India",
    "NEET Mock Tests",
    "NCERT Syllabus",
    "NEET Physics Chemistry Biology",
  ],
  
  // Contact & Social
  contact: {
    email: "support@neetprep.com",
    website: "https://neetprep.com",
  },
  
  // Legal
  legal: {
    companyName: "Thinqr (OPC) Pvt Ltd",
    brandNotice: "NEET Prep Platform is operated by Thinqr (OPC) Pvt Ltd.",
    platformDescription: "AI-powered preparation platform for NEET UG (National Eligibility cum Entrance Test) in India. Content aligned with NCERT syllabus for MBBS/BDS entrance preparation.",
    disclaimer: "An educational technology platform for NEET UG exam preparation. Not affiliated with NTA, MCI, or any government examination authority.",
  },
} as const;

