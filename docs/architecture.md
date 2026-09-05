# Architecture

## System overview

```
              ┌───────────────────────┐
              │      Cloudflare       │
              │    DNS + CDN + SSL    │
              └───────────┬───────────┘
                          ▼
             community.fireshark.in
                          ▼
              ┌───────────────────────┐
              │  Hostinger (shared)   │
              │  PHP 8.3+ / Laravel   │
              └───────────┬───────────┘
                ┌─────────┴──────────┐
                ▼                    ▼
        React production     Laravel REST API
        build (public/build) /api/v1/*
                └─────────┬──────────┘
                          ▼
                       MySQL 8+
```

One origin serves both the compiled React application and the Laravel API. That keeps
authentication cookie-based and same-origin, avoiding CORS entirely.

## Request flow

1. **SPA routes** (`/`, `/questions/{slug}`, `/categories/{slug}`, ...) hit Laravel web
   routes. `SpaController` renders `resources/views/spa.blade.php`, injecting per-page
   `<title>`, meta description, canonical, Open Graph / Twitter tags and — for question
   pages — the **QAPage JSON-LD** built from the published question and answers.
2. **Client-side navigation** after the initial load happens entirely in React; the API is
   consumed with `fetch`/axios via `/api/v1/*`.
3. **API routes** (`routes/api.php`) are wrapped in Sanctum's
   `EnsureFrontendRequestsAreStateful` so first-party requests share the session
   (`StartSession`, CSRF validation and cookies are applied by Sanctum's stateful pipeline).
4. Assets are served from `public/build` using hashed filenames from the Vite manifest
   (`App\Support\ViteManifest`), so no Node runtime is needed in production.

During local development the Vite dev server (port 5173) proxies `/api`, `/sanctum` and
`/storage` to Laravel (port 8000) with `changeOrigin`, so the browser behaves as if it were
the same origin — identical to production semantics.

## Backend layering

```
routes/api.php
  └── Controllers (thin: validation in, resource out)
        ├── Form Requests        validation rules per action
        ├── Policies             authorization (Question/Answer/Comment policies,
        │                        'role:' middleware for staff-only routes)
        └── Services             all business logic
              ├── QuestionService    create/update, slugs + slug history, revisions, tags
              ├── AnswerService      create, accept/unaccept
              ├── CommentService     polymorphic comments + notifications
              ├── VoteService        cast/flip/toggle, score + reputation sync
              ├── ReputationService  ledger writes + cached totals, rollback helpers
              ├── BadgeService       criteria evaluation, grant-once
              ├── LeaderboardService live monthly computation (cached), finalize snapshots
              ├── NotificationService preference-aware notification dispatch
              ├── MentionService     @username resolution
              ├── ModerationService  hide/restore/close/delete/suspend + audit log
              ├── SearchService      MySQL full-text with tokenised LIKE fallback
              └── SeoService         meta + QAPage schema builders
```

Controllers never mutate state directly — every meaningful action goes through a service,
which keeps controllers readable and logic testable.

### Counter strategy

Denormalised counters (`questions_count`, `answers_count`, `reputation`, ...) are cached
aggregates maintained inside the same database transactions as the primary writes. All
decrements are clamped with `GREATEST(CAST(col AS SIGNED) + delta, 0)` so data can never
underflow an unsigned column.

### Reputation as the single source of truth

`users.reputation` is a cached total derived from `reputation_transactions`. Every point
change (posting, votes, acceptance, moderation penalties, deletion rollbacks) is a ledger
row, which makes reputation auditable and reversible.

### Leaderboard strategy

- **Current month** — computed from indexed ledger/content queries and cached for 10
  minutes; no global ranking work happens per page view.
- **History** — the scheduler finalises each month (`community:finalize-leaderboard`),
  snapshotting ranked entries into `leaderboard_entries`.

## Frontend structure

```
frontend/src/
├── api/          axios client (CSRF handling) + typed endpoint wrappers
├── context/      AuthContext (session, unread notification count)
├── components/
│   ├── ui/       Avatar, Modal, ConfirmDialog, Pagination, states (spinner/empty/error)
│   ├── content/  RichText (sanitised markdown), RichTextEditor, VoteControl,
│   │             QuestionCard, ReportModal, AuthorLine
│   └── layout/   Header, Footer, Layout shell
├── pages/        one file per screen (public, auth, user, admin)
└── styles/       design-system CSS (custom properties, no framework)
```

Routes are code-split with `React.lazy`; the initial bundle contains the layout, home,
questions list/detail and ask screen only.

## Key design decisions

- **No AI anywhere.** No AI services, tables or configuration exist; search is MySQL
  full-text. (Specification requirement — see docs/security.md for the review.)
- **Cookie sessions over tokens.** Single-origin deployment makes Sanctum SPA cookie mode
  the simplest secure option; no tokens live in JavaScript.
- **Markdown, not rich HTML.** Content is stored as markdown and sanitised with DOMPurify
  at render time (`marked` + allowlist). The backend never trusts raw HTML.
- **Polymorphic votes/comments/reports** (`question`, `answer`, `comment` morph map) keep
  one table per concern instead of per-content-type tables.
- **Server-injected SEO for a SPA.** The critical public pages get real `<head>` content and
  QAPage structured data from Laravel while remaining a React app client-side.
