# Deploy WorkoutOS (full stack: UI + API)

You see **“No WorkoutOS API at this URL”** when the browser loads your HTML from **static hosting only** (GitHub Pages, many Vercel “static” setups, etc.). The app needs **`server.js`** running so paths like `/api/catalog` exist **on the same host**, unless you point the UI at another host (see below).

## Option A — Deploy the whole Node app (recommended)

Same URL serves the SPA and `/api/*`.

### Render

1. Push this repo to GitHub.
2. [Render](https://render.com) → **New +** → **Blueprint** → connect repo (or **Web Service** with root directory `.`).
3. **Build:** `npm install` · **Start:** `npm start`
4. **Health check path:** `/api/health`
5. In **Environment**, set at least:
   - `NEON_DATABASE_URL`
   - `JWT_SECRET`
   - Optional: `ADMIN_EMAILS`, `BOOTSTRAP_*`, SMTP vars (see `.env.example`).
6. After first deploy, run **one-off shell** or local machine against production DB:
   - `npm run migrate` (on an **empty** database this applies `db/schema.sql` first, then `db/migrations/*`)
   - `npm run seed`
   - `npm run bootstrap-admin` (or rely on `ADMIN_EMAILS` on register).

### Railway / Fly.io

- **Railway:** New project → deploy from GitHub → set start command `npm start` and the same env vars.
- **Fly.io:** `fly launch` (edit `app` in `fly.toml` first), set secrets with `fly secrets set`, then `fly deploy`.

### Docker

```bash
docker build -t workoutos .
docker run -p 3000:3000 --env-file .env workoutos
```

## Option B — Static UI + API on another domain

1. Deploy **only** `server.js` somewhere (Render/Railway/Fly) and note the public URL, e.g. `https://workoutos-api.onrender.com`.
2. Either:
   - Open the static site and use **“Backend server URL”** on the login card → paste the API origin → **Save & connect** (saved in the browser), **or**
   - In **`index.html`**, **before** `<script src="app.js">`, set:

   ```html
   <script>
     window.WORKOUTOS_API_BASE = "https://workoutos-api.onrender.com";
   </script>
   ```

3. Deploy the **HTML/JS/CSS** to static hosting. CORS is enabled on the API for this pattern.

## Local

```bash
cp .env.example .env   # fill NEON_DATABASE_URL, JWT_SECRET, …
npm install
npm run migrate && npm run seed
npm run dev
```

Open **http://localhost:3000** (not a `file://` path).
