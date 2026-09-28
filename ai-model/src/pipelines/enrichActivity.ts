import { completeJSON } from "../llm/geminiClient.js";
import { ENRICHMENT_SYSTEM_PROMPT, buildEnrichmentUserPrompt } from "../prompts/enrichment.prompt.js";
import { activityEnrichmentSchema, type ActivityEnrichmentResponse } from "../schemas/activityEnrichment.schema.js";
import { heuristicEnrich } from "./heuristicEnrichment.js";

export async function enrichActivity(
  _userId: string,
  _activityId: string,
  text: string
): Promise<ActivityEnrichmentResponse> {
  try {
    const userPrompt = buildEnrichmentUserPrompt(text);
    const result = await completeJSON<ActivityEnrichmentResponse>(
      ENRICHMENT_SYSTEM_PROMPT,
      userPrompt,
      activityEnrichmentSchema
    );
    if (result && result.category && Array.isArray(result.skills)) {
      return result;
    }
    console.warn('[AI Enrichment] Incomplete Gemini response, falling back to heuristic classifier.');
    return heuristicEnrich(text);
  } catch (err: any) {
    console.warn(`[AI Enrichment] Gemini call unavailable (${err?.status || err?.message || 'error'}), using senior heuristic classifier.`);
    return heuristicEnrich(text);
  }
}
