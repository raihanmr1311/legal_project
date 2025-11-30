Netlify deployment — Frontend + Proxy to Backend

Overview
- This repository contains a static frontend (HTML/CSS/JS) and a Node.js backend in `Src/` (Express, MySQL, scheduler). The recommended Netlify setup is:
  1. Host the static frontend on Netlify (fast, CDN-backed).
  2. Keep the Node backend (DB, scheduler, SMTP) running on a dedicated host (Railway, Fly, Render, or a VPS).
  3. Proxy API calls from the frontend to the backend using Netlify redirects, or call the backend by absolute URL.

Quick steps (Netlify + GitHub automatic deploys)
1. Push your repository to GitHub.
2. On Netlify dashboard, click **Add new site → Import from Git**.
   - Authorize Netlify to access your GitHub account and select the repository.
   - Build command: leave blank (no build) unless you add a bundler.
   - Publish directory: `.` (or `public` if you move static files there).
3. Deploy site — Netlify will set up webhooks so future pushes auto-deploy.

Netlify CLI (optional, for manual deploys)
```powershell
npm i -g netlify-cli
netlify login
netlify init   # link or create a site
netlify deploy --prod --dir=.
```

Proxy frontend `/api/*` to your backend (recommended)
- To keep client code using relative `/api/...` paths, add a redirect so Netlify forwards those requests to your backend service (replace `https://your-backend.example`):

_redirects (simple)
```
/api/*  https://your-backend.example/:splat  200
```

netlify.toml (example)
```toml
[build]
  publish = "."
  command = ""

[[redirects]]
  from = "/api/*"
  to = "https://your-backend.example/:splat"
  status = 200
  force = true
```

Environment variables
- If your frontend needs runtime configuration (API base URL, public keys), set them in Netlify dashboard: Site settings → Build & deploy → Environment → Environment variables.
- Example: `API_BASE_URL=https://your-backend.example`

Notes about the backend
- Netlify is for static hosting and serverless functions. Keep your Node server on Railway/Fly/Render or a VPS for:
  - Persistent MySQL connections
  - Background scheduler (cron) and long-running processes
  - SMTP via Nodemailer (may be blocked on some PaaS providers; consider using an Email API)
- If you want some endpoints serverless, you can convert lightweight routes to Netlify Functions and keep the DB hosted externally. Cron jobs must be scheduled via external services (GitHub Actions, cron-job.org, or a hosted worker).

Optional: Add a small Netlify Function for testing
- Create `netlify/functions/env-status.js` with a simple handler that returns a few environment variables for quick verification. That is useful for testing Netlify Functions and environment configuration.

Custom domain and HTTPS
- Add a custom domain in Netlify settings and follow the DNS instructions. Netlify provisions HTTPS automatically with Let's Encrypt.

Next steps (recommended)
- (1) Add `netlify.toml` and `_redirects` to this repo and push to GitHub so Netlify can proxy `/api/*` to your backend.
- (2) Link the repo in Netlify and enable automatic deploys from the main branch.
- (3) Keep the Node backend where it is (Railway) or migrate it to a provider that allows the network behavior you need.

If you want, I can add `netlify.toml` and a `_redirects` file to this repo and commit them now.

— End of Netlify deployment guide
Deploy guide — Free hosting with Railway

Overview
- This project is an Express.js app that uses MySQL. To deploy on a free tier you can use Railway (https://railway.app) which provides free projects and a managed MySQL plugin.

Steps (Railway)
1. Create a Railway account and connect your GitHub.
2. Create a new project and choose "Deploy from GitHub". Select this repository.
3. In Railway project, add a plugin -> "MySQL" (Railway will provision a database).
4. Copy connection details from Railway (host, user, password, database, port).
5. Add environment variables in Railway's project settings:
   - `DB_HOST` -> host from Railway
   - `DB_USER` -> user
   - `DB_PASS` -> password
   - `DB_NAME` -> database
   - `DB_PORT` -> port
   - (Optional) `PORT` -> port Railway assigns (usually not needed)
6. Ensure `package.json` has a start script. Railway will run `npm start` by default. If not present, add a script in `package.json`:
   ```json
   "scripts": {
     "start": "node Src/server.js"
   }
   ```
7. Run migration:
   - Open the Railway database console and paste the contents of `migrate.sql`, or
   - Run a one-off job in Railway: `node Src/migrateRunner.js` (not included). Simpler: use the SQL editor in Railway and execute `migrate.sql`.
8. Deploy. Railway will build and start the app.

Notes / Tips
- We updated `Src/db.js` to read DB credentials from environment variables. Locally you can create a `.env` file and use a tool like `cross-env` or `dotenv` if you like.
- If you want to keep credentials locally, set environment variables in your shell before running locally (PowerShell):

```
$env:DB_HOST = 'localhost'; $env:DB_USER='root'; $env:DB_PASS=''; $env:DB_NAME='legal_project'; $env:DB_PORT='3307';
node Src/server.js
```

- After deployment, you may need to allow sending emails (check `Src/emailConfig.js` and set environment variables for SMTP)

Alternative free hosts
- Render / Fly / Vercel — may require switching DB type (Postgres) or using external MySQL provider.

If you want, I can:
- Add a `start` script to `package.json`.
- Add a small `migrateRunner.js` script to run `migrate.sql` automatically from Node.
- Walk you through creating the Railway project step-by-step and run the migration interactively.
