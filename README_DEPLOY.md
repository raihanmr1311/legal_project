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
