import { completeJSON } from "../llm/geminiClient";
import {
  INSIGHTS_SYSTEM_PROMPT,
  buildInsightsUserPrompt,
} from "../prompts/insights.prompt";
import {
  insightsSchema,
  type InsightsResponse,
} from "../schemas/insights.schema";

export async function generateInsights(
  _userId: string,
  _year: number,
  monthlySummaries: unknown[],
  frequencyTable: unknown
): Promise<InsightsResponse> {
  const userPrompt = buildInsightsUserPrompt(monthlySummaries, frequencyTable);

  return completeJSON<InsightsResponse>(
    INSIGHTS_SYSTEM_PROMPT,
    userPrompt,
    insightsSchema
  );
}
