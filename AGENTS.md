# Larpinator — project notes for agents

## Commands

- `npm run dev` — Next.js dev server at http://localhost:3000
- `npm run build` / `npm start` — production build / serve
- `npm run lint` — ESLint (flat config, `eslint-config-next` native flat exports)
- PDF service: `cd pdf-service && python -m uvicorn main:app --port 8000`
  - install deps first: `python -m pip install -r requirements.txt`

## Architecture rules

- **Clerk Core 3** (`@clerk/nextjs` v7): use `<Show when="signed-in">` / `<Show when="signed-out">` — `SignedIn`/`SignedOut`/`Protect` were removed. Middleware lives in `src/proxy.ts` (Next.js 16 renamed middleware → proxy). `ClerkProvider` must be inside `<body>`.
- **Supabase is server-only** via the service-role key (`src/lib/supabase.ts`). Never import it from client components. RLS is enabled with no anon policies.
- **Scoring is centralized** in `src/lib/scoring.ts` (weights + overall/category aggregation) and `src/lib/tiers.ts` (thresholds). Do not hardcode weights or tier names anywhere else.
- **Every activity writes through `src/lib/activity.ts`** → inserts an `analyses` row, recalculates the profile score/tier, awards XP, evaluates achievements.
- **AI calls are server-side** (`src/lib/groq.ts`), validated with zod schemas (`src/lib/ai-schemas.ts`) before anything is saved. Default model: `openai/gpt-oss-120b` (override with `GROQ_MODEL`). No vision model is available on the current Groq account; image CV uploads require `GROQ_VISION_MODEL`.
- **Leaderboards derive from stored scores** via SQL views (`leaderboard_entries`, `leaderboard_quiz`, `leaderboard_battle`, `leaderboard_daily`) — never maintain them manually.
- **Meme assets** live in `public/assets/memes`; the placement map is documented in `memes.md` and centralized in `src/lib/reactions.ts` (`MEME_ASSETS` + `SCORE_MEMES`). Decorative placements use `MemeImage` (renders nothing if the file is missing); the score-reaction meme falls back to an emoji placeholder.
- **Sound** is centralized in `src/components/audio-manager.tsx` (`AudioManagerProvider` + `useAudioManager().playRandom()`): random track from `AUDIO_TRACKS` on navigation (activity routes force-play), every ~75s while visible, on activity start (`AnalysisLoader` mount), and on score reveal (`ScoreReveal` / battle result mount). Mute state persists in localStorage; toggle lives in the navbar.

## Database

- Migrations are plain SQL and run manually in the Supabase SQL editor:
  1. `supabase/migrations/001_schema.sql`
  2. `supabase/migrations/002_seed.sql`
- Environment variables are documented in `.env.example`. Legacy names `GROQ` and `LASTFM_API` are also accepted.

## Environment notes

- Node 20.18.2 on this machine — `@supabase/supabase-js` is pinned to `2.109.0` (>= 2.110 requires Node 22).
- Python 3.12 with PyMuPDF (`pymupdf` import name; `fitz` is deprecated).
