// Insights prompt contract
// Ref: AI-MODEL-README.md § 6.5 Insights

export const INSIGHTS_SYSTEM_PROMPT = `Identify patterns across a full year of monthly summaries and raw activity frequency counts. Only describe patterns that are numerically supported by the provided frequency data — do not speculate on trends without at least two data points showing the direction.

Use only the information explicitly provided in the context below.
Do not invent achievements, metrics, projects, technologies, or dates.
If the context is insufficient to make a claim, omit the claim.
Respond only with valid JSON matching the given schema — no markdown, no commentary.`;

export function buildInsightsUserPrompt(
  monthlySummaries: unknown[],
  frequencyTable: unknown
): string {
  const summariesPayload = JSON.stringify(monthlySummaries, null, 2);
  const freqPayload = JSON.stringify(frequencyTable, null, 2);
  return `Monthly summaries: ${summariesPayload}\nSkill/category frequency table: ${freqPayload}`;
}
