import { completeJSON } from "../llm/geminiClient";
import {
  MONTHLY_SUMMARY_SYSTEM_PROMPT,
  buildMonthlySummaryUserPrompt,
} from "../prompts/monthlySummary.prompt";
import {
  monthlySummarySchema,
  type MonthlySummaryResponse,
} from "../schemas/monthlySummary.schema";

export async function generateMonthlySummary(
  _userId: string,
  _month: number,
  _year: number,
  weeklySummaries: unknown[]
): Promise<MonthlySummaryResponse> {
  const userPrompt = buildMonthlySummaryUserPrompt(weeklySummaries);

  return completeJSON<MonthlySummaryResponse>(
    MONTHLY_SUMMARY_SYSTEM_PROMPT,
    userPrompt,
    monthlySummarySchema
  );
}
