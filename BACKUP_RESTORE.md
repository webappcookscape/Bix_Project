# Backup and Restore Documentation

## Purpose

The backup and restore flow protects the core CookScape project-management data so a crashed server can be rebuilt on a new database.

Backups are stored as JSON files in:

```text
server/backups/
```

Example backup filename:

```text
backup-2026-07-07T02-00-00-022Z.json
```

## Current Backup Coverage

The current backup system saves these database tables:

| Data | Prisma model |
| --- | --- |
| Users and login accounts | `User` |
| Projects | `Project` |
| Tasks and issues | `Task` |
| Project chat messages | `Message` |

The backup JSON format looks like this:

```json
{
  "timestamp": "2026-07-07T02:00:00.075Z",
  "counts": {
    "users": 62,
    "projects": 41,
    "tasks": 14,
    "messages": 2
  },
  "data": {
    "users": [],
    "projects": [],
    "tasks": [],
    "messages": []
  }
}
```

## Not Included Yet

The current backup does not include every table in the Prisma schema.

Not currently backed up:

| Missing data | Prisma model |
| --- | --- |
| Payment records | `PaymentTransaction` |
| Project images | `ProjectImage` |
| Project documents | `ProjectDocument` |
| Task evidence | `TaskEvidence` |
| Emails | `Email` |
| Tickets and comments | `Ticket`, `TicketComment` |
| Client magic links | `MagicLink` |
| Activity logs | `ActivityLog` |
| Push subscriptions | `PushSubscription` |
| Walk-in hub data | `WalkinHubEntry` |
| Work reports | `WorkReport` |
| CRE monthly reports | `CREMonthlyReport` |
| Physical uploaded files | `server/uploads/` files |

Because of this, the current restore is enough for users, projects, tasks, and chat messages, but it is not a complete full-system disaster recovery backup yet.

## Backup Creation

Backup logic lives in:

```text
server/src/services/backupService.js
```

The function is:

```js
createBackup()
```

It:

1. Reads users, projects, tasks, and messages from Prisma.
2. Writes a JSON file into `server/backups/`.
3. Attempts to email the backup using `sendBackupEmail()`.
4. Returns the backup filename, path, and email status.

## Scheduled Backups

Backups are scheduled in `backupService.js` with `node-cron`.

Current schedule:

```js
cron.schedule('0 2 * * *', ...)
```

This means the server attempts a backup every day at 2:00 AM while the Node server is running.

The scheduler is started from:

```text
server/src/app.js
```

## Admin Backup API

The admin route file is:

```text
server/src/routes/adminRoutes.js
```

Available backup API routes:

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/admin/backups` | List backup files |
| `POST` | `/api/admin/backups` | Create a manual backup |
| `GET` | `/api/admin/backups/:filename` | Download a backup file |
| `DELETE` | `/api/admin/backups/:filename` | Delete a backup file |

Restore is intentionally not exposed as an HTTP API route. Restore is a server-side operational script.

## Restore Implementation

Restore logic lives in:

```text
server/src/services/backupService.js
```

The function is:

```js
restoreBackup(filename, options)
```

Supported options:

```js
{
  mode: "merge" | "replace",
  dryRun: true | false
}
```

The runnable script is:

```text
server/scripts/restore_backup.js
```

The npm shortcut is:

```bash
npm run restore:backup
```

## Restore Modes

### Merge Mode

Command:

```bash
npm run restore:backup -- backup-2026-07-07T02-00-00-022Z.json
```

`merge` is the default mode.

It:

1. Keeps existing database data.
2. Updates existing users by `email` first, then `id`.
3. Updates existing projects by `projectCode`, then `cpNumber`, then `id`.
4. Creates missing records.
5. Remaps user and project IDs when a backup record matches an existing database row with a different ID.
6. Restores tasks and messages using the remapped IDs.

Use this when restoring into a database that may already contain some records.

### Replace Mode

Command:

```bash
npm run restore:backup -- backup-2026-07-07T02-00-00-022Z.json --mode=replace
```

`replace` mode deletes current core data first:

1. Deletes `Message` rows.
2. Deletes `Task` rows.
3. Deletes `Project` rows.
4. Deletes `User` rows.
5. Imports users, projects, tasks, and messages from the backup.

Use this for a fresh server or clean recovery database.

Important: `replace` only clears the four restored models. Other tables not included in the backup are not restored.

## Dry Run

Before running a real restore, run a dry run.

Command:

```bash
npm run restore:backup -- backup-2026-07-07T02-00-00-022Z.json dry-run
```

Dry run:

1. Reads the backup file.
2. Validates the JSON format.
3. Shows restore counts.
4. Does not write anything to the database.

Example output:

```json
{
  "success": true,
  "dryRun": true,
  "mode": "merge",
  "filename": "backup-2026-07-07T02-00-00-022Z.json",
  "counts": {
    "users": 62,
    "projects": 41,
    "tasks": 14,
    "messages": 2
  }
}
```

## New Server Restore Procedure

Use this process when the old server crashes and a new server/database must be restored.

1. Deploy the backend code to the new server.
2. Configure `server/.env`, especially `DATABASE_URL`.
3. Install dependencies.

```bash
cd server
npm install
```

4. Create/update the database schema.

```bash
npx prisma migrate deploy
```

5. Put the backup JSON file inside:

```text
server/backups/
```

6. Run a dry run.

```bash
npm run restore:backup -- backup-2026-07-07T02-00-00-022Z.json dry-run
```

7. Restore the data.

For a clean new database:

```bash
npm run restore:backup -- backup-2026-07-07T02-00-00-022Z.json --mode=replace
```

For a database that already has data:

```bash
npm run restore:backup -- backup-2026-07-07T02-00-00-022Z.json
```

8. Start the backend.

```bash
npm run dev
```

9. Start the frontend from the repo root.

```bash
npm run dev
```

10. Clear browser storage and log in again.

```js
localStorage.clear()
location.reload()
```

## Verification

Check database counts with Prisma:

```bash
cd server
node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); Promise.all([prisma.user.count(), prisma.project.count(), prisma.task.count(), prisma.message.count()]).then(([users,projects,tasks,messages]) => console.log({ users, projects, tasks, messages })).finally(() => prisma['$'+'disconnect']())"
```

Expected result should match or exceed the restored backup counts, depending on whether `merge` or `replace` was used.

You can also inspect visually:

```bash
npx prisma studio
```

## Frontend Verification

The frontend API base URL is configured in the root `.env`:

```text
VITE_API_URL=http://localhost:5001/api
```

The backend port is configured in `server/.env`:

```text
PORT=5001
```

If data exists in the database but does not show in the frontend:

1. Clear browser `localStorage`.
2. Log in again with a restored admin user.
3. Check browser DevTools Network tab for `/api/projects`.
4. Confirm the request is going to the correct backend URL.
5. Remember that employee and supervisor pages filter by logged-in user ID.

Admin pages call `/api/projects` directly and should show restored projects if the API is reachable.

Employee and supervisor pages may show fewer records because they call APIs with `employeeId` filters.

## Common Failures

### Unique constraint failed on `email`

Cause:

The database already had a user with the same email but a different ID.

Fix:

Use the updated merge restore logic. It matches users by `email` first and remaps IDs for tasks/projects.

### Data restored but frontend is empty

Cause:

Usually stale browser storage, wrong API URL, or employee-specific filtering.

Fix:

Clear browser storage and log in again:

```js
localStorage.clear()
location.reload()
```

### Table does not exist

Cause:

Prisma migrations were not run on the new database.

Fix:

```bash
cd server
npx prisma migrate deploy
```

## Operational Notes

1. Keep several backup JSON files, not only the latest one.
2. Store backup files outside the crashed server as well, such as email, Google Drive, or object storage.
3. Run `dry-run` before every restore.
4. Prefer `replace` for a brand-new recovery database.
5. Prefer `merge` only when the target database already has data that must be preserved.
6. Back up `server/uploads/` separately because uploaded files are not stored inside this JSON backup.

## Future Improvements

Recommended next improvements:

1. Expand backup coverage to all Prisma models.
2. Include `server/uploads/` file backup or archive export.
3. Add restore support for documents, images, tickets, emails, walkins, and monthly reports.
4. Add a checksum or manifest to each backup file.
5. Add an automated restore test against a temporary database.
6. Protect admin backup routes with authentication and role authorization.
