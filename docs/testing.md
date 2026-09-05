# Testing

## Backend (PHPUnit)

```bash
cd backend
php artisan test
```

55 feature tests / 176 assertions. The suite runs against a dedicated MySQL database
(`fireshark_community_test`, configured in `phpunit.xml`) with `RefreshDatabase` +
baseline seeders, so every test starts from the real schema. Tests exercise the API the
same way the SPA does — with an Origin header and session cookies.

### Coverage map (spec § 88–91)

| Area | Tests |
| --- | --- |
| Authentication | registration + validation, login by email/username, bad credentials, suspended accounts, logout, full password reset via the actual notification token |
| Questions | guest rules, verification gate, validation limits (title 15–180, tag count), slug + counters + reputation on create, edit → slug history + revision, ownership rules, author delete rules, hidden visibility per role, sorting/filtering |
| Voting | upvote + reputation, toggle-off rollback, direction flip, self-vote block, uniqueness, guest block, answer votes |
| Answers & acceptance | answer create + badge, closed-question block, author-only accept (staff override), replace/unaccept reputation rollback, delete rules, moderation delete rollback |
| Moderation & admin | guest/regular blocked from admin (403), moderator vs admin separation, last-admin demotion guard, hide/restore, close/reopen, report → review → resolve-with-action flow, suspension rules, dashboard stats |
| Platform | comments, search (full-text + fallback path), live monthly leaderboard from the ledger, `community:finalize-leaderboard` snapshot + ranks, login rate limiting (429), bookmark/follow toggles |
| SEO | question page title/canonical/OG + **QAPage JSON-LD** matching visible content, hidden content excluded, noindex on private pages, sitemap inclusions/exclusions |

## Frontend

- `npx tsc -b` — strict TypeScript check (part of `npm run build`).
- `npm run build` — production compile; fails on type errors.
- Manual E2E checklist executed against the running stack (see the table below) covers the
  flows in spec § 89 on both desktop (1280 px) and mobile (390 px) viewports:

  register → login → browse categories → open question → ask → answer → vote → accept →
  reputation → leaderboard → notifications → report → moderator resolution → admin console.

## Manual E2E log (last run)

All flows verified in-browser against `frontend` (:5173) + `backend` (:8000):

- Homepage, category, tag, search, profile, leaderboard render live data.
- Login (email or username), logout, session persistence across reloads.
- Ask flow: title counter, category, tag suggestions, markdown editor, publish → detail.
- Answer with markdown code blocks; vote (score + reputation), self-vote disabled.
- Accept answer → solved badge; author reputation/counter updates; notification delivered.
- Badge award notification ("Helpful"), unread badge count in the header.
- Admin dashboard stats; content moderation actions; role/verify/suspend controls.
- Production mode: Laravel serving the compiled build at :8000 with correct SEO head tags.

## Security test expectations

The ModerationAdminTest plus VoteTest/QuestionTest enforce the spec § 90 items
programmatically: unauthorized API access (401), privilege escalation (403), mass
assignment protection (role/verified flags not fillable), duplicate-vote uniqueness at the
schema level, self-vote/self-suspend rules and last-admin protection. See
[security.md](security.md) for the full review checklist.
