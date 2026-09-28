// Yearly report (per-section) prompt contract
// Ref: AI-MODEL-README.md § 6.6 Yearly Report — per section

export const YEARLY_REPORT_SYSTEM_PROMPT_TEMPLATE = (sectionName: string, year: number): string =>
  `Write the "${sectionName}" section of an annual work report for the year ${year} using ONLY the supplied context chunks and achieved-goal records. Professional tone, third-person-neutral or first-person ("I"). No invented metrics, dates, or technologies.

Use only the information explicitly provided in the context below.
Do not invent achievements, metrics, projects, technologies, or dates.
If the context is insufficient to make a claim, omit the claim.
If there is absolutely no data provided for the year, state exactly: "No data available for this section."
Respond only with valid JSON matching the given schema — no markdown, no commentary.`;

export function buildYearlyReportUserPrompt(
  contextChunks: unknown[],
  achievedGoals: unknown[],
  queryFocus: string
): string {
  const chunksPayload = JSON.stringify(contextChunks, null, 2);
  const goalsPayload = JSON.stringify(achievedGoals, null, 2);
  return `Section Focus: Focus ONLY on ${queryFocus}.
Retrieved Context Chunks:
${chunksPayload}

Achieved Goals:
${goalsPayload}`;
}

