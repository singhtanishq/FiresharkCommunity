# Security

> **FireShark Community is a cybersecurity-focused technical community designed to be publicly reviewable, security-conscious, and resistant to common web application abuse.**
>
> Security is not treated as a single feature or a checkbox. The platform uses multiple independent layers across authentication, authorization, input validation, database access, session security, abuse prevention, email protection, file handling, content rendering, transport security, logging, moderation, and operational deployment.
>
> A failure or bypass of one defensive layer is not intended to automatically result in unrestricted access to the application or uncontrolled resource consumption.

---

## Security Philosophy

FireShark Community follows a **defense-in-depth** security model.

The application assumes that:

- Client-side controls can be bypassed.
- API endpoints can be called directly without using the React interface.
- Attackers may automate requests.
- Authentication endpoints are high-value abuse targets.
- Email delivery is a billable external resource and must therefore be protected.
- User-generated content must be treated as untrusted input.
- Uploaded files must be treated as potentially malicious.
- Authorization must never depend on the frontend.
- Database integrity must not depend on application UI restrictions.
- Production deployment procedures must explicitly avoid destructive database operations.
- Logging must provide useful forensic information without leaking credentials or secrets.

The resulting architecture applies security controls at multiple layers:

```text
Internet
   │
   ▼
Cloudflare / TLS / Edge Protection
   │
   ▼
Laravel Public Application
   │
   ├── Security Headers
   ├── Session / CSRF Protection
   ├── Authentication
   ├── Rate Limiting
   ├── OTP Controls
   ├── Email Budget Controls
   ├── Authorization / Policies
   ├── Input Validation
   ├── Upload Validation
   ├── Content Sanitization
   ├── Audit Logging
   │
   ▼
MySQL
   │
   ├── Constraints
   ├── Unique Indexes
   ├── Transactional Operations
   └── Persistent Security / Audit Data
````

---

# 1. Security Architecture

The production application consists of:

| LayerTechnology / Control |                                           |
| ------------------------- | ----------------------------------------- |
| Edge / DNS                | Cloudflare                                |
| Transport                 | HTTPS / TLS                               |
| Web application           | Laravel                                   |
| Backend language          | PHP 8.4+                                  |
| Frontend                  | React + TypeScript                        |
| Authentication            | Laravel Sanctum SPA cookie authentication |
| Database                  | MySQL                                     |
| Sessions                  | Database-backed Laravel sessions          |
| Cache                     | Database-backed Laravel cache             |
| Queue                     | Database-backed Laravel queue             |
| Email                     | ZeptoMail                                 |
| Content format            | Markdown                                  |
| HTML sanitization         | DOMPurify                                 |
| Image processing          | GD                                        |
| Authorization             | Roles + middleware + Policies             |
| Abuse prevention          | Multiple Laravel rate limiters            |
| Email abuse prevention    | Multi-layer email budget system           |
| CAPTCHA readiness         | Cloudflare Turnstile backend verification |
| Auditability              | Application and moderation logs           |

The application does not rely on a third-party forum engine or an external hosted community platform for its core security model.

---

# 2. Authentication Security

Authentication is implemented server-side using Laravel and Laravel Sanctum.

## 2.1 Password Authentication

Passwords are:

- Never stored in plaintext.
- Never intentionally logged.
- Hashed using Laravel's configured password hashing mechanism.
- Compared server-side.
- Never trusted from client-side state.
- Never accepted as a replacement for the server-side authentication process.

Sensitive password-related fields are not exposed through normal API responses.

---

## 2.2 Login Flow

The login process uses a two-stage authentication flow:

```text
Email / Username
       │
       ▼
Password Verification
       │
       ├── Invalid → Generic authentication error
       │
       ▼
OTP Challenge
       │
       ▼
OTP Verification
       │
       ▼
Authenticated Sanctum Session
```

The application supports login using:

- Email address
- Username

Authentication failures are deliberately normalized so that an attacker cannot easily determine whether a particular account exists based solely on the response.

---

## 2.3 OTP-Based Authentication

OTP verification is used as an additional authentication step after successful password verification.

OTP security includes:

- Short-lived OTP challenges.
- Single-use verification.
- Verification token/challenge association.
- Attempt restrictions.
- Expiration.
- Resend restrictions.
- Identifier-based throttling.
- IP-based throttling.
- Challenge invalidation where applicable.
- Protection against repeated automated OTP requests.

The objective is to prevent attackers from turning the OTP mechanism into an unrestricted email-delivery endpoint.

---

# 3. Authentication Rate Limiting

Authentication endpoints are protected by dedicated Laravel rate limiters.

The security model does not rely solely on one global request limit.

Different authentication operations use different controls.

| OperationProtection             |                       |
| ------------------------------- | --------------------- |
| Login start                     | `throttle:auth`       |
| Login OTP verification          | `throttle:auth`       |
| Login OTP resend                | `throttle:auth`       |
| Forgot password                 | `throttle:auth`       |
| Password-reset OTP resend       | `throttle:auth`       |
| Password-reset OTP verification | `throttle:auth`       |
| Password reset                  | `throttle:auth`       |
| Registration start              | `throttle:register`   |
| Registration OTP verification   | `throttle:otp.verify` |
| Registration completion         | `throttle:otp.verify` |
| Registration OTP resend         | `throttle:otp.resend` |
| Username availability           | `throttle:auth`       |
| Email verification resend       | `throttle:auth`       |

The currently implemented baseline limits include:

- Authentication: **10 requests/minute per IP**
- Registration: **5 requests/hour per IP**
- OTP verification: **10 requests/minute per IP/identifier**
- OTP resend: **3 requests/minute per IP**
- OTP resend identifier control: **8 requests/hour per identifier**
- Username checking: **20 requests/minute per IP**

These controls are independent of the email budget system described below.

---

# 4. Email Abuse Protection

## 4.1 Why Email Requires Its Own Security Layer

Authentication rate limiting alone is insufficient to protect an application that sends security emails.

For example:

```text
Attacker
   │
   ├── IP #1 ──┐
   ├── IP #2 ──┤
   ├── IP #3 ──┤
   ├── IP #4 ──┤
   └── IP #N ──┘
              │
              ▼
       Authentication API
              │
              ▼
          ZeptoMail
```

Distributed requests can potentially bypass a simplistic per-IP limiter.

FireShark Community therefore implements an additional **application-level email budget**.

---

# 5. Global Email Budget

All security-sensitive emails pass through the email budget mechanism **before the external email provider is called**.

Current hard limits:

| ScopeLimit                 |       |
| -------------------------- | ----- |
| Global hourly email budget | 500   |
| Global daily email budget  | 5,000 |

These are hard-stop limits.

Once the applicable budget is exceeded, the application rejects the email operation instead of continuing to call ZeptoMail.

This creates an application-level circuit breaker against uncontrolled email consumption.

---

# 6. Per-Endpoint Email Budgets

Email generation is additionally constrained according to the type of email being sent.

Current limits:

| Email operationHourly limit |     |
| --------------------------- | --- |
| Login OTP                   | 200 |
| Signup OTP                  | 100 |
| Password reset OTP          | 150 |
| Email verification resend   | 50  |

These limits prevent a single application feature from consuming the entire global email budget.

For example, even if another endpoint has available capacity, an attacker cannot simply concentrate all abuse against one email-generating operation indefinitely.

---

# 7. Per-IP Email Budgets

A separate email budget is maintained per source IP.

Current limit:

```text
50 security emails / hour / IP
```

This provides an additional protection layer even when individual endpoint limits have not yet been exhausted.

---

# 8. Per-Identifier Email Budgets

Email operations are also constrained by the relevant email/account identifier.

Current limit:

```text
10 security emails / hour / identifier
```

This prevents an attacker from repeatedly targeting one email address or account even when requests are distributed across multiple IP addresses.

---

# 9. Email Budget Enforcement Order

The email budget is checked **before ZeptoMail is called**.

Conceptually:

```text
Request
  │
  ▼
Authentication / Validation
  │
  ▼
Endpoint Rate Limit
  │
  ▼
OTP / Security Operation
  │
  ▼
Email Budget Check
  │
  ├── Budget exceeded
  │       │
  │       └── STOP
  │
  ▼
ZeptoMail
  │
  ▼
Email delivered
```

This distinction is critical.

The budget is not merely a reporting mechanism.

It actively prevents external email transmission after the configured budget has been exhausted.

---

# 10. Concurrency-Safe Email Counters

Email budgets are stored in the MySQL table:

```text
email_budget_counters
```

The implementation uses:

- A unique `bucket_key`.
- MySQL/InnoDB atomic operations.
- `INSERT ... ON DUPLICATE KEY UPDATE`.
- Persistent database-backed counters.
- Window start/end timestamps.
- Separate bucket types and scopes.

This is specifically designed to avoid a race condition such as:

```text
Request A → read count = 49
Request B → read count = 49
Request A → send
Request B → send
```

Instead, counter updates are serialized by the database.

The unique bucket constraint prevents duplicate counter rows for the same security bucket.

---

# 11. Email Budget Alerts

The email budget service also maintains alert thresholds.

Current alert thresholds:

| ScopeAlert threshold |       |
| -------------------- | ----- |
| Hourly               | 100   |
| Daily                | 1,000 |

At these thresholds, the application generates server-side security warnings while still allowing legitimate email traffic to continue.

The implementation currently logs these events and provides a designated integration point for future external monitoring.

---

# 12. Email Abuse Defense in Depth

The complete email-abuse model therefore combines:

```text
                 ┌──────────────────────┐
                 │ Authentication Limit │
                 └──────────┬───────────┘
                            │
                 ┌──────────▼───────────┐
                 │ Endpoint Limit       │
                 └──────────┬───────────┘
                            │
                 ┌──────────▼───────────┐
                 │ IP Email Budget      │
                 └──────────┬───────────┘
                            │
                 ┌──────────▼───────────┐
                 │ Identifier Budget     │
                 └──────────┬───────────┘
                            │
                 ┌──────────▼───────────┐
                 │ Endpoint Email Budget│
                 └──────────┬───────────┘
                            │
                 ┌──────────▼───────────┐
                 │ Global Hourly Budget │
                 └──────────┬───────────┘
                            │
                 ┌──────────▼───────────┐
                 │ Global Daily Budget  │
                 └──────────┬───────────┘
                            │
                            ▼
                         ZeptoMail
```

No individual control is intended to be the only line of defense.

---

# 13. Password Reset Security

Password reset functionality is designed to prevent account enumeration and uncontrolled email generation.

The reset flow:

- Does not reveal whether an arbitrary email address belongs to an account through the normal request response.
- Uses OTP-based verification.
- Applies authentication/abuse rate limits.
- Applies email budgets before sending.
- Uses expiring verification challenges.
- Prevents unrestricted repeated reset-email generation.

The application does not intentionally provide an attacker with a reliable:

```text
"Account exists"
```

versus:

```text
"Account does not exist"
```

oracle through the password-reset request.

---

# 14. Registration Security

Registration is protected independently from normal login.

Controls include:

- Dedicated registration rate limiter.
- Username availability throttling.
- Registration OTP verification.
- OTP resend throttling.
- OTP attempt restrictions.
- Email budget protection.
- Validation of submitted account information.
- Server-side account creation.
- Protection of privileged attributes from mass assignment.

Current registration controls include:

```text
5 registration attempts/hour/IP
3 registration attempts/hour/identifier
10 OTP verification attempts/minute/IP/identifier
3 OTP resends/minute/IP
8 OTP resends/hour/identifier
```

---

# 15. Session Security

Laravel Sanctum is used in SPA cookie mode.

The application uses:

- First-party authentication cookies.
- Secure cookies in production.
- Database-backed sessions.
- CSRF protection.
- Same-origin API architecture.
- Server-side session state.
- No authentication tokens stored in browser JavaScript as the primary authentication mechanism.

Production configuration includes:

```text
SESSION_DRIVER=database
SESSION_SECURE_COOKIE=true
SESSION_DOMAIN=fireshark.in
```

---

# 16. CSRF Protection

State-changing requests are protected using Laravel's CSRF/session security model.

The React API client:

1. Uses credentialed requests.
2. Ensures the CSRF cookie is available.
3. Sends mutating requests through the Laravel session security pipeline.
4. Does not bypass server-side CSRF validation.

The frontend cannot disable or override server-side CSRF enforcement.

---

# 17. Authorization

Authorization is enforced server-side.

The React application may hide or display interface elements based on user state, but **the frontend is never considered an authorization boundary**.

The backend independently verifies:

- Authentication state.
- User role.
- Resource ownership.
- Applicable Laravel Policies.
- Verification status.
- Administrative privileges.

---

# 18. Role-Based Access Control

The platform defines application roles including:

```text
user
moderator
admin
```

Role restrictions are enforced using middleware and server-side authorization policies.

Sensitive attributes such as:

- role
- reputation
- moderation state
- suspension state
- administrative counters
- verification state

are not intended to be user-controlled through ordinary mass-assignment operations.

---

# 19. Privilege Escalation Protection

Users cannot simply submit:

```json
{
  "role": "admin"
}
```

or equivalent privileged attributes through normal account update operations and expect the server to honor them.

Sensitive model attributes are protected using explicit `$fillable` definitions and controlled administrative operations.

Administrative operations requiring privileged changes are handled through dedicated server-side logic.

---

# 20. Administrative Security

Administrative operations are protected behind server-side role middleware.

The security model includes protections against:

- Unauthorized administrative API access.
- Regular-user access to administrative endpoints.
- Moderator access to administrator-only functionality.
- Unauthorized user-role modification.
- Unauthorized category management.
- Unauthorized badge management.
- Unauthorized settings management.

The server remains the final authority.

---

# 21. Administrative Safety Invariants

Important application invariants include protections such as:

- The last administrator cannot be unintentionally removed from administrative control.
- Administrators cannot arbitrarily self-suspend through ordinary user-facing functionality.
- Users cannot modify other users' content without appropriate authority.
- Privileged attributes cannot be assigned through normal mass assignment.

These invariants are enforced server-side rather than through UI restrictions.

---

# 22. Input Validation

All significant writes are validated server-side.

The platform uses Laravel Form Requests and explicit validation rules.

Examples include:

| InputValidation |                                                |
| --------------- | ---------------------------------------------- |
| Question title  | 15–180 characters                              |
| Question body   | Minimum 30 characters                          |
| Tags            | Maximum 5                                      |
| Comment         | Maximum 2,000 characters                       |
| Enum values     | Explicit whitelist                             |
| Usernames       | Validated format and uniqueness                |
| Emails          | Validated email format                         |
| Uploaded media  | MIME, extension, size and dimension validation |

Client-side validation is considered a usability feature, not a security boundary.

---

# 23. Mass Assignment Protection

Models use explicit `$fillable` definitions.

Sensitive fields are intentionally excluded from ordinary user-controlled mass assignment.

Protected categories include:

- Roles.
- Reputation.
- Counters.
- Suspension state.
- Administrative state.
- Other security-sensitive attributes.

Administrative code may use controlled operations such as `forceFill` where explicitly authorized.

---

# 24. SQL Injection Protection

Database access uses Laravel's query builder and Eloquent bindings.

User-supplied values are not interpolated into SQL strings.

The application has been manually reviewed for SQL injection risks.

Raw SQL is limited to controlled operations such as:

- Leaderboard aggregate operations.
- Atomic email-budget counters.
- Counter clamping / decrement operations.

These operations do not use uncontrolled user-provided SQL fragments.

---

# 25. Database Integrity

The application uses database constraints in addition to application-level validation.

Examples include:

- Unique constraints.
- Foreign keys where appropriate.
- Unique vote relationships.
- Unique email-budget bucket keys.
- Transactional operations.
- Persistent audit/security records.

Database constraints provide a second line of defense when application-level checks are bypassed.

---

# 26. Vote Manipulation Protection

Voting is protected against common manipulation scenarios.

Controls include:

- Database uniqueness preventing duplicate votes.
- Server-side self-voting restrictions.
- Authentication requirements where applicable.
- Controlled vote mutation logic.
- Reputation updates through server-side logic.

The database therefore participates in enforcing vote integrity rather than relying exclusively on frontend state.

---

# 27. Reputation Integrity

Reputation changes are controlled by server-side application logic.

Security-sensitive reputation events are logged.

When content deletion invalidates previously earned reputation, the application can reverse the corresponding reputation effect through the reputation ledger rather than blindly leaving derived reputation behind.

This reduces opportunities for permanent reputation inflation through later-deleted content.

---

# 28. XSS Protection

User-generated content is treated as untrusted.

Community content is stored as Markdown and rendered through a sanitization pipeline.

The client-side rendering process uses:

```text
Markdown
   │
   ▼
marked
   │
   ▼
DOMPurify
   │
   ▼
Sanitized HTML
```

DOMPurify is configured with an explicit allowlist.

The platform does not intentionally echo arbitrary user HTML directly into the DOM.

---

# 29. Stored XSS Protection

User content is not considered safe merely because it was stored successfully.

The security model accounts for stored XSS by sanitizing content during rendering.

This applies particularly to:

- Questions.
- Answers.
- Comments.
- User-generated Markdown.

The platform does not assume that authenticated users are trustworthy content authors.

---

# 30. Mention Rendering

Mentions are handled using text-oriented rendering rather than blindly injecting user-provided HTML.

Mention data is therefore not treated as executable markup.

---

# 31. SEO Security

Server-rendered SEO content uses Blade escaping.

Dynamic values are rendered using escaped Blade output such as:

```blade
{{ $value }}
```

rather than intentionally rendering arbitrary user data with raw HTML output.

JSON-LD data is serialized using JSON encoding with appropriate escaping flags.

This prevents SEO functionality from becoming an alternate XSS injection surface.

---

# 32. File Upload Security

File uploads are treated as untrusted input.

Supported image formats are restricted to:

```text
PNG
JPG / JPEG
WEBP
```

Uploads are checked using multiple properties rather than trusting only the filename.

Validation includes:

- MIME type.
- File extension.
- File size.
- Image dimensions.
- Image decoding.
- Re-encoding.

---

# 33. Image Re-Encoding

Uploaded images are processed through GD.

The image is re-encoded before being stored.

This provides an additional defensive layer against arbitrary embedded content or payloads that might otherwise survive unchanged inside an uploaded image.

Uploaded images are also resized to a maximum dimension of approximately:

```text
1600 px
```

---

# 34. Upload Storage

Processed uploads are stored under randomized filenames.

The application uses a random approximately 40-character filename rather than retaining attacker-controlled filenames as storage identifiers.

Media is organized using date-based paths:

```text
storage/app/public/media/YYYY/MM
```

Every upload is registered in the application's `media` table.

This provides traceability for moderation and removal.

---

# 35. Personally Identifiable Information in Uploads

Users are explicitly warned before publishing screenshots or similar media to remove sensitive information.

Warnings are provided at multiple points, including:

- Editor-level guidance.
- Pre-submission warnings.

The platform does **not** claim that image uploads are automatically PII-safe.

Users remain responsible for removing:

- Email addresses.
- Credentials.
- Tokens.
- API keys.
- IP addresses where sensitive.
- Personal documents.
- Other confidential information.

---

# 36. Content Safety

FireShark Community provides community rules covering prohibited or dangerous content.

Examples include:

- Credential exposure.
- Doxxing.
- Harassment.
- Illegal activity.
- Malicious content.
- Unauthorized disclosure of sensitive information.

The platform is a technical community and therefore intentionally allows legitimate cybersecurity discussion while maintaining moderation controls around harmful or prohibited material.

---

# 37. Human Moderation

FireShark Community does not depend on AI moderation.

Moderation is performed through explicit application functionality.

Moderators can perform authorized actions such as:

- Hide content.
- Restore content.
- Close questions.
- Delete content.
- Warn users.
- Suspend users.
- Review reports.

Closed questions may remain publicly readable where appropriate so useful technical knowledge is not unnecessarily destroyed.

---

# 38. Moderation Audit Trail

Significant moderation operations are recorded.

Audit information can include:

- Moderator identity.
- Target/subject.
- Action.
- Reason.
- Metadata.
- Timestamp.

This creates accountability for privileged moderation actions.

---

# 39. Reports and Abuse Handling

Report functionality is rate limited.

Current baseline:

```text
5 reports/minute/user
```

The application also prevents unnecessary duplicate open reports against the same target by the same reporter where the applicable report constraint exists.

This limits automated report flooding.

---

# 40. General API Rate Limiting

Rate limiting is applied across multiple classes of API activity.

Current baseline controls include:

| SurfaceLimit                       |                      |
| ---------------------------------- | -------------------- |
| General authenticated API activity | 60/min/user          |
| Authentication endpoints           | 10/min/IP            |
| Registration                       | 5/hour/IP            |
| Content writes                     | 20/min/user          |
| Search                             | 30/min               |
| Reports                            | 5/min/user           |
| Username availability              | 20/min/IP            |
| OTP verification                   | 10/min/IP/identifier |
| OTP resend                         | 3/min/IP             |

These limits are intended to reduce:

- Brute-force attempts.
- Automated scraping.
- Vote manipulation.
- Content flooding.
- Report abuse.
- Authentication abuse.
- Resource exhaustion.

---

# 41. Distributed Abuse Considerations

Application-level rate limiting is not presented as a replacement for volumetric DDoS protection.

The security architecture separates:

```text
Application abuse
```

from:

```text
Volumetric network attacks
```

Application controls address abusive API behavior.

Cloudflare and upstream infrastructure provide an additional edge layer for traffic filtering and volumetric protection.

---

# 42. Cloudflare Proxy Awareness

The application includes dedicated Cloudflare proxy handling:

```text
TrustCloudflareProxies
```

This exists so that application-level security controls can correctly reason about client IP information when traffic passes through Cloudflare.

This is particularly relevant to:

- Rate limiting.
- Authentication abuse detection.
- Email abuse controls.
- Security logging.

The application must not blindly trust arbitrary client-supplied forwarding headers.

---

# 43. CAPTCHA / Cloudflare Turnstile

The backend contains a dedicated:

```text
VerifyTurnstile
```

middleware capable of server-side Cloudflare Turnstile verification.

The middleware:

- Accepts Turnstile tokens from supported request locations.
- Sends the token to Cloudflare's server-side verification endpoint.
- Uses the configured secret key.
- Handles verification failures.
- Handles expired/duplicate tokens.
- Handles invalid responses.
- Handles service failures.
- Logs security-relevant verification failures.
- Fails closed when explicitly enforced.

### Current production state

Turnstile is **implemented and available in the backend but is not currently enforced on production authentication routes**.

The reason is deliberate:

```text
Backend Turnstile verification
        +
Frontend Turnstile token generation
```

must be implemented and tested together.

The existing frontend currently does not generate Turnstile tokens. Enabling backend enforcement without the frontend integration would cause legitimate authentication requests to fail.

Therefore the current production configuration retains the stronger rate-limiting and email-budget controls while Turnstile remains prepared for a subsequent properly integrated deployment.

---

# 44. Security Headers

Production responses use security-oriented HTTP headers including:

```text
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy
Permissions-Policy
```

These headers reduce common browser-side attack surfaces such as:

- MIME sniffing.
- Unwanted framing.
- Excessive referrer disclosure.
- Unnecessary browser capability exposure.

---

# 45. Transport Security

The production application is served through HTTPS.

Traffic passes through the Cloudflare edge before reaching the Hostinger origin.

Production configuration requires secure cookies.

HSTS is enabled as part of the production security-header strategy.

The intended production transport model is:

```text
Browser
   │
   │ HTTPS
   ▼
Cloudflare
   │
   │ HTTPS
   ▼
Hostinger Origin
   │
   ▼
Laravel
```

---

# 46. Production Debug Protection

Production configuration uses:

```text
APP_ENV=production
APP_DEBUG=false
```

This prevents normal production requests from exposing Laravel debugging information, stack traces, internal implementation details, or environment configuration through user-facing error responses.

---

# 47. Error Handling

API exceptions are rendered through the application's API-aware exception handling.

The application does not intentionally expose:

- Database credentials.
- Application secrets.
- Passwords.
- Authentication tokens.
- Internal stack traces.
- Server filesystem paths.

Production failures should result in controlled error responses rather than development debugging pages.

---

# 48. Logging Security

Security-relevant events are logged server-side.

Examples include:

- Authentication anomalies.
- Email budget violations.
- OTP/security events.
- Reputation events.
- Badge grants.
- Moderation actions.
- Turnstile verification failures where enabled.
- Security-related exceptions.

Logs are intended to provide operational and forensic visibility without becoming a secondary secret-storage system.

---

# 49. Sensitive Data Logging Policy

The application must not intentionally log:

- Passwords.
- Authentication tokens.
- OTP secrets.
- API keys.
- Database credentials.
- Session secrets.

Security logs should contain enough information to investigate abuse without reproducing credentials or authentication material.

---

# 50. Email Provider Security

Security emails are sent through ZeptoMail.

The application treats email delivery as a privileged external operation.

Before sending security-sensitive email, the application can enforce:

1. Endpoint rate limits.
2. IP rate limits.
3. Identifier rate limits.
4. Endpoint email budgets.
5. Global hourly budget.
6. Global daily budget.

Only after these controls succeed should the email provider be contacted.

---

# 51. Email Provider Failure Handling

The application does not assume that the email provider is always available.

Provider failures are handled as application-level errors.

The email budget and security logic are intentionally positioned before provider invocation so that repeated attacker requests cannot simply translate into unrestricted provider traffic.

---

# 52. Scheduled Security Maintenance

The application includes scheduled maintenance operations for security-related temporary data.

These include cleanup of:

- Pending registrations.
- Expired OTP/security challenges.

The objective is to prevent temporary authentication data from accumulating indefinitely.

---

# 53. Database-Backed Infrastructure

The production application intentionally uses database-backed infrastructure for:

```text
Sessions
Cache
Queue
Email budgets
```

This reduces the number of additional infrastructure dependencies required by the shared-hosting deployment.

The production architecture does not require:

- Redis.
- Elasticsearch.
- Docker.
- Kubernetes.
- PM2.
- Supervisor.
- Separate Node.js application servers.

The React application is compiled into static production assets and served through the Laravel application architecture.

---

# 54. Production Deployment Safety

Production deployment is designed to avoid destructive database resets.

Normal production migrations use:

```bash
php artisan migrate --force
```

The following commands are explicitly **not part of the normal production deployment process**:

```text
migrate:fresh
migrate:refresh
migrate:reset
db:wipe
```

These operations can destroy or recreate application data and must never be casually executed against the production database.

---

# 55. Migration Safety

Production database schema changes are applied through Laravel migrations.

The production deployment performed for the security hardening added:

```text
2026_09_16_000001_create_email_budget_counters_table
```

The migration completed successfully in production.

Existing application tables were not dropped or recreated as part of this deployment.

---

# 56. Production Backup Procedure

Before the security deployment, a complete production website backup was created.

The backup included:

```text
community/
public_html/
```

and included the production Laravel application and public web files.

A production database dump was also created and verified to contain:

- Table structures.
- Existing records.
- Application data.

This establishes a rollback/recovery point before security changes are applied.

---

# 57. Production Configuration Protection

The production `.env` file is treated as a deployment-sensitive file.

Backend code deployments do not overwrite the production `.env`.

The production environment retains its actual:

- Database configuration.
- Application environment.
- Mail configuration.
- Session configuration.
- Application URL.
- Sanctum configuration.

Secrets are intentionally excluded from source-control templates.

---

# 58. Production Environment

The production application has been verified with:

```text
Environment: production
Debug Mode: OFF
Laravel: 13.30.1
PHP: 8.4.19
Database: MySQL
Cache: database
Queue: database
Session: database
Mail: ZeptoMail
Maintenance Mode: OFF
```

Laravel framework caches are enabled for:

```text
Configuration
Events
Routes
Views
```

---

# 59. Live Authentication Verification

After deployment, production authentication was tested against the actual live application.

The tested flow successfully completed:

```text
Password submission
       │
       ▼
Password verification
       │
       ▼
OTP generation
       │
       ▼
ZeptoMail delivery
       │
       ▼
OTP entry
       │
       ▼
OTP verification
       │
       ▼
Authenticated session
```

This confirms that the production security changes did not break the primary authentication workflow.

---

# 60. Production API Verification

A deliberately invalid login request was also sent directly against the production API.

The application returned:

```text
HTTP 422
Email or password is incorrect.
```

This demonstrated that the request reached the normal authentication logic rather than failing because of the incomplete Turnstile configuration.

No Turnstile configuration error was returned.

---

# 61. Production Cache Verification

After deployment, production caches were explicitly cleared and rebuilt.

The following framework components were successfully rebuilt:

```text
config
events
routes
views
```

Laravel subsequently reported all four as:

```text
```

This ensures the production application is operating using the current deployed route and configuration definitions rather than stale cached application metadata.

---

# 62. Security Review Checklist

The platform security review includes the following areas:

### Authentication

-  Password authentication is server-side.
-  Passwords are hashed.
-  Passwords are not intentionally logged.
-  Login supports email/username authentication.
-  Authentication failures are normalized.
-  OTP-based second-stage verification is implemented.
-  OTP verification is rate limited.
-  OTP resend is rate limited.
-  OTP challenges expire.
-  OTP challenges are protected against repeated use.
-  Password reset is rate limited.
-  Password-reset responses avoid account enumeration.

### Sessions

-  Laravel Sanctum SPA cookie authentication.
-  Database-backed sessions.
-  Secure production cookies.
-  CSRF protection.
-  Same-origin API architecture.
-  Authentication state enforced server-side.

### Authorization

-  Role-based authorization.
-  Server-side role middleware.
-  Laravel Policies.
-  Ownership checks.
-  Privileged fields protected from mass assignment.
-  Administrative operations restricted.
-  Privilege escalation controls.

### Input Security

-  Form Request validation.
-  Explicit input limits.
-  Enum whitelisting.
-  Mass-assignment protection.
-  SQL parameter binding.
-  Server-side validation independent of frontend validation.

### XSS

-  Markdown-based user content.
-  DOMPurify sanitization.
-  Explicit HTML allowlist.
-  Escaped Blade output.
-  Escaped JSON-LD.
-  No intentional raw rendering of arbitrary user content.

### Uploads

-  MIME validation.
-  Extension validation.
-  Size validation.
-  Dimension validation.
-  GD processing.
-  Image re-encoding.
-  Image resizing.
-  Randomized storage names.
-  Media registration.
-  PII warnings.

### Abuse Prevention

-  Authentication rate limiting.
-  Registration rate limiting.
-  OTP verification rate limiting.
-  OTP resend rate limiting.
-  Content-write rate limiting.
-  Search rate limiting.
-  Report rate limiting.
-  Per-IP email budgets.
-  Per-identifier email budgets.
-  Per-endpoint email budgets.
-  Global hourly email budget.
-  Global daily email budget.
-  Atomic email-budget counters.
-  Email budget checked before provider invocation.

### Database

-  MySQL.
-  Database constraints.
-  Unique vote protection.
-  Unique email-budget bucket protection.
-  Transactional security operations.
-  Migration-based schema management.

### Content & Moderation

-  Community guidelines.
-  Report controls.
-  Moderation roles.
-  Moderation actions.
-  Moderation audit trail.
-  User suspension controls.
-  Content ownership controls.
-  Reputation ledger integrity.

### Transport

-  HTTPS.
-  Cloudflare edge.
-  Secure cookies.
-  HSTS strategy.
-  Security headers.
-  `X-Content-Type-Options`.
-  `X-Frame-Options`.
-  `Referrer-Policy`.
-  `Permissions-Policy`.

### Production

-  `APP_ENV=production`.
-  `APP_DEBUG=false`.
-  Production caches enabled.
-  Database-backed sessions.
-  Production database migration completed.
-  Production backup completed before deployment.
-  Production database dump verified.
-  Live authentication flow tested.
-  Live API authentication behavior tested.
-  Destructive migration commands excluded from normal deployment.

### CAPTCHA

-  Server-side Turnstile middleware implemented.
-  Fail-closed verification logic implemented.
-  Turnstile configuration support implemented.
-  Frontend Turnstile widget/token generation.
-  Production Turnstile enforcement.

---

# 63. Security Controls Summary

The current security model can be summarized as:

```text
                    ┌──────────────────────┐
                    │      CLOUDFLARE      │
                    │ Edge / TLS / Proxy   │
                    └──────────┬───────────┘
                               │
                    ┌──────────▼───────────┐
                    │   SECURITY HEADERS   │
                    │ HSTS / Browser       │
                    │ Security Controls    │
                    └──────────┬───────────┘
                               │
                    ┌──────────▼───────────┐
                    │     LARAVEL API      │
                    └──────────┬───────────┘
                               │
             ┌─────────────────┼─────────────────┐
             │                 │                 │
             ▼                 ▼                 ▼
       Authentication     Authorization     Validation
             │                 │                 │
             ▼                 ▼                 ▼
        OTP Controls       Policies        Sanitization
             │
             ▼
       Rate Limiting
             │
             ▼
       Email Budgets
             │
             ├── Per IP
             ├── Per Identifier
             ├── Per Endpoint
             ├── Global Hourly
             └── Global Daily
             │
             ▼
          ZeptoMail
             │
             ▼
          MySQL
             │
             ├── Constraints
             ├── Transactions
             ├── Sessions
             ├── Security Counters
             └── Audit Data
```

---

# 64. Security Principle: No Single Control Is Trusted

FireShark Community does not rely on:

- A CAPTCHA alone.
- A rate limiter alone.
- A frontend restriction alone.
- A role dropdown alone.
- A database constraint alone.
- Cloudflare alone.
- Laravel alone.
- Email-provider controls alone.

Instead, security-sensitive operations are deliberately protected through multiple layers.

For example, an OTP email request may encounter:

```text
Cloudflare
   ↓
Laravel API
   ↓
Authentication / validation
   ↓
Rate limiter
   ↓
Identifier restrictions
   ↓
Email budget
   ↓
Endpoint budget
   ↓
Global hourly budget
   ↓
Global daily budget
   ↓
ZeptoMail
```

An attacker must therefore defeat multiple independent controls rather than a single frontend restriction.

---

# 65. Security Review Philosophy

Security review is treated as an ongoing engineering process rather than a one-time certification.

When a new security-sensitive feature is introduced, it should be evaluated across:

1. Authentication.
2. Authorization.
3. Input validation.
4. Database integrity.
5. Abuse resistance.
6. Rate limiting.
7. Resource consumption.
8. Logging.
9. Privacy.
10. Deployment safety.
11. Failure behavior.
12. Recovery behavior.

A feature is not considered secure merely because its intended UI behavior works.

The underlying API must remain secure when called directly by an automated client.

---

# 66. What the Platform Does Not Claim

Security documentation should not be interpreted as a claim that the application is impossible to compromise.

No internet-facing application can honestly guarantee that.

This document instead describes the security controls currently implemented and the defensive assumptions under which the platform operates.

The platform is continuously subject to:

- New vulnerabilities.
- Dependency vulnerabilities.
- Configuration mistakes.
- Credential compromise.
- Browser vulnerabilities.
- Infrastructure failures.
- Novel abuse techniques.
- Previously unknown application vulnerabilities.

Security therefore remains an ongoing engineering responsibility.

---

# 67. Responsible Security Testing

FireShark Community is a cybersecurity-focused platform and is intended to be reviewed responsibly.

Security researchers should:

- Avoid accessing other users' private information.
- Avoid destructive testing against production.
- Avoid denial-of-service activity.
- Avoid uncontrolled automated email generation.
- Avoid spam or content flooding.
- Avoid modifying or deleting production data.
- Avoid credential theft or account takeover attempts.
- Preserve evidence necessary to reproduce legitimate vulnerabilities.

Where possible, vulnerabilities should be demonstrated using the minimum-impact proof required to establish the issue.

---

# 68. Security Incident Response

Potential security incidents should be investigated using:

- Application logs.
- Authentication logs.
- Moderation audit records.
- Email-budget events.
- Rate-limit events.
- Database records.
- Cloudflare traffic/security information.
- Relevant server logs.

Investigation should prioritize:

1. Containment.
2. Preservation of evidence.
3. Identification of affected accounts/resources.
4. Credential/session invalidation where required.
5. Remediation.
6. Verification.
7. Post-incident review.

---

# 69. Security Development Requirements

Future contributors should not introduce security-sensitive functionality without considering:

- Direct API invocation.
- Authentication bypass.
- Authorization bypass.
- IDOR.
- SQL injection.
- XSS.
- CSRF.
- SSRF.
- File upload abuse.
- Brute force.
- Enumeration.
- Rate-limit bypass.
- Email abuse.
- Resource exhaustion.
- Privilege escalation.
- Race conditions.
- Auditability.

Any new endpoint that can send email or modify security-sensitive state should receive dedicated abuse controls.

---

# 70. Security Deployment Requirements

Production deployments must follow these principles:

### Allowed

```bash
php artisan migrate --force
php artisan optimize:clear
php artisan optimize
```

### Prohibited as routine production deployment operations

```bash
php artisan migrate:fresh
php artisan migrate:refresh
php artisan migrate:reset
php artisan db:wipe
```

A production database must never be reset merely to apply an ordinary application change.

Before significant production changes:

- Create a backup.
- Verify the backup.
- Deploy only intended files.
- Preserve `.env`.
- Apply migrations safely.
- Clear/rebuild caches where necessary.
- Test the application.
- Verify authentication.
- Verify critical API functionality.

---

# 71. Current Production Security Baseline

At the time of this document update, the production environment has been verified as:

```text
Application
    FireShark Community

Framework
    Laravel 13.30.1

PHP
    8.4.19

Environment
    production

Debug
    OFF

Database
    MySQL

Session
    database

Cache
    database

Queue
    database

Mail
    ZeptoMail

Maintenance Mode
    OFF

Configuration Cache
    CACHED

Route Cache
    CACHED

Event Cache
    CACHED

View Cache
    CACHED
```

---

# 72. Current Security Status

The currently implemented security architecture includes:

| Security AreaStatus              |             |
| -------------------------------- | ----------- |
| Password hashing                 | Active      |
| Sanctum authentication           | Active      |
| Secure sessions                  | Active      |
| CSRF protection                  | Active      |
| Authentication rate limiting     | Active      |
| Registration rate limiting       | Active      |
| OTP verification limiting        | Active      |
| OTP resend limiting              | Active      |
| Password-reset protection        | Active      |
| Email budget system              | Active      |
| Per-IP email limits              | Active      |
| Per-identifier email limits      | Active      |
| Per-endpoint email limits        | Active      |
| Global hourly email limit        | Active      |
| Global daily email limit         | Active      |
| Atomic email counters            | Active      |
| Role-based authorization         | Active      |
| Laravel Policies                 | Active      |
| Mass-assignment protection       | Active      |
| SQL injection defenses           | Active      |
| XSS sanitization                 | Active      |
| Upload validation                | Active      |
| GD image re-encoding             | Active      |
| Moderation audit trail           | Active      |
| Security headers                 | Active      |
| HTTPS                            | Active      |
| Production debug disabled        | Active      |
| Cloudflare proxy awareness       | Active      |
| Production backup procedure      | Established |
| Safe migration procedure         | Established |
| Turnstile backend                | Implemented |
| Turnstile frontend               | Pending     |
| Turnstile production enforcement | Pending     |

---

# 73. Security Roadmap

Security improvements may continue independently of the existing baseline.

Potential future hardening areas include:

- Complete frontend Cloudflare Turnstile integration.
- Enable production Turnstile after end-to-end testing.
- External alerting for email-budget thresholds.
- Centralized security monitoring.
- Automated dependency vulnerability scanning.
- Automated security regression testing.
- Periodic authorization/IDOR review.
- Periodic rate-limit bypass testing.
- Cloudflare WAF/rate-limit tuning.
- Backup restoration drills.
- Incident-response exercises.
- Security-focused CI checks.

These are improvements to the defense-in-depth model and should not be interpreted as evidence that the current security controls are absent.

---

# 74. Final Security Statement

FireShark Community is built as a cybersecurity community and therefore treats security as a first-class engineering concern.

The application is designed around the principle that:

> **The browser is not trusted, the client is not trusted, user input is not trusted, and a single security control is never assumed to be sufficient.**

Authentication is protected independently from authorization.

Authorization is enforced independently from the frontend.

User input is validated independently from browser-side validation.

Database integrity is protected independently from application UI behavior.

Email delivery is protected independently from authentication rate limits.

Uploaded files are treated independently from their filenames and extensions.

Production deployment is protected independently from application functionality through explicit backup and migration procedures.

The resulting security model is intentionally layered:

```text
             SECURITY IN DEPTH
                    │
        ┌───────────┴───────────┐
        │                       │
     PREVENTION             DETECTION
        │                       │
   ┌────┼────┐             ┌────┼────┐
   │    │    │             │    │    │
 Auth  Rate  Input        Logs Audit Alerts
       Limits Validation
   │    │    │
   └────┼────┘
        │
   Authorization
        │
   Database Integrity
        │
   Email Budgets
        │
   Content Sanitization
        │
   Secure Deployment
```

The objective is not to claim that FireShark Community is impossible to attack.

The objective is to ensure that an attacker does not receive a simple path from:

```text
one request
```

to:

```text
account compromise
data manipulation
privilege escalation
uncontrolled email consumption
persistent XSS
database compromise
or unrestricted application abuse.
```

Security controls are continuously reviewable, testable, and expected to evolve as the platform evolves.

---

## Security Contact

For responsible disclosure of a security vulnerability, contact the FireShark Community maintainers through the official project communication channels.

Please provide:

- A clear description of the vulnerability.
- Affected endpoint/component.
- Reproduction steps.
- Expected behavior.
- Actual behavior.
- Security impact.
- Minimal proof of concept where appropriate.
- Any relevant logs or screenshots with credentials/secrets removed.

Do not publicly disclose sensitive vulnerability details before the issue has been reviewed and an appropriate remediation path has been established.

```

**One correction I intentionally made:** I did *not* write that Turnstile is “active” in production. We discovered and verified that it currently isn't, and documenting it as active would make `SECURITY.md` factually wrong. The document instead clearly records the backend implementation and the remaining frontend/enforcement work.
