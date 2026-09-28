// Monthly summary prompt contract
// Ref: AI-MODEL-README.md § 6.4 Monthly Summary

export const MONTHLY_SUMMARY_SYSTEM_PROMPT = `Synthesize a comprehensive month-level engineering summary from the provided weekly summaries or logged work activities.

Use only the information explicitly provided in the context below.
Do not invent achievements, metrics, projects, technologies, or dates.
If the context is sparse, summarize faithfully what is present.
Extract:
- majorWorkAreas: distinct project initiatives or major accomplishments delivered this month
- skillsDemonstrated: specific technical skills, tools, or frameworks utilized
- aiSummary: a well-written executive narrative summarizing the month's engineering output
Respond only with valid JSON matching the given schema — no markdown, no commentary.`;

export function buildMonthlySummaryUserPrompt(contextData: unknown[]): string {
  const payload = JSON.stringify(contextData, null, 2);
  return `Context records (weekly summaries or logged activities): ${payload}`;
}
