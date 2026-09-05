# API reference

Base URL: `/api/v1`. All responses use a consistent envelope:

```json
{ "success": true, "message": "OK", "data": { } }
```

Paginated responses add:

```json
{ "data": [ ... ],
  "meta": { "current_page": 1, "last_page": 4, "per_page": 15, "total": 57 } }
```

Errors use the same envelope with `"success": false`; validation errors include an
`errors` map keyed by field. HTTP codes: 401 unauthenticated, 403 forbidden / unverified,
404 missing, 422 validation, 429 rate limited.

**Auth model:** Sanctum SPA cookie sessions. Clients must hold the `XSRF-TOKEN` cookie and
send it as `X-XSRF-TOKEN` on POST/PUT/PATCH/DELETE. The React client does this
automatically (`src/api/client.ts`).

---

## Authentication

| Method | Endpoint | Notes |
| --- | --- | --- |
| POST | `/auth/register` | name, username, email, password → logs the user in |
| POST | `/auth/login` | email **or** username + password |
| POST | `/auth/logout` | invalidates the session |
| GET | `/auth/me` | current profile (requires auth) |
| GET | `/auth/email/verify/{id}/{hash}` | signed URL forwarded by the SPA |
| POST | `/auth/email/verification-notification` | resend verification (auth, throttled) |
| POST | `/auth/forgot-password` | always returns a neutral success |
| POST | `/auth/reset-password` | token, email, password, confirmation |

## Questions

| Method | Endpoint | Notes |
| --- | --- | --- |
| GET | `/questions` | `?sort=latest\|most_answered\|most_viewed\|most_voted\|unanswered\|activity`, `?category=slug`, `?tag=slug`, `?author=username`, `?unanswered=1`, `?page=` |
| GET | `/questions/{slug}` | detail (includes `body`, viewer's `my_vote`, `bookmarked`, `following`); old slugs return `{data: {redirect: true, to: ...}}` |
| POST | `/questions` | auth + verified + throttle `write`; title 15–180, body ≥ 30 chars, category, ≤5 tags, optional `status: draft` |
| PUT | `/questions/{id}` | author or staff; records a revision, keeps old slug for redirect |
| DELETE | `/questions/{id}` | author only while `answers_count = 0`; staff anytime |
| GET | `/questions/{id}/answers` | `?sort=votes\|oldest\|newest` |
| POST | `/questions/{id}/answers` | auth + verified; blocked when the question is closed |
| POST | `/questions/{id}/bookmark` | toggle |
| POST | `/questions/{id}/follow` | toggle (followers get answer notifications) |

## Answers

| Method | Endpoint | Notes |
| --- | --- | --- |
| PUT | `/answers/{id}` | author or staff |
| DELETE | `/answers/{id}` | author while not accepted; staff anytime |
| POST | `/answers/{id}/accept` | question author or staff; replaces any previous acceptance |
| POST | `/answers/{id}/unaccept` | same authorisation |

## Votes / comments / reports

| Method | Endpoint | Notes |
| --- | --- | --- |
| POST | `/votes` | `votable_type` (`question`/`answer`), `votable_id`, `value` (1/-1). Toggle off by repeating; flipping is allowed. Self-votes and unverified users rejected |
| GET | `/comments?commentable_type=&commentable_id=` | published comments for a question or answer |
| POST | `/comments` | auth + verified; body ≤ 2000 chars |
| PUT/DELETE | `/comments/{id}` | author (delete also staff) |
| POST | `/reports` | auth + verified + throttle 5/min; one open report per reporter/target |

## Taxonomy, search, discovery (public)

| Method | Endpoint | Notes |
| --- | --- | --- |
| GET | `/categories` | active categories with counts |
| GET | `/categories/{slug}` | category detail: stats, related tags, paginated questions (`?sort=latest\|popular\|most_voted\|unanswered`) |
| GET | `/tags` | paginated tag directory (`?q=`) |
| GET | `/tags/{slug}` | tag detail + questions |
| GET | `/tags/suggest?q=` | autocomplete for the ask form |
| GET | `/search?q=` | full-text search with LIKE fallback; `?sort=relevance\|latest\|votes` |
| GET | `/leaderboard` | current month + all-time + archive (`?month=YYYY-MM` for finalized history) |
| GET | `/users/{username}` | public profile incl. badges and verification |
| GET | `/users/{username}/questions` | published questions |
| GET | `/users/{username}/answers` | answers on visible questions |
| GET | `/badges` | badge catalogue |

## Member settings

| Method | Endpoint | Notes |
| --- | --- | --- |
| GET | `/me/bookmarks` | saved questions |
| PATCH | `/me/profile` | name, bio, expertise, location, website, notification preferences |
| POST | `/me/avatar` | image upload ≤ 2 MB |
| PUT | `/me/password` | current + new password |
| DELETE | `/me/account` | password-confirmed deactivation (anonymises the profile) |
| POST | `/media` | question/answer image upload (PNG/JPG/WEBP ≤ 5 MB, resized to ≤1600 px) |

## Notifications (auth)

| Method | Endpoint |
| --- | --- |
| GET | `/notifications` (paginated + `unread_count`) |
| GET | `/notifications/unread-count` |
| POST | `/notifications/{id}/read` |
| POST | `/notifications/read-all` |

## Admin & moderation (`role:moderator,admin`)

| Method | Endpoint | Notes |
| --- | --- | --- |
| GET | `/admin/dashboard` | aggregate statistics + recent activity |
| GET | `/admin/questions` / `/admin/answers` / `/admin/comments` | all statuses (`?status=`, `?q=`) |
| POST | `/admin/content/hide` / `restore` / `delete` | `{type, id, reason?}` |
| POST | `/admin/content/close` / `reopen` | `{question_id, reason}` |
| POST | `/admin/content/restore-deleted` | undo a soft delete |
| GET/POST | `/admin/reports`, `/admin/reports/{id}/status` | moderation queue; status + optional action (`hide`/`delete`/`warn`) |
| GET | `/admin/users` | search/filter users |
| POST | `/admin/users/{id}/role` | **admin only**; cannot demote the last admin |
| POST | `/admin/users/{id}/verify` / `revoke-verification` | admin only; verification types |
| POST | `/admin/users/{id}/suspend` / `unsuspend` | admin only; cannot self-suspend |
| CRUD | `/admin/categories*`, `/admin/tags*` | admin only; tag merge supported |
| CRUD | `/admin/badges*`, `/admin/badges/{id}/award` | admin only; manual badge award by username |
| GET/PUT | `/admin/reputation-rules*` | admin only; point values and enable flags |
| GET/PUT | `/admin/settings` | site name/description/support URL etc. |
| GET/POST | `/admin/leaderboard`, `/admin/leaderboard/finalize` | snapshot + close a month |

## Rate limits

| Limiter | Applied to | Limit |
| --- | --- | --- |
| `api` | everything | 60/min per user (or IP) |
| `auth` | register, login, password reset, resend verification | 10/min per IP |
| `write` | ask, answer, comment, vote, upload | 20/min per user |
| `search` | `/search` | 30/min |
| `reports` | `/reports` | 5/min |
