/**
 * FAQ Data for AEO (Answer Engine Optimization)
 * Optimized for ChatGPT, Perplexity, Google SGE
 */

export interface FAQItem {
  question: string;
  answer: string;
  category: "general" | "neet" | "platform";
}

export const FAQ_DATA: FAQItem[] = [
  // Platform-specific questions
  {
    question: "What is NEET Prep Platform?",
    answer: "NEET Prep Platform is a web-based exam preparation platform for NEET UG (National Eligibility cum Entrance Test) in India. It uses AI to generate study notes for Physics, Chemistry, and Biology, provides practice questions, and tracks your performance. Built by Thinqr (OPC) Pvt Ltd.",
    category: "platform",
  },
  {
    question: "Is NEET Prep Platform free to use?",
    answer: "NEET Prep Platform offers a free plan with limited access to study material and features. Paid plans (Plus at ₹199/month and Pro at ₹299/month) provide full access to all features, including unlimited practice tests and advanced analytics. Annual billing options are also available with 20% discount.",
    category: "platform",
  },
  {
    question: "Which exams are supported by NEET Prep Platform?",
    answer: "NEET Prep Platform currently focuses on NEET UG (National Eligibility cum Entrance Test) preparation. The platform covers all three subjects: Physics, Chemistry, and Biology (Botany & Zoology) according to the NCERT syllabus for Class 11 and 12.",
    category: "platform",
  },
  {
    question: "How does AI help in exam preparation on NEET Prep Platform?",
    answer: "NEET Prep Platform uses artificial intelligence to generate topic-wise study notes based on the NEET UG syllabus. The AI organizes content by subject and topic, making it easier to navigate and study. The platform also uses your test performance to identify weak areas and recommend focused practice.",
    category: "platform",
  },
  {
    question: "Is payment secure on NEET Prep Platform?",
    answer: "Yes. NEET Prep Platform uses Razorpay, a certified payment gateway in India, to process all payments. Razorpay is PCI DSS compliant and all transactions are encrypted. We do not store your payment card details on our servers.",
    category: "platform",
  },
  
  // General NEET questions
  {
    question: "What is NEET UG exam?",
    answer: "NEET UG (National Eligibility cum Entrance Test - Undergraduate) is a national-level entrance exam for MBBS and BDS admissions in India. It is conducted as a pen-and-paper test with 180 MCQs covering Physics, Chemistry, and Biology (Botany & Zoology) based on NCERT syllabus for Class 11 and 12.",
    category: "general",
  },
  {
    question: "Who conducts NEET UG exam in India?",
    answer: "NEET UG exam is conducted by the National Testing Agency (NTA) on behalf of the Ministry of Health and Family Welfare, Government of India. The exam is held annually for students seeking MBBS/BDS admissions in government and private medical/dental colleges across India.",
    category: "general",
  },
  
  // NEET Specific
  {
    question: "How to prepare for NEET UG exam?",
    answer: "NEET UG preparation requires systematic study of NCERT textbooks for Class 11 and 12 covering Physics, Chemistry, and Biology. Focus on understanding concepts, practice numerical problems in Physics and Chemistry, and master Biology diagrams and processes. Regular practice with NEET-pattern mock tests is essential for better scores.",
    category: "neet",
  },
  {
    question: "Is NEET UG mandatory for MBBS admission?",
    answer: "Yes, NEET UG is mandatory for MBBS and BDS admissions in all medical and dental colleges in India, including government, private, and deemed universities. Without a valid NEET UG score, you cannot get admission to any medical/dental course in India.",
    category: "neet",
  },
  {
    question: "What is NEET UG exam pattern?",
    answer: "NEET UG is a pen-and-paper based exam with 180 multiple-choice questions (45 each in Physics and Chemistry, 90 in Biology). Each correct answer carries +4 marks, with -1 mark deducted for wrong answers. The exam duration is 3 hours and covers NCERT syllabus for Class 11 and 12.",
    category: "neet",
  },
  {
    question: "What is the NEET UG syllabus?",
    answer: "NEET UG syllabus is based on NCERT curriculum for Class 11 and 12. It covers Physics (Mechanics, Thermodynamics, Optics, etc.), Chemistry (Physical, Organic, Inorganic), and Biology (Botany: Plant Physiology, Genetics, Ecology; Zoology: Human Physiology, Evolution, Biotechnology). The syllabus is officially prescribed by NTA.",
    category: "neet",
  },
  {
    question: "How many times is NEET UG conducted in a year?",
    answer: "NEET UG is conducted once a year by NTA, typically in May. The exact dates are announced by NTA on the official NEET website. Candidates must register online during the specified application period (usually February-March) to appear for the exam.",
    category: "neet",
  },
  {
    question: "What is the validity of NEET UG score?",
    answer: "NEET UG score is valid for one year only. Candidates must use their NEET UG score for admissions in the same year through counseling conducted by relevant authorities (MCC for All India Quota, State authorities for State Quota). For next year's admissions, you need to reappear for NEET UG.",
    category: "neet",
  },
];

// Helper: Get FAQs by category
export const getFAQsByCategory = (category: FAQItem["category"]) =>
  FAQ_DATA.filter((faq) => faq.category === category);

// Helper: Get all FAQs
export const getAllFAQs = () => FAQ_DATA;
