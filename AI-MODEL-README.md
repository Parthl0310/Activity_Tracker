# AI Layer — Complete Build Guide (Free Stack)

Standalone spec for `/packages/ai`. Generation = Google Gemini free tier. Embeddings = local, no account. Vector store = Pinecone (free Starter tier). Everything else stays free/local.

---

## 0. Accounts / Keys Needed

| Needed | Why | Where to get it |
|---|---|---|
| Google AI Studio API key | Gemini free-tier calls | https://aistudio.google.com/apikey — **ask the user for this key before wiring `.env`; do not proceed with live calls without it** |
| Pinecone API key + index | Vector storage/search for activity & summary embeddings | https://app.pinecone.io — free Starter tier, no credit card. **Ask the user for this key, and confirm the index name/region, before wiring `.env`** |

Embeddings themselves still run fully local (no signup, no key) — only the vector *store* (Pinecone) needs an account.

If any other integration comes up later that needs a key/account, stop and ask before assuming a provider.

---

## 1. Stack

| Purpose | Choice | Account? |
|---|---|---|
| LLM (generation, classification, summarization, reports) | Gemini `gemini-2.0-flash` (free tier) via `@google/generative-ai` | Yes — API key |
| Embeddings | `Xenova/transformers.js`, model `Xenova/all-MiniLM-L6-v2` (384-dim) — runs in-process, no network call | No |
| Vector store | Pinecone (free Starter tier, serverless index) via `@pinecone-database/pinecone` | Yes — API key |
| Structured output | Gemini JSON mode (`responseMimeType: "application/json"` + schema) | — |

Note on embedding dimension: MiniLM-L6-v2 outputs **384** dims — create the Pinecone index with `dimension: 384` and `metric: "cosine"`.

Namespace strategy: use **one Pinecone index**, two namespaces — `activities` and `monthly-summary-chunks` — and always filter/query within the caller's own `userId` via Pinecone metadata filtering (`{ userId: { $eq: userId } }`). Never query without that filter.

---

## 2. `.env`

```
GEMINI_API_KEY=            # ask user — from https://aistudio.google.com/apikey
GEMINI_MODEL=gemini-2.0-flash
EMBEDDING_MODEL=Xenova/all-MiniLM-L6-v2
EMBEDDING_DIM=384

PINECONE_API_KEY=          # ask user — from https://app.pinecone.io
PINECONE_INDEX=activity-tracker
```

Gemini free tier has request-per-minute and daily caps that change over time — check current limits at https://ai.google.dev/gemini-api/docs/rate-limits before assuming a number, and design the queue (section 7) to respect whatever the current limit is.

---

## 3. Package Structure

```
/packages/ai/src
  /llm
    geminiClient.ts        → complete(), completeJSON<T>(prompt, schema)
  /embeddings
    embeddingClient.ts      → embed(text): Promise<number[]>, embedBatch(texts)
    localModel.ts            → lazy-loads transformers.js pipeline, caches in memory
  /vectorstore
    pineconeClient.ts        → upsert(), query(), deleteByFilter() against Pinecone
  /prompts
    enrichment.prompt.ts
    vagueEntry.prompt.ts
    weeklySummary.prompt.ts
    monthlySummary.prompt.ts
    insights.prompt.ts
    yearlyReport.prompt.ts
    ragAssistant.prompt.ts
  /schemas                   → zod schemas mirrored as Gemini JSON schemas
    activityEnrichment.schema.ts
    weeklySummary.schema.ts
    monthlySummary.schema.ts
    yearlyReportSection.schema.ts
  /pipelines
    enrichActivity.ts
    generateWeeklySummary.ts
    generateMonthlySummary.ts
    generateInsights.ts
    generateYearlyReport.ts
    ragQuery.ts
  /validation
    hallucinationCheck.ts
  /utils
    tokenBudget.ts           → truncate/chunk context to fit prompt limits
    retry.ts                 → exponential backoff for rate-limit errors
```

---

## 4. LLM Client

```ts
// llm/geminiClient.ts
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function completeJSON<T>(
  systemPrompt: string,
  userPrompt: string,
  responseSchema: object
): Promise<T> {
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL ?? "gemini-2.0-flash",
    systemInstruction: systemPrompt,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema,
      temperature: 0.2,
    },
  });
  const result = await model.generateContent(userPrompt);
  return JSON.parse(result.response.text()) as T;
}

export async function complete(systemPrompt: string, userPrompt: string): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL ?? "gemini-2.0-flash",
    systemInstruction: systemPrompt,
  });
  const result = await model.generateContent(userPrompt);
  return result.response.text();
}
```

Wrap every call site with `retry.ts` (backoff on HTTP 429 — free tier will hit this).

---

## 5. Embedding Client (local, no account)

```ts
// embeddings/localModel.ts
import { pipeline, type FeatureExtractionPipeline } from "@xenova/transformers";

let extractor: FeatureExtractionPipeline | null = null;

async function getExtractor() {
  if (!extractor) {
    extractor = await pipeline("feature-extraction", process.env.EMBEDDING_MODEL ?? "Xenova/all-MiniLM-L6-v2");
  }
  return extractor;
}

export async function embed(text: string): Promise<number[]> {
  const model = await getExtractor();
  const output = await model(text, { pooling: "mean", normalize: true });
  return Array.from(output.data as Float32Array);
}

export async function embedBatch(texts: string[]): Promise<number[][]> {
  return Promise.all(texts.map(embed));
}
```

First call downloads the model weights (~90MB) from Hugging Face's public CDN once, then caches on disk — no API key, no rate limit, runs on CPU.

---

## 5b. Vector Store Client (Pinecone)

```ts
// vectorstore/pineconeClient.ts
import { Pinecone } from "@pinecone-database/pinecone";

const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
const index = pc.index(process.env.PINECONE_INDEX!);

export async function upsertVector(
  namespace: "activities" | "monthly-summary-chunks",
  id: string,
  vector: number[],
  metadata: Record<string, any> // MUST include userId
) {
  await index.namespace(namespace).upsert([{ id, values: vector, metadata }]);
}

export async function queryVectors(
  namespace: "activities" | "monthly-summary-chunks",
  userId: string,
  vector: number[],
  topK = 8
) {
  const result = await index.namespace(namespace).query({
    vector,
    topK,
    filter: { userId: { $eq: userId } },
    includeMetadata: true,
  });
  return result.matches ?? [];
}

export async function deleteVector(namespace: "activities" | "monthly-summary-chunks", id: string) {
  await index.namespace(namespace).deleteOne(id);
}
```

Index setup (one-time, do via Pinecone console or SDK): dimension `384`, metric `cosine`, serverless (free tier region — confirm with user which cloud/region their free account defaults to).

Metadata stored alongside each vector: `activities` namespace → `{ userId, activityId, text, workDate, project }`; `monthly-summary-chunks` namespace → `{ userId, monthlySummaryId, chunkType, chunkText }`. Pinecone stores metadata, not the DB record itself — the DB (Mongo/Postgres) remains the source of truth; Pinecone is purely the similarity index.

---

## 6. Prompt Contracts

Every prompt that touches user history includes this block verbatim:

```
Use only the information explicitly provided in the context below.
Do not invent achievements, metrics, projects, technologies, or dates.
If the context is insufficient to make a claim, omit the claim.
Respond only with valid JSON matching the given schema — no markdown, no commentary.
```

### 6.1 Activity Enrichment

```
System: You are a work-log classifier. Categorize the employee's raw activity
entry. Do not add facts not present in the text.

User: Activity text: "{text}"

Return JSON:
{
  category: one of ["Bug Fix","Feature","Optimization","Refactor","Learning",
                     "Discussion","Production Issue","Documentation","Other"],
  project: string | null,
  skills: string[],
  keywords: string[],
  workType: "Technical" | "Non-Technical" | "Learning"
}
```

### 6.2 Vague Entry Detector

```
System: Judge whether this work entry is too vague to be useful in a report
(fewer than ~4 meaningful words, no concrete object/verb, generic phrasing
like "worked on backend"). If vague, propose ONE more specific rewrite that
adds no new facts — only makes the existing statement concrete in phrasing.
If already specific, say so.

User: Entry: "{text}"

Return JSON: { isVague: boolean, suggestion: string | null }
```

### 6.3 Weekly Summary

```
System: Summarize this employee's completed work for one week using ONLY the
supplied activity list. Group related work. Never invent entries.

User: Activities (JSON array with date, text, category, project, skills): {activities}

Return JSON:
{
  majorWork: string[],
  technicalAreas: string[],
  aiInsight: string   // one sentence, grounded only in the list above
}
```

### 6.4 Monthly Summary

```
System: Synthesize a month-level summary from these weekly summaries only.

User: Weekly summaries: {weeklySummaries}

Return JSON:
{
  majorWorkAreas: string[],
  skillsDemonstrated: string[],
  aiSummary: string
}
```

### 6.5 Insights

```
System: Identify patterns across a full year of monthly summaries and raw
activity frequency counts. Only describe patterns that are numerically
supported by the provided frequency data — do not speculate on trends
without at least two data points showing the direction.

User: Monthly summaries: {monthlySummaries}
Skill/category frequency table: {frequencyTable}

Return JSON:
{
  strongestWorkArea: string,
  mostFrequentTechnicalArea: string,
  mostActiveProject: string,
  mostDemonstratedSkills: string[],
  learningPattern: string,
  workPattern: string
}
```

### 6.6 Yearly Report — per section

One call per section, each scoped to its own retrieved context (see section 8).

```
System: Write the "{sectionName}" section of an annual work report using
ONLY the supplied context chunks and achieved-goal records. Professional
tone, third-person-neutral or first-person ("I")—match existing report
voice if regenerating. No invented metrics, dates, or technologies.

User: Context chunks: {retrievedChunks}
Achieved goals: {achievedGoals}

Return JSON: { sectionText: string, sourceChunkIds: string[] }
```

`sourceChunkIds` feeds the hallucination check in section 9.

### 6.7 RAG Assistant

```
System: Answer the employee's question about their own work history using
ONLY the retrieved records below. If nothing retrieved is relevant, say
"I couldn't find matching records for that."

User: Question: "{question}"
Retrieved records: {retrievedContext}

Return plain text answer, not JSON.
```

---

## 7. Rate-Limit-Aware Queueing

Free-tier Gemini has strict per-minute request caps. All AI calls go through BullMQ jobs (see main README section 8), never called synchronously from a request handler for bulk operations.

```ts
// utils/retry.ts
export async function withBackoff<T>(fn: () => Promise<T>, maxRetries = 5): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      if (err?.status === 429 && attempt < maxRetries - 1) {
        await new Promise(r => setTimeout(r, 2 ** attempt * 1000));
        continue;
      }
      throw err;
    }
  }
  throw new Error("unreachable");
}
```

Enrichment jobs (one per activity) should be rate-limited in the BullMQ queue config (`limiter: { max: N, duration: 60000 }`) matching whatever Gemini's current free-tier RPM is — check https://ai.google.dev/gemini-api/docs/rate-limits and set `N` accordingly at build time.

---

## 8. RAG Retrieval (Pinecone, local embeddings)

```ts
// pipelines/ragQuery.ts
import { queryVectors } from "../vectorstore/pineconeClient";
import { embed } from "../embeddings/embeddingClient";

export async function retrieveContext(
  userId: string,
  query: string,
  namespace: "activities" | "monthly-summary-chunks",
  k = 8
) {
  const queryVector = await embed(query);
  const matches = await queryVectors(namespace, userId, queryVector, k);
  return matches.map(m => ({ score: m.score, ...m.metadata }));
}
```

Write-side: whenever an activity is enriched or a monthly-summary chunk is created, call `upsertVector(...)` in the same job — Pinecone is the single index that both semantic search and RAG report generation query against.

For the yearly report (section 6.6), run 6 separate `retrieveContext` calls — one per section — against the `monthly-summary-chunks` namespace, using a section-specific query string (e.g. `"technical contributions and implementations"` for Technical Work).

---

## 9. Hallucination Validation

```ts
// validation/hallucinationCheck.ts
export async function validateClaims(sectionText: string, sourceChunks: string[]): Promise<{ supported: boolean; flaggedSentences: string[] }> {
  const sentences = sectionText.split(/(?<=[.!?])\s+/);
  const sourceEmbeddings = await embedBatch(sourceChunks);
  const flagged: string[] = [];

  for (const sentence of sentences) {
    const claimVec = await embed(sentence);
    const bestScore = Math.max(...sourceEmbeddings.map(v => cosineSim(claimVec, v)));
    if (bestScore < 0.55) flagged.push(sentence); // threshold tune during testing
  }
  return { supported: flagged.length === 0, flaggedSentences: flagged };
}
```

If a section returns flagged sentences: either strip them automatically, or re-call the LLM once with `"The following claims were not grounded in context and must be removed: {flagged}"`, then re-validate. Cap at one retry to avoid burning free-tier quota.

This is a similarity heuristic, not proof — final say stays with the employee at review time.

---

## 10. Confidence Score

Computed in application code, not by the LLM:

```ts
weeklyConfidence = distinctDaysWithEntries / 5   // capped at 1.0
monthlyConfidence = average(weeklyConfidences for that month)
```

---

## 11. Build Order (AI layer only)

1. Wire `GEMINI_API_KEY` (ask user), stub `geminiClient.ts`, test with a single `complete()` call
2. `localModel.ts` — confirm transformers.js downloads and embeds without a key
3. Wire `PINECONE_API_KEY` (ask user), create the index (dimension 384, metric cosine), confirm `PINECONE_INDEX` name, test one `upsertVector` + `queryVectors` round trip
4. `activityEnrichment` pipeline + schema, wire into activity create/update job — enrichment job now also calls `upsertVector("activities", ...)`
5. Vague-entry endpoint (on-demand, not queued)
6. Weekly summary pipeline + cron job
7. Monthly summary pipeline + chunk embedding, each chunk upserted to `monthly-summary-chunks` namespace
8. Insights pipeline (mostly aggregation code, thin LLM narrative layer)
9. RAG retrieval function (Pinecone query), wire into semantic search + assistant endpoints
10. Yearly report multi-query pipeline, section-by-section generation
11. Hallucination validation pass, wire into report generation flow
12. Rate-limit tuning against Gemini's actual current free-tier limits (check the docs link in section 7 at build time — do not hardcode a remembered number)

---

## 12. Things to Ask the User Before Building

- Gemini API key (section 0) — required before any live LLM call works.
- Pinecone API key + index name/region (section 0) — required before any vector upsert/query works.
- If free-tier limits force a fallback provider later (OpenRouter, another Gemini-compatible free endpoint), ask which one before switching `geminiClient.ts`.
- If Pinecone's free-tier storage/query limits are ever exceeded, ask before switching vector stores or upgrading plan.
- If deploying beyond local dev later, ask where (Render/Railway/Vercel/etc.) before adding deployment config — out of scope for this local-only build.
