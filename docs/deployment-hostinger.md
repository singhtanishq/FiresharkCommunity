# Deployment — Hostinger shared hosting

Target: `community.fireshark.in` on existing Hostinger shared hosting, behind Cloudflare.
Production needs **PHP 8.3+, MySQL, Composer (or a packaged vendor dir) and cron — nothing
else**. No Node runtime, Docker, Redis, Elasticsearch or Supervisor is required.

> Do the Cloudflare DNS step last (see [cloudflare.md](cloudflare.md)) so the domain only
> goes live once the app is ready.

## 0. Host requirements checklist (spec § 123)

- [ ] PHP ≥ 8.3 with `pdo_mysql`, `mbstring`, `openssl`, `gd`, `exif`, `curl`, `zip`
- [ ] MySQL database available in hPanel
- [ ] SSH access (Hostinger provides it on shared plans)
- [ ] Cron available (hPanel → Advanced → Cron Jobs)
- [ ] Writable `storage/` and `bootstrap/cache/`
- [ ] Subdomain `community.fireshark.in` createable with a custom document root

## 1. Build the release package (on your machine)

```bash
git clone <repo> && cd fireshark-community
./deployment/build-production.sh
```

The script:

1. `npm ci && npm run build` in `frontend/` → compiles the React app into
   `backend/public/build` with a manifest.
2. `composer install --no-dev --optimize-autoloader` in `backend/`.

If the Hostinger plan has no SSH/Composer, upload `backend/vendor/` with the package
instead of running composer on the server.

## 2. Create the database (hPanel)

1. hPanel → Databases → **MySQL Databases** → create e.g. `u123456789_community` with a
   dedicated user and a strong password. Note the host (usually `localhost`), name, user,
   password.

## 3. Create the subdomain (hPanel)

1. hPanel → Websites → **Subdomains** → create `community.fireshark.in`.
2. Point its **document root** at a directory such as `~/community` (create it in the next
   step). Keep `fireshark.in` (WordPress) untouched.
3. Enable the free Hostinger SSL certificate for the subdomain (SSL → install). Cloudflare
   Full (strict) needs this origin certificate to be valid.

## 4. Upload the application

Upload the **contents of `backend/`** (via File Manager or `rsync`/SFTP — not git) into
`~/community`, so that `~/community/public` exists.

```bash
rsync -avz --exclude storage/logs --exclude .env ./backend/ user@server:~/community/
```

## 5. Configure the environment

```bash
cd ~/community
cp .env.example .env
nano .env
```

Set at minimum:

```ini
APP_ENV=production
APP_DEBUG=false
APP_URL=https://community.fireshark.in
DB_DATABASE=<hpanel db name>
DB_USERNAME=<hpanel db user>
DB_PASSWORD=<hpanel db password>
SESSION_DOMAIN=fireshark.in
SANCTUM_STATEFUL_DOMAINS=community.fireshark.in
FRONTEND_URL=https://community.fireshark.in
REQUIRE_EMAIL_VERIFICATION=true
MAIL_*        # Hostinger SMTP credentials for community@fireshark.in
```

Then:

```bash
php artisan key:generate --force
```

## 6. Migrate & seed (first deploy only)

```bash
php artisan migrate --force          # NEVER migrate:fresh in production
php artisan db:seed --force          # categories, badges, reputation rules, settings
php artisan storage:link
```

## 7. Create the first administrator

```bash
php artisan community:create-admin   # prompts interactively; password input hidden
```

## 8. Point the document root at /public

hPanel → Subdomains → `community.fireshark.in` → document root →

```
/home/u123456789/community/public
```

If the panel cannot set a nested document root, use the fallback arrangement: move the
app to `~/community-app` and place a small `index.php` shim in the subdomain root
(`~/community`) containing:

```php
<?php
require __DIR__.'/../community-app/vendor/autoload.php';
$app = require_once __DIR__.'/../community-app/bootstrap/app.php';
$app->handleRequest(Illuminate\Http\Request::capture());
```

Never expose `.env`, `storage/`, `tests/` or git metadata to the web root.

## 9. Permissions

```bash
chmod -R u+rwX storage bootstrap/cache
# The PHP user (usually the account owner on shared hosting) needs write access only there.
```

## 10. Production optimisation

```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

Re-run these after every deploy (and `php artisan optimize:clear` first while deploying).

## 11. Cron (leaderboard + housekeeping)

hPanel → Advanced → Cron Jobs → every minute:

```
cd /home/u123456789/community && /usr/bin/php artisan schedule:run >> /dev/null 2>&1
```

The scheduler only fires the leaderboard finalization (1st of the month, 00:10) and
model pruning — it is safe to run every minute. If cron is unavailable, an admin can
finalize months manually in **Admin → Settings & leaderboard**.

## 12. Post-deploy verification checklist (spec § 99)

- [ ] `https://community.fireshark.in/` loads with no mixed-content warnings
- [ ] Register → verification email arrives → verify → login
- [ ] Ask a question, answer, vote, accept — counters and reputation move
- [ ] Image upload works and lands in `storage/app/public/media`
- [ ] `/api/v1/questions` returns JSON; unauthenticated admin calls return 401/403
- [ ] `/sitemap.xml` lists the homepage, questions, categories, tags
- [ ] `/robots.txt` disallows `/admin`, `/api`, auth and settings pages
- [ ] A question page's view-source contains the title, canonical, OG tags and QAPage JSON-LD
- [ ] 404 page renders for unknown slugs; no Laravel stack traces visible (`APP_DEBUG=false`)
- [ ] Cloudflare proxy shows a valid certificate (Full strict)

## 13. Updating the deployment

```bash
# Local:
git pull && ./deployment/build-production.sh
# Upload backend/ (excluding .env, storage) + restart nothing (PHP-FPM handles it)
# On the server:
php artisan migrate --force && php artisan optimize:clear && php artisan config:cache && php artisan route:cache && php artisan view:cache
```

## 14. Backups (spec § 96)

- **Database**: hPanel → Databases → daily/weekly backups, or a cron `mysqldump` to
  `~/backups`. Test restores quarterly.
- **Uploads**: include `storage/app/public` (media + avatars) in the backup rotation.
- **Code**: the Git repository is the source of truth — it is *not* a database backup.
- **Secrets**: `.env` lives only on the server; keep a copy in the team's secret manager.
