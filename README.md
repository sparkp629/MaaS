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

## Project structure

- `frontend/` — React SPA (landing, onboarding, dashboard, Competitor Search, checkout)
- `backend/` — API (dashboard summary, KOLs, intelligence, content generation, Stripe webhook)
- `.cursor/rules/` — Project rules (local only; not committed to the repo)
- `.cursor/skills/` — Reusable skills (agent-frontend, content-orchestrator, etc.)

## Environment

Copy `.env.example` to `.env` and set:

- `PORT` — Backend port (default 3001)
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` — Supabase (optional)
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` — Stripe (optional)

Without these, the app runs with mock auth and sample data.

## Deploy (Vercel)

The repo includes a `vercel.json` that builds the frontend and rewrites all routes to `index.html` for the SPA. Deploy from the root; set **Root Directory** to the repo root and use the default build/output from `vercel.json`.

## License

Private. All rights reserved.
