# RASIA PHASE 1 — SUPER OS

Phase: **14 September 2026 → 31 December 2026**

## What's inside
- Animated / glass / neon UI
- Login
- Google-calendar-style weekly time grid
- Daily timetable
- Weekly timetable
- Monthly Phase calendar
- Explicit free-time blocks
- A/L Study OS
- Goals + editable progress
- Change/version log + JSON export
- Browser reminders
- Rasia AI: offline planner core
- Optional Node/Express AI backend starter
- JSON-first data model

## Login
Username: `Rasia200907`
Password: the password supplied for this build.

The frontend stores a SHA-256 password hash rather than plaintext. **This is not real authentication** because a static website ships its code to the browser.

## GitHub Pages
The frontend can be hosted on GitHub Pages after the repository is public. Upload:
```
index.html
css/
js/
data/
```
The `backend/` folder is optional and does not run on GitHub Pages.

## Real AI
The backend is optional. To use it:
1. Install Node.js.
2. `cd backend`
3. `npm install`
4. Copy `.env.example` to `.env`
5. Put the API key in `.env` (server-side only).
6. `npm start`

Never put an API key in `js/app.js`, JSON files, GitHub Pages, or browser localStorage.

## Privacy
Because GitHub Pages is a static public website, anyone can technically inspect/download frontend files. Do not put passwords, API keys, customer records, SPS private documents, or other sensitive data in `data/`.

The app's live progress, reminders, chat history and changes are stored in browser localStorage. Export changes before moving devices/browsers.

## Timetable data
Edit `data/timetable.json` to change the weekly schedule. The current blocks are a planning baseline based on the schedule discussed before. Exact times should be adjusted if school/class/travel changes.

## Important
This system is designed to optimize time **without treating sleep, meals or recovery as disposable**. As a teen, protect adequate sleep.
