# Security

The platform itself is a cybersecurity community, so it is built to be reviewed. Below is
the model and the concrete checklist of what is enforced, and where.

## Authentication & sessions

- Laravel session authentication via Sanctum SPA cookie mode — first-party only, HttpOnly
  cookies, CSRF token required on every mutating request. No tokens in JavaScript.
- Passwords hashed with bcrypt (`hashed` cast). Never stored or logged in plain text.
- Brute-force protection: `auth` rate limiter 10/min/IP on register/login/reset (429 after).
- Login accepts email **or** username but returns identical errors for both failure modes.
- Suspended users cannot log in (403).
- Optional email verification gate on all write actions
  (`REQUIRE_EMAIL_VERIFICATION`, default true) — `verified.api` middleware.
- Password reset sends a neutral response regardless of account existence (no user
  enumeration) and revokes nothing silently; tokens are single-use and expire.

## Authorization

- Role enum on the user (`user`, `moderator`, `admin`) + `role:` middleware for route
  groups, Laravel Policies for content.
- Enforced server-side only — the React app performs no authorization decisions.
- Guards verified by tests: regular users cannot reach any admin endpoint (403);
  moderators cannot manage users/roles/categories/badges/settings; admins cannot demote
  the last admin, cannot self-suspend; users cannot edit others' questions; an accepted
  answer cannot be deleted by its author.
- Users can never self-assign verification badges or roles (attributes not fillable;
  admin-only endpoints use `forceFill`).

## Input handling

- All writes go through Form Request validation with explicit rules (title length
  15–180, body ≥ 30 chars, tag count ≤ 5, comment ≤ 2000 chars, enum whitelists).
- Mass-assignment protection: strict `$fillable` on every model; sensitive fields
  (`role`, `reputation`, counters, `is_suspended`) are never fillable.
- SQL injection: Eloquent bindings everywhere; the only raw SQL is the leaderboard
  aggregate and counter clamps, both parameter-free.
- XSS: content is stored as Markdown and rendered client-side through `marked` +
  **DOMPurify** with an explicit tag/attribute allowlist; raw HTML from users is never
  echoed. Mention rendering is plain-text based. Server-rendered SEO uses Blade escaping
  (`{{ }}`) for every dynamic value; JSON-LD is `json_encode`d with escaping flags.
- CSRF: Laravel session tokens via `X-XSRF-TOKEN` on every mutation; enforced by
  Sanctum's stateful pipeline.

## Uploads

- PNG/JPG/WEBP only, validated by MIME + extension + size (≤ 5 MB) + dimension checks.
- Re-encoded through GD (strips embedded payloads), resized to ≤ 1600 px, stored under a
  random 40-char name in `storage/app/public/media/YYYY/MM`.
- Every upload is registered in the `media` table so moderators can trace/remove abuse.
- Users are warned twice (editor hint + pre-submit banner) to strip PII from screenshots;
  the platform never claims uploads are PII-safe.

## Rate limiting & anti-abuse (spec § 23, § 120)

| Surface | Limit |
| --- | --- |
| API generally | 60/min/user |
| Auth endpoints | 10/min/IP |
| Content writes (ask/answer/comment/vote/upload) | 20/min/user |
| Search | 30/min |
| Reports | 5/min/user |

Plus: duplicate votes impossible (DB unique index), self-voting blocked, one open report
per reporter/target, moderation actions all audited (`moderation_actions`), deleted content
rolls back its earned reputation through the ledger.

## Content safety (spec § 42)

- Community guidelines page defines prohibited content (credentials, malware, doxxing,
  harassment, illegal activity).
- Deterministic validation: PII warning before publishing, no AI moderation.
- Moderators hide/restore/close/delete content and warn/suspend users; closed questions
  stay publicly readable so knowledge is preserved.
- Every significant action writes an audit row with moderator, subject, reason and metadata.

## Headers & transport

- `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`,
  `Permissions-Policy` on every response (`SecurityHeaders` middleware).
- HSTS added in production; TLS terminates at Cloudflare (Full strict) with a valid
  Hostinger origin certificate.
- `APP_DEBUG=false` in production; errors render the SPA 404/error states, never traces.

## Logging

- Authentication anomalies, reputation events ≥ 10 points, badge grants and moderation
  actions are logged server-side.
- Passwords, tokens and credentials are never logged; notification content is the only
  user text that reaches logs.

## Review checklist performed

- [x] Unauthorized API requests → 401 (tests)
- [x] IDOR: ownership policies on question/answer/comment mutations (tests)
- [x] Privilege escalation: role/verified flags not mass-assignable; admin-only routes
      behind `role:admin` (tests)
- [x] XSS: DOMPurify allowlist; Blade-escaped SEO shell; no `{!! !!}` on user data
- [x] SQL injection: bound queries only (manual review)
- [x] CSRF: enforced on all state-changing routes (manual + framework tests)
- [x] Malicious uploads: MIME/extension/size/dimension validation + GD re-encode
- [x] Rate limiting: auth/write/search/report limiters (429 test for login)
- [x] Mass assignment: strict fillables (tests assert role changes need admin endpoints)
- [x] Vote manipulation: unique index + self-vote block (tests)
- [x] No AI, no fake data, no third-party forum engine (manual review)
