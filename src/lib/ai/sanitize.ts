import { NotesData } from "@/lib/ai/schemas";

const CHEM_CODE_PATTERN = /\b(smiles|inchi)\b/i;

function ensureNoChemCodes(text: string) {
  if (CHEM_CODE_PATTERN.test(text)) {
    throw new Error("Chemical codes are not allowed in v2 notes.");
  }
}

export function sanitizeNotesData(data: NotesData) {
  ensureNoChemCodes(data.topicName);
  ensureNoChemCodes(data.subjectName);

  for (const section of data.sections) {
    ensureNoChemCodes(section.title);
    for (const block of section.blocks) {
      if (block.type === "paragraph") {
        ensureNoChemCodes(block.text);
      }
      if (block.type === "bullets") {
        block.items.forEach(ensureNoChemCodes);
      }
      if (block.type === "table") {
        block.headers.forEach(ensureNoChemCodes);
        block.rows.flat().forEach(ensureNoChemCodes);
      }
      if (block.type === "mcq") {
        ensureNoChemCodes(block.question);
        block.options.forEach((option) => ensureNoChemCodes(option.text));
        ensureNoChemCodes(block.explanation);
      }
      if (block.type === "chemicals") {
        block.items.forEach((item) => {
          ensureNoChemCodes(item.name);
        });
      }
    }
  }
}
