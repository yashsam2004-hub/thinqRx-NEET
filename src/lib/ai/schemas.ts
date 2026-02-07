import { z } from "zod";

export const chemicalItemSchema = z.object({
  name: z.string().min(1),
  imageUrl: z.string().url().optional(), // Optional - will be fetched from PubChem
});

export const notesBlockSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("paragraph"), text: z.string().min(1) }),
  z.object({ type: z.literal("bullets"), items: z.array(z.string().min(1)).min(1) }),
  z.object({
    type: z.literal("table"),
    headers: z.array(z.string().min(1)).min(1),
    rows: z.array(z.array(z.string().min(1)).min(1)).min(1),
    caption: z.string().optional(),
    gpatNote: z.string().optional(), // GPAT exam focus note
  }),
  z.object({
    type: z.literal("chemicals"),
    items: z.array(chemicalItemSchema).min(1),
  }),
  z.object({
    type: z.literal("mcq"),
    question: z.string().min(1),
    options: z.array(
      z.object({
        id: z.enum(["A", "B", "C", "D"]),
        text: z.string().min(1),
      })
    ).length(4),
    correctOptionId: z.enum(["A", "B", "C", "D"]),
    explanation: z.string().min(1),
  }),
  z.object({
    type: z.literal("image"),
    url: z.string().url(),
    alt: z.string().min(1),
    caption: z.string().optional(),
    source: z.string().optional(),
    license: z.string().optional(),
  }),
  z.object({
    type: z.literal("video"),
    videoId: z.string().min(1),
    title: z.string().min(1),
    description: z.string().optional(),
  }),
  // NEW: Formula block for GPAT equations
  z.object({
    type: z.literal("formula"),
    title: z.string().min(1),
    formula: z.string().min(1),
    description: z.string().optional(),
    gpatTip: z.string().optional(),
  }),
  // Figure block removed - no image generation system available
  // Kept in schema for backwards compatibility but will be skipped during rendering
  z.object({
    type: z.literal("figure"),
    title: z.string().optional(),
    caption: z.string().min(1),
    imageUrl: z.string().min(1),
    alt: z.string().optional(),
    enhancement_type: z.literal("STRUCTURE_AUGMENTATION").optional(),
  }),

  // NEW: Reaction block (for organic/medicinal chemistry only)
  z.object({
    type: z.literal("reaction"),
    name: z.string().min(1), // e.g., "Friedel–Crafts acylation"
    equation: z.string().min(1), // e.g., "Ar-H + RCOCl → Ar-CO-R + HCl"
    conditions: z.string().optional(), // e.g., "AlCl3 catalyst"
    description: z.string().optional(), // Brief explanation
    note: z.string().optional(), // Important note (e.g., "Deactivated rings do not undergo this reaction")
    // Structure visualization (optional)
    reactantStructure: z.string().optional(), // Image path/URL for reactant structure
    productStructure: z.string().optional(), // Image path/URL for product structure
    structureVariant: z.enum(["handwritten", "textbook"]).optional(), // Visual style
    enhancement_type: z.literal("STRUCTURE_AUGMENTATION").optional(), // Tag for structure enhancements
  }),
  // NEW: Highlight box (Why this matters, GPAT focus, Key concept)
  z.object({
    type: z.literal("highlight"),
    style: z.enum(["info", "tip", "warning", "gpat", "clinical"]),
    title: z.string().min(1),
    content: z.string().min(1),
  }),
  // NEW: Definition block (cleaner than paragraph)
  z.object({
    type: z.literal("definition"),
    term: z.string().min(1),
    definition: z.string().min(1),
  }),
  // NEW: Diagram block
  z.object({
    type: z.literal("diagram"),
    diagramType: z.enum(["micelle", "surface_tension", "emulsion", "adsorption", "contact_angle", "generic"]),
    title: z.string().optional(),
    description: z.string().optional(),
    caption: z.string().optional(),
    gpatAngle: z.array(z.string()).optional(),
    keyRecall: z.array(z.string()).optional(),
    svgAsset: z.string().optional(),
  }),
]);

export const notesSectionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  blocks: z.array(notesBlockSchema).min(1),
});

export const notesSchema = z.object({
  topicId: z.string().min(1),
  topicName: z.string().min(1),
  subjectName: z.string().min(1),
  sections: z.array(notesSectionSchema).min(1),
});

export type NotesData = z.infer<typeof notesSchema>;

export const testSchema = z.object({
  topicId: z.string().min(1),
  topicName: z.string().min(1),
  questions: z.array(
    z.object({
      id: z.string().min(1),
      question: z.string().min(1),
      options: z.array(
        z.object({
          id: z.enum(["A", "B", "C", "D"]),
          text: z.string().min(1),
        })
      ).length(4),
      correctOptionId: z.enum(["A", "B", "C", "D"]),
      explanation: z.string().min(1),
    }),
  ),
});

export type TestData = z.infer<typeof testSchema>;
