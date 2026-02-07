import { z } from "zod";

export const syllabusImportSchema = z.object({
  subjects: z.array(
    z.object({
      name: z.string().min(1),
      order: z.number().int().nonnegative().optional(),
      topics: z.array(
        z.object({
          name: z.string().min(1),
          order: z.number().int().nonnegative().optional(),
          is_free_preview: z.boolean().optional(),
          guardrails: z.string().optional(),
        }),
      ),
    }),
  ),
});

export type SyllabusImportPayload = z.infer<typeof syllabusImportSchema>;


