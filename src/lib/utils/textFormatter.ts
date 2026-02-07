/**
 * Text formatter for enhancing readability in notes
 * Automatically bolds important terms and improves formatting
 */

// Common pharmacy/chemistry terms to bold
const IMPORTANT_TERMS = [
  // Equilibrium terms
  "equilibrium", "equilibria", "Le Chatelier", "reaction quotient", "equilibrium constant",
  "forward reaction", "reverse reaction", "dynamic equilibrium",
  
  // Chemistry concepts
  "pH", "pKa", "pKb", "Ka", "Kb", "Kw", "Henderson-Hasselbalch",
  "buffer", "acid", "base", "salt", "conjugate", "weak acid", "weak base", "strong acid", "strong base",
  "dissociation", "ionization", "hydrolysis",
  
  // Mathematical/quantitative
  "concentration", "molarity", "solubility", "Ksp",
  
  // General important terms
  "IMPORTANT", "NOTE", "KEY POINT", "REMEMBER", "CAUTION", "WARNING",
  
  // Pharmacy specific
  "GPAT", "drug", "pharmaceutical", "formulation", "bioavailability",
  "pharmacokinetics", "pharmacodynamics", "therapeutic", "dosage"
];

export interface TextPart {
  text: string;
  bold: boolean;
}

/**
 * Parses text and returns array of parts with bold indicators
 * Handles both markdown-style **bold** and important terms
 */
export function parseTextForBold(text: string): TextPart[] {
  if (!text) return [];
  
  const parts: TextPart[] = [];
  
  // First, parse markdown-style bold (**text** or __text__)
  // Split by ** or __ patterns
  const markdownPattern = /(\*\*.*?\*\*|__.*?__)/g;
  const segments = text.split(markdownPattern);
  
  segments.forEach((segment) => {
    if (!segment) return;
    
    // Check if this segment is markdown bold
    if (segment.startsWith('**') && segment.endsWith('**')) {
      // Remove ** and add as bold
      parts.push({
        text: segment.slice(2, -2),
        bold: true
      });
    } else if (segment.startsWith('__') && segment.endsWith('__')) {
      // Remove __ and add as bold
      parts.push({
        text: segment.slice(2, -2),
        bold: true
      });
    } else {
      // Regular text - check for important terms
      const importantTermsPattern = new RegExp(
        `\\b(${IMPORTANT_TERMS.join("|")})\\b`,
        "gi"
      );
      
      let lastIndex = 0;
      let match;
      const regex = new RegExp(importantTermsPattern);
      
      while ((match = regex.exec(segment)) !== null) {
        // Add text before match
        if (match.index > lastIndex) {
          const beforeText = segment.substring(lastIndex, match.index);
          if (beforeText) {
            parts.push({ text: beforeText, bold: false });
          }
        }
        
        // Add bold match
        parts.push({
          text: match[0],
          bold: true
        });
        
        lastIndex = regex.lastIndex;
      }
      
      // Add remaining text
      if (lastIndex < segment.length) {
        const remainingText = segment.substring(lastIndex);
        if (remainingText) {
          parts.push({ text: remainingText, bold: false });
        }
      }
    }
  });
  
  return parts.length > 0 ? parts : [{ text, bold: false }];
}

/**
 * Extracts key terms from a topic name for image search
 */
export function extractKeyTermsForImages(topicName: string, subjectName: string): string[] {
  const terms: string[] = [];
  
  // Add topic name
  terms.push(topicName);
  
  // Add subject context
  if (subjectName) {
    terms.push(`${topicName} ${subjectName}`);
  }
  
  // Add educational context
  terms.push(`${topicName} diagram`);
  terms.push(`${topicName} illustration`);
  
  return terms;
}

/**
 * Formats numbers with proper superscripts/subscripts
 */
export function formatChemicalNotation(text: string): string {
  // Convert 10^-14 to 10⁻¹⁴
  text = text.replace(/\^-(\d+)/g, (_, num) => {
    const superscripts: Record<string, string> = {
      '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
      '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹'
    };
    return '⁻' + num.split('').map((d: string) => superscripts[d] || d).join('');
  });
  
  // Convert 10^14 to 10¹⁴
  text = text.replace(/\^(\d+)/g, (_, num) => {
    const superscripts: Record<string, string> = {
      '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
      '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹'
    };
    return num.split('').map((d: string) => superscripts[d] || d).join('');
  });
  
  return text;
}
