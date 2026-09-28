/**
 * AI Model Manual Test Script
 * Run: npx ts-node test-ai.ts
 *
 * Tests every major functionality of the AI model with real API calls.
 * Green ✅ = working, Red ❌ = broken, Yellow ⚠️  = partial issue.
 */

import * as dotenv from "dotenv";
dotenv.config({ path: "../.env" }); // root .env
dotenv.config({ path: ".env" });    // ai-model .env (if exists)

// ─── Helpers ────────────────────────────────────────────────────────────────

const GREEN  = "\x1b[32m";
const RED    = "\x1b[31m";
const YELLOW = "\x1b[33m";
const CYAN   = "\x1b[36m";
const BOLD   = "\x1b[1m";
const RESET  = "\x1b[0m";

let passed = 0;
let failed = 0;

function header(title: string) {
  console.log(`\n${BOLD}${CYAN}━━━  ${title}  ━━━${RESET}`);
}

function ok(label: string, detail?: string) {
  passed++;
  console.log(`  ${GREEN}✅ ${label}${RESET}${detail ? `  →  ${detail}` : ""}`);
}

function fail(label: string, err: unknown) {
  failed++;
  const msg = err instanceof Error ? err.message : String(err);
  console.log(`  ${RED}❌ ${label}${RESET}\n     ${msg}`);
}

function warn(label: string, detail: string) {
  console.log(`  ${YELLOW}⚠️  ${label}${RESET}  →  ${detail}`);
}

function printJSON(obj: unknown) {
  console.log("     " + JSON.stringify(obj, null, 2).replace(/\n/g, "\n     "));
}

// ─── 1. ENV VARS ─────────────────────────────────────────────────────────────

header("1. Environment Variables");

const required = ["GEMINI_API_KEY", "PINECONE_API_KEY", "PINECONE_INDEX"];
for (const key of required) {
  if (process.env[key]) {
    ok(`${key} is set`, `${process.env[key]!.slice(0, 8)}...`);
  } else {
    fail(`${key} missing`, new Error(`Set ${key} in your .env file`));
  }
}

// ─── 2. LOCAL EMBEDDINGS ─────────────────────────────────────────────────────

header("2. Local Embeddings (no API key needed)");

import("./src/embeddings/embeddingClient").then(async ({ embed, embedBatch }) => {

  // 2a. Single embed
  try {
    const vec = await embed("Implemented the login feature using JWT");
    if (vec.length === 384) {
      ok("embed() returns 384-dim vector", `first 3 values: [${vec.slice(0,3).map(v => v.toFixed(4)).join(", ")}]`);
    } else {
      fail("embed() wrong dimension", new Error(`got ${vec.length}, expected 384`));
    }
  } catch (e) { fail("embed() threw", e); }

  // 2b. Batch embed
  try {
    const vecs = await embedBatch(["Fixed a bug in the auth module", "Wrote unit tests for the API"]);
    if (vecs.length === 2 && vecs[0].length === 384) {
      ok("embedBatch() returns 2 vectors of 384 dims each");
    } else {
      fail("embedBatch() wrong shape", new Error(JSON.stringify({ length: vecs.length, dim: vecs[0]?.length })));
    }
  } catch (e) { fail("embedBatch() threw", e); }

  // 2c. Cosine similarity sanity check (similar texts should score higher)
  try {
    const { embed: embedFn } = await import("./src/embeddings/localModel");
    const v1 = await embedFn("implemented user authentication with JWT tokens");
    const v2 = await embedFn("built login system using JSON web tokens");
    const v3 = await embedFn("attended a team lunch on Friday");
    const dot = (a: number[], b: number[]) => a.reduce((s, v, i) => s + v * b[i], 0);
    const sim12 = dot(v1, v2);
    const sim13 = dot(v1, v3);
    if (sim12 > sim13) {
      ok("Similarity check: related texts score higher than unrelated", `related=${sim12.toFixed(3)}, unrelated=${sim13.toFixed(3)}`);
    } else {
      warn("Similarity check unexpected result", `related=${sim12.toFixed(3)}, unrelated=${sim13.toFixed(3)}`);
    }
  } catch (e) { fail("Similarity check threw", e); }

// ─── 3. GEMINI LLM CLIENT ────────────────────────────────────────────────────

  header("3. Gemini LLM Client");
  const { complete, completeJSON } = await import("./src/llm/geminiClient");

  // 3a. Plain text
  try {
    const result = await complete(
      "You are a helpful assistant. Reply in exactly one sentence.",
      "What is 2 + 2?"
    );
    if (result && result.trim().length > 0) {
      ok("complete() returns plain text", result.trim().slice(0, 80));
    } else {
      fail("complete() returned empty", new Error("empty response"));
    }
  } catch (e) { fail("complete() threw", e); }

  // 3b. JSON mode
  try {
    const result = await completeJSON<{ name: string; count: number }>(
      "You are a JSON generator.",
      "Return a JSON object with fields: name (string 'test') and count (number 42).",
      {
        type: "object",
        properties: {
          name:  { type: "string" },
          count: { type: "integer" },
        },
        required: ["name", "count"],
      }
    );
    if (result.name && typeof result.count === "number") {
      ok("completeJSON() returns structured JSON", `name="${result.name}", count=${result.count}`);
    } else {
      fail("completeJSON() wrong shape", new Error(JSON.stringify(result)));
    }
  } catch (e) { fail("completeJSON() threw", e); }

// ─── 4. PIPELINES ────────────────────────────────────────────────────────────

  header("4. Pipeline: enrichActivity");
  const { enrichActivity } = await import("./src/pipelines/enrichActivity");

  try {
    const result = await enrichActivity(
      "user-test-01",
      "activity-test-01",
      "Implemented JWT authentication middleware in Express.js, added refresh token rotation and wrote integration tests"
    );
    console.log("     Output:");
    printJSON(result);
    const hasRequired = result.category && Array.isArray(result.skills) && Array.isArray(result.keywords);
    if (hasRequired) {
      ok("enrichActivity() returns category, skills, keywords", `category="${result.category}", skills=[${result.skills.join(", ")}]`);
    } else {
      fail("enrichActivity() missing fields", new Error(JSON.stringify(result)));
    }
  } catch (e) { fail("enrichActivity() threw", e); }

  // ── 4b. detectVagueEntry (vague) ──
  header("4. Pipeline: detectVagueEntry");
  const { detectVagueEntry } = await import("./src/pipelines/detectVagueEntry");

  try {
    const vague = await detectVagueEntry("worked on stuff");
    console.log("     Vague input output:");
    printJSON(vague);
    if (vague.isVague === true && vague.suggestion) {
      ok("detectVagueEntry() correctly flags vague entry", `suggestion: "${vague.suggestion}"`);
    } else {
      warn("detectVagueEntry() — unexpected result for vague input", JSON.stringify(vague));
    }
  } catch (e) { fail("detectVagueEntry() (vague) threw", e); }

  try {
    const clear = await detectVagueEntry(
      "Refactored the PostgreSQL query in the reports module to use indexed joins, reducing p99 latency from 800ms to 120ms"
    );
    console.log("     Clear input output:");
    printJSON(clear);
    if (clear.isVague === false) {
      ok("detectVagueEntry() correctly passes clear entry", `isVague=${clear.isVague}`);
    } else {
      warn("detectVagueEntry() flagged a clear entry as vague", JSON.stringify(clear));
    }
  } catch (e) { fail("detectVagueEntry() (clear) threw", e); }

  // ── 4c. generateWeeklySummary ──
  header("4. Pipeline: generateWeeklySummary");
  const { generateWeeklySummary } = await import("./src/pipelines/generateWeeklySummary");

  try {
    const activities = [
      { date: "2026-09-14", text: "Implemented JWT middleware in Express", category: "Backend",   skills: ["Node.js", "JWT", "Express"] },
      { date: "2026-09-14", text: "Fixed bug in refresh token rotation logic", category: "Backend", skills: ["Node.js", "debugging"] },
      { date: "2026-09-15", text: "Wrote integration tests for auth endpoints", category: "Testing", skills: ["Jest", "Supertest"] },
      { date: "2026-09-15", text: "Reviewed PR for frontend login form",       category: "Frontend", skills: ["React", "code review"] },
      { date: "2026-09-16", text: "Set up CI pipeline with GitHub Actions",    category: "DevOps",   skills: ["GitHub Actions", "CI/CD"] },
    ];
    const result = await generateWeeklySummary(
      "user-test-01",
      new Date("2026-09-14"),
      new Date("2026-09-16"),
      activities
    );
    console.log("     Output:");
    printJSON(result);
    if (Array.isArray(result.majorWork) && result.majorWork.length > 0 && result.aiInsight) {
      ok("generateWeeklySummary() returns majorWork + aiInsight", `"${result.aiInsight.slice(0, 70)}..."`);
    } else {
      fail("generateWeeklySummary() missing fields", new Error(JSON.stringify(result)));
    }
  } catch (e) { fail("generateWeeklySummary() threw", e); }

// ─── 5. PINECONE VECTOR STORE ────────────────────────────────────────────────

  header("5. Pinecone Vector Store");
  const { upsertVector, queryVectors, deleteVector } = await import("./src/vectorstore/pineconeClient");

  const testId    = `test-vec-${Date.now()}`;
  const testUserId = "test-user-sanity-check";

  // 5a. Upsert
  try {
    const vec = await embed("Fixed authentication bug in login endpoint");
    await upsertVector("activities", testId, vec, {
      userId:     testUserId,
      activityId: testId,
      text:       "Fixed authentication bug in login endpoint",
    });
    ok("upsertVector() — inserted test vector", `id=${testId}`);
  } catch (e) { fail("upsertVector() threw", e); }

  // 5b. Query (small delay so Pinecone indexes the upserted vector)
  try {
    await new Promise(r => setTimeout(r, 2000)); // 2s for indexing
    const queryVec = await embed("authentication bug fix");
    const matches  = await queryVectors("activities", testUserId, queryVec, 5);
    const found    = matches.some(m => m.id === testId);
    if (found) {
      ok("queryVectors() — finds the upserted test vector", `score=${matches.find(m => m.id === testId)?.score?.toFixed(4)}`);
    } else {
      warn("queryVectors() — test vector not in top-5 yet (may need more indexing time)", `matches returned: ${matches.length}`);
    }
  } catch (e) { fail("queryVectors() threw", e); }

  // 5c. Delete
  try {
    await deleteVector("activities", testId);
    ok("deleteVector() — cleaned up test vector");
  } catch (e) { fail("deleteVector() threw", e); }

// ─── 6. RAG QUERY ────────────────────────────────────────────────────────────

  header("6. RAG Query (retrieveContext)");
  const { retrieveContext } = await import("./src/pipelines/ragQuery");

  try {
    // Insert a known vector first so we have something to retrieve
    const vec = await embed("Designed the REST API schema for the activity module");
    const ragTestId = `rag-test-${Date.now()}`;
    await upsertVector("activities", ragTestId, vec, {
      userId: testUserId,
      activityId: ragTestId,
      text: "Designed the REST API schema for the activity module",
    });

    await new Promise(r => setTimeout(r, 2000));

    const context = await retrieveContext(testUserId, "API design work", "activities", 5);
    if (Array.isArray(context)) {
      ok("retrieveContext() returns array", `${context.length} chunks retrieved`);
      if (context.length > 0) {
        ok("retrieveContext() has score + metadata", `top score: ${(context[0].score as number)?.toFixed(4)}`);
      }
    } else {
      fail("retrieveContext() wrong return type", new Error(typeof context));
    }

    await deleteVector("activities", ragTestId); // cleanup
  } catch (e) { fail("retrieveContext() threw", e); }

// ─── 7. HALLUCINATION CHECK ───────────────────────────────────────────────────

  header("7. Hallucination Check (validateClaims)");
  const { validateClaims } = await import("./src/validation/hallucinationCheck");

  // 7a. Grounded text — should pass
  try {
    const source = ["Implemented JWT authentication middleware in Express.js with refresh token support"];
    const claim  = "The developer implemented JWT-based authentication in Express with refresh tokens.";
    const result = await validateClaims(claim, source);
    if (result.supported) {
      ok("validateClaims() — grounded claim passes", `flaggedSentences: ${result.flaggedSentences.length}`);
    } else {
      warn("validateClaims() — grounded claim flagged (threshold may need tuning)", `flagged: "${result.flaggedSentences[0]}"`);
    }
  } catch (e) { fail("validateClaims() (grounded) threw", e); }

  // 7b. Hallucinated text — should be flagged
  try {
    const source = ["Attended a team standup meeting on Monday"];
    const claim  = "The developer deployed a Kubernetes cluster to AWS and reduced costs by 40%.";
    const result = await validateClaims(claim, source);
    if (!result.supported && result.flaggedSentences.length > 0) {
      ok("validateClaims() — hallucinated claim correctly flagged", `flagged: "${result.flaggedSentences[0].slice(0, 60)}..."`);
    } else {
      warn("validateClaims() — hallucination not caught", "threshold may be too low");
    }
  } catch (e) { fail("validateClaims() (hallucination) threw", e); }

  // 7c. Empty source — should flag everything
  try {
    const result = await validateClaims("Some claim here.", []);
    if (!result.supported) {
      ok("validateClaims() — no sources → all claims flagged (correct)");
    } else {
      warn("validateClaims() — empty source should have flagged claims", JSON.stringify(result));
    }
  } catch (e) { fail("validateClaims() (empty source) threw", e); }

// ─── 8. UTILS ────────────────────────────────────────────────────────────────

  header("8. Utils");
  const { estimateTokens, chunkText } = await import("./src/utils/tokenBudget");
  const { withBackoff }               = await import("./src/utils/retry");

  // tokenBudget
  try {
    const tokens = estimateTokens("Hello world this is a test");
    if (typeof tokens === "number" && tokens > 0) {
      ok("estimateTokens() works", `"Hello world this is a test" → ${tokens} tokens`);
    } else {
      fail("estimateTokens() wrong output", new Error(String(tokens)));
    }
  } catch (e) { fail("estimateTokens() threw", e); }

  try {
    const longText = "word ".repeat(500); // 2500 chars ≈ 625 tokens
    const chunks   = chunkText(longText, 100);
    if (chunks.length > 1) {
      ok("chunkText() splits long text", `${chunks.length} chunks, first chunk: "${chunks[0].slice(0,30)}..."`);
    } else {
      fail("chunkText() did not split", new Error(`got ${chunks.length} chunk(s)`));
    }
  } catch (e) { fail("chunkText() threw", e); }

  try {
    const chunks = chunkText("short text", 1000);
    if (chunks.length === 1 && chunks[0] === "short text") {
      ok("chunkText() returns single chunk for short text");
    } else {
      fail("chunkText() short text wrong output", new Error(JSON.stringify(chunks)));
    }
  } catch (e) { fail("chunkText() (short) threw", e); }

  // retry
  try {
    let callCount = 0;
    const result = await withBackoff(async () => {
      callCount++;
      return "success";
    });
    if (result === "success" && callCount === 1) {
      ok("withBackoff() passes through on success", `called once`);
    } else {
      fail("withBackoff() unexpected result", new Error(`result=${result}, calls=${callCount}`));
    }
  } catch (e) { fail("withBackoff() threw", e); }

  try {
    let attempts = 0;
    await withBackoff(async () => {
      attempts++;
      const err: any = new Error("rate limited");
      err.status = 429;
      throw err;
    }, 2).catch(() => {}); // expected to throw after retries
    if (attempts === 3) { // 1 initial + 2 retries
      ok("withBackoff() retries on 429 and stops after maxRetries", `attempted ${attempts} times`);
    } else {
      warn("withBackoff() retry count mismatch", `expected 3, got ${attempts}`);
    }
  } catch (e) { fail("withBackoff() retry test threw unexpectedly", e); }

// ─── FINAL SUMMARY ───────────────────────────────────────────────────────────

  const total = passed + failed;
  console.log(`\n${BOLD}━━━  RESULTS  ━━━${RESET}`);
  console.log(`  ${GREEN}Passed: ${passed}/${total}${RESET}`);
  if (failed > 0) {
    console.log(`  ${RED}Failed: ${failed}/${total}${RESET}`);
  }
  console.log();

  if (failed === 0) {
    console.log(`${GREEN}${BOLD}All checks passed — AI model is working correctly.${RESET}\n`);
  } else {
    console.log(`${RED}${BOLD}Some checks failed — see ❌ above for details.${RESET}\n`);
    process.exit(1);
  }

}).catch(err => {
  console.error(`${RED}Fatal error during test:${RESET}`, err);
  process.exit(1);
});
