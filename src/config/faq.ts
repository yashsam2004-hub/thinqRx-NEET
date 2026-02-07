/**
 * FAQ Data for AEO (Answer Engine Optimization)
 * Optimized for ChatGPT, Perplexity, Google SGE
 */

export interface FAQItem {
  question: string;
  answer: string;
  category: "general" | "gpat";
}

export const FAQ_DATA: FAQItem[] = [
  // General
  {
    question: "What is GPAT exam?",
    answer: "GPAT (Graduate Pharmacy Aptitude Test) is a national-level entrance exam for M.Pharm admissions in India. It is conducted as a computer-based test with 125 MCQs covering pharmaceutical sciences as per PCI syllabus. A valid GPAT score is mandatory for government-funded M.Pharm programs.",
    category: "general",
  },
  {
    question: "Who conducts GPAT exam in India?",
    answer: "GPAT exam is conducted by the National Testing Agency (NTA) on behalf of the All India Council for Technical Education (AICTE). The exam is held annually for pharmacy graduates seeking M.Pharm admissions in government and private institutions across India.",
    category: "general",
  },
  
  // GPAT Specific
  {
    question: "How to prepare for GPAT exam?",
    answer: "GPAT preparation requires systematic study of pharmaceutical sciences following the latest PCI syllabus. Focus on core subjects like Medicinal Chemistry, Pharmacology, Pharmaceutics, and Pharmacognosy. Practice with GPAT-pattern mock tests and previous year questions for better scores.",
    category: "gpat",
  },
  {
    question: "Is GPAT mandatory for M.Pharm admission?",
    answer: "GPAT is mandatory for M.Pharm admissions in government-funded institutions across India. A valid GPAT score is also required for AICTE stipend eligibility. Many private colleges in India also accept GPAT scores for admissions.",
    category: "gpat",
  },
  {
    question: "What is GPAT exam pattern?",
    answer: "GPAT is a computer-based national exam with 125 multiple-choice questions. Each correct answer carries +4 marks, with -1 mark deducted for wrong answers. The exam duration is 3 hours and covers pharmaceutical chemistry, pharmacology, pharmaceutics, and pharmacognosy as per PCI syllabus.",
    category: "gpat",
  },
  {
    question: "What is the GPAT syllabus?",
    answer: "GPAT syllabus is based on the PCI (Pharmacy Council of India) B.Pharm curriculum. It covers four main subjects: Pharmaceutics, Pharmaceutical Chemistry, Pharmacology, and Pharmacognosy. The exam tests fundamental and applied knowledge across all pharmaceutical sciences.",
    category: "gpat",
  },
  {
    question: "How many times is GPAT conducted in a year?",
    answer: "GPAT is conducted once a year by NTA, typically in January or February. The exact dates are announced by NTA on the official GPAT website. Candidates must register online during the specified application period to appear for the exam.",
    category: "gpat",
  },
  {
    question: "What is the validity of GPAT score?",
    answer: "GPAT score is valid for three years from the date of declaration of results. Candidates can use their GPAT score for M.Pharm admissions across India during this validity period. The score is also used for AICTE stipend eligibility verification.",
    category: "gpat",
  },
];

// Helper: Get FAQs by category
export const getFAQsByCategory = (category: FAQItem["category"]) =>
  FAQ_DATA.filter((faq) => faq.category === category);

// Helper: Get all FAQs
export const getAllFAQs = () => FAQ_DATA;
