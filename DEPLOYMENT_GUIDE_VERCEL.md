# Complete Vercel Deployment Guide for Activity Tracker (Frontend & Backend)

This guide provides the complete, step-by-step process to deploy both the **Frontend** and **Backend** of the Activity Tracker application to [Vercel](https://vercel.com) using your GitHub repository: `https://github.com/Parthl0310/Activity_Tracker.git`.

---

## 🏗️ Architecture Overview on Vercel

```
┌─────────────────────────────────┐       ┌─────────────────────────────────┐
│        Frontend (Vercel)        │       │        Backend (Vercel)         │
│  - Framework: Vite + React SPA  │ ────► │  - Runtime: Serverless Node.js  │
│  - Root Directory: frontend     │       │  - Root Directory: ./ (Root)    │
│  - SPA Routing: vercel.json     │       │  - Handler: api/index.ts        │
└─────────────────────────────────┘       └─────────────────┬───────────────┘
                                                            │
                            ┌───────────────────────────────┼───────────────────────────────┐
                            ▼                               ▼                               ▼
                 [MongoDB Atlas Cloud]           [Google Gemini 2.5/Flash]           [Pinecone Vector DB]
```

- **Frontend**: Deployed as a high-performance static SPA on Vercel's global Edge Network.
- **Backend**: Deployed as a Vercel Serverless Function via `api/index.ts` connecting `backend` and `ai-model` workspaces.

---

## 📋 Step 0: Prerequisites Check

Before deploying on Vercel, ensure you have:
1. **GitHub Repository**: Your code pushed to `https://github.com/Parthl0310/Activity_Tracker.git` (branch `main`).
2. **MongoDB Atlas**:
   - Go to [MongoDB Atlas](https://cloud.mongodb.com).
   - Under **Security** ➔ **Network Access**, ensure IP Access List includes `0.0.0.0/0` (Allow Access from Anywhere) so Vercel serverless functions can connect.
   - Note your connection string (e.g. `mongodb+srv://user:pass@cluster0...`).
3. **Google Gemini API Key**: From [Google AI Studio](https://aistudio.google.com/).
4. **Pinecone API Key & Index**: From [Pinecone Console](https://app.pinecone.io/) (index name: `activity-tracker`).
5. **Upstash Redis (Optional)**: If using background BullMQ queue.

---

## 🚀 Step 1: Deploy Backend to Vercel

1. Log in to your [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **"Add New..."** ➔ **"Project"**.
3. Import your GitHub repository: `Parthl0310/Activity_Tracker`.
4. Configure the project settings:
   - **Project Name**: `activity-tracker-api` (or your preferred name)
   - **Framework Preset**: `Other`
   - **Root Directory**: `./` (Leave as root directory so Vercel can link the `ai-model` monorepo workspace)
   - **Build Command**: `npm run build`
   - **Output Directory**: Leave empty / default
   - **Install Command**: `npm install`
5. Expand **Environment Variables** and add the following keys:

| Key | Example Value | Description |
|---|---|---|
| `MONGODB_URI` | `mongodb+srv://user:pass@cluster0...` | MongoDB Atlas URI |
| `JWT_ACCESS_SECRET` | `RxaPLkN9Oeo73DAZrT8KdYhoJ9jPllYhKlFOwlCq4zn` | Secret string for JWT access |
| `JWT_REFRESH_SECRET` | `oXdJoOSdcd7WXHKtSK4mZc7Y80900Ju2bhG4YLgP4tW` | Secret string for JWT refresh |
| `JWT_ACCESS_EXPIRY` | `15m` | Access token lifetime |
| `JWT_REFRESH_EXPIRY` | `30d` | Refresh token lifetime |
| `GEMINI_API_KEY` | `AQ.Ab8RN6...` | Google Gemini API Key |
| `GEMINI_MODEL` | `gemini-3.1-flash-lite` | Gemini model name |
| `EMBEDDING_MODEL` | `Xenova/all-MiniLM-L6-v2` | Embedding model |
| `PINECONE_API_KEY` | `pcsk_...` | Pinecone API Key |
| `PINECONE_INDEX` | `activity-tracker` | Pinecone Index Name |
| `REDIS_URL` | `rediss://default:...@upstash.io:6379` | Upstash Redis URL (optional) |
| `FRONTEND_URL` | `http://localhost:5173` | Temporary value; will update in Step 3 |
| `NODE_ENV` | `production` | Production mode |

6. Click **"Deploy"**.
7. Once finished, Vercel will give you a domain, e.g.:
   ```
   https://activity-tracker-api-parth.vercel.app
   ```
8. **Verify Backend**: Open `https://activity-tracker-api-parth.vercel.app/health` in your browser. You should see:
   ```json
   {
     "status": "ok",
     "service": "activity-tracker-api"
   }
   ```

---

## 🎨 Step 2: Deploy Frontend to Vercel

1. In your [Vercel Dashboard](https://vercel.com/dashboard), click **"Add New..."** ➔ **"Project"**.
2. Select the SAME GitHub repository again: `Parthl0310/Activity_Tracker`.
3. Configure the project settings:
   - **Project Name**: `activity-tracker-web` (or your preferred name)
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click **Edit** and select `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Expand **Environment Variables** and add:

| Key | Value | Description |
|---|---|---|
| `VITE_API_URL` | `https://activity-tracker-api-parth.vercel.app` | Backend Vercel URL from Step 1 (NO trailing slash) |

5. Click **"Deploy"**.
6. Once completed, Vercel will give you your frontend domain, e.g.:
   ```
   https://activity-tracker-web-parth.vercel.app
   ```

---

## 🔗 Step 3: Link Backend CORS to Frontend Domain

Now connect the backend CORS to your new frontend domain:

1. Go to your **Backend Project** in Vercel (`activity-tracker-api`).
2. Go to **Settings** ➔ **Environment Variables**.
3. Edit `FRONTEND_URL` and change its value to your frontend Vercel URL:
   ```
   https://activity-tracker-web-parth.vercel.app
   ```
4. Go to the **Deployments** tab, click the three dots `...` on the latest deployment, and click **"Redeploy"** so the new environment variable takes effect.

---

## ✅ Step 4: Final Verification

1. Open your frontend URL: `https://activity-tracker-web-parth.vercel.app`.
2. Sign in or create a new account (`/signup`).
3. Add a work entry with AI improvement (`/add-work`).
4. View your **Dashboard**, **Activity Heatmap**, **Work Records**, **Achieved Goals**, and **Performance Reports**.
5. Test on your mobile phone to experience the fully responsive UI!
