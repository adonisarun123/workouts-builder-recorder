# Workout Builder & Recorder (Neon + Auth + AI)

This version upgrades the MVP to support your requested architecture:

- **Neon PostgreSQL DB** for persistent user, profile, readiness, session, and set/exercise logs.
- **Individual login/register** for each user (JWT auth).
- **Comprehensive log capture** for readiness + session + per-exercise details.
- **Per-user markdown memory file** in `user_memories/<user_id>.md` that stores profile, growth snapshot, and recent logs.
- **Optional AI coaching** via OpenAI API (or any model API with small adapter changes).

## 1) Setup

```bash
cp .env.example .env
npm install
```

Populate `.env`:

- `NEON_DATABASE_URL` (required)
- `JWT_SECRET` (required)
- `OPENAI_API_KEY` (optional)
- `OPENAI_MODEL` (optional; default `gpt-4o-mini`)

## 2) Initialize Neon schema

Run `db/schema.sql` against your Neon database.

## 3) Run

```bash
npm run dev
```

Open: `http://localhost:3000`

## API Endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/profile` (auth)
- `POST /api/sessions` (auth)
- `GET /api/sessions` (auth)

## Notes

- Memory files are generated server-side in `user_memories/` after register/profile/session writes.
- AI feedback automatically falls back to rule-based behavior if `OPENAI_API_KEY` is not configured.
- UI remains responsive across mobile/tablet/desktop breakpoints.
