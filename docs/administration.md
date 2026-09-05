# Administration handbook

## Getting in

The first administrator is created on the server:

```bash
php artisan community:create-admin
```

(Interactive, password input hidden. Repeat the command any time to add another admin.)
Sign in at `/login` and open **Admin dashboard** from the avatar menu (or `/admin`).

Roles:

| Role | Capabilities |
| --- | --- |
| Moderator | Dashboard, reports queue, content moderation (hide/restore/close/delete), see users |
| Admin | Everything above + users, roles, verifications, suspensions, categories, tags, badges, reputation rules, settings, leaderboard finalization |

## Daily workflow

### 1. Reports queue (`/admin/reports`)

New user reports land here with reason, description and the reported content excerpt.

- **Reviewing** — marks it in progress.
- **Hide content / Delete content** — acts on the content *and* resolves the report.
- **Dismiss** — nothing wrong found.
- Every resolution stores who handled it, when and with what note.

### 2. Content moderation (`/admin/questions`, `/admin/answers`)

- Filter by status or search by title; open the question on the public site before acting.
- **Hide** keeps the content but removes it from public lists (author counters adjusted).
- **Close** freezes a question with a reason (duplicate, off-topic, ...). It stays readable.
- **Delete** soft-deletes, rolls back the author's earned reputation through the ledger,
  unaccepts answers and cleans comments/votes. **Restore deleted** undoes it.

### 3. Users (`/admin/users`)

- Search by name/username/email; review reputation and contribution counts inline.
- **Role** — promote moderators/admins (admins only; the last admin cannot be demoted).
- **Verify** — grant `FireShark Team / Instructor / Expert / Alumni / Professional` badges.
  Users can never self-assign these.
- **Suspend** — blocks login and all write actions; restore any time. Moderation penalties
  (reputation deduction) are separate and applied from the badge/reputation screen or via
  reports resolution.

### 4. Categories & tags (`/admin/categories`)

- Categories: rename (slug follows), activate/deactivate, delete (only when empty), add.
- Tags: rename, delete, **merge** (moves all question associations to a target tag and
  recomputes counts). Regular users can only attach existing tags — new-tag creation is a
  staff privilege, which keeps the tag namespace clean.

### 5. Badges & reputation (`/admin/badges`)

- Badge catalogue shows tier, award type, criteria and how many users hold each badge.
- **Award…** grants a manual badge (e.g. *FireShark Instructor*) by username — never
  awarded twice.
- Reputation rules table maps actions to points (e.g. *Answer accepted = +15*). Points and
  enabled flags are editable; changes apply immediately, with no code changes and no
  rewriting of history.

### 6. Settings & leaderboard (`/admin/settings`)

- Site name/description/support URL — used on the site and in SEO defaults.
- Leaderboard periods: months finalize automatically on the 1st (cron). If cron is not
  configured, use **Finalize … now** at month end to snapshot ranks; history is preserved
  and browsable from the public leaderboard's month selector.

## Seed data policy

Production seeding (`php artisan db:seed`) adds **only** configuration: categories, badges,
reputation rules, settings. Never run `DevelopmentSeeder` in production — it refuses, and
it would introduce fake community content.

## Community cold start (spec § 106)

Before launch, seed genuine content authored by the FireShark team: post real questions
and answers through the normal UI with staff accounts (verified badges make them stand
out). Aim for a handful of high-quality discussions per launch category — authenticity over
volume; the platform ships with **zero fake content**.

## Operational notes

- **Email**: configure Hostinger SMTP in `.env` (`MAIL_*`) so verification, password reset
  and notification-adjacent mails send. Until then, keep
  `REQUIRE_EMAIL_VERIFICATION=false` only if you accept unverified posting.
- **Leaderboard cron**: hPanel cron every minute → `php artisan schedule:run`.
- **Backups**: database + `storage/app/public`; see deployment-hostinger.md § 14.
- **Logs**: `storage/logs/laravel.log` — security-relevant events (large reputation
  changes, badge grants, suspensions) are recorded; no credentials are ever logged.
