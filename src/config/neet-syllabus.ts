/**
 * NEET UG Syllabus Structure
 * Based on NCERT curriculum for Class 11 and 12
 * 
 * This file serves as a reference for admin to add subjects and topics
 * Admin will use the admin panel to actually create these in the database
 */

export interface SubjectConfig {
  name: string;
  description: string;
  order: number;
  topics: TopicConfig[];
}

export interface TopicConfig {
  name: string;
  slug: string;
  class: "11" | "12" | "both";
  importance: "high" | "medium" | "low";
  description?: string;
}

export const NEET_SUBJECTS: SubjectConfig[] = [
  {
    name: "Physics",
    description: "Physical world and measurement, kinematics, laws of motion, thermodynamics, electromagnetism, optics, and modern physics",
    order: 1,
    topics: [
      // Class 11
      { name: "Physical World", slug: "physical-world", class: "11", importance: "low" },
      { name: "Units and Measurements", slug: "units-measurements", class: "11", importance: "high" },
      { name: "Motion in a Straight Line", slug: "motion-straight-line", class: "11", importance: "high" },
      { name: "Motion in a Plane", slug: "motion-plane", class: "11", importance: "high" },
      { name: "Laws of Motion", slug: "laws-of-motion", class: "11", importance: "high" },
      { name: "Work, Energy and Power", slug: "work-energy-power", class: "11", importance: "high" },
      { name: "System of Particles and Rotational Motion", slug: "rotational-motion", class: "11", importance: "high" },
      { name: "Gravitation", slug: "gravitation", class: "11", importance: "high" },
      { name: "Mechanical Properties of Solids", slug: "mechanical-properties-solids", class: "11", importance: "medium" },
      { name: "Mechanical Properties of Fluids", slug: "mechanical-properties-fluids", class: "11", importance: "medium" },
      { name: "Thermal Properties of Matter", slug: "thermal-properties", class: "11", importance: "medium" },
      { name: "Thermodynamics", slug: "thermodynamics", class: "11", importance: "high" },
      { name: "Kinetic Theory", slug: "kinetic-theory", class: "11", importance: "medium" },
      { name: "Oscillations and Waves", slug: "oscillations-waves", class: "11", importance: "high" },
      
      // Class 12
      { name: "Electric Charges and Fields", slug: "electric-charges-fields", class: "12", importance: "high" },
      { name: "Electrostatic Potential and Capacitance", slug: "electrostatic-potential", class: "12", importance: "high" },
      { name: "Current Electricity", slug: "current-electricity", class: "12", importance: "high" },
      { name: "Moving Charges and Magnetism", slug: "moving-charges-magnetism", class: "12", importance: "high" },
      { name: "Magnetism and Matter", slug: "magnetism-matter", class: "12", importance: "medium" },
      { name: "Electromagnetic Induction", slug: "electromagnetic-induction", class: "12", importance: "high" },
      { name: "Alternating Current", slug: "alternating-current", class: "12", importance: "high" },
      { name: "Electromagnetic Waves", slug: "electromagnetic-waves", class: "12", importance: "medium" },
      { name: "Ray Optics and Optical Instruments", slug: "ray-optics", class: "12", importance: "high" },
      { name: "Wave Optics", slug: "wave-optics", class: "12", importance: "high" },
      { name: "Dual Nature of Radiation and Matter", slug: "dual-nature", class: "12", importance: "high" },
      { name: "Atoms", slug: "atoms", class: "12", importance: "medium" },
      { name: "Nuclei", slug: "nuclei", class: "12", importance: "high" },
      { name: "Semiconductor Electronics", slug: "semiconductor-electronics", class: "12", importance: "medium" },
    ],
  },
  {
    name: "Chemistry",
    description: "Physical chemistry, inorganic chemistry, and organic chemistry based on NCERT Class 11 and 12",
    order: 2,
    topics: [
      // Class 11
      { name: "Some Basic Concepts of Chemistry", slug: "basic-concepts-chemistry", class: "11", importance: "high" },
      { name: "Structure of Atom", slug: "structure-of-atom", class: "11", importance: "high" },
      { name: "Classification of Elements and Periodicity", slug: "periodic-table", class: "11", importance: "high" },
      { name: "Chemical Bonding and Molecular Structure", slug: "chemical-bonding", class: "11", importance: "high" },
      { name: "States of Matter", slug: "states-of-matter", class: "11", importance: "medium" },
      { name: "Thermodynamics", slug: "thermodynamics-chem", class: "11", importance: "high" },
      { name: "Equilibrium", slug: "equilibrium", class: "11", importance: "high" },
      { name: "Redox Reactions", slug: "redox-reactions", class: "11", importance: "high" },
      { name: "Hydrogen", slug: "hydrogen", class: "11", importance: "medium" },
      { name: "s-Block Elements", slug: "s-block-elements", class: "11", importance: "medium" },
      { name: "p-Block Elements", slug: "p-block-elements", class: "11", importance: "high" },
      { name: "Organic Chemistry - Basic Principles", slug: "organic-chemistry-basics", class: "11", importance: "high" },
      { name: "Hydrocarbons", slug: "hydrocarbons", class: "11", importance: "high" },
      { name: "Environmental Chemistry", slug: "environmental-chemistry", class: "11", importance: "low" },
      
      // Class 12
      { name: "Solid State", slug: "solid-state", class: "12", importance: "medium" },
      { name: "Solutions", slug: "solutions", class: "12", importance: "high" },
      { name: "Electrochemistry", slug: "electrochemistry", class: "12", importance: "high" },
      { name: "Chemical Kinetics", slug: "chemical-kinetics", class: "12", importance: "high" },
      { name: "Surface Chemistry", slug: "surface-chemistry", class: "12", importance: "medium" },
      { name: "General Principles of Isolation of Elements", slug: "isolation-elements", class: "12", importance: "medium" },
      { name: "p-Block Elements (Group 15-18)", slug: "p-block-12", class: "12", importance: "high" },
      { name: "d and f Block Elements", slug: "d-f-block-elements", class: "12", importance: "high" },
      { name: "Coordination Compounds", slug: "coordination-compounds", class: "12", importance: "high" },
      { name: "Haloalkanes and Haloarenes", slug: "haloalkanes-haloarenes", class: "12", importance: "high" },
      { name: "Alcohols, Phenols and Ethers", slug: "alcohols-phenols-ethers", class: "12", importance: "high" },
      { name: "Aldehydes, Ketones and Carboxylic Acids", slug: "aldehydes-ketones", class: "12", importance: "high" },
      { name: "Amines", slug: "amines", class: "12", importance: "high" },
      { name: "Biomolecules", slug: "biomolecules", class: "12", importance: "high" },
      { name: "Polymers", slug: "polymers", class: "12", importance: "medium" },
      { name: "Chemistry in Everyday Life", slug: "chemistry-everyday-life", class: "12", importance: "medium" },
    ],
  },
  {
    name: "Biology - Botany",
    description: "Plant biology including morphology, anatomy, physiology, reproduction, genetics, and ecology",
    order: 3,
    topics: [
      // Class 11
      { name: "The Living World", slug: "living-world", class: "11", importance: "low" },
      { name: "Biological Classification", slug: "biological-classification", class: "11", importance: "high" },
      { name: "Plant Kingdom", slug: "plant-kingdom", class: "11", importance: "high" },
      { name: "Morphology of Flowering Plants", slug: "morphology-flowering-plants", class: "11", importance: "high" },
      { name: "Anatomy of Flowering Plants", slug: "anatomy-flowering-plants", class: "11", importance: "high" },
      { name: "Cell: The Unit of Life", slug: "cell-unit-life", class: "11", importance: "high" },
      { name: "Cell Cycle and Cell Division", slug: "cell-cycle-division", class: "11", importance: "high" },
      { name: "Transport in Plants", slug: "transport-plants", class: "11", importance: "high" },
      { name: "Mineral Nutrition", slug: "mineral-nutrition", class: "11", importance: "medium" },
      { name: "Photosynthesis in Higher Plants", slug: "photosynthesis", class: "11", importance: "high" },
      { name: "Respiration in Plants", slug: "respiration-plants", class: "11", importance: "high" },
      { name: "Plant Growth and Development", slug: "plant-growth-development", class: "11", importance: "high" },
      
      // Class 12
      { name: "Reproduction in Organisms", slug: "reproduction-organisms", class: "12", importance: "medium" },
      { name: "Sexual Reproduction in Flowering Plants", slug: "sexual-reproduction-plants", class: "12", importance: "high" },
      { name: "Principles of Inheritance and Variation", slug: "inheritance-variation", class: "12", importance: "high" },
      { name: "Molecular Basis of Inheritance", slug: "molecular-basis-inheritance", class: "12", importance: "high" },
      { name: "Evolution", slug: "evolution-botany", class: "12", importance: "high" },
      { name: "Human Health and Disease", slug: "health-disease-botany", class: "12", importance: "medium" },
      { name: "Strategies for Enhancement in Food Production", slug: "food-production", class: "12", importance: "medium" },
      { name: "Microbes in Human Welfare", slug: "microbes-welfare", class: "12", importance: "medium" },
      { name: "Biotechnology: Principles and Processes", slug: "biotechnology-principles", class: "12", importance: "high" },
      { name: "Biotechnology and its Applications", slug: "biotechnology-applications", class: "12", importance: "high" },
      { name: "Organisms and Populations", slug: "organisms-populations", class: "12", importance: "high" },
      { name: "Ecosystem", slug: "ecosystem", class: "12", importance: "high" },
      { name: "Biodiversity and Conservation", slug: "biodiversity-conservation", class: "12", importance: "high" },
      { name: "Environmental Issues", slug: "environmental-issues", class: "12", importance: "medium" },
    ],
  },
  {
    name: "Biology - Zoology",
    description: "Animal biology including diversity, human physiology, reproduction, genetics, and evolution",
    order: 4,
    topics: [
      // Class 11
      { name: "Animal Kingdom", slug: "animal-kingdom", class: "11", importance: "high" },
      { name: "Structural Organization in Animals", slug: "structural-organization-animals", class: "11", importance: "medium" },
      { name: "Biomolecules", slug: "biomolecules-zoo", class: "11", importance: "high" },
      { name: "Digestion and Absorption", slug: "digestion-absorption", class: "11", importance: "high" },
      { name: "Breathing and Exchange of Gases", slug: "breathing-gas-exchange", class: "11", importance: "high" },
      { name: "Body Fluids and Circulation", slug: "body-fluids-circulation", class: "11", importance: "high" },
      { name: "Excretory Products and their Elimination", slug: "excretory-products", class: "11", importance: "high" },
      { name: "Locomotion and Movement", slug: "locomotion-movement", class: "11", importance: "medium" },
      { name: "Neural Control and Coordination", slug: "neural-control", class: "11", importance: "high" },
      { name: "Chemical Coordination and Integration", slug: "chemical-coordination", class: "11", importance: "high" },
      
      // Class 12
      { name: "Reproduction in Organisms (Zoology)", slug: "reproduction-organisms-zoo", class: "12", importance: "medium" },
      { name: "Human Reproduction", slug: "human-reproduction", class: "12", importance: "high" },
      { name: "Reproductive Health", slug: "reproductive-health", class: "12", importance: "high" },
      { name: "Principles of Inheritance and Variation (Zoology)", slug: "inheritance-variation-zoo", class: "12", importance: "high" },
      { name: "Molecular Basis of Inheritance (Zoology)", slug: "molecular-inheritance-zoo", class: "12", importance: "high" },
      { name: "Evolution (Zoology)", slug: "evolution-zoo", class: "12", importance: "high" },
      { name: "Human Health and Disease (Zoology)", slug: "health-disease-zoo", class: "12", importance: "high" },
      { name: "Microbes in Human Welfare (Zoology)", slug: "microbes-zoo", class: "12", importance: "medium" },
      { name: "Biotechnology and its Applications (Zoology)", slug: "biotechnology-zoo", class: "12", importance: "high" },
      { name: "Organisms and Populations (Zoology)", slug: "organisms-populations-zoo", class: "12", importance: "high" },
      { name: "Ecosystem (Zoology)", slug: "ecosystem-zoo", class: "12", importance: "high" },
      { name: "Biodiversity and Conservation (Zoology)", slug: "biodiversity-zoo", class: "12", importance: "high" },
      { name: "Environmental Issues (Zoology)", slug: "environmental-issues-zoo", class: "12", importance: "medium" },
    ],
  },
];

/**
 * Helper function to get all topics for a subject
 */
export function getTopicsBySubject(subjectName: string): TopicConfig[] {
  const subject = NEET_SUBJECTS.find(s => s.name === subjectName);
  return subject?.topics || [];
}

/**
 * Helper function to get high-importance topics
 */
export function getHighImportanceTopics(): { subject: string; topics: TopicConfig[] }[] {
  return NEET_SUBJECTS.map(subject => ({
    subject: subject.name,
    topics: subject.topics.filter(t => t.importance === "high"),
  }));
}

/**
 * Helper function to count total topics per subject
 */
export function getTopicCounts() {
  return NEET_SUBJECTS.map(subject => ({
    subject: subject.name,
    total: subject.topics.length,
    class11: subject.topics.filter(t => t.class === "11" || t.class === "both").length,
    class12: subject.topics.filter(t => t.class === "12" || t.class === "both").length,
    highImportance: subject.topics.filter(t => t.importance === "high").length,
  }));
}

/**
 * Total question distribution in NEET UG
 */
export const NEET_EXAM_PATTERN = {
  physics: {
    totalQuestions: 45,
    marksPerQuestion: 4,
    totalMarks: 180,
    negativeMarking: -1,
  },
  chemistry: {
    totalQuestions: 45,
    marksPerQuestion: 4,
    totalMarks: 180,
    negativeMarking: -1,
  },
  biology: {
    totalQuestions: 90, // 45 Botany + 45 Zoology
    marksPerQuestion: 4,
    totalMarks: 360,
    negativeMarking: -1,
    botany: 45,
    zoology: 45,
  },
  total: {
    totalQuestions: 180,
    totalMarks: 720,
    duration: 180, // minutes
  },
};
