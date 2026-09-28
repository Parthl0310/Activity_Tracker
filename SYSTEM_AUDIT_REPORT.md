# Senior Developer End-to-End System Audit: Frontend & Backend Flow Analysis

**Audit Date:** September 2026  
**Auditor:** Senior Staff Software Architect  
**Scope:** Full line-by-line inspection of Frontend (`frontend/src/`) and Backend (`backend/src/`), covering models, DTOs, controllers, services, store hooks, routing, components, and user flows against the requirements in [README-MONGODB.md](file:///d:/SEM_7/System%20Design/activity_tracker/README-MONGODB.md) and [AI-MODEL-README.md](file:///d:/SEM_7/System%20Design/activity_tracker/AI-MODEL-README.md).

---

## 1. Executive Summary

A comprehensive line-by-line code audit revealed **16 distinct bugs and flow breakdowns** across the frontend and backend integration surface:
- **Critical Severity (4 Bugs):** Uncaught runtime crashes (`TypeError`, `CastError`, Zod validation rejections) that break core page renders or prevent saving records.
- **High Severity (5 Bugs):** Data loss and model desynchronization where data sent by the user is silently dropped by MongoDB, or where core features are completely disconnected between UI and API.
- **Medium Severity (4 Bugs):** State desynchronization, reload fallbacks causing accidental edits to mock records, and timezone shift rejections.
- **Low / Polish Severity (3 Bugs):** Orphaned database models, hardcoded filter labels, and UI default value overrides.

---

## 2. Complete Error Matrix

| # | Severity | Flow / Area | File & Line | Bug / Defect Summary | Impact |
|---|---|---|---|---|---|
| **1** | **CRITICAL** | Records / Search Filter | [activityStore.ts:190](file:///d:/SEM_7/System%20Design/activity_tracker/frontend/src/store/activityStore.ts#L190) | `act.title.toLowerCase()` throws `TypeError` | Instant crash / blank screen whenever user types in the search bar. |
| **2** | **CRITICAL** | Achieved Goals Creation | [AddAchievedGoalPage.tsx:16](file:///d:/SEM_7/System%20Design/activity_tracker/frontend/src/pages/goals/AddAchievedGoalPage.tsx#L16)<br>[achievedGoals.dto.ts:18](file:///d:/SEM_7/System%20Design/activity_tracker/backend/src/modules/achievedGoals/achievedGoals.dto.ts#L18) | Default `selectedActivityIds` set to `['act_001', 'act_002']` | Form submission fails 100% of the time with `Invalid ObjectId format` (400 Bad Request). |
| **3** | **CRITICAL** | Achieved Goals List | [AchievedGoalsListPage.tsx:86](file:///d:/SEM_7/System%20Design/activity_tracker/frontend/src/pages/goals/AchievedGoalsListPage.tsx#L86) | Unchecked `g.relatedActivityIds.length` in reducer | If any goal has null/undefined array, whole page crashes with `TypeError`. |
| **4** | **CRITICAL** | Activity Date Validation | [activities.dto.ts:6](file:///d:/SEM_7/System%20Design/activity_tracker/backend/src/modules/activities/activities.dto.ts#L6)<br>[activities.dto.ts:23](file:///d:/SEM_7/System%20Design/activity_tracker/backend/src/modules/activities/activities.dto.ts#L23) | `date <= new Date()` rejects same-day activities due to UTC timezone offset | Users logging same-day work in ahead timezones (e.g. IST +05:30) get rejected with "Future dates are not allowed". |
| **5** | **HIGH** | Achieved Goal Schema | [AchievedGoal.ts:14-43](file:///d:/SEM_7/System%20Design/activity_tracker/backend/src/models/AchievedGoal.ts#L14-L43)<br>[achievedGoals.dto.ts:10-19](file:///d:/SEM_7/System%20Design/activity_tracker/backend/src/modules/achievedGoals/achievedGoals.dto.ts#L10-L19) | Schema & DTO omit `project`, `keyOutcomes`, `category`, `impactScore` | Submitting a goal silently drops project & outcomes in MongoDB; cards display fallback mock data. |
| **6** | **HIGH** | Work Details Direct Nav | [WorkDetailsPage.tsx:22-38](file:///d:/SEM_7/System%20Design/activity_tracker/frontend/src/pages/records/WorkDetailsPage.tsx#L22-L38) | Page falls back to hardcoded mock record `act_002` if store isn't populated | Refreshing `/records/:id` loads fake "Fixed checkout payment bug" data instead of calling API `getById`. |
| **7** | **HIGH** | AI Insights Page | [InsightsPage.tsx:11-43](file:///d:/SEM_7/System%20Design/activity_tracker/frontend/src/pages/insights/InsightsPage.tsx#L11-L43) | Disconnected from `GET /insights/overview` & `GET /insights/ai` | Insights page calculates two tiny client-side arrays and completely ignores the backend AI generation engine. |
| **8** | **HIGH** | Yearly Report UI | [ReportsPage.tsx:216-230](file:///d:/SEM_7/System%20Design/activity_tracker/frontend/src/pages/reports/ReportsPage.tsx#L216-L230) | Only 4 of 8 sections rendered; missing UI for Regenerate, Edit, & Finalize | Backend supports isolated regeneration, section editing, and finalization, but frontend has no buttons or forms for them. |
| **9** | **HIGH** | RAG Assistant Frontend | [apiClient.ts:88](file:///d:/SEM_7/System%20Design/activity_tracker/frontend/src/services/apiClient.ts#L88)<br>[Navbar.tsx:48](file:///d:/SEM_7/System%20Design/activity_tracker/frontend/src/components/layout/Navbar.tsx#L48) | RAG Assistant (`POST /assistant/ask` or `POST /search/ask`) has no UI trigger | Employee cannot ask questions to the RAG assistant from the web app; search bar only does MongoDB regex matching. |
| **10** | **MEDIUM** | Activity Title Field | [Activity.ts:40-96](file:///d:/SEM_7/System%20Design/activity_tracker/backend/src/models/Activity.ts#L40-L96)<br>[WorkEntryCard.tsx:49](file:///d:/SEM_7/System%20Design/activity_tracker/frontend/src/components/activities/WorkEntryCard.tsx#L49) | Backend has no `title` field, while frontend cards render `{activity.title}` | Work cards display empty headers; editing `title` in `WorkDetailsPage` is silently dropped by backend. |
| **11** | **MEDIUM** | Auth Error Interceptor | [apiClient.ts:28-56](file:///d:/SEM_7/System%20Design/activity_tracker/frontend/src/services/apiClient.ts#L28-L56)<br>[authStore.ts:146](file:///d:/SEM_7/System%20Design/activity_tracker/frontend/src/store/authStore.ts#L146) | Interceptor rejects with `error.response?.data`; store checks `error?.response?.status` | Failed profile fetches don't clear corrupted localStorage tokens because `error.response` is already stripped. |
| **12** | **MEDIUM** | Logout Route Rejection | [auth.service.ts:146](file:///d:/SEM_7/System%20Design/activity_tracker/backend/src/modules/auth/auth.service.ts#L146)<br>[apiClient.ts:67](file:///d:/SEM_7/System%20Design/activity_tracker/frontend/src/services/apiClient.ts#L67) | Backend `logout()` throws 400 if `rawRefreshToken` is missing; frontend sends empty body | Calling `logout()` triggers console warnings and backend 400 errors if cookie is absent or cross-origin. |
| **13** | **MEDIUM** | Weekly/Monthly Date Query | [weeklySummary.service.ts:15-18](file:///d:/SEM_7/System%20Design/activity_tracker/backend/src/modules/summaries/weeklySummary.service.ts#L15-L18) | Local `setHours(0,0,0,0)` shifts UTC timestamps for date-range queries | Summaries saved at UTC midnight fail exact lookup on servers running non-UTC local timezones. |
| **14** | **LOW** | Profile Setup Defaults | [ProfileSetupPage.tsx:12-17](file:///d:/SEM_7/System%20Design/activity_tracker/frontend/src/pages/onboarding/ProfileSetupPage.tsx#L12-L17) | Pre-fills mock engineer values ("Senior Backend Engineer", "Engineering") | New users signing up with empty roles see hardcoded demo data instead of clean inputs. |
| **15** | **LOW** | Dashboard Greeting Initials | [DashboardPage.tsx:85](file:///d:/SEM_7/System%20Design/activity_tracker/frontend/src/pages/dashboard/DashboardPage.tsx#L85) | Header greets `Good morning, {initials}` instead of `{firstName}` | Renders "Good morning, KD 👋" instead of "Good morning, Kavya 👋". |
| **16** | **LOW** | Orphaned Notification Model | [Notification.ts](file:///d:/SEM_7/System%20Design/activity_tracker/backend/src/models/Notification.ts)<br>[notificationStore.ts](file:///d:/SEM_7/System%20Design/activity_tracker/frontend/src/store/notificationStore.ts) | Backend `Notification` model is never instantiated or exposed via routes | Notifications in the top navigation bell exist purely in ephemeral frontend memory and vanish on refresh. |

---

## 3. Detailed Line-by-Line Breakdown & Senior Developer Solutions

### Defect 1: Instant Search Filter Crash on Title
- **Location:** [activityStore.ts:189-196](file:///d:/SEM_7/System%20Design/activity_tracker/frontend/src/store/activityStore.ts#L189-L196)
- **Root Cause:**
  ```typescript
  // frontend/src/store/activityStore.ts
  if (filter.searchQuery.trim()) {
    const query = filter.searchQuery.toLowerCase();
    const matchesTitle = act.title.toLowerCase().includes(query); // CRASHES: act.title is undefined!
  ```
  In MongoDB, the `Activity` schema has `text`, `aiRefinedText`, and `project`, but **no `title`**. `act.title` is therefore `undefined`, causing an unhandled `TypeError: Cannot read properties of undefined (reading 'toLowerCase')`.
- **Senior Developer Fix:**
  Safely derive or guard the title:
  ```typescript
  const title = act.title || act.project || act.text.slice(0, 50);
  const matchesTitle = title.toLowerCase().includes(query);
  ```

---

### Defect 2: Achieved Goal Creation 100% Broken by Hardcoded Dummy IDs
- **Location:** [AddAchievedGoalPage.tsx:16](file:///d:/SEM_7/System%20Design/activity_tracker/frontend/src/pages/goals/AddAchievedGoalPage.tsx#L16), [achievedGoals.dto.ts:18](file:///d:/SEM_7/System%20Design/activity_tracker/backend/src/modules/achievedGoals/achievedGoals.dto.ts#L18)
- **Root Cause:**
  ```typescript
  // frontend/src/pages/goals/AddAchievedGoalPage.tsx
  const [selectedActivityIds, setSelectedActivityIds] = useState<string[]>(['act_001', 'act_002']);
  ```
  `'act_001'` and `'act_002'` are not valid 24-character hexadecimal MongoDB ObjectIds.
  When submitted, the backend Zod validator rejects it immediately:
  ```typescript
  // backend/src/modules/achievedGoals/achievedGoals.dto.ts
  relatedActivityIds: z.array(objectIdValidator).optional().default([]),
  ```
- **Senior Developer Fix:**
  1. Set initial state to empty array: `useState<string[]>([])`.
  2. In `achievedGoals.service.ts`, sanitize and ignore invalid string IDs before querying Mongoose.

---

### Defect 3: Reducer TypeError Crash on Achieved Goals Page
- **Location:** [AchievedGoalsListPage.tsx:86](file:///d:/SEM_7/System%20Design/activity_tracker/frontend/src/pages/goals/AchievedGoalsListPage.tsx#L86)
- **Root Cause:**
  ```typescript
  {goals.reduce((acc, g) => acc + g.relatedActivityIds.length, 0)} Logs
  ```
  If any goal record from the database has `relatedActivityIds` as `undefined` or null, reading `.length` uncaught throws a fatal runtime exception.
- **Senior Developer Fix:**
  Use optional chaining with fallback:
  ```typescript
  {goals.reduce((acc, g) => acc + (g.relatedActivityIds?.length || 0), 0)} Logs
  ```

---

### Defect 4: Same-Day Activity Logging Blocked by Timezone Shifts
- **Location:** [activities.dto.ts:6](file:///d:/SEM_7/System%20Design/activity_tracker/backend/src/modules/activities/activities.dto.ts#L6), [activities.dto.ts:23](file:///d:/SEM_7/System%20Design/activity_tracker/backend/src/modules/activities/activities.dto.ts#L23)
- **Root Cause:**
  ```typescript
  workDate: z.string().or(z.date()).transform((val) => new Date(val)).refine(date => date <= new Date(), { message: 'Future dates are not allowed' })
  ```
  When a user in India (UTC+5:30) logs today's work at 8:00 AM, `new Date("2026-09-21")` is evaluated. If the client or server creates an ISO string representing local end-of-day or timezone offset, comparing strictly against `new Date()` (the current second in UTC) flags same-day work as "in the future".
- **Senior Developer Fix:**
  Allow dates through the end of the current local day:
  ```typescript
  .refine((date) => {
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    return date <= endOfToday;
  }, { message: 'Future dates are not allowed' })
  ```

---

### Defect 5: Achieved Goal Data Loss (Project & Outcomes Stripped)
- **Location:** [AchievedGoal.ts:14-43](file:///d:/SEM_7/System%20Design/activity_tracker/backend/src/models/AchievedGoal.ts#L14-L43), [achievedGoals.dto.ts:10-19](file:///d:/SEM_7/System%20Design/activity_tracker/backend/src/modules/achievedGoals/achievedGoals.dto.ts#L10-L19)
- **Root Cause:**
  `AddAchievedGoalPage.tsx` allows the user to input `project`, `keyOutcomes`, and `category`. However:
  1. `CreateAchievedGoalDto` does not define these fields.
  2. Mongoose's `AchievedGoalSchema` does not define these fields.
  Because Mongoose runs in strict mode, it silently strips `project` and `keyOutcomes` on `AchievedGoal.create()`. When viewed later on `GoalCard.tsx`, `goal.project` falls back to `'Payment System'`, and deliverables are lost.
- **Senior Developer Fix:**
  Add `project: { type: String, trim: true, default: '' }`, `keyOutcomes: [{ type: String, trim: true }]`, and `category: { type: String, trim: true }` to both `AchievedGoal.ts` and `achievedGoals.dto.ts`.

---

### Defect 6: Refreshing Work Details Page Reverts to Dummy Mock Record
- **Location:** [WorkDetailsPage.tsx:22-38](file:///d:/SEM_7/System%20Design/activity_tracker/frontend/src/pages/records/WorkDetailsPage.tsx#L22-L38)
- **Root Cause:**
  ```typescript
  const activity = getActivityById(id || 'act_002') || {
    id: 'act_002',
    title: 'Fixed checkout payment bug',
    ...
  ```
  If a user opens `/records/:id` directly or presses F5, `useActivityStore` has not yet finished fetching all activities. `getActivityById(id)` returns `undefined`. Instead of showing a loader and fetching the record via `apiClient.activities.getById(id)`, the page silently falls back to the hardcoded mock object `'act_002'`. If the user edits or deletes, the app attempts to mutate `'act_002'`.
- **Senior Developer Fix:**
  Add a `useEffect` in `WorkDetailsPage.tsx` that checks if the activity is loaded; if not, calls `apiClient.activities.getById(id)` and renders a clean skeleton loader while fetching.

---

### Defect 7: Insights Page Disconnected from Backend AI Engine
- **Location:** [InsightsPage.tsx:11-43](file:///d:/SEM_7/System%20Design/activity_tracker/frontend/src/pages/insights/InsightsPage.tsx#L11-L43)
- **Root Cause:**
  The backend has two sophisticated endpoints:
  - `GET /insights/overview?year=...`: Aggregated monthly histograms, top skills, category distributions.
  - `GET /insights/ai?year=...`: AI-generated insights via Gemini (`strongestWorkArea`, `mostActiveProject`, `learningPattern`, `workPatternSummary`).
  `InsightsPage.tsx` never calls either endpoint. Furthermore, `apiClient.ts` lacks an `insights` service object entirely.
- **Senior Developer Fix:**
  1. Add `insights = { getOverview: (year) => ..., getAI: (year) => ... }` to `apiClient.ts`.
  2. Update `InsightsPage.tsx` to display real backend charts, histograms, and Gemini career recommendations.

---

### Defect 8: Reports Page Omits 4 Sections & Disconnects Regeneration/Editing
- **Location:** [ReportsPage.tsx:216-230](file:///d:/SEM_7/System%20Design/activity_tracker/frontend/src/pages/reports/ReportsPage.tsx#L216-L230)
- **Root Cause:**
  1. The UI only renders 4 sections (`executiveSummary`, `majorContributions`, `technicalWork`, `skillsDemonstrated`), leaving out `projects`, `learningAndDevelopment`, `achievedGoals`, and `overallYearSummary`.
  2. The backend provides `PUT /reports/yearly/:year/sections/:name` and `POST /reports/yearly/:year/sections/:name/regenerate`, but the UI provides no section edit modal, no single-section regenerate button, and no finalize button.
- **Senior Developer Fix:**
  1. Render all 8 sections with formatted Markdown / pre-wrap styling.
  2. Add section edit triggers and a single-section "Regenerate with AI" button leveraging `apiClient.reports`.

---

### Defect 9: RAG Assistant Has No UI Trigger in Web App
- **Location:** [Navbar.tsx:48](file:///d:/SEM_7/System%20Design/activity_tracker/frontend/src/components/layout/Navbar.tsx#L48), [apiClient.ts:88](file:///d:/SEM_7/System%20Design/activity_tracker/frontend/src/services/apiClient.ts#L88)
- **Root Cause:**
  While `POST /assistant/ask` was engineered and verified in the backend, the frontend search bar only triggers textual MongoDB regex searches (`apiClient.activities.getAll({ q })`). There is no modal, tab, or button where a user can enter natural language questions (e.g. *"What did I accomplish in Q2 for authentication?"*) to receive a RAG response with source citations.
- **Senior Developer Fix:**
  Add an "Ask AI Assistant" tab or modal in the search dropdown to call `apiClient.search.ask(query)` and display grounded answers alongside sources.

---

### Defect 10: Missing Title in Activity Schema Causes UI Inconsistencies
- **Location:** [Activity.ts:40-96](file:///d:/SEM_7/System%20Design/activity_tracker/backend/src/models/Activity.ts#L40-L96), [WorkEntryCard.tsx:49](file:///d:/SEM_7/System%20Design/activity_tracker/frontend/src/components/activities/WorkEntryCard.tsx#L49)
- **Root Cause:**
  The frontend UI displays `{activity.title}` on every work card, but the backend schema does not store `title`. When users edit the title in `WorkDetailsPage`, the backend silently drops it.
- **Senior Developer Fix:**
  Add optional `title?: string` to `Activity.ts` and `activities.dto.ts`. If not provided during creation, auto-populate it from the first 60 characters of the activity description.

---

### Defect 11: Response Interceptor Error Unwrapping Breaks Auth Clearing
- **Location:** [apiClient.ts:54](file:///d:/SEM_7/System%20Design/activity_tracker/frontend/src/services/apiClient.ts#L54), [authStore.ts:146](file:///d:/SEM_7/System%20Design/activity_tracker/frontend/src/store/authStore.ts#L146)
- **Root Cause:**
  ```typescript
  // apiClient.ts
  return Promise.reject(error.response?.data || error);
  ```
  The interceptor rejects with `error.response.data`.
  In `authStore.ts`:
  ```typescript
  if (error?.response?.status === 401 || error?.response?.status === 403) {
    localStorage.removeItem('worklog_access_token');
  }
  ```
  `error.response` is already `undefined` because `error` is now the unwrapped response body! The condition evaluates to `false`, leaving expired/invalid tokens lingering in `localStorage`.
- **Senior Developer Fix:**
  Check both `error?.response?.status` and `error?.status || error?.statusCode === 401`.

---

### Defect 12: Logout Rejection When Cookie is Absent
- **Location:** [auth.service.ts:146-148](file:///d:/SEM_7/System%20Design/activity_tracker/backend/src/modules/auth/auth.service.ts#L146-L148)
- **Root Cause:**
  `authService.logout(rawRefreshToken)` throws `AppError('Refresh token is required', 400)` if no token is passed. If a user logs out from a client that only stored the access token or had the cookie cleared, the backend returns 400.
- **Senior Developer Fix:**
  Make `rawRefreshToken` optional on logout: if provided, revoke it from the database; if not provided, clear the cookie and respond with 200 OK.

---

### Defect 13: Timezone Shift in Weekly Summary Queries
- **Location:** [weeklySummary.service.ts:15-18](file:///d:/SEM_7/System%20Design/activity_tracker/backend/src/modules/summaries/weeklySummary.service.ts#L15-L18)
- **Root Cause:**
  `new Date(weekStart).setHours(0, 0, 0, 0)` modifies the date in local server time, not UTC. When queries are executed across varying server timezones, start boundaries desynchronize from stored UTC boundaries.
- **Senior Developer Fix:**
  Use UTC boundary helpers: `Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0)`.

---

### Defect 14: Profile Setup Auto-fills Demo Data
- **Location:** [ProfileSetupPage.tsx:12-17](file:///d:/SEM_7/System%20Design/activity_tracker/frontend/src/pages/onboarding/ProfileSetupPage.tsx#L12-L17)
- **Root Cause:**
  ```typescript
  const [formData, setFormData] = useState({
    name: user?.name || 'Kavya Deshmukh',
    jobRole: user?.jobRole || 'Senior Backend Engineer',
    department: user?.department || 'Engineering',
    reviewYear: user?.reviewYear || 2026,
  });
  ```
  Because `jobRole` and `department` default to empty strings `""` upon signup, the `||` operator evaluates to the mock strings. Every newly registered user sees "Kavya Deshmukh" / "Senior Backend Engineer" / "Engineering".
- **Senior Developer Fix:**
  Use empty strings as fallbacks: `user?.jobRole ?? ''`.

---

### Defect 15: Header Greets with Initials Instead of Name
- **Location:** [DashboardPage.tsx:85](file:///d:/SEM_7/System%20Design/activity_tracker/frontend/src/pages/dashboard/DashboardPage.tsx#L85)
- **Root Cause:**
  `DashboardPage.tsx` computes `const firstName = user?.name ? user.name.split(' ')[0] : 'Guest';` on line 25, but renders `{initials}` on line 85 ("Good morning, KD 👋").
- **Senior Developer Fix:**
  Replace `{initials}` with `{firstName}`.

---

### Defect 16: Orphaned Notification Database Model
- **Location:** [Notification.ts](file:///d:/SEM_7/System%20Design/activity_tracker/backend/src/models/Notification.ts)
- **Root Cause:**
  `Notification.ts` exists in the backend models directory but has no corresponding service, controller, or route. Frontend notifications are stored in a transient Zustand store in RAM and are wiped on refresh.
- **Senior Developer Fix:**
  Mount a lightweight `notifications.routes.ts` (`GET /notifications`, `PATCH /notifications/:id/read`), or persist frontend notifications to `localStorage`.
