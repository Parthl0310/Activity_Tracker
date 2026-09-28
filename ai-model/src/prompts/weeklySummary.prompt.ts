// Weekly summary prompt contract
// Ref: AI-MODEL-README.md § 6.3 Weekly Summary

export const WEEKLY_SUMMARY_SYSTEM_PROMPT = `Summarize this employee's completed work for one week using ONLY the supplied activity list. Group related work. Never invent entries.

Use only the information explicitly provided in the context below.
Do not invent achievements, metrics, projects, technologies, or dates.
If the context is insufficient to make a claim, omit the claim.
Respond only with valid JSON matching the given schema — no markdown, no commentary.`;

export type ActivityForWeeklySummary = {
  date: string | Date;
  text: string;
  category: string;
  project?: string | null;
  skills: string[];
};

export function buildWeeklySummaryUserPrompt(activities: ActivityForWeeklySummary[]): string {
  const payload = JSON.stringify(activities, null, 2);
  return `Activities (JSON array with date, text, category, project, skills): ${payload}`;
}
