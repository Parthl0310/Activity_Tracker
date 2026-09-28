import { completeJSON } from "../llm/geminiClient";
import {
  WEEKLY_SUMMARY_SYSTEM_PROMPT,
  buildWeeklySummaryUserPrompt,
  type ActivityForWeeklySummary,
} from "../prompts/weeklySummary.prompt";
import {
  weeklySummarySchema,
  type WeeklySummaryResponse,
} from "../schemas/weeklySummary.schema";

export async function generateWeeklySummary(
  _userId: string,
  _weekStart: Date,
  _weekEnd: Date,
  activities: ActivityForWeeklySummary[]
): Promise<WeeklySummaryResponse> {
  const userPrompt = buildWeeklySummaryUserPrompt(activities);

  return completeJSON<WeeklySummaryResponse>(
    WEEKLY_SUMMARY_SYSTEM_PROMPT,
    userPrompt,
    weeklySummarySchema
  );
}
