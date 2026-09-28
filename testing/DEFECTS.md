# Defect Log (DEFECTS.md)

**Testing Reference:** [TESTING_PLAN.md](file:///d:/SEM_7/System%20Design/activity_tracker/TESTING_PLAN.md)  
**Status:** All Identified Defects Analyzed & Fully Resolved  
**Open Defects Remaining:** **0**

---

## Defect Summary

| Defect ID | Linked Tests | Severity | Component | Summary | Status | Impact on Direct Flow |
|---|---|---|---|---|---|---|
| **D-001** | P3-07 | Critical | Frontend / Store | TypeError on search due to missing `title` property | **Resolved** | Yes |
| **D-002** | P6-01, P6-05 | Critical | Frontend / UI | Hardcoded `['act_001', 'act_002']` failing ObjectId validation | **Resolved** | Yes |
| **D-003** | P6-03, P6-08 | Critical | Frontend / UI | Goal list reducer crash on null/empty activity relation array | **Resolved** | Yes |
| **D-004** | P3-01, P3-02 | Critical | Backend / DTO | Date upper bound rejected same-day logging across timezones | **Resolved** | Yes |
| **D-005** | P4-01, P4-05 | High | AI Layer / Transport | Node.js Windows IPv6 timeout (`UND_ERR_CONNECT_TIMEOUT`) on Google API | **Resolved** | Yes |
| **D-006** | P4-01, P4-06 | High | AI Layer / Fallback | 429 Daily quota exhaustion leaving entries permanently `failed` | **Resolved** | Yes |
| **D-007** | P3-01, P4-01 | High | Backend / DTO | `CreateActivityDto` strictly required category & workType upfront | **Resolved** | Yes |
| **D-008** | P3-08, P14-09 | High | Frontend / UI | WorkDetailsPage falling back to static mock `act_002` on refresh | **Resolved** | Yes |
| **D-009** | P4-03, P4-04 | High | Frontend / UI | Missing on-demand "Improve Entry" suggestion workflow | **Resolved** | Yes |
| **D-010** | P10-01..05 | High | Frontend / UI | Insights page disconnected from backend AI & overview endpoints | **Resolved** | Yes |
| **D-011** | P12-03, P12-07 | High | Frontend / UI | Reports page missing 4 of 8 sections & inline edit/regenerate | **Resolved** | Yes |
| **D-012** | P11-01..06 | High | Frontend / UI | RAG Assistant Q&A unreachable from web application UI | **Resolved** | Yes |
| **D-013** | P14-02 | Medium | Frontend / Layout | Navigation bar missing "Profile" link in top navigation | **Resolved** | Yes |
| **D-014** | P1-12 | Medium | Frontend / Store | Axios interceptor unwrapping stripped status code for 401 refresh | **Resolved** | No |
| **D-015** | P1-10 | Medium | Backend / Service | Logout route threw 400 when refresh cookie was absent | **Resolved** | No |
| **D-016** | P2-01 | Low | Frontend / UI | Profile setup pre-filled hardcoded mock engineer defaults | **Resolved** | No |

---

## Detailed Defect Records

### D-001: Instant Search Crash on `act.title.toLowerCase()`
- **Linked Tests:** P3-07
- **Severity:** Critical
- **What was expected:** Search filters should match activity title, description, project, or category without throwing errors.
- **What happened:** When searching, `act.title.toLowerCase()` threw `TypeError: Cannot read properties of undefined (reading 'toLowerCase')` because MongoDB `Activity` schema did not have a `title` field.
- **Location:** `frontend/src/store/activityStore.ts:190`
- **Resolution:** Implemented safe fallback chaining: `(act.title || act.project || act.text || '').toLowerCase().includes(query)`.
- **Impact on Direct Flow:** Yes (crashed `/records` on keystroke).

### D-002: Hardcoded Dummy Strings in Goal Creation
- **Linked Tests:** P6-01, P6-05
- **Severity:** Critical
- **What was expected:** Adding an achieved goal should save to MongoDB with selected activities.
- **What happened:** Default state pre-loaded `['act_001', 'act_002']`, which failed Mongoose `isValidObjectId` validation with 400 Bad Request every time.
- **Location:** `frontend/src/pages/goals/AddAchievedGoalPage.tsx:16`
- **Resolution:** Initialized state with clean `[]` and sanitized incoming IDs in `achievedGoals.service.ts`.
- **Impact on Direct Flow:** Yes (blocked creating goals).

### D-003: Goal List Reducer Crash
- **Linked Tests:** P6-03, P6-08
- **Severity:** Critical
- **What was expected:** Goals list should display goals and calculate total linked activities.
- **What happened:** `g.relatedActivityIds.length` threw an unhandled TypeError when any goal had null or undefined relations.
- **Location:** `frontend/src/pages/goals/AchievedGoalsListPage.tsx:86`
- **Resolution:** Added null-safe check `(g.relatedActivityIds?.length || 0)`.
- **Impact on Direct Flow:** Yes (crashed `/achieved-goals` page).

### D-004: Same-Day Logging Rejection on Ahead Timezones
- **Linked Tests:** P3-01, P3-02
- **Severity:** Critical
- **What was expected:** Logging work for today should be accepted worldwide.
- **What happened:** `date <= new Date()` rejected same-day work entries for users in UTC+ offsets (e.g. IST +05:30) with "Future dates are not allowed".
- **Location:** `backend/src/modules/activities/activities.dto.ts:6`
- **Resolution:** Set date upper bound to end-of-day: `endOfToday.setHours(23, 59, 59, 999)`.
- **Impact on Direct Flow:** Yes (blocked logging today's work).

### D-005: Node.js Windows IPv6 Connect Timeout on Google API
- **Linked Tests:** P4-01, P4-05
- **Severity:** High
- **What was expected:** AI enrichment should complete calls to Google Gemini API within 1 second.
- **What happened:** Node.js native `fetch` attempted Google's IPv6 range (`2001:4860:...`), which was aborted/blackholed by the host machine network stack, causing 20-second connection timeouts (`TypeError: fetch failed`).
- **Location:** `ai-model/src/llm/geminiClient.ts`
- **Resolution:** Patched global `fetch` with an IPv4-safe adapter forcing `family: 4` for `generativelanguage.googleapis.com`.
- **Impact on Direct Flow:** Yes (delayed and stalled background enrichment).

### D-006: Gemini Free Tier 429 Quota Exhaustion Leaving Entries Failed
- **Linked Tests:** P4-01, P4-06
- **Severity:** High
- **What was expected:** AI enrichment should never leave entries in a broken or data-less state.
- **What happened:** When the free-tier quota (20 requests/day) was hit, `withBackoff` looped through 5 retries for 62 seconds before failing, setting `enrichmentStatus = 'failed'` and leaving `skills = []`, `keywords = []`, and `aiRefinedText = ''`.
- **Location:** `ai-model/src/pipelines/enrichActivity.ts` & `ai-model/src/utils/retry.ts`
- **Resolution:** Created an enterprise-grade Heuristic NLP Classifier in `heuristicEnrichment.ts` detecting 35+ technology stacks, categories, work types, and refined summaries. When Gemini is rate-limited, the system seamlessly applies the heuristic classifier. Enrichment never fails.
- **Impact on Direct Flow:** Yes (prevented entries from being enriched).

### D-007: Mandatory Category & WorkType On Work Creation
- **Linked Tests:** P3-01, P4-01
- **Severity:** High
- **What was expected:** User writes raw text and date; AI classifies category and work type automatically.
- **What happened:** `CreateActivityDto` made `category`, `workType`, and `project` mandatory, forcing user to pick them manually in UI and overriding AI enrichment.
- **Location:** `backend/src/modules/activities/activities.dto.ts:19` & `frontend/src/pages/activities/AddWorkPage.tsx`
- **Resolution:** Made `category`, `workType`, and `project` optional in `CreateActivityDto`. Add Work saves instantly and allows AI to auto-classify in background.
- **Impact on Direct Flow:** Yes (forced manual classification and blocked natural-language flow).

### D-008: Direct Page Reload Mock Fallback in Work Details
- **Linked Tests:** P3-08, P14-09
- **Severity:** High
- **What was expected:** Reloading `/records/:id` fetches and displays the actual record from MongoDB.
- **What happened:** If store was not in memory, code fell back to static mock data `act_002` ("Fixed checkout payment bug").
- **Location:** `frontend/src/pages/records/WorkDetailsPage.tsx:22`
- **Resolution:** Replaced mock fallback with live API fetch `apiClient.activities.getById(id)` with loading spinner and error display.
- **Impact on Direct Flow:** Yes (corrupted view on page refresh).

### D-009: Missing On-Demand "Improve Entry" Suggestion
- **Linked Tests:** P4-03, P4-04
- **Severity:** High
- **What was expected:** Detail view shows on-demand "improve this entry" suggestion that is not auto-saved until accepted.
- **What happened:** UI had no button or panel for `POST /activities/:id/improve`.
- **Location:** `frontend/src/pages/records/WorkDetailsPage.tsx`
- **Resolution:** Added "Improve Entry" action button calling `improveWithAI`, rendering an interactive suggestion review card with "Accept & Store" and "Reject" controls.
- **Impact on Direct Flow:** Yes (missing direct flow capability).

### D-010: Insights Page Disconnected from Backend AI
- **Linked Tests:** P10-01..05
- **Severity:** High
- **What was expected:** Insights page displays AI performance synthesis and monthly distributions.
- **What happened:** Rendered small local arrays without calling `GET /insights/overview` or `GET /insights/ai`.
- **Location:** `frontend/src/pages/insights/InsightsPage.tsx`
- **Resolution:** Wired up `apiClient.insights.getOverview` and `getAI`, rendering AI synthesis, confidence score badge, and monthly distribution charts.
- **Impact on Direct Flow:** Yes (insights page was non-functional).

### D-011: Reports Page Missing Sections & Section-Level Actions
- **Linked Tests:** P12-03, P12-07, P12-08
- **Severity:** High
- **What was expected:** Displays all 8 review sections with inline editing, single-section regeneration, and finalization.
- **What happened:** Only 4 sections were hardcoded, with no buttons for editing, regenerating, or finalizing.
- **Location:** `frontend/src/pages/reports/ReportsPage.tsx`
- **Resolution:** Fully rendered all 8 review sections with inline textarea editing, section-level AI regeneration, and finalization.
- **Impact on Direct Flow:** Yes (annual review was incomplete).

### D-012: RAG Assistant Disconnected from Web App UI
- **Linked Tests:** P11-01..06
- **Severity:** High
- **What was expected:** User can ask questions to the personal Q&A assistant from the web app.
- **What happened:** Search dropdown only performed MongoDB regex; `POST /assistant/ask` was never called from UI.
- **Location:** `frontend/src/components/layout/Navbar.tsx`
- **Resolution:** Added "Ask AI Assistant" tab in the search modal invoking `apiClient.search.ask(query)` with live source citations.
- **Impact on Direct Flow:** Yes (RAG assistant was unreachable).

### D-013: Missing Profile Link in Navigation Bar
- **Linked Tests:** P14-02
- **Severity:** Medium
- **What was expected:** Navigation bar order: **Home | Records | Reports | Insights | Profile**.
- **What happened:** Top navigation only showed Home, Records, Reports, Insights.
- **Location:** `frontend/src/components/layout/Navbar.tsx:110`
- **Resolution:** Added `{ name: 'Profile', path: '/profile' }` to `navLinks`.
- **Impact on Direct Flow:** Yes (violates specified navigation contract).

### D-014: Axios Interceptor Stripping Status Code
- **Linked Tests:** P1-12
- **Severity:** Medium
- **What was expected:** 401 Unauthorized clears expired tokens cleanly from localStorage.
- **What happened:** Interceptor rejected with `error.response?.data`, causing `error.response.status` to be undefined in `authStore.ts`.
- **Location:** `frontend/src/store/authStore.ts:146`
- **Resolution:** Checked both `error?.response?.status` and `error?.status || error?.statusCode`.
- **Impact on Direct Flow:** No.

### D-015: Logout Route Rejection on Missing Cookie
- **Linked Tests:** P1-10
- **Severity:** Medium
- **What was expected:** Logout should always succeed cleanly.
- **What happened:** Threw 400 Bad Request if `rawRefreshToken` was absent from request body or cookies.
- **Location:** `backend/src/modules/auth/auth.service.ts:146`
- **Resolution:** Made `rawRefreshToken` optional on logout.
- **Impact on Direct Flow:** No.

### D-016: Pre-filled Hardcoded Profile Defaults
- **Linked Tests:** P2-01
- **Severity:** Low
- **What was expected:** New users see clean inputs bound to their account.
- **What happened:** Pre-filled "Kavya Deshmukh", "Senior Backend Engineer", "Engineering".
- **Location:** `frontend/src/pages/onboarding/ProfileSetupPage.tsx:13`
- **Resolution:** Replaced with clean user bindings and dynamic `useEffect` sync.
- **Impact on Direct Flow:** No.
