# SECRET BASE OF RASIA — PHASE 1 SUPER AI

A free personal-OS style web app for Rasia's Phase 1 (2026-09-14 → 2026-12-31).

## Included

- Login gate
- Dashboard (fixed)
- Calendar: Daily / Weekly / Monthly / All Time
- Free-time engine
- A/L Study OS
- Goals + progress
- Reminders
- Changes/version log
- Help for Rasia
- Secret Base of Rasia private-style page
- Sinhala / Singlish / English AI chat UI
- Offline AI fallback
- Optional Node/Express + OpenAI Responses API backend
- Function tools for schedule/free-time/goals and approval-only change/reminder proposals
- GitHub Pages auto-deploy workflow

## Login

Username: `Rasia200907`

Password: `Rasia200907`

This is only a frontend login gate. It is NOT strong authentication. Never put API keys, passwords for other services, SPS customer data, or other secrets in the public frontend repository.

## GitHub Pages

1. Put the contents of this folder in your repository root.
2. Push to `main`.
3. GitHub → Settings → Pages → Source: GitHub Actions.
4. The included workflow deploys the static frontend.
5. GitHub Pages can take a little time to publish.

## Advanced AI backend

GitHub Pages is static hosting, so the Node AI server must run separately.

1. Go to `backend/`.
2. Install:
   `npm install`
3. Copy `.env.example` to `.env`.
4. Put your API key ONLY in `.env`:
   `OPENAI_API_KEY=...`
5. Optional:
   `OPENAI_MODEL=gpt-5.6-luna`
6. Run:
   `npm start`

Then either put the backend URL in `data/config.json` as `ai.api_base`, or set it in the browser console/local storage if the backend is on another domain:

`localStorage.setItem("rasia_api_base","https://YOUR-BACKEND-DOMAIN")`

Reload the app.

## Important

- The UI and offline planner do not require an AI API key.
- Using an external AI API can incur API usage charges.
- The backend is designed so AI proposes plan mutations; the user should approve before applying them.
- The frontend stores progress/chat/reminders in browser localStorage.

## Deployment architecture

Frontend:
GitHub Pages → static HTML/CSS/JS/data

AI:
Node.js/Express → OpenAI Responses API

Do not place `OPENAI_API_KEY` in GitHub Pages files.


## Easiest way to make Rasia AI actually ONLINE

**Important:** GitHub Pages is static hosting. It can show the Rasia AI UI, but it cannot execute `/api/chat`. That is why a GitHub Pages-only deployment shows `AI LOCAL`.

This project is now Vercel-ready. Vercel Functions can run server-side code, and environment variables keep the API key off the browser. citeturn0search1turn0search0

### Recommended deployment

1. Push this whole project to GitHub.
2. Import the repository into Vercel.
3. Vercel detects the `api/` folder and creates:
   - `/api/health`
   - `/api/chat`
4. Vercel → Project → Settings → Environment Variables.
5. Add:
   - `OPENAI_API_KEY` = your API key
   - `OPENAI_MODEL` = `gpt-5.6-luna` (or another model available to your API account)
6. Redeploy.
7. Open your Vercel URL.
8. In Rasia AI, the badge should change from **AI LOCAL** to **AI ONLINE**.

Never put `OPENAI_API_KEY` in `data/`, `js/`, HTML, or GitHub. Vercel's server-side environment variables are the correct place for secrets. citeturn0search2turn0search6

### If you keep using GitHub Pages

The site still works in offline/local-AI mode. For real generative AI, point `localStorage.rasia_api_base` at your Vercel backend URL, then reload.

Example in browser console:

`localStorage.setItem("rasia_api_base","https://YOUR-PROJECT.vercel.app")`

The frontend will then call `https://YOUR-PROJECT.vercel.app/api/chat`.

### Test

Open:

`https://YOUR-PROJECT.vercel.app/api/health`

It should return JSON with `"ok": true`.

