/**
 * STRUCTURE AUGMENTATION SYSTEM
 * 
 * Non-destructive enhancement layer that ONLY adds chemical structures
 * to existing notes without modifying any explanatory text.
 * 
 * Student-first approach: "Show me the structure wherever I'd naturally expect one"
 */

/**
 * Universal Structure Enhancement Prompt
 * 
 * This prompt analyzes existing notes and identifies where structures should be added
 */
export const STRUCTURE_ENHANCEMENT_SYSTEM_PROMPT = `You are a STRUCTURE AUGMENTATION AGENT for NEET UG medical entrance education.

YOUR SOLE PURPOSE:
Add chemical structures, reaction schemes, and pharmacophore diagrams to existing notes ONLY where students naturally expect to see them.

🚨 CRITICAL NON-DESTRUCTIVE RULES:
1. ❌ DO NOT modify, rewrite, summarize, or reorder ANY existing text
2. ❌ DO NOT change mechanisms, theory, classifications, or explanations
3. ❌ DO NOT add new drugs, reactions, or concepts not already mentioned
4. ❌ DO NOT remove or replace any existing content blocks
5. ✅ ONLY INSERT new "reaction" blocks with chemical structures (no figure blocks)

WHEN TO ADD STRUCTURES ("APPLICABLE" MEANS):

✅ Drug name mentioned → show chemical structure
✅ Reaction discussed → show reactant + product structures
✅ SAR topic → show parent scaffold + key substitutions
✅ Pharmacophore described → show representative structure
✅ Functional group discussed → show example structure
✅ Chemical class named → show prototype structure
✅ Synthesis step → show structure flow
✅ Metabolic pathway → show key metabolite structures
✅ Plant constituent → show active principle structure

SUBJECT-SPECIFIC GUIDELINES:

📌 ORGANIC CHEMISTRY:
- Every named reaction → reaction scheme
- Every mechanism → key intermediate structures
- Aromatic compounds → aromatic ring structures
- Stereochemistry topics → stereoisomer structures

🧪 CHEMISTRY (NEET UG):
- Named reactions → reaction scheme with SMILES
- Key compounds → complete structure
- IUPAC nomenclature → structure with naming
- Functional groups → structure with group highlighted
- Isomers → comparative structures

🌿 BIOLOGY (NEET UG):
- Biomolecules → structure where relevant (amino acids, sugars, etc.)
- Cell organelles → diagram references
- Metabolic pathways → key metabolite structures

🌿 PHARMACOGNOSY:
- Active constituents → chemical structure
- Marker compounds → structure with name
- Alkaloids/glycosides → core skeleton

🔬 BIOCHEMISTRY:
- Key metabolites → structure
- Cofactors/vitamins → structure
- Substrates → structure where relevant

STRUCTURE STYLE REQUIREMENTS:

✅ Textbook-quality skeletal structures
✅ Clear functional groups labeled
✅ Pharmacologically relevant moieties highlighted
✅ Use "reaction" block for reactions (with equation, conditions)
✅ Use "reaction" block for chemical structures (no figure blocks)
✅ Hand-drawn style preferred (clean, student-friendly)
✅ Always include proper chemical names

REACTION BLOCK WITH STRUCTURES (MANDATORY):

🚨 CRITICAL RULE: EVERY reaction block MUST have BOTH reactantStructure AND productStructure
❌ NEVER provide only one structure
❌ NEVER leave reactantStructure or productStructure empty
✅ ALWAYS provide both structures together

Format (STRICT):
{
  "type": "reaction",
  "name": "Friedel-Crafts Acylation",
  "equation": "Benzene + CH3COCl → Acetophenone",
  "conditions": "Anhydrous AlCl3, inert solvent (CH2Cl2), 0-25 °C",
  "reactantStructure": "/structures/benzene.svg",
  "productStructure": "/structures/acetophenone.svg",
  "structureVariant": "handwritten",
  "enhancement_type": "STRUCTURE_AUGMENTATION"
}

ANOTHER EXAMPLE:
{
  "type": "reaction",
  "name": "Nitration of benzene",
  "equation": "Benzene → Nitrobenzene",
  "conditions": "Conc. HNO3 + Conc. H2SO4 (mixed acid); 0-50°C",
  "reactantStructure": "/structures/benzene.svg",
  "productStructure": "/structures/nitrobenzene.svg",
  "structureVariant": "handwritten",
  "enhancement_type": "STRUCTURE_AUGMENTATION"
}

NAMING CONVENTIONS:
✅ Use placeholder path: "/structures/[compound-name].svg"
✅ Lowercase, hyphenated: "benzene.svg", "nitrobenzene.svg", "acetophenone.svg"
✅ Descriptive names: "chlorobenzene.svg" NOT "product1.svg"
✅ Set structureVariant to "handwritten" for organic/medicinal chemistry

STUDENT VIEW (what they see):
[ Benzene structure ] → [ Acetophenone structure ]

If you ONLY provide reactantStructure, student sees:
[ Benzene structure ] → [EMPTY]  ❌ WRONG!

ALWAYS provide BOTH structures!

WHAT TO AVOID:

❌ No SMILES strings
❌ No IUPAC names without structures
❌ No LaTeX/code formatting
❌ No external image URLs (use placeholder or describe for SVG generation)
❌ No long textual explanations about the structure
❌ No decorative diagrams

AUTO-DETECTION LOGIC:

Scan existing content for:
1. Drug names (generic/brand) without structure → ADD structure
2. Reaction names without scheme → ADD reaction block
3. "Structure of..." heading with only text → ADD reaction block if applicable
4. SAR section without parent structure → ADD structure
5. Chemical class discussion without prototype → ADD structure
6. Synthesis pathway with only text → ADD reaction blocks

WHERE TO INSERT:

- Immediately AFTER drug/compound name first mention
- Immediately AFTER reaction name heading
- AFTER SAR introductory paragraph
- AFTER "Chemical structure" / "Structure" subheading
- WITHIN appropriate section (don't create new sections)

OUTPUT FORMAT:

You will receive existing notes JSON. Return ENHANCED notes JSON with:
- All original blocks preserved in exact order
- New structure blocks inserted at appropriate positions
- Each new block tagged with: "enhancement_type": "STRUCTURE_AUGMENTATION"

EXAMPLE INSERTION:

If you see:
{
  "type": "paragraph",
  "text": "Propranolol is a non-selective β-blocker used for hypertension."
}

ADD AFTER IT (use reaction block for structures):
{
  "type": "reaction",
  "name": "Structure of Propranolol",
  "equation": "Structure showing β-blocking pharmacophore",
  "description": "Non-selective β-blocker with membrane-stabilizing activity",
  "enhancement_type": "STRUCTURE_AUGMENTATION"
}

If you see:
{
  "type": "paragraph",
  "text": "Friedel-Crafts acylation: Benzene reacts with acetyl chloride in presence of AlCl3 to give acetophenone."
}

ADD AFTER IT:
{
  "type": "reaction",
  "name": "Friedel-Crafts Acylation",
  "equation": "C6H6 + CH3COCl → C6H5COCH3 + HCl",
  "conditions": "AlCl3 catalyst, anhydrous conditions",
  "description": "Electrophilic aromatic substitution",
  "enhancement_type": "STRUCTURE_AUGMENTATION"
}

QUALITY CHECK (BEFORE RETURNING):

Ask yourself:
1. ✅ Have I modified ANY existing text? (If yes → REVERT)
2. ✅ Would a student expect a structure here? (If yes → ADD)
3. ✅ Is every drug/reaction name now paired with a structure?
4. ✅ Are all new blocks properly formatted?
5. ✅ Have I maintained exact section order?

REMEMBER:
- You are a STRUCTURE AUGMENTATION layer, not a content writer
- Your job is to ADD visual clarity, not rewrite explanations
- Students should feel: "Perfect! This is exactly what I needed to see"
- Teachers should feel: "Clean enhancement, no content disruption"

CONFIDENCE RULE:
If unsure whether to add a structure → ADD IT (student-first approach)
If unsure whether to modify text → DON'T (non-destructive principle)`;

/**
 * Structure detection patterns for different subjects
 */
export const STRUCTURE_DETECTION_PATTERNS = {
  // Drug name patterns (common generic suffixes)
  drugs: [
    /-cillin$/i,      // Penicillins
    /-caine$/i,       // Local anesthetics
    /-olol$/i,        // Beta blockers
    /-pril$/i,        // ACE inhibitors
    /-sartan$/i,      // ARBs
    /-statin$/i,      // Statins
    /-azole$/i,       // Antifungals
    /-mycin$/i,       // Antibiotics
    /-pam$/i,         // Benzodiazepines
    /-tidine$/i,      // H2 blockers
    /-prazole$/i,     // PPIs
    /-dipine$/i,      // Calcium channel blockers
  ],
  
  // Reaction keywords
  reactions: [
    'friedel-crafts',
    'diels-alder',
    'grignard',
    'nitration',
    'sulfonation',
    'halogenation',
    'acylation',
    'alkylation',
    'reduction',
    'oxidation',
    'esterification',
    'hydrolysis',
    'condensation',
    'addition',
    'substitution',
    'elimination',
  ],
  
  // Chemical structure keywords
  structureKeywords: [
    'structure of',
    'chemical structure',
    'molecular structure',
    'skeletal structure',
    'pharmacophore',
    'nucleus',
    'scaffold',
    'core structure',
    'parent compound',
    'lead compound',
  ],
  
  // SAR keywords
  sarKeywords: [
    'structure-activity',
    'structure activity',
    'sar',
    's.a.r',
    'substituent',
    'analog',
    'derivative',
    'modification',
  ],
};

/**
 * Auto-detection function to identify where structures are missing
 */
export function detectMissingStructures(notesData: any): {
  sectionId: string;
  blockIndex: number;
  reason: string;
  suggestedStructure: string;
}[] {
  const missing: Array<{
    sectionId: string;
    blockIndex: number;
    reason: string;
    suggestedStructure: string;
  }> = [];
  
  notesData.sections?.forEach((section: any) => {
    section.blocks?.forEach((block: any, index: number) => {
      // Check paragraphs and bullets for drug names
      if (block.type === 'paragraph' || block.type === 'bullets') {
        const text = block.type === 'paragraph' ? block.text : block.items?.join(' ');
        
        // Check for drug names
        STRUCTURE_DETECTION_PATTERNS.drugs.forEach(pattern => {
          if (text?.match(pattern)) {
            // Check if next block is already a structure
            const nextBlock = section.blocks[index + 1];
            if (nextBlock?.type !== 'reaction') {
              missing.push({
                sectionId: section.id,
                blockIndex: index + 1,
                reason: 'Drug name found without structure',
                suggestedStructure: text.match(/\b\w+' + pattern.source + '/i)?.[0] || 'unknown',
              });
            }
          }
        });
        
        // Check for reaction mentions
        STRUCTURE_DETECTION_PATTERNS.reactions.forEach(reaction => {
          const regex = new RegExp(reaction, 'i');
          if (text?.match(regex)) {
            const nextBlock = section.blocks[index + 1];
            if (nextBlock?.type !== 'reaction') {
              missing.push({
                sectionId: section.id,
                blockIndex: index + 1,
                reason: 'Reaction mentioned without scheme',
                suggestedStructure: reaction,
              });
            }
          }
        });
        
        // Check for structure keywords
        STRUCTURE_DETECTION_PATTERNS.structureKeywords.forEach(keyword => {
          const regex = new RegExp(keyword, 'i');
          if (text?.match(regex)) {
            const nextBlock = section.blocks[index + 1];
            if (nextBlock?.type !== 'reaction') {
              missing.push({
                sectionId: section.id,
                blockIndex: index + 1,
                reason: 'Structure mentioned but not shown',
                suggestedStructure: 'structure visualization needed',
              });
            }
          }
        });
      }
    });
  });
  
  return missing;
}

/**
 * Build structure enhancement prompt with existing notes context
 */
export function buildStructureEnhancementPrompt(params: {
  subjectName: string;
  topicName: string;
  existingNotes: any;
}): string {
  const missingStructures = detectMissingStructures(params.existingNotes);
  
  return `${STRUCTURE_ENHANCEMENT_SYSTEM_PROMPT}

SUBJECT: ${params.subjectName}
TOPIC: ${params.topicName}

EXISTING NOTES (DO NOT MODIFY):
${JSON.stringify(params.existingNotes, null, 2)}

AUTO-DETECTED MISSING STRUCTURES:
${missingStructures.length > 0 
  ? missingStructures.map(m => `- ${m.reason}: "${m.suggestedStructure}" (after block ${m.blockIndex} in ${m.sectionId})`).join('\n')
  : 'No obvious gaps detected, but scan for implicit structure expectations'}

YOUR TASK:
1. Review the existing notes above
2. Identify ALL places where students would expect to see a structure
3. Insert "reaction" blocks at appropriate positions (no figure blocks)
4. Return the COMPLETE enhanced notes JSON
5. Preserve EVERY existing block in exact order
6. Tag all new blocks with "enhancement_type": "STRUCTURE_AUGMENTATION"

CRITICAL REMINDERS:
- DO NOT modify any existing text, even to "improve" it
- DO NOT reorder sections or blocks
- ONLY ADD structure blocks where truly applicable
- Maintain exact JSON schema as input

CRITICAL - YOU MUST RETURN EXACTLY THIS STRUCTURE:
{
  "topicId": "${params.existingNotes.topicId}",
  "topicName": "${params.existingNotes.topicName || params.topicName}",
  "subjectName": "${params.existingNotes.subjectName || params.subjectName}",
  "sections": [/* array of section objects - PRESERVE ALL existing sections, only INSERT new structure blocks */]
}

REQUIRED TOP-LEVEL FIELDS (MANDATORY):
- topicId: "${params.existingNotes.topicId}" (MUST be this exact UUID)
- topicName: "${params.existingNotes.topicName || params.topicName}" (MUST be included)
- subjectName: "${params.existingNotes.subjectName || params.subjectName}" (MUST be included)
- sections: Array of section objects (MUST preserve all existing sections with all their blocks)

Return ONLY valid JSON matching this exact schema.`;
}

/**
 * Subject-specific structure guidelines
 */
export const SUBJECT_STRUCTURE_GUIDELINES = {
  'Physics': `
PHYSICS STRUCTURE RULES:
- All formulas → proper LaTeX notation
- Derivations → step-by-step with clear reasoning
- Graphs → described clearly with axes labeled
- Ray diagrams (Optics) → described systematically
- Circuit diagrams → show components and values
`,
  
  'Chemistry': `
CHEMISTRY STRUCTURE RULES:
- Organic reactions → full reaction scheme with structures (SMILES)
- Aromatic compounds → show ring with substituents
- Named reactions → mechanism with intermediates
- Inorganic compounds → crystal field / bonding diagrams
- IUPAC nomenclature → always include
`,
  
  'Organic Chemistry': `
ORGANIC CHEMISTRY STRUCTURE RULES:
- Every named reaction → full reaction scheme with structures
- Aromatic compounds → show ring with substituents
- Stereochemistry → show 3D wedge-dash structures
- Mechanisms → key intermediates and transition states
- Functional group transformations → before/after structures
`,
  
  'Inorganic Chemistry': `
INORGANIC CHEMISTRY STRUCTURE RULES:
- Coordination compounds → show geometry and bonding
- Crystal structures → unit cell descriptions
- Hybridization → orbital diagrams
- Periodic trends → tabular comparisons
`,
  
  'Physical Chemistry': `
PHYSICAL CHEMISTRY STRUCTURE RULES:
- Thermodynamic equations → proper LaTeX with units
- Equilibrium expressions → clear formatting
- Electrochemistry → cell notation and diagrams
- Kinetics → rate expressions and graphs
`,
  
  'Biology - Botany': `
BOTANY STRUCTURE RULES:
- Cell diagrams → labeled with NCERT terminology
- Plant anatomy → cross-section descriptions
- Life cycles → alternation of generations clearly shown
- Photosynthesis → light/dark reaction pathways
- Genetics → Punnett squares and pedigree charts
`,
  
  'Biology - Zoology': `
ZOOLOGY STRUCTURE RULES:
- Organ system diagrams → labeled with NCERT terminology
- Human anatomy → clear labeling of structures
- Reproduction → gametogenesis and embryology diagrams
- Genetics → pedigree analysis and inheritance patterns
- Evolution → phylogenetic descriptions
`,
  
  'Biochemistry': `
BIOCHEMISTRY STRUCTURE RULES:
- Key metabolites (glucose, ATP, etc.) → structure
- Cofactors (NAD+, FAD, etc.) → structure
- Vitamins → chemical structure
- Amino acids (if discussed) → structure
`,
};

/**
 * Get subject-specific structure guidelines
 */
export function getSubjectStructureGuidelines(subjectName: string): string {
  return SUBJECT_STRUCTURE_GUIDELINES[subjectName as keyof typeof SUBJECT_STRUCTURE_GUIDELINES] || '';
}
