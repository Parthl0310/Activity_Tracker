# TESTING_PLAN.md — Continuous Activity Tracking & AI Performance Reporting System

This file is the instruction set for the AI agent (Antigravity) that will verify every feature of this project, one by one. Read all of it before doing anything.

---

## 0. Golden Rules (highest priority — never break these)

1. **The direct flow of the website is already working and MUST NOT change.** Your job is to verify and report, not to redesign, refactor, rename, reorder, or "improve".
2. **Do not modify any file under `/apps` or `/packages` or `/infra`.** All test material (scripts, seed data, notes, reports) goes into a new top-level folder called `/testing`. If `/testing` does not exist, create it.
3. **If you find a bug, do not fix it.** Write it into the defect log (section 9) with reproduction steps, the suspected file/module, and a suggested fix. Wait for the owner to approve before any code change is made.
4. **Never touch real data.** Use a separate test database and dedicated test users (section 4). Never delete or edit documents that were not created by the test run.
5. **Work one phase at a time.** Finish a phase, write its results, then stop and wait for the owner to say "next" unless told to run everything.
6. **Evidence over claims.** A test is PASS only if you observed the expected result yourself (API response, database state, vector store state, or browser screen). Never mark PASS from reading code alone.
7. **Be honest about blocked tests.** If a test cannot run (missing key, service down, no data), mark it BLOCKED and say why. Do not skip silently and do not guess.
8. **Respect external limits.** The LLM (Gemini free tier) and Pinecone free tier have rate limits. Pace calls, avoid loops that hammer them, and stop on repeated 429 errors.
9. **No secrets in reports.** Never print API keys, JWT secrets, or password hashes into any report or log.

---

## 1. Project Context (for the agent)

A private, single-user work journal. The user logs completed work daily. The system enriches each entry with AI, then compresses entries into weekly, then monthly, then yearly AI-generated reports. No managers, no evidence uploads, no future goals, no quarterly layer. Every piece of data is scoped to one user.

**Stack**
- Frontend: React 18, TypeScript, Tailwind, Vite, TanStack Query, React Router, Zustand (auth store)
- Backend: Node.js 18+, Express 5, TypeScript
- Database: MongoDB 7 via Mongoose, run as a single-node replica set (needed for transactions in report versioning and finalize)
- Vectors: Pinecone serverless index, 384 dimensions, cosine metric. Namespaces: `activities` and `monthly-summary-chunks`
- Queue and cache: Redis with BullMQ
- Embeddings: local model MiniLM (384-dim), no account needed
- LLM: Google Gemini free tier
- Export: Puppeteer (PDF) and the `docx` package (DOCX)
- Auth: JWT access token (15 min) and refresh token (30 days, httpOnly cookie, hashed copy stored for revocation), bcrypt cost 12

**Monorepo layout:** `/apps/web`, `/apps/api`, `/packages/shared-types`, `/packages/ai`, `/infra`.

**Sync rule to keep in mind:** MongoDB holds record text and metadata, Pinecone holds vectors, linked by a shared id (`Activity._id` for activities, `chunkId` for monthly summary chunks). Every Pinecone query carries a `userId` filter.

**Collections:** User, RefreshToken, Activity, AchievedGoal, WeeklySummary, MonthlySummary, YearlyReport, Notification.

**Background jobs:** enrichment, embedding, weekly summary (cron Monday 00:00 for previous week), monthly summary (cron on the 1st), yearly report (manual trigger, async, polled by job id).

---

## 2. The Fixed Direct Flow (the reference — must stay exactly like this)

This is the user journey that is confirmed working. Treat it as a contract. Any deviation you observe while testing is a defect to report, not something to change.

1. **Signup / Login.** New user creates an account, or an existing user logs in.
2. **Profile setup (first login only).** Name, job role, department, review year. Until complete, the user is sent to onboarding.
3. **Dashboard (Home).** Overview of recent activity.
4. **Add Work.** User writes an entry (text, date, project). It saves instantly. Enrichment and embedding happen in the background.
5. **Records.** List with filters (date range, project, category), pagination, and a detail view that shows the AI-refined text and an on-demand "improve this entry" suggestion that is not auto-saved.
6. **Achieved Goals.** Add a goal and link related activities.
7. **Reports, weekly.** Weekly summary view, with review, edit, and regenerate.
8. **Reports, monthly.** Monthly summary view, with review, edit, and regenerate.
9. **Insights.** Yearly overview charts and AI insights.
10. **Search and Assistant.** Natural-language search and the personal Q&A assistant.
11. **Yearly report.** Check availability, generate (async), edit or regenerate sections, finalize (creates a new version), then export to PDF or DOCX.
12. **Profile settings and logout.**

Navigation bar order: **Home | Records | Reports | Insights | Profile**.

---

## 3. Pre-flight Checks (Phase 0 — run before anything else)

For each check, record PASS / FAIL / BLOCKED with evidence.

| ID | Check | Expected |
|---|---|---|
| P0-01 | Read the `.env` file and list which variables are present, without printing values | All variables from the project list exist and are non-empty: ports, JWT secrets, expiry values, Mongo URI, Redis URL, Gemini key and model, embedding model and dimension, Pinecone key and index |
| P0-02 | MongoDB reachable and running as a replica set | Connection works and the replica set is initiated and primary |
| P0-03 | Redis reachable | Ping succeeds |
| P0-04 | Pinecone index exists | Index name matches the env value, dimension is 384, metric is cosine, and it is serverless |
| P0-05 | Gemini key and configured model actually respond | A tiny test prompt returns text. Note: the configured model name may be deprecated or renamed, so if this fails report the exact error and list which model names the key can use. Do not change the env value |
| P0-06 | Embedding model loads locally and returns a 384-length vector | Vector length equals 384 |
| P0-07 | API server starts cleanly | No crash, connects to Mongo and Redis, listens on the configured port |
| P0-08 | Worker or job processor is running | The queue processes a test job. Note whether the embedding model runs inside the API process or a separate worker, and report it |
| P0-09 | Web app starts and loads the login page | Page renders without console errors |
| P0-10 | Dependencies install cleanly | No unresolved or deprecated-critical packages. Just report, do not upgrade |

Do not continue to Phase 1 until P0-01 to P0-07 are PASS, or the owner tells you to continue anyway.

---

## 4. Test Data Strategy

**Isolation**
- Use a dedicated test database name (for example the normal name with a `_test` suffix) and a dedicated test Pinecone index, or, if only one index exists, use test users only and clean up by `userId` afterward.
- Never run destructive cleanup without confirming the target is the test database.

**Test users**
- **User A:** main test account, full profile completed, review year set to the seeded year.
- **User B:** second account, used only to prove data isolation.
- **User C:** freshly created account with no profile and no data, used for onboarding and empty-state checks.

**Seed data for User A** (create under `/testing/seed`, insert through the real API where possible so enrichment and embedding actually run):
- Roughly 40 to 60 entries spread across at least 4 different months and at least 6 different weeks of the review year, using past dates so summaries can be generated immediately.
- A mix of categories: bug fix, feature, optimization, refactor, learning, discussion, production issue, documentation, other.
- A mix of clear entries and deliberately vague entries (for example "worked on stuff", "meeting").
- At least 3 distinct projects.
- At least one entry on a week boundary (Sunday night / Monday morning) and one on a month boundary (last day and first day) to test grouping.
- Also seed 3 to 4 achieved goals linked to real entries.

Pace seeding so the LLM rate limit is not exceeded.

---

## 5. How to Run Tests

**Three ways to test any feature. Use the one that isolates the problem best:**

1. **Direct API calls** (best for isolating backend behavior). Call the route directly with the correct token, without the UI.
2. **Database inspection** (best for confirming what was stored). Look at the actual documents after each action.
3. **Browser walkthrough** (best for confirming the UI and the direct flow). Drive the real website and take screenshots.

**Single-feature mode.** The owner may say "run only test P3-05" or "run only Phase 8". In that case:
- Run only the requested items, plus the minimum prerequisites they list.
- Every test below states its prerequisite so it can be run alone.
- Report only on what was run.

**Job timing rule.** Do NOT wait for the Monday or 1st-of-month cron. Trigger the weekly and monthly jobs manually through a helper script placed in `/testing`, and use the regenerate endpoints where they apply. Also verify separately, by reading the scheduler configuration, that the cron expressions are correct (Monday 00:00 for weekly, the 1st for monthly). Do not change them.

**Every test result must record:** test ID, PASS / FAIL / BLOCKED, what you did, what you observed, and the evidence location.

---

## 6. Test Phases

Route reference (for API-level testing):
- Auth: signup, login, refresh, logout
- Profile: get, setup, update
- Activities: create, list with filters (from, to, project, category, q), get, update, delete, improve
- Achieved goals: create, list, update
- Summaries: weekly get/regenerate/edit, monthly get/regenerate/edit
- Insights: overview and AI insights, by year
- Reports (yearly): availability, generate (returns job id), get, section edit, section regenerate, finalize, versions, export PDF, export DOCX
- Search: semantic search
- Assistant: ask

### Phase 1 — Authentication

| ID | Test | Expected |
|---|---|---|
| P1-01 | Signup with valid data | Account created, tokens issued, password stored only as a bcrypt hash |
| P1-02 | Signup with an already used email | Clear error, no duplicate user |
| P1-03 | Signup with invalid input (bad email, short password, missing fields) | Validation error, nothing saved |
| P1-04 | Login with correct credentials | Access token returned, refresh token set as an httpOnly cookie |
| P1-05 | Login with wrong password and with unknown email | Same generic failure for both, no hint about which was wrong |
| P1-06 | Access a protected route without a token | Rejected |
| P1-07 | Access a protected route with a malformed or expired token | Rejected |
| P1-08 | Refresh with a valid refresh token | New access token issued and the refresh token is rotated |
| P1-09 | Reuse the old refresh token after rotation | Rejected |
| P1-10 | Logout, then try to refresh | Refresh token is revoked and refresh fails |
| P1-11 | Rate limit on auth routes | After repeated attempts, requests are limited. Reset the limiter counters afterward |
| P1-12 | Frontend: token refresh interceptor | When the access token expires during use, the UI silently refreshes and the user is not kicked out |

### Phase 2 — Profile and Onboarding

| ID | Test | Expected |
|---|---|---|
| P2-01 | New user (User C) logs in for the first time | Redirected to profile setup and cannot reach other pages |
| P2-02 | Submit profile setup with all required fields | Saved, profile marked complete, user lands on the dashboard |
| P2-03 | Submit with missing or invalid fields | Validation errors shown, nothing saved |
| P2-04 | Update profile later | Changes persist after a page refresh |
| P2-05 | Returning user with a complete profile | Goes straight to the dashboard, no onboarding |

### Phase 3 — Daily Work Recording (no AI involved)

| ID | Test | Expected |
|---|---|---|
| P3-01 | Create an entry with valid data | Saved immediately, appears in the list, initial enrichment status is pending |
| P3-02 | Create with missing text or missing date | Validation error |
| P3-03 | List entries | Newest work date first, paginated correctly, correct total |
| P3-04 | Filter by date range | Only entries in range, boundaries inclusive |
| P3-05 | Filter by project | Only that project |
| P3-06 | Filter by category | Only that category |
| P3-07 | Combine filters and the text query | Results satisfy all conditions |
| P3-08 | Get a single entry by id | Correct entry. An invalid id format gives a clean error, and a valid but unknown id gives not found |
| P3-09 | Update an entry (change text) | Saved, and enrichment is re-queued because text changed |
| P3-10 | Update an entry (change only non-text field, if allowed) | Saved, and enrichment is not needlessly re-queued |
| P3-11 | Delete an entry | Removed from the database, and its vector is removed from Pinecone, and it no longer appears in search |
| P3-12 | Empty state | A user with no entries sees a proper empty state, not an error |

### Phase 4 — AI Enrichment

| ID | Test | Expected |
|---|---|---|
| P4-01 | Save a clear entry and wait for the job | Status moves pending to done. Category is one of the allowed values. Skills and keywords are populated. Work type is set |
| P4-02 | Save a vague entry | Enrichment still completes sensibly, with category possibly "Other" |
| P4-03 | Improve-entry suggestion on a vague entry | A better rewrite is returned and NOT saved automatically |
| P4-04 | Accepting the suggestion in the UI | Only then is the refined text stored |
| P4-05 | Force an LLM failure (invalid key or blocked network in the test environment only) | Status becomes failed, the entry is not lost, and the raw entry remains usable |
| P4-06 | Retry behavior after failure | The job retries per configuration and eventually succeeds or stays failed with a clear reason |
| P4-07 | Hallucination sanity check | Enriched skills and keywords are grounded in the entry text and do not invent unrelated technologies |

### Phase 5 — Embeddings and Vector Sync

| ID | Test | Expected |
|---|---|---|
| P5-01 | After enrichment, check the vector flag on the entry | Marked as indexed and the embedding model version recorded |
| P5-02 | Check Pinecone for that entry's id in the `activities` namespace | Vector exists with 384 dimensions and metadata containing the correct user id |
| P5-03 | Update the entry text | Vector is refreshed, not duplicated |
| P5-04 | Delete the entry | Vector removed |
| P5-05 | Mongo and Pinecone consistency check | Count of indexed entries in Mongo equals vectors for that user in the namespace. Report any mismatch with ids |
| P5-06 | Embedding job failure and retry | Retried, and no half-synced state is left silently |

### Phase 6 — Achieved Goals

| ID | Test | Expected |
|---|---|---|
| P6-01 | Create a goal with title, description, completion date | Saved |
| P6-02 | Create with missing required fields | Validation error |
| P6-03 | List goals | Only the current user's goals |
| P6-04 | Update a goal | Persists |
| P6-05 | Link activities to a goal | Linked ids stored, and no duplicates if linked twice |
| P6-06 | Link an activity that belongs to another user | Rejected |
| P6-07 | Link a non-existent activity | Clean error |
| P6-08 | UI: goal list and add-goal form | Match the direct flow, and linked activities are visible |

### Phase 7 — Semantic Search

| ID | Test | Expected |
|---|---|---|
| P7-01 | Natural-language query that matches seeded entries by meaning (not exact words) | Relevant entries ranked on top |
| P7-02 | Query with no relevant data | Empty or low-confidence results, no crash |
| P7-03 | Empty query | Clean validation |
| P7-04 | User isolation | User B searching returns none of User A's entries |
| P7-05 | Search right after creating an entry, before indexing completes | Behaves gracefully, and appears once indexed |
| P7-06 | Deleted entries | Never returned |

### Phase 8 — Weekly Summaries

| ID | Test | Expected |
|---|---|---|
| P8-01 | Trigger the weekly job manually for a seeded week | One summary created with major work, technical areas, AI insight, entry count, and a confidence score between 0 and 1 |
| P8-02 | Entry count accuracy | Equals the number of entries actually in that week (Monday to Sunday), including boundary entries |
| P8-03 | Summary content grounding | No work is mentioned that is not in that week's entries |
| P8-04 | Trigger again for the same week | No duplicate (unique per user and week start) |
| P8-05 | Week with zero entries | No fabricated summary, or a clean empty result |
| P8-06 | Fetch by week start | Returns the right one. List returns all for the user |
| P8-07 | Manual edit | Content saved and status becomes edited |
| P8-08 | Regenerate | New content produced, and the status is updated according to the design |
| P8-09 | Notification created when a summary is ready | Notification document exists and shows in the UI |
| P8-10 | Scheduler configuration | Cron is set for Monday 00:00 covering the previous week (read only) |

### Phase 9 — Monthly Summaries

| ID | Test | Expected |
|---|---|---|
| P9-01 | Trigger the monthly job for a seeded month | Summary created with major work areas, skills demonstrated, AI summary, entry count, source week ids, confidence |
| P9-02 | Source weeks | The referenced weekly summaries belong to that month and that user |
| P9-03 | Chunks created | Chunks exist with type, text, and chunk id |
| P9-04 | Chunks in Pinecone | Each chunk id exists in the `monthly-summary-chunks` namespace with the correct user metadata |
| P9-05 | Duplicate run | No duplicate (unique per user, month, year) |
| P9-06 | Edit and regenerate | Same expectations as weekly. Regenerating replaces old chunks in Pinecone rather than piling up stale ones |
| P9-07 | Scheduler configuration | Cron is set for the 1st of the month (read only) |

### Phase 10 — Insights

| ID | Test | Expected |
|---|---|---|
| P10-01 | Yearly overview | Totals and the monthly histogram match a manual count from the database |
| P10-02 | Top categories and top skills | Correct ordering and counts against a manual calculation |
| P10-03 | AI insights | Strongest area, most active project, learning pattern, and work pattern are consistent with the data |
| P10-04 | Year with no data | Clean empty state |
| P10-05 | Charts in the UI | Render correctly and match the API numbers |

### Phase 11 — Personal RAG Assistant

| ID | Test | Expected |
|---|---|---|
| P11-01 | Ask a factual question answerable from seeded data | Correct answer grounded in the user's own entries |
| P11-02 | Ask something not in the data | Says it cannot find it. No invented answer |
| P11-03 | Ask about a specific month | Uses monthly summaries and entries appropriately |
| P11-04 | Isolation | User B cannot get answers from User A's data |
| P11-05 | Rate limit on the assistant route | Limited after excessive requests. Reset afterward |
| P11-06 | Empty or very long question | Clean handling |

### Phase 12 — Yearly Report

| ID | Test | Expected |
|---|---|---|
| P12-01 | Availability check | Correctly reports what data exists (weeks, months, goals) |
| P12-02 | Generate report | Returns a job id immediately, and status can be polled until complete |
| P12-03 | Report structure | All sections exist: executive summary, major contributions, technical work, skills demonstrated, projects, achieved goals, learning and development, overall year summary |
| P12-04 | Grounding and hallucination validation | Every claim in the report is traceable to seeded entries, summaries, or goals. Report any invented project, skill, or achievement |
| P12-05 | Achieved goals section | Matches the goals actually stored |
| P12-06 | Generate with insufficient data | Sensible message, not a fabricated report |
| P12-07 | Edit one section | Only that section changes and it persists |
| P12-08 | Regenerate one section | Only that section changes |
| P12-09 | Finalize | Status becomes final and content is locked, and a new version is created inside a database transaction |
| P12-10 | Edit a finalized report | Blocked as designed |
| P12-11 | Version list | Shows all versions in order, with unique year and version numbers |
| P12-12 | Transaction integrity | If finalize fails midway, no half-created version remains |

### Phase 13 — Export

| ID | Test | Expected |
|---|---|---|
| P13-01 | Export PDF | File downloads, opens, all sections present, readable layout |
| P13-02 | Export DOCX | File downloads, opens in Word or an equivalent, all sections present |
| P13-03 | Content matches the saved report, including manual edits | Yes |
| P13-04 | Export a year with no report | Clean error |
| P13-05 | Special characters and long text | No broken layout or missing text |

### Phase 14 — Frontend and Direct Flow in the Browser

Drive the real site with a browser, take a screenshot at each step, and confirm it matches section 2.

| ID | Test | Expected |
|---|---|---|
| P14-01 | Signup, onboarding, dashboard, in order | Exactly as the direct flow |
| P14-02 | Navigation bar | Shows Home, Records, Reports, Insights, Profile, in that order, and every link works |
| P14-03 | Protected routes when logged out | Redirect to login and return to the original page after login if designed so |
| P14-04 | Add Work then Records | New entry appears, enrichment shows up after a short delay |
| P14-05 | Loading, empty, and error states | Present on each page, no blank screens |
| P14-06 | Forms | Inline validation messages, submit button disabled or guarded during save |
| P14-07 | Responsive layout | Usable at phone, tablet, and desktop widths |
| P14-08 | Browser console | No unexpected errors or failed network requests during a full run |
| P14-09 | Refresh on every page | State recovers correctly, session persists via the refresh token |

### Phase 15 — Security and Data Isolation

| ID | Test | Expected |
|---|---|---|
| P15-01 | User B requests User A's entry, goal, summary, report, or export by id | Not found or forbidden. Never returned |
| P15-02 | User B tries to edit or delete User A's data | Rejected, and nothing changes |
| P15-03 | Every Pinecone query includes the user filter | Confirmed by reading the code paths and by the search and assistant tests |
| P15-04 | Password storage | Only a bcrypt hash with the expected cost, never plain text |
| P15-05 | Sensitive fields in API responses | No password hash and no token hash returned |
| P15-06 | Injection attempts in text fields and query strings | Handled safely, and no operator injection through filters |
| P15-07 | Malformed ids everywhere ids are accepted | Clean validation error |
| P15-08 | Cookie flags | httpOnly always, secure in production mode |
| P15-09 | Text with HTML or script tags in an entry | Displayed as plain text, no script execution in the UI |

### Phase 16 — Resilience and Failure Handling

| ID | Test | Expected |
|---|---|---|
| P16-01 | Redis down during entry creation | Clear behavior, entry not silently lost. Restore Redis afterward |
| P16-02 | Gemini failure or rate limit | Jobs fail gracefully and retry, and the UI shows a clear state |
| P16-03 | Pinecone unreachable | Search and assistant return a clean error, and the Mongo data is safe |
| P16-04 | Server restart mid-job | Queued jobs resume or are retried, and no duplicates are created |
| P16-05 | Large entry text | Handled, or rejected with a clear limit |

### Phase 17 — Final End-to-End Regression of the Direct Flow

Create a brand-new user and walk the entire direct flow from step 1 to step 12 without shortcuts, using only the UI, seeded through normal use as far as time allows. Confirm every step behaves as described in section 2 and that nothing changed compared to earlier phases. This is the sign-off phase.

---

## 7. Known Things to Watch (report, do not fix)

- The configured Gemini model name may be deprecated. Report the result of P0-05 in detail.
- The embedding package used may have a newer maintained replacement. Just note the package name and version in the report.
- Running the embedding model inside the API process can block requests. Note where it actually runs.
- The free-tier limits of Gemini and Pinecone can cause intermittent failures during seeding. Distinguish rate-limit failures from real bugs.
- Week boundary handling (time zones and Monday start) is a common bug source. Test it carefully in P8-02.

---

## 8. Reporting

Create these files inside `/testing`:

1. **`/testing/RESULTS.md`** — one row per test: ID, status, short observation, evidence path. Add a summary at the top: totals of PASS, FAIL, BLOCKED per phase.
2. **`/testing/DEFECTS.md`** — the defect log (section 9 format).
3. **`/testing/evidence/`** — screenshots, saved API responses, and database snapshots referenced by test ID.
4. **`/testing/seed/`** and **`/testing/helpers/`** — seed data and helper scripts you created.

Update RESULTS.md after every phase, not only at the end.

---

## 9. Defect Log Format

For every FAIL, add an entry with:

- **Defect ID** (D-001, D-002, ...)
- **Linked test ID(s)**
- **Severity:** Critical (blocks the direct flow or leaks data), High (feature broken), Medium (wrong behavior with a workaround), Low (cosmetic)
- **What was expected** and **what happened**
- **Steps to reproduce** (exact, minimal)
- **Suspected location** (file and function, if you can identify it)
- **Suggested fix** (described in words, not applied)
- **Impact on the direct flow:** yes or no

---

## 10. Definition of Done

Testing is complete when:

- Every test in phases 0 to 17 is marked PASS, FAIL, or BLOCKED, with evidence.
- All Critical and High defects are documented with reproduction steps.
- The final regression (Phase 17) confirms the direct flow matches section 2.
- No file outside `/testing` was modified. Confirm this at the end by checking the repository for changes and stating the result.

---

## 11. Kickoff Prompts the Owner Can Use

- **Start:** "Read TESTING_PLAN.md fully. Run Phase 0 only, write RESULTS.md, then stop and wait."
- **Next phase:** "Next. Run Phase N only."
- **Single test:** "Run only test P8-02 and its prerequisites. Report the evidence."
- **Everything:** "Run all phases in order, one at a time, updating RESULTS.md after each, and stop immediately if a Critical defect blocks the direct flow."
- **Re-test after a fix:** "I fixed defect D-003. Re-run only its linked tests and the Phase 17 regression."
