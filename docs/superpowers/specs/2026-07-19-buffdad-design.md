# BuffDad — Design Spec

**Date:** 2026-07-19
**Status:** Approved by Chris

## What it is

A mobile-first PWA that helps Chris's dad (late 70s, mobile, swims regularly) with gym workouts — especially core work — at a small gym with cable machines, kettlebells, dumbbells, and basic weight-stack machines. Dad logs workouts with near-zero friction; Chris reviews summaries on a private coach page and sends feedback back into dad's app. Tone: encouraging with humor, no emojis, custom line-art illustrations. Extremely simple UX — dad is not tech-savvy.

## Users

- **Dad** — sole athlete. Goes to gym 1–2×/week, no fixed schedule. iPhone, app added to homescreen.
- **Chris (coach)** — reviews workout summaries, replies with feedback. Own homescreen entry.

## Architecture

- **One Fly.io app.** Hono (Node) server: serves built React SPA (Vite), JSON API, web push. Auto-stop/auto-start single machine; push sends happen during request handling, so auto-stop is safe.
- **SQLite** via `better-sqlite3`, file on Fly volume mounted at `/data`.
- **Frontend:** Vite + React SPA. Tailwind for styling. 21st.dev (magic MCP) for component inspiration.
- **No accounts.** Two secret token paths (tokens from env vars):
  - `/d/<DAD_TOKEN>` — dad's app
  - `/coach/<COACH_TOKEN>` — coach page (dad never sees this URL; no in-app link to it)
  - `/` — humorous "Members Only" placeholder page
- Each token path serves its own PWA manifest (name, icon, start_url scoped to that path) so both users can add-to-homescreen independently.

## Data model

| Table | Columns (essentials) |
|---|---|
| `workouts` | id, template_key, started_at, finished_at, feel_rating (easy/right/rough, nullable), note (nullable) |
| `workout_sets` | id, workout_id, exercise_key, sets, reps, weight (nullable for bodyweight/steps-based) |
| `messages` | id, workout_id, body, created_at, read_at (nullable) |
| `push_subs` | id, role (dad/coach), subscription JSON, created_at |

Exercise library and workout templates are **seed data in code** (JSON/TS files). Chris edits and redeploys — no admin UI.

## Visual design

- **Style: "Beach Club"** — ocean blues (`#2a9d8f` teal action color, `#1a3c50` navy text) + sand/cream (`#fdf6e3`), light theme (readable in bright gym), big rounded cards, soft shadows.
- **Typography:** huge — base font larger than typical apps; giant tap targets (min ~56px). System font stack.
- **Humor in copy** throughout (e.g. wood chop: "Chop wood. There is no wood. Chop anyway."). No emojis anywhere.
- **Custom line-art SVG illustrations** — consistent stroke style, teal/navy on cream — one per exercise (simple figure poses) plus decorative touches (waves, sun).
- **Splash screen:** the AI-generated beach photo (`loading_screen.png`) with "BuffDad" title overlaid. It's an in-joke/aspiration, shown briefly at launch.
- **App icon:** custom aesthetic icon (line-art flex/wave motif, Beach Club palette), bundled at all iOS sizes.

## Dad's screens

1. **Splash** — beach photo + BuffDad wordmark, brief.
2. **Home** — humorous greeting, "Up next" workout card (next template in rotation; no day-of-week pressure), big START WORKOUT button, light stats (total workouts, "N workouts in last 14 days"), "Note from Chris" badge when unread messages exist.
3. **Workout — checklist view** (default mid-workout view) — scrollable list of the day's exercises with read-only checkmarks and sets×reps summary. Cannot check off from here; tapping an exercise opens the wizard card.
4. **Workout — wizard card** (one exercise, full screen) — illustration, humor one-liner, pre-filled sets/reps/weight from last completed instance (template defaults if first time), giant +/− steppers to adjust, big **DONE** button → marks complete and auto-advances to next unfinished exercise. Always visible: back-to-list, "How do I do this?", Skip.
5. **Exercise help** — big-print step-by-step form cues, common mistakes, safety notes with senior-friendly variants, optional curated YouTube link (clearly optional; app never depends on it).
6. **Finish screen** — celebration (confetti-ish, on-brand), session summary, optional one-tap feel rating (Easy / Just right / Rough), then auto-posts summary to coach feed + push notification to Chris.
7. **Progress** — calendar dots for workout days, per-exercise weight sparklines, fun cumulative stats ("You've lifted a walrus worth of weight this month").
8. **Coach notes** — Chris's messages, newest first, each with context chrome showing which workout it refers to (template name + date + mini summary). Opening marks read.

## Coach page (Chris)

- Feed of workout summaries, newest first: template, date/duration, per-exercise sets/reps/weight with deltas vs previous same-exercise ("+5 lb"), feel rating, dad's note.
- Reply box under each workout → creates `message`, pushes notification to dad.
- Unreplied workouts visually flagged.
- Push-notification enable toggle.

## Workout logic

- 4 rotating templates: **Core Day**, **Full Body A**, **Full Body B**, **Cable & Carry Day**. Core-forward overall.
- "Up next" = next template in rotation after the last *completed* workout. No scheduling, no guilt mechanics — he does as few or many per week as he wants. Streak-style stats phrased positively (counts, not broken chains).
- Exercise library: ~40–50 exercises matched to his gym (cables, KB, DB, stack machines), each with: key, name, humor line, equipment, form cues, mistakes, safety/variant notes, optional YouTube URL, default sets/reps/weight, illustration.
- Skipping an exercise is frictionless and judged only with gentle humor.

## Push notifications

- `web-push` npm lib, VAPID keys in Fly secrets.
- Dad finishes workout → push to coach subs. Chris replies → push to dad subs.
- One-tap "Turn on notifications" prompt in both apps. iOS requires homescreen install first — include plain-English install walkthrough page Chris can use with dad.
- Push failure is non-fatal (fire and forget; messages still visible in-app).

## Offline behavior

- Service worker caches app shell (gym wifi flaky).
- Mid-workout logging is optimistic: sets recorded to localStorage queue, synced to API when reachable. Workout completion retries until synced.

## Error handling

- API writes are idempotent enough for retry (client-generated ids for workouts/sets).
- Wrong/missing token → the "Members Only" page, no data leakage.
- SQLite on volume = single source of truth; Fly volume snapshots as backup story.

## Testing

- One small API test file: create workout with sets → appears in coach feed → coach reply → appears in dad's notes + unread badge logic. Run with `node --test`. No framework sprawl.

## Deploy

- Dockerfile (build SPA, run Hono server), `fly.toml` with volume mount, auto-stop enabled, min 0 machines. Secrets: `DAD_TOKEN`, `COACH_TOKEN`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`.

## Explicitly out of scope (add later if wanted)

- Email (Resend) — dropped in favor of coach page + push.
- Accounts/auth beyond secret URLs.
- Admin UI for editing templates/exercises (edit seed files + redeploy).
- Dad replying to coach messages.
- Workout plan editing in-app.
