# Local development

## Prerequisites

- PHP 8.3+ with `pdo_mysql`, `mbstring`, `openssl`, `gd`, `exif`
- Composer 2
- Node.js 20+ and npm
- MySQL 8+ — either a local server or Docker (`docker compose up -d mysql` from the repo root)

## First-time setup

```bash
# Database (choose one)
docker compose up -d mysql          # option A
mysql -uroot -e "CREATE DATABASE fireshark_community CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"  # option B

cd backend
cp .env.example .env
# For local development adjust:
#   APP_ENV=local, APP_DEBUG=true, APP_URL=http://localhost:8000
#   FRONTEND_URL=http://localhost:5173
#   SANCTUM_STATEFUL_DOMAINS=localhost:5173,127.0.0.1:5173,localhost:8000,127.0.0.1:8000
#   SESSION_DOMAIN=localhost
#   REQUIRE_EMAIL_VERIFICATION=false   (until SMTP is configured)
composer install
php artisan key:generate
php artisan migrate --seed
php artisan storage:link
php artisan community:create-admin
php artisan serve                   # http://localhost:8000
```

```bash
cd frontend
npm install
npm run dev                         # http://localhost:5173
```

Open http://localhost:5173 — the Vite dev server proxies `/api`, `/sanctum` and `/storage`
to Laravel, so session cookies and CSRF work exactly as they will in the single-origin
production deployment.

## Everyday commands

| Command | Purpose |
| --- | --- |
| `php artisan serve` | Laravel dev server on :8000 |
| `npm run dev` (in `frontend/`) | Vite dev server on :5173 with HMR |
| `php artisan test` | full backend test suite (uses `fireshark_community_test`) |
| `php artisan migrate:fresh --seed --seeder=DevelopmentSeeder` | reset with realistic dev content |
| `php artisan db:seed` | safe baseline data only (categories, badges, rules, settings) |
| `php artisan community:create-admin` | create/replace an administrator |
| `php artisan community:finalize-leaderboard [YYYY-MM]` | snapshot + close a leaderboard month |
| `php artisan schedule:run` | run due scheduled tasks (cron in production) |
| `npm run build` (in `frontend/`) | production bundle into `../backend/public/build` |

## Development data

`DevelopmentSeeder` creates six users (password `Password123!`):
`admin@fireshark.test` (admin, username `tanishq`), `meera` (moderator), `arjun`
(verified instructor), `riya`, `devp`, `karan` — plus ten realistic questions with
answers, comments and votes generated through the real services.

## Email in development

`MAIL_MAILER=log` writes every message (verification links, password resets) to
`backend/storage/logs/laravel.log`. Copy the link into the browser to complete the flow,
or set `REQUIRE_EMAIL_VERIFICATION=false` to skip verification entirely while building.

## Production-parity check

After `npm run build`, Laravel on :8000 serves the compiled SPA itself — open
http://localhost:8000 (not :5173) to verify the production shell, asset loading and the
server-injected SEO tags (`view-source:` shows title/canonical/OG/QAPage JSON-LD).

## Troubleshooting

- **419 on login/register** — the CSRF cookie is missing. Any GET to `/api/v1/*` through
  the Vite proxy establishes it; the axios client does this automatically before mutations.
- **401 after login** — `SANCTUM_STATEFUL_DOMAINS` must include the origin the browser is
  actually on (for dev: `localhost:5173`).
- **Images don't load** — run `php artisan storage:link`.
- **Full-text search returns nothing for new rows** — InnoDB full-text indexes update on
  commit; this only affects rows inside open transactions (e.g. tests), never production.
