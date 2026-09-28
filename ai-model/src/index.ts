// packages/ai/src/index.ts
// Public barrel — re-exports all public interfaces from the AI package.
// Add exports here as modules are implemented.

export * from "./llm/geminiClient";
export * from "./embeddings/embeddingClient";
export * from "./vectorstore/pineconeClient";
export * from "./pipelines/enrichActivity";
export * from "./pipelines/detectVagueEntry";
export * from "./pipelines/generateWeeklySummary";
export * from "./pipelines/generateMonthlySummary";
export * from "./pipelines/generateInsights";
export * from "./pipelines/generateYearlyReport";
export * from "./pipelines/ragQuery";
export * from "./validation/hallucinationCheck";
export * from "./utils/retry";
export * from "./utils/tokenBudget";
export * from "./pipelines/improveActivity";
export * from "./prompts/ragAssistant.prompt";
