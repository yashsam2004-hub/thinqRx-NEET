/**
 * Biology Diagram Library for NEET UG
 * 
 * Manages SVG diagrams for Botany and Zoology topics
 * All diagrams are original, NCERT-style schematics
 */

export interface BiologyDiagram {
  id: string;
  path: string;
  title: string;
  category: "botany" | "zoology";
  subtopic: string;
  description: string;
  labels?: string[];
  usedIn?: string[]; // Topics where this diagram is used
}

/**
 * Biology Diagram Catalog
 * Admin will add actual SVG files to /public/biology-diagrams/
 */
export const biologyDiagrams: BiologyDiagram[] = [
  // ===== BOTANY DIAGRAMS =====
  {
    id: "cell-basic-plant",
    path: "/biology-diagrams/botany/cell-structure/basic-plant-cell.svg",
    title: "Basic Plant Cell Structure",
    category: "botany",
    subtopic: "Cell Biology",
    description: "Generic plant cell showing major organelles (cell wall, chloroplast, vacuole, nucleus, mitochondria)",
    labels: ["Cell Wall", "Plasma Membrane", "Nucleus", "Chloroplast", "Vacuole", "Mitochondria"],
    usedIn: ["Cell: The Unit of Life", "Plant Cell Structure"],
  },
  {
    id: "leaf-anatomy",
    path: "/biology-diagrams/botany/plant-anatomy/leaf-cross-section.svg",
    title: "Leaf Cross-Section (Anatomy)",
    category: "botany",
    subtopic: "Plant Anatomy",
    description: "Cross-section of dicot leaf showing epidermis, mesophyll, vascular bundles",
    labels: ["Upper Epidermis", "Palisade Mesophyll", "Spongy Mesophyll", "Vascular Bundle", "Lower Epidermis", "Stomata"],
    usedIn: ["Anatomy of Flowering Plants", "Photosynthesis"],
  },
  {
    id: "photosynthesis-overview",
    path: "/biology-diagrams/botany/photosynthesis/photosynthesis-process.svg",
    title: "Photosynthesis Overview",
    category: "botany",
    subtopic: "Plant Physiology",
    description: "Light and dark reactions overview with inputs and outputs",
    labels: ["Light Reaction", "Dark Reaction (Calvin Cycle)", "Chloroplast"],
    usedIn: ["Photosynthesis in Higher Plants"],
  },
  {
    id: "flower-structure",
    path: "/biology-diagrams/botany/plant-anatomy/flower-structure.svg",
    title: "Flower Structure (Longitudinal Section)",
    category: "botany",
    subtopic: "Reproduction",
    description: "Complete flower showing androecium and gynoecium",
    labels: ["Petal", "Sepal", "Stamen", "Anther", "Filament", "Pistil", "Ovary", "Style", "Stigma"],
    usedIn: ["Morphology of Flowering Plants", "Sexual Reproduction in Flowering Plants"],
  },
  
  // ===== ZOOLOGY DIAGRAMS =====
  {
    id: "heart-structure-basic",
    path: "/biology-diagrams/zoology/organ-systems/heart-structure.svg",
    title: "Human Heart - Basic Structure",
    category: "zoology",
    subtopic: "Circulatory System",
    description: "Four-chambered heart showing major blood vessels",
    labels: ["Right Atrium", "Right Ventricle", "Left Atrium", "Left Ventricle", "Aorta", "Pulmonary Artery", "Vena Cava"],
    usedIn: ["Body Fluids and Circulation", "Human Heart"],
  },
  {
    id: "nephron-structure",
    path: "/biology-diagrams/zoology/organ-systems/nephron.svg",
    title: "Nephron Structure",
    category: "zoology",
    subtopic: "Excretory System",
    description: "Detailed nephron showing Bowman's capsule, tubules, and blood vessels",
    labels: ["Glomerulus", "Bowman's Capsule", "Proximal Convoluted Tubule", "Loop of Henle", "Distal Convoluted Tubule", "Collecting Duct"],
    usedIn: ["Excretory Products and their Elimination", "Human Excretory System"],
  },
  {
    id: "neuron-structure",
    path: "/biology-diagrams/zoology/human-anatomy/neuron.svg",
    title: "Neuron Structure",
    category: "zoology",
    subtopic: "Neural System",
    description: "Typical neuron showing cell body, dendrites, axon, and synaptic terminals",
    labels: ["Cell Body", "Dendrites", "Axon", "Myelin Sheath", "Node of Ranvier", "Synaptic Terminal"],
    usedIn: ["Neural Control and Coordination", "Human Nervous System"],
  },
  {
    id: "digestive-system-overview",
    path: "/biology-diagrams/zoology/organ-systems/digestive-system.svg",
    title: "Human Digestive System",
    category: "zoology",
    subtopic: "Digestive System",
    description: "Complete alimentary canal from mouth to anus with accessory organs",
    labels: ["Mouth", "Esophagus", "Stomach", "Small Intestine", "Large Intestine", "Liver", "Pancreas"],
    usedIn: ["Digestion and Absorption", "Human Digestive System"],
  },
  {
    id: "dna-structure",
    path: "/biology-diagrams/zoology/reproduction/dna-double-helix.svg",
    title: "DNA Double Helix Structure",
    category: "zoology",
    subtopic: "Genetics",
    description: "DNA double helix showing base pairing and sugar-phosphate backbone",
    labels: ["Adenine (A)", "Thymine (T)", "Guanine (G)", "Cytosine (C)", "Sugar-Phosphate Backbone", "Hydrogen Bonds"],
    usedIn: ["Molecular Basis of Inheritance", "DNA Structure"],
  },
];

/**
 * Get diagram by ID
 */
export function getDiagramById(id: string): BiologyDiagram | undefined {
  return biologyDiagrams.find(d => d.id === id);
}

/**
 * Get diagrams by category (botany or zoology)
 */
export function getDiagramsByCategory(category: "botany" | "zoology"): BiologyDiagram[] {
  return biologyDiagrams.filter(d => d.category === category);
}

/**
 * Get diagrams by subtopic
 */
export function getDiagramsBySubtopic(subtopic: string): BiologyDiagram[] {
  return biologyDiagrams.filter(d => 
    d.subtopic.toLowerCase().includes(subtopic.toLowerCase())
  );
}

/**
 * Search diagrams by keyword
 */
export function searchDiagrams(keyword: string): BiologyDiagram[] {
  const lowerKeyword = keyword.toLowerCase();
  return biologyDiagrams.filter(d =>
    d.title.toLowerCase().includes(lowerKeyword) ||
    d.description.toLowerCase().includes(lowerKeyword) ||
    d.subtopic.toLowerCase().includes(lowerKeyword) ||
    d.labels?.some(label => label.toLowerCase().includes(lowerKeyword))
  );
}

/**
 * Get all diagram IDs (for AI reference)
 */
export function getAllDiagramIds(): string[] {
  return biologyDiagrams.map(d => d.id);
}
