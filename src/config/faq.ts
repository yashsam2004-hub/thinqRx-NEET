/**
 * FAQ Data for AEO (Answer Engine Optimization)
 * Optimized for ChatGPT, Perplexity, Google SGE
 */

export interface FAQItem {
  question: string;
  answer: string;
  category: "general" | "gpat" | "platform";
}

export const FAQ_DATA: FAQItem[] = [
  // Platform-specific questions
  {
    question: "What is ThinqRx?",
    answer: "ThinqRx is a web-based exam preparation platform for GPAT and other pharmacy entrance exams in India. It uses AI to generate study notes, provides practice questions, and tracks your performance. ThinqRx is built by Thinqr (OPC) Pvt Ltd.",
    category: "platform",
  },
  {
    question: "Is ThinqRx free to use?",
    answer: "ThinqRx offers a free plan with limited access to study material and features. Paid plans (Plus at ₹199/month and Pro at ₹299/month) provide full access to all features, including unlimited practice tests and advanced analytics. Annual billing options are also available.",
    category: "platform",
  },
  {
    question: "Which exams are supported by ThinqRx?",
    answer: "ThinqRx currently focuses on GPAT (Graduate Pharmacy Aptitude Test) preparation. The platform covers all four main subjects according to the PCI syllabus: Pharmaceutics, Pharmaceutical Chemistry, Pharmacology, and Pharmacognosy.",
    category: "platform",
  },
  {
    question: "How does AI help in exam preparation on ThinqRx?",
    answer: "ThinqRx uses artificial intelligence to generate topic-wise study notes based on the GPAT syllabus. The AI organizes content by subject and topic, making it easier to navigate and study. The platform also uses your test performance to identify areas where you need more practice.",
    category: "platform",
  },
  {
    question: "Is payment secure on ThinqRx?",
    answer: "Yes. ThinqRx uses Razorpay, a certified payment gateway in India, to process all payments. Razorpay is PCI DSS compliant and all transactions are encrypted. ThinqRx does not store your payment card details on its servers.",
    category: "platform",
  },
  
  // General GPAT questions
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
