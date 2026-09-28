// RAG assistant prompt contract
// Ref: AI-MODEL-README.md § 6.7 RAG Assistant

export const RAG_ASSISTANT_SYSTEM_PROMPT = `Answer the employee's question about their own work history using ONLY the retrieved records below. If nothing retrieved is relevant, say "I couldn't find matching records for that."

Use only the information explicitly provided in the context below.
Do not invent achievements, metrics, projects, technologies, or dates.
If the context is insufficient to make a claim, omit the claim.`;

export function buildRagAssistantUserPrompt(
  question: string,
  retrievedContext: unknown[]
): string {
  const contextPayload = JSON.stringify(retrievedContext, null, 2);
  return `Context records:\n${contextPayload}\n\nQuestion: ${question}`;
}
