import { completeJSON } from "../llm/geminiClient.js";
import { VAGUE_ENTRY_SYSTEM_PROMPT, buildVagueEntryUserPrompt } from "../prompts/vagueEntry.prompt.js";
import { vagueEntrySchema, type VagueEntryResponse } from "../schemas/vagueEntry.schema.js";

export async function detectVagueEntry(text: string): Promise<VagueEntryResponse> {
  try {
    const userPrompt = buildVagueEntryUserPrompt(text);
    const res = await completeJSON<VagueEntryResponse>(
      VAGUE_ENTRY_SYSTEM_PROMPT,
      userPrompt,
      vagueEntrySchema
    );
    if (res && typeof res.isVague === 'boolean') {
      return res;
    }
  } catch (err) {
    // Fallback to heuristic check
  }

  const trimmed = text.trim();
  const wordCount = trimmed.split(/\s+/).length;
  const vaguePatterns = /\b(stuff|things|misc|various|worked on|task|meeting|did work|helped out)\b/i;

  if (wordCount < 6 || vaguePatterns.test(trimmed)) {
    return {
      isVague: true,
      suggestion: `Completed core deliverables and technical implementation for: "${trimmed}".`,
    };
  }

  return {
    isVague: false,
    suggestion: null,
  };
}
