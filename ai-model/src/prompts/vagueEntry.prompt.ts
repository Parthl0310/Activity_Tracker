// Vague entry detector prompt contract
// Ref: AI-MODEL-README.md § 6.2 Vague Entry Detector

export const VAGUE_ENTRY_SYSTEM_PROMPT = `Judge whether this work entry is too vague to be useful in a report (fewer than ~4 meaningful words, no concrete object/verb, generic phrasing like "worked on backend"). If vague, propose ONE more specific rewrite that adds no new facts — only makes the existing statement concrete in phrasing. If already specific, say so.

Use only the information explicitly provided in the context below.
Do not invent achievements, metrics, projects, technologies, or dates.
If the context is insufficient to make a claim, omit the claim.
Respond only with valid JSON matching the given schema — no markdown, no commentary.`;

export function buildVagueEntryUserPrompt(text: string): string {
  return `Entry: "${text}"`;
}
