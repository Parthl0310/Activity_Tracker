# Continuous Activity Tracking & AI Performance Reporting System (MongoDB Edition)

Private, single-user (per account) work journal. Employee logs completed work daily → system compresses it into weekly → monthly → yearly AI-generated reports. No managers, no evidence, no future goals, no quarterly layer.

--- 

## 1. Monorepo Structure

```
/apps
  /web                → React + TS + Tailwind (Vite)
  /api                → Express + TS
/packages
  /shared-types        → shared DTOs/zod schemas used by web + api
  /ai                  → AI orchestration package (enrichment, RAG, prompts)
/infra
  docker-compose.yml    → mongodb, redis
```

---

## 2. Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, TypeScript, Tailwind CSS, Vite, TanStack Query, React Router, Zod |
| Backend | Node.js 18+, Express 5, TypeScript |
| DB | MongoDB 7 (local, Docker or native install) |
| ODM | Mongoose |
| Vector search | Pinecone (free Starter tier, serverless index) — MongoDB stores the records, Pinecone stores/queries the vectors |
| Cache/Queue | Redis (BullMQ for background jobs) |
| Auth | JWT access + refresh tokens, bcrypt password hashing |
| Embeddings | Local, no account — `@xenova/transformers`, model `Xenova/all-MiniLM-L6-v2` (384-dim) |
| LLM | Google Gemini free tier (`gemini-2.0-flash`) — needs a free API key, see section 12 |
| PDF/DOCX export | Puppeteer (PDF), `docx` npm package (DOCX) |

---

## 3. Environment Variables (`.env`)

```
# API
PORT=4000
NODE_ENV=development
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=30d

# Database
MONGODB_URI=mongodb://localhost:27017/activity_tracker

# Redis
REDIS_URL=redis://localhost:6379

# AI
GEMINI_API_KEY=            # ask user — from https://aistudio.google.com/apikey
GEMINI_MODEL=gemini-2.0-flash
EMBEDDING_MODEL=Xenova/all-MiniLM-L6-v2
EMBEDDING_DIM=384

PINECONE_API_KEY=          # ask user — from https://app.pinecone.io
PINECONE_INDEX=activity-tracker
```

`docker-compose.yml` should run Mongo as a single-node replica set (`--replSet rs0`) even locally — needed for multi-document transactions used in report versioning/finalize.

---

## 4. Database Schema (MongoDB / Mongoose)

```ts
// models/User.ts
{
  _id: ObjectId,
  name: String,
  email: { type: String, unique: true, required: true },
  passwordHash: String,
  jobRole: String,
  department: String,
  reviewYear: Number,
  skills: [String],
  currentProjects: [String],
  joiningDate: Date,
  professionalBackground: String,
  profileCompleted: { type: Boolean, default: false },
  createdAt: Date,
  updatedAt: Date
}

// models/RefreshToken.ts
{
  _id: ObjectId,
  userId: { type: ObjectId, ref: "User", index: true, required: true },
  tokenHash: String,
  revoked: { type: Boolean, default: false },
  expiresAt: Date,
  createdAt: Date
}

// models/Activity.ts
{
  _id: ObjectId,
  userId: { type: ObjectId, ref: "User", index: true, required: true },
  text: String,
  aiRefinedText: String,
  workDate: { type: Date, index: true, required: true },
  project: { type: String, index: true },
  category: String,          // Bug Fix | Feature | Optimization | Refactor | Learning | Discussion | Production Issue | Documentation | Other
  skills: [String],
  keywords: [String],
  workType: String,           // Technical | Non-Technical | Learning
  vectorIndexed: { type: Boolean, default: false }, // true once upserted to Pinecone (id = activity's own _id, namespace "activities")
  embeddingModelVersion: String,
  enrichmentStatus: { type: String, default: "pending" }, // pending | done | failed
  createdAt: Date,
  updatedAt: Date
}
// Compound index: { userId: 1, workDate: -1 }
// Compound index: { userId: 1, project: 1 }

// models/AchievedGoal.ts
{
  _id: ObjectId,
  userId: { type: ObjectId, ref: "User", index: true, required: true },
  title: String,
  description: String,        // "what did you accomplish"
  completedAt: Date,
  relatedActivityIds: [{ type: ObjectId, ref: "Activity" }],
  createdAt: Date,
  updatedAt: Date
}

// models/WeeklySummary.ts
{
  _id: ObjectId,
  userId: { type: ObjectId, ref: "User", index: true, required: true },
  weekStart: Date,
  weekEnd: Date,
  summary: {
    majorWork: [String],
    technicalAreas: [String],
    aiInsight: String,
    entryCount: Number
  },
  confidenceScore: Number,     // 0–1
  status: { type: String, default: "generated" }, // generated | reviewed | edited
  createdAt: Date
}
// Unique compound index: { userId: 1, weekStart: 1 }

// models/MonthlySummary.ts
{
  _id: ObjectId,
  userId: { type: ObjectId, ref: "User", index: true, required: true },
  month: Number,
  year: Number,
  summary: {
    majorWorkAreas: [String],
    skillsDemonstrated: [String],
    aiSummary: String,
    entryCount: Number
  },
  sourceWeekIds: [{ type: ObjectId, ref: "WeeklySummary" }],
  chunks: [
    {
      chunkId: String,          // matches the Pinecone vector id in "monthly-summary-chunks" namespace
      chunkType: String,        // technical | contribution | learning | project | general
      chunkText: String
    }
  ],
  confidenceScore: Number,
  createdAt: Date
}
// Unique compound index: { userId: 1, month: 1, year: 1 }

// models/YearlyReport.ts
{
  _id: ObjectId,
  userId: { type: ObjectId, ref: "User", index: true, required: true },
  year: Number,
  report: {
    executiveSummary: String,
    majorContributions: String,
    technicalWork: String,
    skillsDemonstrated: String,
    projects: String,
    achievedGoals: String,
    learningAndDevelopment: String,
    overallYearSummary: String
  },
  version: { type: Number, default: 1 },
  status: { type: String, default: "draft" }, // draft | reviewed | final
  createdAt: Date,
  updatedAt: Date
}
// Compound index: { userId: 1, year: 1, version: 1 } (unique)

// models/Notification.ts
{
  _id: ObjectId,
  userId: { type: ObjectId, ref: "User", index: true, required: true },
  type: String,                // summary_ready | report_ready | reminder
  payload: Schema.Types.Mixed,
  read: { type: Boolean, default: false },
  createdAt: Date
}
```

No embedding vectors stored in MongoDB at all — Mongo holds the record text/metadata, Pinecone holds the vectors (matched by shared id: `Activity._id` for activities, `chunkId` for monthly-summary chunks). Every Pinecone write and query carries `userId` in its metadata/filter, matching the same `userId` scoping used on every Mongo query.

---

## 5. Backend Structure

```
/apps/api/src
  /config          → env loader, mongoose connection, redis client
  /middleware      → auth.middleware.ts, error.middleware.ts, rateLimit.middleware.ts
  /models           → User, RefreshToken, Activity, AchievedGoal, WeeklySummary, MonthlySummary, YearlyReport, Notification
  /modules
    /auth
      auth.controller.ts
      auth.service.ts
      auth.routes.ts
    /profile
      profile.controller.ts
      profile.service.ts
    /activities
      activities.controller.ts
      activities.service.ts
      activities.repository.ts
    /achievedGoals
      achievedGoals.controller.ts
      achievedGoals.service.ts
    /summaries
      weeklySummary.controller.ts
      weeklySummary.service.ts
      monthlySummary.controller.ts
      monthlySummary.service.ts
    /insights
      insights.controller.ts
      insights.service.ts
    /reports
      yearlyReport.controller.ts
      yearlyReport.service.ts
      export.controller.ts        -- PDF/DOCX
    /search
      search.controller.ts        -- semantic search + RAG assistant
  /jobs
    weeklySummary.job.ts
    monthlySummary.job.ts
    embedding.job.ts
    yearlyReport.job.ts
    queue.ts                       -- BullMQ setup
  /ai                               -- thin wrapper around /packages/ai
  /vectorstore
    pineconeClient.ts                -- upsert/query/delete against Pinecone (shared with /packages/ai)
  app.ts
  server.ts
```

### Controller responsibilities

**`auth.controller.ts`**
- `signup(req, res)` — create user doc, hash password, issue tokens
- `login(req, res)` — verify credentials, issue access+refresh tokens
- `refresh(req, res)` — rotate refresh token, issue new access token
- `logout(req, res)` — revoke refresh token doc

**`profile.controller.ts`**
- `getProfile(req, res)`
- `setupProfile(req, res)` — first-time setup (name, role, dept, review year)
- `updateProfile(req, res)`

**`activities.controller.ts`**
- `createActivity(req, res)` — save raw entry doc, enqueue enrichment + embedding jobs (embedding job upserts to Pinecone)
- `listActivities(req, res)` — paginated, filter by date range/project/category
- `getActivity(req, res)`
- `updateActivity(req, res)` — re-enqueues enrichment if text changed
- `deleteActivity(req, res)`
- `improveEntry(req, res)` — on-demand vague-entry rewrite suggestion (does not auto-save)

**`achievedGoals.controller.ts`**
- `createAchievedGoal(req, res)`
- `listAchievedGoals(req, res)`
- `updateAchievedGoal(req, res)`
- `linkActivities(req, res)` — push into `relatedActivityIds`

**`weeklySummary.controller.ts`**
- `getWeeklySummary(req, res, weekStart)`
- `regenerateWeeklySummary(req, res)`
- `editWeeklySummary(req, res)` — manual employee edits, sets `status='edited'`
- `listWeeklySummaries(req, res)`

**`monthlySummary.controller.ts`**
- mirrors weekly: `getMonthlySummary`, `regenerateMonthlySummary`, `editMonthlySummary`, `listMonthlySummaries`

**`insights.controller.ts`**
- `getYearlyOverview(req, res)` — counts, monthly activity histogram, top categories/skills (Mongo aggregation pipeline)
- `getAIInsights(req, res)` — strongest work area, most active project, learning pattern, work pattern

**`yearlyReport.controller.ts`**
- `checkAvailability(req, res)` — what data exists before generation
- `generateReport(req, res)` — triggers annual RAG job (async, returns job id)
- `getReport(req, res, year)`
- `editReportSection(req, res)`
- `regenerateSection(req, res, sectionName)`
- `finalizeReport(req, res)` — locks status='final', creates new version doc (Mongo transaction across the version bump)
- `listReportVersions(req, res)`

**`export.controller.ts`**
- `exportPDF(req, res)`
- `exportDOCX(req, res)`

**`search.controller.ts`**
- `semanticSearch(req, res)` — natural-language query over activities (Pinecone similarity query, user-scoped by metadata filter)
- `askAssistant(req, res)` — personal RAG Q&A over activities + monthly summaries

---

## 6. Mongo Aggregation Examples (replacing SQL GROUP BY)

```ts
// Yearly overview counts + monthly histogram
const overview = await ActivityModel.aggregate([
  { $match: { userId, workDate: { $gte: yearStart, $lte: yearEnd } } },
  {
    $group: {
      _id: { $month: "$workDate" },
      count: { $sum: 1 }
    }
  },
  { $sort: { _id: 1 } }
]);

// Top skills frequency
const topSkills = await ActivityModel.aggregate([
  { $match: { userId, workDate: { $gte: yearStart, $lte: yearEnd } } },
  { $unwind: "$skills" },
  { $group: { _id: "$skills", count: { $sum: 1 } } },
  { $sort: { count: -1 } },
  { $limit: 5 }
]);
```

---

## 7. Frontend Structure

```
/apps/web/src
  /pages
    /auth            → Login, Signup
    /onboarding       → ProfileSetup
    /dashboard        → Dashboard (Home)
    /records          → RecordsList, RecordDetail, AddWork
    /goals            → AchievedGoalsList, AddAchievedGoal
    /reports          → WeeklySummaryView, MonthlySummaryView, YearlyOverview, ReportEditor
    /insights         → InsightsPage
    /profile          → ProfileSettings
  /components
    /ui               → Button, Card, Input, Modal, Badge, Skeleton (Tailwind primitives)
    /charts           → MonthlyActivityBar, CategoryDistribution
    /records          → WorkEntryCard, EntryForm, EnrichmentPreview
    /reports          → SectionEditor, ConfidenceBadge, ReportVersionList
  /hooks              → useAuth, useActivities, useWeeklySummary, useYearlyReport, useRAGAssistant
  /lib                → api client (axios/fetch wrapper with token refresh interceptor), queryClient
  /store              → auth store (Zustand) — access token in memory, refresh token httpOnly cookie
  /routes             → route definitions + protected route guard
```

Entirely unchanged from the Postgres version — the frontend never talks to the DB directly. Navigation: `Home | Records | Reports | Insights | Profile`.

---

## 8. AI Package (`/packages/ai`) — Summary

Full detail lives in the separate AI-MODEL-README (Gemini + local embeddings + Pinecone, prompts, hallucination validation, RAG pipeline are DB-agnostic — Mongo just stores the record text/metadata that Pinecone's metadata mirrors). Retrieval:

```ts
// packages/ai/pipelines/ragQuery.ts
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

Write side: the enrichment job upserts each activity's vector to the `activities` namespace (id = Mongo `_id`); the monthly-summary job upserts each chunk to `monthly-summary-chunks` (id = `chunkId` stored back on the `MonthlySummary.chunks[]` subdocument). MongoDB and Pinecone are kept in sync by always writing both in the same job — if one fails, retry the job rather than leaving them out of sync.

---

## 9. Background Jobs (BullMQ + Redis) — unchanged

| Job | Trigger | Action |
|---|---|---|
| `embedding.job` | on activity create/update | embed text, upsert to Pinecone `activities` namespace, set `Activity.vectorIndexed=true` |
| `enrichment.job` | on activity create/update | run enrichment pipeline |
| `weeklySummary.job` | cron, every Monday 00:00 (prev week) + manual regenerate | generate weekly summary |
| `monthlySummary.job` | cron, 1st of month + manual regenerate | generate monthly summary, chunk it, upsert chunks to Pinecone `monthly-summary-chunks` namespace |
| `yearlyReport.job` | manual trigger (`generateReport`) | run annual RAG pipeline, async, poll via job id |

---

## 10. API Route Map — unchanged

```
POST   /auth/signup
POST   /auth/login
POST   /auth/refresh
POST   /auth/logout

GET    /profile
POST   /profile/setup
PATCH  /profile

POST   /activities
GET    /activities?from=&to=&project=&category=&q=
GET    /activities/:id
PATCH  /activities/:id
DELETE /activities/:id
POST   /activities/:id/improve

POST   /achieved-goals
GET    /achieved-goals
PATCH  /achieved-goals/:id

GET    /summaries/weekly?weekStart=
POST   /summaries/weekly/:id/regenerate
PATCH  /summaries/weekly/:id
GET    /summaries/monthly?month=&year=
POST   /summaries/monthly/:id/regenerate
PATCH  /summaries/monthly/:id

GET    /insights/overview?year=
GET    /insights/ai?year=

GET    /reports/yearly/:year/availability
POST   /reports/yearly/:year/generate     -> returns jobId
GET    /reports/yearly/:year
PATCH  /reports/yearly/:year/section/:name
POST   /reports/yearly/:year/section/:name/regenerate
POST   /reports/yearly/:year/finalize
GET    /reports/yearly/:year/versions
GET    /reports/yearly/:year/export/pdf
GET    /reports/yearly/:year/export/docx

GET    /search?q=
POST   /assistant/ask
```

`:id` params are now Mongo `ObjectId` strings instead of UUID strings — validate with `mongoose.isValidObjectId()` in a request-validation middleware.

---

## 11. Auth & Security — unchanged logic, storage swapped

- Access token: JWT, 15 min expiry, `Authorization: Bearer`.
- Refresh token: JWT, 30 day expiry, httpOnly+secure cookie, hashed copy in `RefreshToken` collection for revocation.
- `auth.middleware.ts` verifies access token, attaches `req.user = { id, email }`.
- Every repository function takes `userId` as a mandatory first argument.
- Rate limiting on `/auth/*` and `/assistant/ask` (Redis-backed).
- Passwords: bcrypt, cost factor 12.

---

## 12. Accounts / Keys Needed

| Needed | Why | Where |
|---|---|---|
| Google AI Studio API key | Gemini free-tier LLM calls | https://aistudio.google.com/apikey — ask before wiring `.env` |
| Pinecone API key + index | Vector storage/search | https://app.pinecone.io — free Starter tier, no credit card. Ask for the key and confirm index name/region before wiring `.env` |

MongoDB runs locally (Docker/native install), embeddings run locally, Redis runs locally — no account needed for those three. If you later want Atlas-hosted Mongo, that's a separate free Atlas signup — ask before switching.

---

## 13. Build Order (Phases) — unchanged sequence, Mongo-specific notes inline

1. Foundation — monorepo, Mongo (as single-node replica set) + Redis via Docker, auth, project scaffolding
2. Profile — signup/login/profile setup
3. Daily work recording — CRUD, no AI yet
4. Achieved goals — CRUD + activity linking
5. Pinecone setup — create index (dim 384, cosine, serverless), wire `PINECONE_API_KEY`/`PINECONE_INDEX` (ask user), test one upsert+query round trip
6. AI enrichment — category/skill/keyword extraction, vague-entry improvement
7. Embeddings — enrichment job upserts to Pinecone `activities` namespace, semantic search wired to Pinecone query
8. Weekly summaries — job + review/edit UI
9. Monthly summaries — job + chunk upsert to Pinecone `monthly-summary-chunks` namespace
10. AI insights — Mongo aggregation pipelines + narrative
11. Personal RAG assistant
12. Yearly RAG report — multi-query retrieval, section generation, hallucination validation
13. Report editing — section edit/regenerate, versioning (Mongo transaction), finalize
14. Export — PDF/DOCX
15. Production polish — caching, retries, logging, rate limiting, responsive UI, empty/loading states

---

## 14. Explicitly Out of Scope

No future goals/deadlines/progress tracking. No evidence upload/linking. No quarterly reports. No duplicate detection or similarity blocking. No manager/HR dashboards, approvals, ratings, or promotion/salary logic. No cross-user data access — every collection and query is `userId`-scoped.
