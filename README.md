# 🚀 WorkLog AI — Continuous Activity Tracking & AI Performance Appraisal System

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React 19](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)](https://expressjs.com/)
[![MongoDB Atlas](https://img.shields.io/badge/MongoDB_Atlas-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini_3.1_Flash-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://aistudio.google.com/)
[![Pinecone Vector DB](https://img.shields.io/badge/Pinecone_Vector_DB-000000?style=for-the-badge)](https://www.pinecone.io/)
[![BullMQ & Redis](https://img.shields.io/badge/BullMQ_%26_Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://bullmq.io/)
[![Vercel Serverless](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)

> **WorkLog AI** is an AI-native engineering productivity and appraisal platform designed to solve performance review anxiety. It automatically transforms raw, unstructured daily engineering logs into executive-ready accomplishments with quantified business impact, maintaining a grounded semantic vector memory of your work and auto-generating multi-version performance appraisals with one-click PDF export.

---

## 📌 Table of Contents
- [The Problem It Solves](#-the-problem-it-solves)
- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Monorepo Structure](#-monorepo-structure)
- [Tech Stack](#-tech-stack)
- [REST API Reference](#-rest-api-reference)
- [Getting Started Locally](#-getting-started-locally)
- [Environment Variables](#-environment-variables)
- [Deployment on Vercel](#-deployment-on-vercel)

---

## 🎯 The Problem It Solves

Engineering evaluations and annual performance reviews are fundamentally broken:
- **The Recency Bias & Memory Trap**: Engineers spend hundreds of hours solving complex bugs, optimizing architectures, and delivering features. Yet when appraisal season arrives, they scramble through closed Jira tickets, merged PRs, and Slack threads trying to remember what they accomplished 8 months ago.
- **Unstructured Raw Notes**: Engineers rarely have time to write formal progress updates daily. Raw notes like *"fixed auth timeout and tuned redis query"* fail to convey actual business value to engineering managers and executive leadership.
- **Subjective Appraisals**: Writing annual self-evaluations is stressful, manual, and time-consuming.

**WorkLog AI eliminates this friction** by capturing daily progress in seconds, using LLM pipelines to upgrade notes into executive-ready accomplishments, indexing historical contributions into a vector database for semantic recall, and auto-synthesizing comprehensive appraisal reports.

---

## ✨ Key Features

### 1. ⚡ Instant Daily Logging & Real-Time AI Enrichment
- Log daily work in seconds with minimal text input.
- **1-Click AI Improvement (Google Gemini 3.1 Flash)**: Automatically refactors raw notes into bulleted accomplishments with architectural context, quantified metrics (e.g., latency reduction, throughput gains), and KPI alignment.
- Auto-categorizes entries into categories (*Feature Work*, *Bug Fixes*, *DevOps/Infra*, *Refactoring*, *Code Review*).

### 2. 🧠 Grounded RAG Assistant & Semantic Work Search
- **Dense Vector Search**: Every saved activity is automatically embedded into a 384-dimensional dense vector using `@xenova/transformers` (`all-MiniLM-L6-v2`) and upserted to **Pinecone Vector Database**.
- **Interactive Natural-Language AI Assistant**: Ask questions in plain English (*"What security and caching improvements did I ship in Q2?"*).
- **Zero Hallucination Guarantee**: Answers are generated strictly from retrieved vector context, complete with clickable citations referencing exact dates and projects.

### 3. 📊 Interactive 12-Month Contribution Heatmap & Analytics
- Visual GitHub-style contribution calendar displaying daily intensity, active streaks, and monthly velocity across the full year.
- Interactive date filtering, category distribution breakdown, and quarterly progress indicators.

### 4. 📑 Automated Appraisal Engine & Multi-Draft Version Merging
- **Multi-Period Reports**: Auto-generate **Weekly Snippets**, **Monthly Summaries**, and comprehensive **Annual Performance Reviews**.
- **Draft Comparison & Version Merging**: Generate multiple draft iterations, compare diffs side-by-side, and combine sections (Executive Summary, Technical Innovations, Leadership & Mentorship) into a final consolidated appraisal.
- **Locking & Archival**: Lock final versions to prevent accidental modifications or deletions.
- **Executive PDF Export**: Print or export formal, styled evaluation documents with executive headers and skills badges.

### 5. 🎯 Quarterly Goal Alignment (OKRs)
- Define quarterly engineering goals and track active progress against logged activities and completed milestones.

### 6. 📱 100% Mobile & Desktop Responsive Design
- Crafted with modern warm-amber glassmorphism aesthetics (`#7C4D2E`, `#C8874A`).
- Fluid touch-swiping tab bars, mobile navigation drawer, and adaptive 2x2 metric grids optimized for screens from 320px to 4K displays.

---

## 🏛️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Client Tier (React 19)                        │
│  - Vite SPA + TypeScript + Zustand + React Query                        │
│  - 100% Responsive Glassmorphic UI (Mobile Drawer, Heatmap, Modals)     │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ HTTPS / REST (JWT Bearer)
┌────────────────────────────────────▼────────────────────────────────────┐
│                    API Gateway & Application Tier                       │
│                    (Node.js / Express / Vercel Serverless)              │
│  - Dual-Token Auth (Access / Refresh Token Rotation)                   │
│  - Activity, Goal, Profile & Report Controllers                         │
│  - Connection Pooling with MongoDB Atlas                                │
└──────────────────┬─────────────────┬───────────────────┬────────────────┘
                   │                 │                   │
                   ▼                 ▼                   ▼
       ┌──────────────────────┐ ┌───────────────┐ ┌──────────────────────┐
       │   MongoDB Atlas      │ │ Upstash Redis │ │ AI Package           │
       │   (Primary Database) │ │ & BullMQ      │ │ (@activity-tracker/ai)│
       │ - Users & Profiles   │ │ - Background  │ ├──────────────────────┤
       │ - Work Activities    │ │   Job Queue   │ │ • Google Gemini 3.1  │
       │ - Goals & Summaries  │ │ - Resilience  │ │ • Pinecone Vector DB │
       │ - Annual Reports     │ │   Worker      │ │ • Xenova Embeddings  │
       └──────────────────────┘ └───────────────┘ └──────────────────────┘
```

---

## 📂 Monorepo Structure

```
activity_tracker/
├── api/
│   └── index.js                 # Vercel Serverless Function entry point
├── backend/
│   ├── api/
│   │   └── index.js             # Standalone serverless handler
│   ├── src/
│   │   ├── config/              # Database, Redis, and Environment configs
│   │   ├── middleware/          # Auth guards, role validation, error handler
│   │   ├── models/              # Mongoose schemas (User, Activity, Goal, Report)
│   │   ├── modules/             # Controllers, routes, and services
│   │   │   ├── auth/            # Sign in, signup, token refresh
│   │   │   ├── activities/      # CRUD and filtering for logs
│   │   │   ├── achievedGoals/   # Milestone and OKR tracking
│   │   │   ├── reports/         # Annual report generation & draft merging
│   │   │   ├── summaries/       # Weekly & monthly aggregations
│   │   │   └── search/          # Semantic vector search & RAG assistant
│   │   ├── jobs/                # BullMQ queue & asynchronous workers
│   │   ├── app.ts               # Express app instance and routing
│   │   └── server.ts            # Local development server bootstrapper
│   ├── package.json
│   └── vercel.json
├── frontend/
│   ├── src/
│   │   ├── components/          # Reusable UI (Navbar, Calendar, Toast, Modals)
│   │   ├── pages/               # Dashboard, Records, Goals, Reports, Profile
│   │   ├── services/            # Axios API client with interceptors
│   │   ├── store/               # Zustand state stores (auth, activity, goals)
│   │   └── styles/              # Global responsive CSS & design tokens
│   ├── package.json
│   └── vercel.json              # SPA client routing rewrite rule
├── ai-model/
│   ├── src/
│   │   ├── embeddings/          # Dense vector generation (all-MiniLM-L6-v2)
│   │   ├── vectorstore/         # Pinecone client, upsert, and similarity query
│   │   ├── llm/                 # Google Gemini client with retry logic
│   │   ├── pipelines/           # Enrichment, RAG, and appraisal prompts
│   │   └── validation/          # Hallucination validation checks
│   └── package.json             # Internal workspace package (@activity-tracker/ai)
├── public/
│   └── index.html               # Static fallback entry
├── package.json                 # Monorepo workspaces definition & build scripts
└── vercel.json                  # Root routing configuration
```

---

## 🛠️ Tech Stack

| Domain | Technology | Details |
|---|---|---|
| **Frontend** | React 19, TypeScript, Vite | Fast client-side rendering with strict typing |
| **State Management** | Zustand, TanStack React Query | Lightweight centralized state and query caching |
| **Styling & UI** | Vanilla CSS Design System, TailwindCSS | Curated warm-amber glassmorphism palette, responsive flex/grid |
| **Backend API** | Node.js, Express.js | Modular REST architecture with error-boundary middleware |
| **Database** | MongoDB Atlas, Mongoose | Document database with connection pooling and schema validation |
| **Vector Database** | Pinecone | Serverless index for 384-dimensional dense semantic search |
| **Embeddings** | Hugging Face Transformers (`@xenova/transformers`) | In-process ONNX vectorization via `all-MiniLM-L6-v2` |
| **Generative LLM** | Google Gemini 3.1 Flash | Fast, low-latency reasoning for text enrichment & RAG synthesis |
| **Job Queue** | BullMQ, Upstash Redis | Resilient background job queue with exponential backoff |
| **Deployment** | Vercel Serverless Functions | Serverless Node.js deployment with CDN Edge distribution |

---

## 🔌 REST API Reference

| Method | Endpoint | Description | Auth Required |
|---|---|---|:---:|
| `POST` | `/auth/signup` | Register a new user account | No |
| `POST` | `/auth/login` | Authenticate user & issue tokens | No |
| `POST` | `/auth/refresh` | Rotate access token using refresh token | Yes |
| `GET` | `/health` | Health check endpoint | No |
| `GET` | `/activities` | Retrieve filtered work logs | Yes |
| `POST` | `/activities` | Create a new work log & trigger AI enrichment | Yes |
| `POST` | `/activities/improve` | Real-time AI refinement of raw text | Yes |
| `GET` | `/activities/:id` | Get details of a single work log | Yes |
| `DELETE` | `/activities/:id` | Delete a work record | Yes |
| `GET` | `/achieved-goals` | Retrieve quarterly goals | Yes |
| `POST` | `/achieved-goals` | Create a new quarterly milestone | Yes |
| `GET` | `/reports/annual` | Retrieve annual report drafts | Yes |
| `POST` | `/reports/annual/generate` | Auto-synthesize a new annual review draft | Yes |
| `POST` | `/reports/annual/merge` | Merge sections from two report drafts | Yes |
| `PATCH` | `/reports/annual/:version/lock` | Lock/unlock an annual report version | Yes |
| `GET` | `/assistant/ask` | Query the RAG vector assistant | Yes |

---

## 💻 Getting Started Locally

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm (v9.0.0 or higher)
- MongoDB instance (Local or MongoDB Atlas)
- Google AI Studio API Key
- Pinecone Account & Index (`activity-tracker`)

### 1. Clone the Repository
```bash
git clone https://github.com/Parthl0310/Activity_Tracker.git
cd Activity_Tracker
```

### 2. Install Dependencies
```bash
npm install
cd frontend && npm install && cd ..
```

### 3. Configure Environment Variables
Create `.env` inside the `backend/` folder:
```env
PORT=4000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/activity_tracker
JWT_ACCESS_SECRET=your_jwt_access_secret_123
JWT_REFRESH_SECRET=your_jwt_refresh_secret_456
FRONTEND_URL=http://localhost:5173
REDIS_URL=rediss://default:<token>@<host>.upstash.io:6379
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-3.1-flash-lite
EMBEDDING_MODEL=Xenova/all-MiniLM-L6-v2
EMBEDDING_DIM=384
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX=activity-tracker
```

Create `.env` inside the `frontend/` folder:
```env
VITE_API_URL=http://localhost:4000
```

### 4. Build Monorepo Workspaces
```bash
npm run build
```

### 5. Start Development Servers
Open two terminal windows:
```bash
# Terminal 1: Backend API
cd backend
npm run dev

# Terminal 2: Frontend Client
cd frontend
npm run dev
```

Visit `http://localhost:5173` in your browser.

---

## ☁️ Deployment on Vercel

The application is pre-configured for seamless serverless deployment on Vercel:

1. **Deploy Backend**: Import the repository on Vercel, set Root Directory to `./`, add your environment variables, and deploy.
2. **Deploy Frontend**: Import the repository again, set Root Directory to `frontend`, add `VITE_API_URL=<your-backend-vercel-url>`, and deploy.
3. **CORS Update**: Update `FRONTEND_URL` in the backend project settings to your frontend Vercel domain.

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
