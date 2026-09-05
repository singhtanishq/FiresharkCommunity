# Database

MySQL 8+ is the only datastore. All schema is created by Laravel migrations
(`php artisan migrate`); nothing is hand-written in production.

## Tables

| Table | Purpose |
| --- | --- |
| `users` | Accounts: identity, `role` enum (`user`/`moderator`/`admin`), cached reputation and content counters, suspension state, notification preferences |
| `password_reset_tokens`, `sessions` | Laravel-native auth infrastructure (database session driver) |
| `categories` | Editable taxonomy; `questions_count` cache; soft deletes |
| `tags` | Normalised tags; `questions_count` cache; `created_by` for audit |
| `question_tags` | Pivot, composite PK |
| `questions` | Core entity: title/slug/body (markdown), `status` enum (`draft`/`pending`/`published`/`hidden`/`closed`), views/votes/answers counters, `accepted_answer_id`, close reason, soft deletes, FULLTEXT(title, body) |
| `question_slugs` | Old slugs for 301-style redirects after title changes (SEO-safe) |
| `question_revisions` | Old/new title + body per edit, with editor attribution |
| `answers` | Answer bodies, `status` (`published`/`hidden`), `accepted_at`, votes score, FULLTEXT(body) |
| `comments` | Polymorphic on question/answer, length-capped bodies |
| `votes` | Polymorphic up/down votes; UNIQUE(user, type, id) — duplicate votes impossible at the schema level |
| `bookmarks` | Private per-user question saves, UNIQUE(user, question) |
| `question_followers` | Follow-for-notifications, UNIQUE(question, user) |
| `badges` | Badge catalogue: tier, `award_type` (`automatic`/`manual`), JSON criteria |
| `user_badges` | Grant record, UNIQUE(user, badge) — never awarded twice |
| `reputation_rules` | Admin-editable point values per action (no hard-coded reputation) |
| `reputation_transactions` | Append-only reputation ledger; morphTo source for rollback |
| `leaderboard_periods` | Monthly windows, `active`/`finalized` |
| `leaderboard_entries` | Finalized snapshots with rank + per-metric counts |
| `notifications` | Laravel database notifications (types are plain strings in `data`) |
| `reports` | Polymorphic report queue: reason enum, status enum, moderator resolution |
| `moderation_actions` | Audit trail of every significant moderation action |
| `media` | Uploaded image registry (path, mime, size, dimensions) for cleanup/abuse tracking |
| `user_verifications` | Admin-controlled verification badges (`team`/`instructor`/`expert`/`alumni`/`professional`), revocable |
| `settings` | Key/value site settings (site name, descriptions, toggles) |
| `cache`, `jobs`, `failed_jobs`, `personal_access_tokens` | Laravel infrastructure (database cache + queue drivers, no Redis) |

## Polymorphic type map

A morph map enforces short, stable type names (`question`, `answer`, `comment`, `user`)
instead of fully-qualified class names — registered in `AppServiceProvider`.

## Indexing (query-pattern driven)

- `questions`: unique slug; `(status, category_id)`-style filters; `created_at`, `views`,
  `votes_score`, `last_activity_at` for sorts; FULLTEXT(title, body) for search.
- `answers`: `(question_id, created_at)`, `user_id`, FULLTEXT(body).
- `comments`/`votes`/`reports`: morph indexes plus status/date composites.
- `reputation_transactions`: `(user_id, created_at)` — powers the live monthly leaderboard.
- `leaderboard_entries`: `(period_id, rank)` and UNIQUE `(period_id, user_id)`.
- `notifications`: `(user_id, read_at, created_at)` via Laravel's morph index.

## Seeding

- `php artisan db:seed` — **safe, production-ready**: 16 categories, 9 badges,
  8 reputation rules, base settings. No fake users, no fake questions.
- `php artisan db:seed --class=DevelopmentSeeder` — **development only** (refuses to run in
  production): 6 test users + realistic Q&A content created *through the real services* so
  reputation, badges, counters and notifications are exercised honestly.

## Counter columns vs. queries

Denormalised counters (`questions_count`, `answers_count`, `reputation`, tag/category
counts) are updated in the same transaction as the underlying write and clamped at zero.
They exist to keep list pages off `COUNT(*)` queries. The reputation ledger remains the
authoritative record; `users.reputation` is its cached total.

## Conventions

- Foreign keys with explicit `cascadeOnDelete` / `restrictOnDelete` per relationship
  (e.g. deleting a category with questions is blocked in the UI and DB).
- `enum` columns for closed vocabularies; PHP backed enums mirror them (`App\Enums`).
- Soft deletes on all user content, so moderation can restore and revisions remain.
