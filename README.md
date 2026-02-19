# MaaS — Mindshare as a Service

A SaaS platform for mindshare analytics: audit your niche, discover KOLs that convert, and run multi-channel campaigns (X, LinkedIn, Shorts).

## Product and visual direction

- **Landing**: One strong CTA (“See what I’m missing”), no visible “login” button; user is invited to discover, not to sign in.
- **Onboarding**: 7 questions in 4 steps; answers feed dashboard data; dashboard UI stays the same.
- **Dashboard**: Data (KOLs, intelligence, ROI) shown in defined blocks; **intuitive** display that does **not** look like classic analytics tools (cards, tables, charts). Distinct, readable.
- **Auth**: Mock by default; Supabase for storage (survey results, API extractions) and optional real auth later. No GitHub OAuth in product direction.
- **Data**: Stored in Supabase (or similar), not on Vercel. See `docs/DIRECTION_ARTISTIQUE_ET_TECHNIQUE.md` for the full direction (artistic and technical).

## Stack

- **Frontend**: React 18, Vite, Tailwind CSS, React Router
- **Backend**: Node.js, Express
- **Auth**: Supabase (optional; mock auth when not configured)
- **Payments**: Stripe Checkout (optional)

## Run locally

From the project root:

```bash
npm run start
```

Then **open your browser** at [http://localhost:5173](http://localhost:5173) (the command does not open it automatically). The landing page leads to onboarding (7 questions in 4 steps) then the dashboard.

# MaaS — Mindshare as a Service

MaaS is a prototype SaaS that identifies high-impact content and KOLs (Key Opinion Leaders) to help early-stage SaaS teams choose channels, angles and creators that convert. The repo contains a React frontend (landing, onboarding, dashboard) and a Node.js backend with extraction/orchestration endpoints.

Deployment domain

The intended production domain for the landing and app is: maa-s.vercel.app

Quick overview

- Landing: single-CTA focused on conversion. Onboarding: short survey that feeds personalized dashboard suggestions. Dashboard: prioritized actionable insights (what content worked, which KOLs convert, ROI signals). Missing data is shown as “Coming soon”.

Tech stack (strict minimal)

- Frontend: React + Vite + Tailwind
- Backend: Node.js + Express
- Storage/analytics: Supabase (optional)
- Hosting: Vercel (frontend) + optional server on Node (backend)

What to know before running

- Copy `.env.example` to `.env` and populate required keys when you need real integrations. The repository intentionally ignores `.env` — do NOT commit secrets. If secrets were ever committed, rotate them immediately.

Minimal environment variables (examples in `.env.example`):

- `PORT` — backend port
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` — Supabase (optional)
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` — Stripe (optional)

Run locally

Install and run both frontend and backend from the repository root:

```bash
npm install
npm run start
```

Open http://localhost:5173 to view the frontend. The app falls back to mocked/sample data when integrations are not configured.

Notes on APIs & next steps

- The backend contains connectors for X (Twitter), YouTube, LinkedIn, Meta/TikTok and others under `backend/services/`. Each connector expects API keys in environment variables. See the docs folder for integration links.
- Missing or rate-limited data is shown as “Coming soon” on the dashboard; the frontend already contains placeholders for these states.
- Required later: hourly availability checker to remove content that disappeared from source platforms, KOL country-based grouping and influence-based ranking (implemented in the frontend as filters/sorting but requires backend data).

Vision (short)

Automate campaign discovery and content generation via AI agents that can propose, test and optimize creator-driven campaigns with minimal human oversight. Keep the product focused on actionable copy/angles and creator matching that actually drives conversions.

If you want, I can now:

- Add an infra diagram and a short deploy checklist for Vercel + Supabase.
- Implement the backend endpoint skeletons required by the dashboard filters and hourly checker.

—
Small, actionable README to help contributors get started.
