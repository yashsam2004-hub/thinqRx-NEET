/**
 * Subject-Specific AI Prompt Enhancements for NEET UG
 * Provides specialized instructions for Physics, Chemistry, and Biology
 */

export const PHYSICS_PROMPT_ENHANCEMENT = `
PHYSICS-SPECIFIC INSTRUCTIONS:

1. FORMULAS & EQUATIONS:
   - ALL formulas MUST use proper LaTeX notation
   - Include SI units for all physical quantities
   - Show step-by-step derivations for key formulas
   - Highlight dimensional analysis where applicable
   
2. NUMERICAL PROBLEMS:
   - Focus on problem-solving strategies
   - Include "Given", "To Find", "Solution" format
   - Show unit conversions explicitly
   - Highlight common calculation errors
   
3. DIAGRAMS & VECTORS:
   - Use vector notation: \\vec{F}, \\vec{v}, \\vec{a}
   - Reference diagram IDs where applicable
   - Describe diagram setup clearly
   
4. KEY CONCEPTS:
   - Emphasize NCERT conceptual understanding
   - Link topics (e.g., Newton's laws → momentum → energy)
   - Previous year NEET question patterns
   
5. COMMON MISTAKES:
   - Sign conventions (direction, charge, potential)
   - Unit consistency
   - Scalar vs vector confusion
   - Approximation validity

EXAMPLE TOPICS:
- Laws of Motion: Free body diagrams, friction, circular motion
- Thermodynamics: First law, heat engines, entropy
- Electromagnetism: Coulomb's law, Gauss's law, magnetic effects
- Optics: Ray diagrams, interference, diffraction
`;

export const CHEMISTRY_PROMPT_ENHANCEMENT = `
CHEMISTRY-SPECIFIC INSTRUCTIONS:

1. CHEMICAL STRUCTURES:
   - Provide exact IUPAC names for all compounds
   - NO SMILES codes in output
   - Mention functional groups explicitly
   - Structure images will be rendered via Kekule.js
   
2. REACTIONS:
   - Use "reaction" blocks for organic reactions
   - Include conditions (temperature, catalyst, solvent)
   - Show electron movement for mechanisms
   - Name reactions (Friedel-Crafts, SN1/SN2, etc.)
   
3. PHYSICAL CHEMISTRY:
   - All equations in LaTeX format
   - Include units and constants
   - Show calculation steps
   - Highlight approximations (e.g., ideal gas, weak acid)
   
4. INORGANIC CHEMISTRY:
   - Periodic trends and exceptions
   - Coordination chemistry nomenclature
   - d-orbital diagrams and electronic configurations
   - Color coding for oxidation states
   
5. ORGANIC CHEMISTRY:
   - IUPAC nomenclature rules
   - Reaction mechanisms with curved arrows
   - Stereochemistry (R/S, E/Z notation)
   - Reagent specificity

EXAMPLE TOPICS:
- Organic: Haloalkanes, Alcohols, Aldehydes, Amines
- Physical: Thermodynamics, Equilibrium, Electrochemistry
- Inorganic: p-block, d-block, Coordination compounds
`;

export const BIOLOGY_PROMPT_ENHANCEMENT = `
BIOLOGY-SPECIFIC INSTRUCTIONS:

1. DIAGRAMS & SCHEMATICS:
   - Reference diagram IDs from biology-diagrams library
   - Describe diagram components clearly
   - Label key structures
   - NCERT-style simple schematics
   
2. PROCESSES & MECHANISMS:
   - Step-by-step breakdown
   - Use flowcharts for complex processes
   - Highlight regulatory points
   - Enzyme names and locations
   
3. CLASSIFICATION:
   - Taxonomic hierarchies
   - Binomial nomenclature
   - Key distinguishing features
   - Representative examples
   
4. TERMINOLOGY:
   - Use NCERT-aligned terminology
   - Define technical terms clearly
   - Avoid overly complex jargon
   - Link concepts across topics
   
5. PHYSIOLOGY:
   - Organ system integration
   - Homeostasis mechanisms
   - Hormonal regulation
   - Disease connections

BOTANY TOPICS:
- Morphology & Anatomy
- Photosynthesis & Respiration
- Plant Growth & Development
- Reproduction in Plants
- Genetics & Evolution

ZOOLOGY TOPICS:
- Human Physiology (Digestion, Circulation, Excretion, Neural, Endocrine)
- Reproduction & Development
- Genetics, Evolution, Ecology
- Health & Disease
- Biotechnology

EXAMPLE DIAGRAM REFERENCES:
- "heart-structure" for cardiovascular system
- "cell-basic" for cell biology
- "photosynthesis-cycle" for plant physiology
`;

/**
 * Get subject-specific prompt enhancement based on subject name
 */
export function getSubjectPromptEnhancement(subjectName: string): string {
  const normalizedSubject = subjectName.toLowerCase();
  
  if (normalizedSubject.includes("physics")) {
    return PHYSICS_PROMPT_ENHANCEMENT;
  }
  
  if (normalizedSubject.includes("chemistry")) {
    return CHEMISTRY_PROMPT_ENHANCEMENT;
  }
  
  if (normalizedSubject.includes("biology") || normalizedSubject.includes("botany") || normalizedSubject.includes("zoology")) {
    return BIOLOGY_PROMPT_ENHANCEMENT;
  }
  
  return ""; // No specific enhancement for other subjects
}

/**
 * Build enhanced notes prompt with subject-specific instructions
 */
export function buildEnhancedNotesPrompt(params: {
  topicId: string;
  topicName: string;
  subjectName: string;
  outline: string[];
  includeSubjectGuidance?: boolean;
}): string {
  const basePrompt = `Generate structured NEET UG notes as JSON only.

Topic: ${params.topicName}
Subject: ${params.subjectName}
Outline headings (use these as section titles in order):
${params.outline.map((heading, index) => `${index + 1}. ${heading}`).join("\n")}`;

  if (params.includeSubjectGuidance !== false) {
    const subjectEnhancement = getSubjectPromptEnhancement(params.subjectName);
    if (subjectEnhancement) {
      return `${basePrompt}\n\n${subjectEnhancement}`;
    }
  }
  
  return basePrompt;
}

/**
 * PMD File Reference Context
 * Used when .pmd files are available as backend reference
 */
export function buildPMDContextPrompt(pmdContent: string, topic: string): string {
  return `
REFERENCE MATERIAL CONTEXT:
The following reference material is provided as context for the topic "${topic}".
Use this as background reference ONLY. Do NOT copy verbatim.
Generate original, exam-focused content based on NEET UG syllabus.

--- Reference Material ---
${pmdContent.substring(0, 3000)} // Limit to prevent token overflow
--- End Reference ---

IMPORTANT:
- Use above reference for conceptual grounding only
- Generate fresh, original content
- Focus on NEET UG exam relevance
- Follow NCERT terminology and style
- If reference is unclear, rely on your expertise
`;
}
