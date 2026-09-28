# Activity Tracker & Performance Reporting System — Completed Implementation Guide

This document provides a detailed technical overview of all completed backend components, architectural designs, database models, aggregation pipelines, API endpoints, and automated Postman test suites built in accordance with [README-MONGODB.md](file:///d:/SEM_7/System%20Design/README-MONGODB.md).

---

## 1. Architecture & Design Pattern

The backend is structured using a clean, layered architectural pattern with strict TypeScript typing, Express 5, and Mongoose ODM:

```
src/
├── config/             # Environment configuration (JWT, Mongo, Redis, Port) and DB initialization
├── middleware/         # Auth verification (JWT), error handling, Zod request/params validation
├── models/             # Mongoose document interfaces, schemas, unique & compound indexes
│   ├── User.ts
│   ├── RefreshToken.ts
│   ├── Activity.ts
│   ├── AchievedGoal.ts
│   ├── WeeklySummary.ts
│   ├── MonthlySummary.ts
│   ├── YearlyReport.ts
│   └── Notification.ts
├── modules/            # Feature modules (DTOs, Service, Controller, Routes)
│   ├── auth/           # Signup, login, token rotation, logout
│   ├── profile/        # User profile setup, retrieval, updates
│   ├── activities/     # Daily work logging, pagination, filtering, search
│   ├── achievedGoals/  # Milestone tracking and activity linking
│   ├── insights/       # MongoDB aggregation pipelines (histograms, top skills, work breakdown)
│   ├── summaries/      # Weekly and monthly summary generation, edits & chunking
│   └── reports/        # Yearly 8-section report generation, section edits & version locking
├── app.ts              # Express application configuration and route mounting
└── server.ts           # Server bootstrap and MongoDB connection lifecycle
```

---

## 2. Completed Modules & Implementation Details

### Phase 1: Foundation & Authentication Module
* **Models**:
  * [User.ts](file:///d:/SEM_7/System%20Design/src/models/User.ts): User credentials, contact info, review metadata.
  * [RefreshToken.ts](file:///d:/SEM_7/System%20Design/src/models/RefreshToken.ts): SHA-256 hashed refresh tokens with automatic MongoDB TTL index expiration.
* **Security**:
  * Passwords hashed with `bcrypt` (12 rounds).
  * Dual-token strategy: 15-minute access token + 30-day refresh token with rotation and revocation.

### Phase 2: Profile Management Module
* **Files**: `src/modules/profile/` ([profile.controller.ts](file:///d:/SEM_7/System%20Design/src/modules/profile/profile.controller.ts), [profile.service.ts](file:///d:/SEM_7/System%20Design/src/modules/profile/profile.service.ts), [profile.routes.ts](file:///d:/SEM_7/System%20Design/src/modules/profile/profile.routes.ts), [profile.dto.ts](file:///d:/SEM_7/System%20Design/src/modules/profile/profile.dto.ts))
* **Endpoints**: `POST /profile/setup`, `GET /profile`, `PATCH /profile`.

### Phase 3: Daily Activity Recording Module
* **Model**: [Activity.ts](file:///d:/SEM_7/System%20Design/src/models/Activity.ts)
  * Fields: `userId`, `text`, `aiRefinedText`, `workDate`, `project`, `category`, `skills`, `keywords`, `workType`, `vectorIndexed`, `embeddingModelVersion`, `enrichmentStatus`.
  * Compound performance indexes: `{ userId: 1, workDate: -1 }`, `{ userId: 1, project: 1 }`.
* **Endpoints**: `POST /activities`, `GET /activities`, `GET /activities/:id`, `PATCH /activities/:id`, `DELETE /activities/:id`, `POST /activities/:id/improve`.

### Phase 4: Achieved Goals Module
* **Model**: [AchievedGoal.ts](file:///d:/SEM_7/System%20Design/src/models/AchievedGoal.ts)
  * Fields: `userId`, `title`, `description`, `completedAt`, `relatedActivityIds` (`ObjectId[]` referencing `Activity`).
  * Compound index: `{ userId: 1, completedAt: -1 }`.
* **Endpoints**: `POST /achieved-goals`, `GET /achieved-goals`, `GET /achieved-goals/:id`, `PATCH /achieved-goals/:id`, `DELETE /achieved-goals/:id`, `POST /achieved-goals/:id/link-activities`.

### Phase 5: Insights & Analytics Module (MongoDB Aggregation Pipelines)
* **Files**: `src/modules/insights/` ([insights.service.ts](file:///d:/SEM_7/System%20Design/src/modules/insights/insights.service.ts), [insights.controller.ts](file:///d:/SEM_7/System%20Design/src/modules/insights/insights.controller.ts), [insights.routes.ts](file:///d:/SEM_7/System%20Design/src/modules/insights/insights.routes.ts), [insights.dto.ts](file:///d:/SEM_7/System%20Design/src/modules/insights/insights.dto.ts))
* **Aggregations Implemented**:
  * 12-Month activity histogram (`$match`, `$group: { _id: { $month: "$workDate" } }`, `$sort`).
  * Top skills frequencies ranking (`$unwind: "$skills"`, `$group`, `$sort`, `$limit: 10`).
  * Work category and work-type distribution breakdown.
  * Project volume breakdown.
  * AI Insights narrative generation.
* **Endpoints**: `GET /insights/overview?year=`, `GET /insights/ai?year=`.

### Phase 6: Weekly & Monthly Summaries Module
* **Models**:
  * [WeeklySummary.ts](file:///d:/SEM_7/System%20Design/src/models/WeeklySummary.ts) (Unique compound index: `{ userId: 1, weekStart: 1 }`).
  * [MonthlySummary.ts](file:///d:/SEM_7/System%20Design/src/models/MonthlySummary.ts) (Unique compound index: `{ userId: 1, month: 1, year: 1 }`, chunk subdocuments).
* **Files**: `src/modules/summaries/` ([weeklySummary.service.ts](file:///d:/SEM_7/System%20Design/src/modules/summaries/weeklySummary.service.ts), [monthlySummary.service.ts](file:///d:/SEM_7/System%20Design/src/modules/summaries/monthlySummary.service.ts), [summaries.controller.ts](file:///d:/SEM_7/System%20Design/src/modules/summaries/summaries.controller.ts), [summaries.routes.ts](file:///d:/SEM_7/System%20Design/src/modules/summaries/summaries.routes.ts), [summaries.dto.ts](file:///d:/SEM_7/System%20Design/src/modules/summaries/summaries.dto.ts))
* **Endpoints**:
  * Weekly: `GET /summaries/weekly?weekStart=`, `POST /summaries/weekly/generate`, `POST /summaries/weekly/:id/regenerate`, `PATCH /summaries/weekly/:id`, `GET /summaries/weekly/list`.
  * Monthly: `GET /summaries/monthly?month=&year=`, `POST /summaries/monthly/generate`, `POST /summaries/monthly/:id/regenerate`, `PATCH /summaries/monthly/:id`, `GET /summaries/monthly/list`.

### Phase 7: Yearly Reports & Version Control Module
* **Model**: [YearlyReport.ts](file:///d:/SEM_7/System%20Design/src/models/YearlyReport.ts) (Unique compound index: `{ userId: 1, year: 1, version: 1 }`).
* **Files**: `src/modules/reports/` ([yearlyReport.service.ts](file:///d:/SEM_7/System%20Design/src/modules/reports/yearlyReport.service.ts), [yearlyReport.controller.ts](file:///d:/SEM_7/System%20Design/src/modules/reports/yearlyReport.controller.ts), [reports.routes.ts](file:///d:/SEM_7/System%20Design/src/modules/reports/reports.routes.ts), [yearlyReport.dto.ts](file:///d:/SEM_7/System%20Design/src/modules/reports/yearlyReport.dto.ts))
* **Features**:
  * 8-Section performance report generation (`executiveSummary`, `majorContributions`, `technicalWork`, `skillsDemonstrated`, `projects`, `achievedGoals`, `learningAndDevelopment`, `overallYearSummary`).
  * Section-level editing and regeneration.
  * Report finalization and immutable version archiving (preventing edits to finalized versions).
  * Version history retrieval.
* **Endpoints**:
  * `GET /reports/yearly/:year/availability`
  * `POST /reports/yearly/:year/generate`
  * `GET /reports/yearly/:year`
  * `PATCH /reports/yearly/:year/section/:name`
  * `POST /reports/yearly/:year/section/:name/regenerate`
  * `POST /reports/yearly/:year/finalize`
  * `GET /reports/yearly/:year/versions`

---

## 3. Complete Master API Endpoint Reference Table

| Module | Method | Endpoint | Auth Required | Description |
|---|---|---|---|---|
| **System** | `GET` | `/health` | No | Service health check |
| **Auth** | `POST` | `/auth/signup` | No | User registration & token generation |
| **Auth** | `POST` | `/auth/login` | No | Credential verification & token issue |
| **Auth** | `POST` | `/auth/refresh` | No | Refresh token rotation |
| **Auth** | `POST` | `/auth/logout` | No | Token revocation |
| **Profile** | `GET` | `/profile` | Yes | Get authenticated user profile |
| **Profile** | `POST` | `/profile/setup` | Yes | First-time profile setup |
| **Profile** | `PATCH` | `/profile` | Yes | Partial profile update |
| **Activities** | `POST` | `/activities` | Yes | Create work activity log |
| **Activities** | `GET` | `/activities` | Yes | List & filter activities (pagination, search) |
| **Activities** | `GET` | `/activities/:id` | Yes | Get single activity |
| **Activities** | `PATCH` | `/activities/:id` | Yes | Update activity |
| **Activities** | `DELETE`| `/activities/:id` | Yes | Delete activity |
| **Activities** | `POST` | `/activities/:id/improve` | Yes | AI suggestion for work entry |
| **Goals** | `POST` | `/achieved-goals` | Yes | Create milestone accomplishment |
| **Goals** | `GET` | `/achieved-goals` | Yes | List goals with populated activities |
| **Goals** | `GET` | `/achieved-goals/:id` | Yes | Get single goal with activities |
| **Goals** | `PATCH` | `/achieved-goals/:id` | Yes | Update goal |
| **Goals** | `DELETE`| `/achieved-goals/:id` | Yes | Delete goal |
| **Goals** | `POST` | `/achieved-goals/:id/link-activities` | Yes | Link activity IDs to goal (`$addToSet`) |
| **Insights** | `GET` | `/insights/overview` | Yes | Monthly activity histogram & top skills aggregations |
| **Insights** | `GET` | `/insights/ai` | Yes | AI insights narrative & strengths analysis |
| **Summaries** | `GET` | `/summaries/weekly` | Yes | Get weekly summary by `weekStart` |
| **Summaries** | `POST` | `/summaries/weekly/generate` | Yes | Generate/upsert weekly summary |
| **Summaries** | `POST` | `/summaries/weekly/:id/regenerate` | Yes | Re-synthesize weekly summary |
| **Summaries** | `PATCH` | `/summaries/weekly/:id` | Yes | Edit weekly summary (sets status='edited') |
| **Summaries** | `GET` | `/summaries/weekly/list` | Yes | List weekly summaries (paginated) |
| **Summaries** | `GET` | `/summaries/monthly` | Yes | Get monthly summary by `month` and `year` |
| **Summaries** | `POST` | `/summaries/monthly/generate` | Yes | Generate/upsert monthly summary & chunks |
| **Summaries** | `POST` | `/summaries/monthly/:id/regenerate` | Yes | Re-synthesize monthly summary |
| **Summaries** | `PATCH` | `/summaries/monthly/:id` | Yes | Edit monthly summary |
| **Summaries** | `GET` | `/summaries/monthly/list` | Yes | List monthly summaries (paginated) |
| **Reports** | `GET` | `/reports/yearly/:year/availability` | Yes | Check readiness/volume before generating report |
| **Reports** | `POST` | `/reports/yearly/:year/generate` | Yes | Generate 8-section yearly report draft |
| **Reports** | `GET` | `/reports/yearly/:year` | Yes | Retrieve active report draft or final report |
| **Reports** | `PATCH` | `/reports/yearly/:year/section/:name` | Yes | Edit specific report section |
| **Reports** | `POST` | `/reports/yearly/:year/section/:name/regenerate` | Yes | Regenerate specific section |
| **Reports** | `POST` | `/reports/yearly/:year/finalize` | Yes | Lock report to 'final' status and archive version |
| **Reports** | `GET` | `/reports/yearly/:year/versions` | Yes | List all report versions and drafts for year |

---

## 4. Automated Postman Testing Suite

### Files:
* **Collection**: [Activity_Tracker_API.postman_collection.json](file:///d:/SEM_7/System%20Design/postman/Activity_Tracker_API.postman_collection.json)
* **Environment**: [Auth_and_Profile.postman_environment.json](file:///d:/SEM_7/System%20Design/postman/Auth_and_Profile.postman_environment.json)

### Tested Flows:
1. **Positive Happy Path**:
   - Health check ➜ Dynamic user signup ➜ Token issue & storage ➜ Profile onboarding setup ➜ Activity logging (Technical & Feature) ➜ Milestone creation & activity linking ➜ MongoDB Aggregation execution (Overview & AI narrative) ➜ Weekly & Monthly summary generation ➜ 8-section Yearly report synthesis ➜ Section editing & regeneration ➜ Report finalization.
2. **Alternative & Negative Flows**:
   - Validation failure handling (`400 Bad Request` for invalid month query > 12).
   - Finalized report mutation protection (`400 Bad Request` when attempting to edit a locked final report).
   - Deleted entity verification (`404 Not Found`).
   - Revoked token rejection (`401 Unauthorized` after logout).
