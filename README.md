# FireShark Community

A production-ready technical Q&A community for FireShark — ask questions, share knowledge,
build expertise. Built as an independent FireShark product (not a clone of any reference
platform), targeting `community.fireshark.in`.

**Stack:** React 19 + TypeScript + Vite · Laravel 13 (PHP 8.3+) · MySQL 8+ · Sanctum cookie
authentication · No AI — fully human-driven.

---

## What is inside

| Area | Highlights |
| --- | --- |
| Questions & answers | Markdown editor with preview + image uploads, slugs, revisions, slug-redirects, drafts |
| Voting | Up/down votes, one vote per user, self-vote blocked, score sync, reputation effects |
| Accepted answers | Author accepts/staff override, one accepted at a time, solved status |
| Reputation | Append-only ledger (`reputation_transactions`), admin-configurable rules |
| Badges | Automatic (criteria-based) + manual (instructor/professional) badges |
| Leaderboard | Live monthly board from the reputation ledger, monthly finalize + history |
| Notifications | Database notifications with per-user preferences, mentions (`@username`) |
| Moderation | Reports queue, hide/restore/close/reopen/delete, suspension, full audit trail |
| Admin | Dashboard stats, users, content, categories/tags, badges, reputation rules, settings |
| SEO | Server-rendered meta + canonical + OG/Twitter, **QAPage JSON-LD**, `sitemap.xml`, `robots.txt` |
| Security | CSRF, XSS sanitisation, policies, rate limiting, upload validation, security headers |

## Repository layout

```
fireshark-community/
├── backend/               Laravel API + SEO layer + compiled-SPA host
├── frontend/              React (Vite + TypeScript) application
├── docs/                  Architecture, API, database, deployment, security docs
├── deployment/            Production build helper script
├── docker-compose.yml     Local MySQL (+ Adminer) — development convenience only
└── README.md
```

## Quick start (local)

Prerequisites: PHP 8.3+ (with gd, pdo_mysql, mbstring), Composer, Node 20+, MySQL 8+
(local server or `docker compose up -d mysql`).

```bash
# 1. Backend
cd backend
cp .env.example .env                 # then edit DB_* + APP_KEY
composer install
php artisan key:generate
php artisan migrate --seed           # categories, badges, reputation rules, settings
php artisan storage:link
php artisan serve                    # http://localhost:8000

# 2. Frontend (development)
cd ../frontend
npm install
npm run dev                          # http://localhost:5173 (proxies /api to :8000)

# 3. First administrator
cd ../backend
php artisan community:create-admin
```

Optional sample content for local development only:

```bash
php artisan migrate:fresh --seed --seeder=DevelopmentSeeder
# Dev accounts all use password: Password123!  (admin@fireshark.test, riya@, meera@, ...)
```

Set `REQUIRE_EMAIL_VERIFICATION=false` in `backend/.env` if you want to test before
configuring SMTP; otherwise verification emails are written to `storage/logs/laravel.log`
with the `log` mailer.

## Production build (single origin)

```bash
./deployment/build-production.sh
```

This compiles the React app into `backend/public/build` and optimises Laravel. Laravel then
serves the SPA shell (with server-injected SEO metadata) and the `/api/*` routes from one
origin — exactly the deployment model used on Hostinger. See
[docs/deployment-hostinger.md](docs/deployment-hostinger.md) and
[docs/cloudflare.md](docs/cloudflare.md).

## Documentation

- [docs/architecture.md](docs/architecture.md) — system design and request flow
- [docs/database.md](docs/database.md) — schema, indexes, seeding
- [docs/api.md](docs/api.md) — REST endpoint reference
- [docs/local-development.md](docs/local-development.md) — day-to-day development
- [docs/testing.md](docs/testing.md) — test suite and how to run it
- [docs/deployment-hostinger.md](docs/deployment-hostinger.md) — step-by-step hosting setup
- [docs/cloudflare.md](docs/cloudflare.md) — DNS, proxy and SSL configuration
- [docs/security.md](docs/security.md) — security model and review checklist
- [docs/administration.md](docs/administration.md) — admin and moderator handbook
- [docs/community-rules.md](docs/community-rules.md) — the public guidelines source

## License / ownership

Proprietary — FireShark. All rights reserved.
