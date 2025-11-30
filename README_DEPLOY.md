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

Mailtrap (testing SMTP inbox)
- If you want to capture inbound/outbound test messages without using a real Gmail account in production, Mailtrap is a good testing inbox. To use Mailtrap set the following environment variables in your Railway project (or local `.env` for development):

   - `EMAIL_HOST=smtp.mailtrap.io`
   - `EMAIL_PORT=2525` (or `587`)
   - `EMAIL_SECURE=false`
   - `EMAIL_USER=<username from Mailtrap SMTP settings>`
   - `EMAIL_PASS=<password from Mailtrap SMTP settings>`

   Then run the same one-off send test you used earlier:

   ```powershell
   railway run node Src/checkSmtpEgress.js smtp.mailtrap.io 2525 5000
   railway run node Src/sendTestEmail.js you@your.email
   ```

   - If the TCP check times out from Railway one-off, the deployed containers may still be blocked from that port; if the one-off succeeds but deployed background sends fail, check the deploy logs for transporter.verify() timeouts.
   - Mailtrap will show captured messages in its inbox UI so you can inspect headers and bodies without sending to real recipients.

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
