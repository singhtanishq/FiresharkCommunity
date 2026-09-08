# FireShark Community

A production-ready technical Q&A community platform for FireShark — built with **React 18 + TypeScript + Vite** frontend, **Laravel 11 + PHP 8.3** API backend, **MySQL 8** database, **Sanctum** cookie authentication, and **ZeptoMail** for transactional emails. No AI — fully human-driven.

**Target domain:** `community.fireshark.in` (coexists with `fireshark.in` WordPress site)

---

## What's Inside

| Area | Highlights |
| --- | --- |
| Questions & answers | Markdown editor with preview, image uploads, slugs, revisions, drafts |
| Voting | Up/down votes, one vote per user, self-vote blocked, score sync, reputation effects |
| Accepted answers | Author accepts/staff override, one accepted at a time, solved status |
| Reputation | Append-only ledger (`reputation_transactions`), admin-configurable rules |
| Badges | Automatic (criteria-based) + manual (instructor/professional) badges |
| Leaderboard | Live monthly board from the reputation ledger, monthly finalize + history |
| Notifications | Database notifications with per-user preferences, mentions (`@username`), bookmarks, follows |
| Moderation | Reports queue, hide/restore/close/delete, suspension, full audit trail |
| Admin | Dashboard stats, users, roles, verifications, suspensions, categories, tags, badges, reputation rules, settings, leaderboard finalization |
| SEO | Server-injected meta + canonical + OG/Twitter tags, **QAPage JSON-LD**, `sitemap.xml`, `robots.txt` |
| Security | CSRF, XSS sanitisation, policies, rate limiting, upload validation, audit trail |

---

## Quick Start (Local Development)

### Prerequisites
- PHP 8.3+ with `pdo_mysql`, `mbstring`, `openssl`, `gd`, `exif`, `curl`, `zip`
- Composer 2
- Node.js 20+ and npm
- MySQL 8+ — either local or Docker

```bash
# 1. Database (choose one)
docker compose up -d mysql          # option A
mysql -uroot -e "CREATE DATABASE fireshark_community CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"  # option B

# 2. Backend
cd backend
cp .env.example .env
# Edit .env with your DB credentials, set FRONTEND_URL=http://localhost:5173
composer install
php artisan key:generate
php artisan migrate --seed           # categories, badges, reputation rules, settings
php artisan storage:link
php artisan community:create-admin
php artisan serve                    # http://localhost:8000

# 3. Frontend (development)
cd ../frontend
npm install
npm run dev                          # http://localhost:5173 (proxies /api to :8000)

# Optional: seed development content (6 users + 10 realistic Q&A)
php artisan migrate:fresh --seed --seeder=DevelopmentSeeder
```

**Dev logins:** `admin@fireshark.test` / `Password123!` (admin), `riya` (regular), `meera` (moderator), `arjun` (verified instructor), `devp`, `karan`.

---

## Production Build & Deployment (Hostinger + Cloudflare)

```bash
./deployment/build-production.sh
```

This compiles the React app into `backend/public/build` and optimises Laravel. Upload `backend/` to Hostinger, create the subdomain `community.fireshark.in` pointing to `~/community/public`, run migrations + seeders, configure Cloudflare DNS (A record to Hostinger IP, Proxy **On**, SSL **Full (strict)**). See [deployment-hostinger.md](deployment-hostinger.md) and [cloudflare.md](cloudflare.md) for step-by-step guides.

---

## Architecture Overview

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
│  PHP 8.3 / Laravel    │
└───────────┬───────────┘
     ┌──────┴──────┐
     ▼             ▼
React Build      Laravel REST API
(public/build)   (/api/v1/*)
     └──────┬──────┘
            ▼
         MySQL 8+
```

Single origin serves both the compiled React SPA and the Laravel API — same-origin cookies + CSRF work out of the box.

---

## Key Features Implemented

### Authentication (OTP-based, ZeptoMail)
- **Login**: Password → OTP (5 min TTL, 5 attempts → 15 min lock)
- **Signup**: Name+Username → Email OTP → Password
- **Password reset**: Email → OTP → Short-lived reset token → New password
- **ZeptoMail** for all transactional emails (dev logs OTPs when `APP_ENV=local`)

### Security
- Sanctum SPA cookie auth (HttpOnly, SameSite=Lax, Secure in prod)
- CSRF on every mutation, strict `$fillable`, policies, rate limiters
- Login: 5 wrong passwords → 15 min lock; OTP: 5 wrong codes → 15 min lock
- Distributed brute-force: IP + account + endpoint rate limiters
- Uploads: PNG/JPG/WEBP ≤5 MB, GD re-encode, random names, `media` table for moderation
- OTPs stored as bcrypt hash, single-use, invalidated on new issue

### Content & Engagement
- Questions/Answers/Comments in Markdown (sanitised via DOMPurify + `marked`)
- Voting: up/down, toggle, flip, self-vote blocked, reputation sync
- Accepted answers: author + staff override, reputation +15, solved badge
- Comments on Q/A, mentions (`@username`), bookmarks, follows, notifications
- Monthly leaderboard (reputation + counts), historical snapshots

### Admin & Moderation
- Reports queue with actions (hide/delete/warn/dismiss)
- Content moderation: hide/restore/close/delete/restore
- Users: roles, verify badges, suspend/unsuspend, last-admin protection
- Categories/tags: CRUD, merge tags, reorder, counts
- Badges/reputation: editable rules, manual award
- Leaderboard: monthly finalize, history preserved

### SEO & Performance
- Server-rendered `<head>` per public route (title, canonical, OG, Twitter, **QAPage JSON-LD**)
- `sitemap.xml` (questions, categories, tags, public profiles)
- `robots.txt` disallows `/admin`, `/api`, auth, settings
- Production: Laravel serves compiled `public/build` assets (hashed, manifest)
- No Node runtime in production

---

## Testing

```bash
# Backend (66 feature tests, 220 assertions)
cd backend && php artisan test

# Frontend typecheck
cd ../frontend && npx tsc -b

# Production build
npm run build
```

---

## Documentation Index

- [Architecture](docs/architecture.md) — system design, request flow, backend layering
- [Database](docs/database.md) — schema, indexes, polymorphic map, seeding
- [API Reference](docs/api.md) — endpoints, payloads, rate limits
- [Local Development](docs/local-development.md) — setup, daily commands, troubleshooting
- [Testing](docs/testing.md) — test matrix, coverage map, E2E checklist
- [Deployment (Hostinger)](docs/deployment-hostinger.md) — 14-step guide
- [Cloudflare Config](docs/cloudflare.md) — DNS, SSL, cache rules
- [Security](docs/security.md) — threat model, checklist, audit log
- [Administration](docs/administration.md) — moderator/admin handbook
- [Community Rules](docs/community-rules.md) — public guidelines source

---

## License

Proprietary — FireShark. All rights reserved.
