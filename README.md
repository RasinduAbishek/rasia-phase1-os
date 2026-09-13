# RASIA Phase 1 Advanced OS

## Period
**14 September 2026 → 31 December 2026**

## Included
- Animated dark UI
- Login screen
- Daily timetable
- Weekly timetable
- Monthly Phase calendar
- Free-time planning
- A/L Study OS
- Goals + progress controls
- Change log
- Browser reminders / notification permission
- Local progress persistence
- JSON data files
- Export of changes and local progress

## Login
Username: `Rasia200907`
Password: the password you supplied when requesting this build.

The password is **not stored as plain text**; the frontend stores its SHA-256 hash.

### Important privacy note
This is a static frontend. A GitHub **private repository does not make a deployed GitHub Pages website private**. The login is a client-side lock, not real authentication. Do not put secrets, API keys, private customer data, passwords, or sensitive SPS records into this site.

For genuine private access, deploy behind real authentication (for example a hosting provider with password protection/authentication, or a backend auth system).

## GitHub
1. Create a **private** repository.
2. Upload the extracted files.
3. Commit and push.
4. If using GitHub Pages, understand that the published site can be publicly reachable despite the repo being private.
5. For real private deployment, use authenticated hosting.

## Editing
- Weekly timetable: `data/timetable.json`
- Goals: `data/goals.json`
- Study system: `data/study.json`
- Initial change log: `data/changes.json`
- Login config: `data/config.json`

The app stores live progress/change/reminder data in browser localStorage. Use **Export** to move local data to a file before changing browser/device.

## Design principle
The schedule is a planning baseline, not a command to cut sleep. As a teen, protect adequate sleep, meals, recovery and school requirements.
