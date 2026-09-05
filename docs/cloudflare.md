# Cloudflare configuration

FireShark DNS is authoritative at Cloudflare. **Do not move nameservers to Hostinger** —
Hostinger only hosts the origin.

## 1. DNS record

Cloudflare dashboard → `fireshark.in` → DNS → add:

| Type | Name | Target | Proxy |
| --- | --- | --- | --- |
| A | `community` | `<Hostinger server IP>` | Proxied (orange cloud) |

- Get the exact server IP from hPanel → Hosting → Plan details. Never invent it.
- No CNAME flattening or extra records are needed; the same Hostinger server can host both
  `fireshark.in` (WordPress) and `community.fireshark.in` (this app).

## 2. SSL/TLS mode

SSL/TLS → Overview → **Full (strict)**.

- Requires a valid certificate on the Hostinger origin (install Hostinger's free SSL for
  the subdomain first, per the deployment guide).
- **Do not use Flexible** — it causes redirect loops and mixed-content risk.

## 3. Recommended Cloudflare settings

| Setting | Value | Why |
| --- | --- | --- |
| Always Use HTTPS | On | Enforce TLS |
| Automatic HTTPS Rewrites | On | Mixed-content safety net |
| Brotli | On | Faster asset transfer |
| Cache Rule: `*community.fireshark.in/build/*` | Cache Everything, 1 year | Hashed Vite assets are immutable |
| Cache Rule: bypass `/api/*` and `/admin/*` | Bypass | Dynamic + private |
| Page Rule/Rule: `/sitemap.xml` | Bypass or short cache | Should reflect new questions quickly |
| Bot Fight Mode | On (evaluate at launch) | Spam pressure reduction |
| WAF managed rules | On | Baseline protection |

Upload size note: Cloudflare's free-plan request body limit is 100 MB — image uploads are
capped at 5 MB by the app anyway.

## 4. Launch sequence

1. Complete the Hostinger deployment (see [deployment-hostinger.md](deployment-hostinger.md))
   and verify the origin directly (hosts-file test or the temporary Hostinger subdomain).
2. Add the Cloudflare DNS record above (proxied).
3. Wait for the certificate to be active (Cloudflare → SSL/TLS → Edge Certificates).
4. Browse `https://community.fireshark.in/` — padlock, no mixed content.
5. Verify: login works (cookies with the proxied domain), question pages expose QAPage
   JSON-LD (view-source), `/sitemap.xml` resolves, admin console is reachable and all
   Cloudflare cache rules behave.

## 5. Things that must never change

- Nameservers stay on Cloudflare.
- `SANCTUM_STATEFUL_DOMAINS=community.fireshark.in` and `SESSION_DOMAIN=fireshark.in` in
  the production `.env` must match the proxy setup — the SPA and API share one origin.
- Do not enable "Rocket Loader"; it breaks module loading order for SPAs.
