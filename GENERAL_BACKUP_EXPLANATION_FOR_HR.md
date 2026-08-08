# General Backup and Restore Explanation for HR

## Purpose

This document explains, in simple non-technical language, how our backup and restore process works.

The goal is to make sure important business data is not lost if the server fails, crashes, or needs to be moved to a new VPS.

## What Is a VPS

A VPS is a virtual private server.

In simple words, it is the online server where our application runs.

The application, database connection, uploaded files, and backup files are managed from this server.

## Where Backup Files Are Stored

Backup files are first stored inside the VPS in a dedicated backup folder.

Example:

```text
server/backups/
```

This folder works like a local storage area inside the server.

Whenever a backup is created, the system saves a backup file into this folder.

The backup file usually has a date and time in its name, so the team can identify when it was created.

Example:

```text
backup-2026-07-07T02-00-00-022Z.json
```

## Why We Also Send Backup Files by Email

Saving a backup only inside the VPS is not enough.

If the VPS itself fails, the backup folder may also become unavailable.

So, after creating the backup file, the system also sends a copy to email.

This gives us two layers of safety:

| Storage location | Purpose |
| --- | --- |
| VPS backup folder | Quick access from the server |
| Email copy | External copy in case the VPS is lost |

This means even if the server crashes, the team can still recover data from the backup file received by email.

## What the Backup File Contains

The backup file contains important application data in a structured format.

Depending on the application, this can include:

| Data type | Example |
| --- | --- |
| Users | Admins, employees, managers |
| Projects | Project names, client details, status |
| Tasks | Assigned work and task progress |
| Messages | Project-related communication |
| Reports | Business or operational records, if included |

The exact data included depends on what the technical team has configured in the backup script.

## What Happens When Uploaded Files Are Involved

Some applications also have uploaded files, such as:

| File type | Example |
| --- | --- |
| Images | Site photos, project photos |
| PDFs | Documents, quotations, invoices |
| CSV or Excel files | Imported reports |
| Other attachments | Any file uploaded by users |

Files can be large, so sending them directly by email may fail if the attachment size is too high.

To handle this, uploaded files should be reduced or compressed before being sent by email.

This means:

1. The system collects uploaded files.
2. Large files are reduced in size where possible.
3. The reduced files are attached or bundled.
4. The file backup is sent by email.

This helps email delivery work more reliably.

## Why File Size Reduction Matters

Email systems usually have attachment size limits.

For example, many email providers reject very large attachments.

If uploaded files are compressed or reduced before sending, the backup email is more likely to be delivered successfully.

This is especially important for image-heavy systems.

## What Is Restore

Restore means taking saved backup data and putting it back into the application database.

This is usually done when:

1. The old server crashes.
2. A new VPS is created.
3. The database is empty or incomplete.
4. The team needs to recover old data.

## Why We Use a Restore Script

Instead of manually entering data again, the technical team writes a restore script.

A restore script is a controlled recovery tool.

It reads the backup file and puts the data back into the database automatically.

This is faster, safer, and more accurate than manual data entry.

## How the Restore Script Works

The restore script follows a simple rule:

```text
If the data is not there, add it.
If the data is already there, update it.
```

In technical terms, this is often called an add-or-update process.

For HR and operations, it means:

| Situation | What the restore script does |
| --- | --- |
| Record does not exist | Adds the record |
| Record already exists | Updates the existing record |
| Same email already exists | Updates that user instead of creating a duplicate |
| Same project already exists | Updates that project instead of creating a duplicate |

This prevents duplicate users, duplicate projects, and repeated records.

## Example

Suppose the backup has a user:

```text
admin@company.com
```

If the new database does not have this user, the script adds the user.

If the new database already has this user, the script updates the existing user.

This is safer than blindly importing everything as new data.

## Why This Is Safer

The add-or-update method helps avoid:

1. Duplicate users
2. Duplicate projects
3. Broken task assignments
4. Login conflicts
5. Missing relationships between records

It also allows the technical team to restore into a database that may already contain some data.

## Restore Types

There are usually two restore approaches.

| Restore type | Meaning |
| --- | --- |
| Merge restore | Add missing data and update existing data |
| Replace restore | Clear old data first, then import backup data |

For a completely new VPS, replace restore is usually cleaner.

For a VPS that already has some useful data, merge restore is safer.

## What HR Should Understand

HR does not need to run the restore script.

HR only needs to understand the process:

1. Backup files are saved in the VPS backup folder.
2. Backup files are also sent to email for safety.
3. Uploaded files may be compressed before email backup.
4. Restore is done by the technical team using a script.
5. The script adds missing data and updates existing data.
6. After restore, HR/admin users should verify that important records are visible.

## What HR Should Do During a Server Issue

If the server crashes or data is missing:

1. Do not delete any backup emails.
2. Inform the technical team.
3. Share the latest backup email or backup filename.
4. Mention the last date/time when the system was working.
5. After restore, log in and check whether users, projects, and important records are visible.

## Simple Summary

Our backup process saves important data inside the VPS backup folder and also sends a copy by email.

If uploaded files are included, they should be reduced in size before sending through email.

If the server crashes, the technical team can use the backup file and run a restore script.

The restore script works intelligently:

```text
Missing data is added.
Existing data is updated.
```

This helps us recover quickly and avoid duplicate records.
