# Security

FireShark Community is designed with a **defense-in-depth security model** across authentication, authorization, session management, input validation, content rendering, file uploads, abuse prevention, email delivery, database integrity, transport security, and moderation.

The security architecture assumes that:

- Client-side controls can be bypassed and are therefore never treated as an authorization boundary.
- APIs may be called directly without using the frontend.
- User input, uploaded files, and community content are untrusted.
- Authentication and OTP endpoints are high-value abuse targets.
- Email delivery is an external, metered resource that requires independent protection.
- Database integrity must not depend solely on application UI behavior.
- Security-sensitive operations require server-side enforcement.

---

## Security Architecture

The production application uses the following security-relevant components:

| Layer | Technology / Control |
| --- | --- |
| Edge / DNS | Cloudflare |
| Transport | HTTPS / TLS |
| Web Application | Laravel |
| Backend | PHP |
| Frontend | React + TypeScript |
| Authentication | Laravel Sanctum SPA cookie authentication |
| Sessions | Database-backed Laravel sessions |
| Database | MySQL |
| Cache | Database-backed Laravel cache |
| Queue | Database-backed Laravel queue |
| Email Delivery | ZeptoMail |
| Content Format | Markdown |
| HTML Sanitization | DOMPurify |
| Image Processing | GD |
| Authorization | Roles, middleware, and Laravel Policies |
| Abuse Prevention | Multiple application-level rate limiters |
| Email Protection | Global, endpoint, IP, and identifier budgets |
| Edge Proxy | Cloudflare with trusted proxy handling |
| CAPTCHA Readiness | Server-side Cloudflare Turnstile verification |
| Auditability | Application and moderation logging |

The platform does not rely on a single security mechanism. Sensitive workflows are protected by multiple independent controls so that bypassing one layer does not automatically bypass the others.

---

# Authentication

## Password Security

Authentication is enforced server-side through Laravel.

Passwords are:

- Never stored in plaintext.
- Hashed using Laravel's configured password hashing mechanism.
- Verified server-side.
- Not intentionally written to application logs.
- Not returned through normal API responses.

Client-side password validation is treated only as a usability feature. The backend remains responsible for validating and authenticating credentials.

## Login Security

The authentication flow uses:

1. Identifier submission using email address or username.
2. Server-side password verification.
3. OTP challenge generation.
4. OTP verification.
5. Authenticated Laravel Sanctum session establishment.

Authentication failures are normalized so that ordinary login behavior does not unnecessarily disclose whether a particular account exists.

## OTP Security

OTP verification is protected with multiple controls, including:

- Short-lived OTP challenges.
- Single-use verification.
- Challenge expiration.
- Attempt restrictions.
- Resend restrictions.
- IP-based throttling.
- Identifier-based throttling.
- Protection against repeated automated OTP requests.
- Email-delivery budgets applied before the mail provider is contacted.

These controls are designed to prevent both OTP guessing and abuse of the OTP system as an unrestricted email-sending mechanism.

---

# Authentication Rate Limiting

Authentication-related endpoints use dedicated Laravel rate limiters rather than relying on one generic application-wide threshold.

Current baseline limits include:

| Operation | Limit |
| --- | --- |
| Authentication endpoints | 10 requests/minute/IP |
| Registration | 5 requests/hour/IP |
| Registration identifier controls | 3 requests/hour/identifier |
| OTP verification | 10 requests/minute/IP/identifier |
| OTP resend | 3 requests/minute/IP |
| OTP resend identifier control | 8 requests/hour/identifier |
| Username availability | 20 requests/minute/IP |

Protected authentication operations include login, OTP verification, OTP resend, password recovery, password-reset OTP operations, registration, and account-verification resend operations.

Rate limiting is one layer of protection. Email-specific controls described below operate independently of these request limits.

---

# Password Reset Protection

Password recovery is protected against both account enumeration and uncontrolled email generation.

The reset flow:

- Uses OTP-based verification.
- Applies authentication-related throttling.
- Applies email budgets before sending security messages.
- Uses expiring verification challenges.
- Restricts repeated reset operations.
- Avoids intentionally exposing account existence through the normal password-reset request flow.

This prevents the password-reset endpoint from becoming a reliable account-discovery oracle or an unrestricted email-delivery endpoint.

---

# Registration Security

Registration is protected independently from normal login.

Implemented controls include:

- Dedicated registration rate limiting.
- Username availability throttling.
- Registration OTP verification.
- OTP verification attempt restrictions.
- OTP resend restrictions.
- Identifier-based resend controls.
- Email budget enforcement.
- Server-side validation of registration data.
- Server-side account creation.
- Protection of privileged attributes from mass assignment.

Registration is therefore subject to both authentication-style abuse controls and dedicated account-creation protections.

---

# Session Security

Laravel Sanctum is used for SPA authentication through first-party cookies.

The session model includes:

- Database-backed Laravel sessions.
- Secure production cookies.
- Credentialed frontend requests.
- Server-side authentication state.
- CSRF protection for state-changing requests.
- Same-origin application/API security controls.

The application does not depend on storing its primary authentication state in browser-accessible JavaScript storage.

---

# CSRF Protection

State-changing requests are protected through Laravel's CSRF and session security model.

The React client:

- Uses credentialed requests.
- Obtains the Laravel CSRF cookie where required.
- Sends state-changing requests through the normal Laravel security pipeline.

CSRF validation remains a server-side control and cannot be disabled by the frontend.

---

# Authorization

Authorization is enforced on the backend.

The frontend may conditionally display controls based on user state, but frontend visibility is never considered proof of authorization.

For protected operations, the server evaluates the applicable:

- Authentication state.
- User role.
- Resource ownership.
- Laravel Policy.
- Verification state.
- Administrative privilege.

Direct API calls that bypass the React interface are therefore still subject to server-side authorization.

---

# Role-Based Access Control

The application defines role-based access for:

```text
user
moderator
admin
```

Role restrictions are enforced through server-side middleware and authorization policies.

Privileged state is not intended to be controlled through ordinary user-submitted fields.

Protected security-sensitive attributes include, where applicable:

- Role.
- Reputation.
- Moderation state.
- Suspension state.
- Administrative state.
- Verification state.
- Security-related counters.

---

# Privilege Escalation Protection

The application protects privileged model attributes from ordinary mass-assignment operations.

A malicious request attempting to submit a privileged field such as:

```json
{
  "role": "admin"
}
```

is not treated as an authorized role-change operation.

Administrative changes are handled through explicit server-side logic rather than normal user profile updates.

Administrative functionality is additionally protected with role-aware server-side middleware.

---

# Administrative Controls

Administrative and moderation operations are protected independently from normal user operations.

The security model includes controls against:

- Unauthorized administrative API access.
- Regular-user access to administrative functionality.
- Unauthorized role modification.
- Unauthorized moderation operations.
- Unauthorized management of platform-controlled resources.

Application-level safety invariants also protect important administrative states, including safeguards against unintentionally removing the last administrator from administrative control.

---

# Input Validation

All significant application writes are validated server-side.

Laravel Form Requests and explicit validation rules are used to constrain incoming data.

Representative validation limits include:

| Input | Validation |
| --- | --- |
| Question title | 15–180 characters |
| Question body | Minimum 30 characters |
| Tags | Maximum 5 |
| Comment | Maximum 2,000 characters |
| Enum fields | Explicitly allowed values |
| Username | Format and uniqueness validation |
| Email | Email-format validation |
| Uploaded media | MIME, extension, size, and dimension validation |

Browser-side validation does not replace backend validation.

---

# Mass Assignment Protection

Models use explicit `$fillable` definitions so ordinary user-controlled request payloads cannot arbitrarily populate privileged attributes.

Security-sensitive fields are intentionally excluded from normal mass-assignment workflows.

This protects against attempts to manipulate application state through additional properties included in otherwise legitimate requests.

---

# SQL Injection Protection

Database access uses Laravel Eloquent and the query builder with parameter binding.

The application does not intentionally interpolate uncontrolled user input directly into SQL statements.

Controlled raw SQL operations are limited to application-defined cases such as:

- Aggregate/leaderboard calculations.
- Atomic email-budget counter operations.
- Counter update or clamping logic.

These operations do not treat arbitrary user input as executable SQL.

---

# Database Integrity

Application-level validation is reinforced with database-level integrity controls.

These include:

- Unique constraints.
- Foreign keys where appropriate.
- Transactional operations.
- Unique vote relationships.
- Unique email-budget bucket keys.
- Persistent security-related records.

Database constraints provide a second enforcement layer if an application request bypasses normal UI behavior.

---

# Vote Integrity

Voting operations include server-side and database-level protections against common manipulation scenarios.

Controls include:

- Authentication requirements where applicable.
- Server-side self-voting restrictions.
- Database uniqueness preventing duplicate votes.
- Controlled vote mutation logic.
- Server-side reputation updates.

The database therefore participates directly in preserving vote integrity.

---

# Reputation Integrity

Reputation changes are controlled by server-side application logic.

Security-sensitive reputation events are logged, and reputation effects associated with subsequently removed content can be reversed through the application's reputation ledger logic.

This helps prevent deleted content from continuing to provide unintended reputation benefits.

---

# Cross-Site Scripting Protection

All community-generated content is treated as untrusted input.

User content is stored as Markdown and passed through a sanitization pipeline before being rendered as HTML.

The rendering flow is:

```text
User Content
     │
     ▼
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

The platform does not intentionally render arbitrary user-provided HTML directly into the application DOM.

---

# Stored XSS Protection

Stored community content remains untrusted even after it has been persisted successfully.

Sanitization is therefore applied at rendering time for user-generated content such as:

- Questions.
- Answers.
- Comments.
- User-authored Markdown.

This provides protection against malicious content that may have been successfully stored but later rendered to other users.

---

# Mention Security

Mention rendering is handled as text-oriented application data rather than treating user-provided mention values as executable HTML.

Mention content is therefore not intentionally promoted into an arbitrary HTML injection surface.

---

# SEO Rendering Security

Server-rendered SEO content uses escaped Blade output for dynamic values.

Dynamic values are rendered through escaped expressions such as:

```blade
{{ $value }}
```

rather than intentionally outputting arbitrary user content as raw HTML.

Structured SEO data is serialized as JSON with appropriate escaping so that SEO metadata does not become an alternate injection path.

---

# File Upload Security

Uploaded files are treated as untrusted input.

Supported image formats are restricted to:

```text
PNG
JPG / JPEG
WEBP
```

Image uploads are validated using multiple properties, including:

- MIME type.
- File extension.
- File size.
- Image dimensions.
- Image decoding.
- Re-encoding.

Validation does not rely solely on the filename supplied by the client.

---

# Image Re-Processing

Uploaded images are processed through GD and re-encoded before storage.

The application also limits image dimensions to approximately:

```text
1600 px
```

This introduces an additional processing boundary between attacker-supplied image data and the final stored asset.

Re-encoding is intended to reduce the risk of retaining arbitrary embedded content unchanged inside uploaded images.

---

# Secure Upload Storage

Processed media is stored under randomized filenames rather than preserving attacker-controlled filenames as storage identifiers.

The application uses approximately 40-character random filenames and organizes media using date-based storage paths such as:

```text
storage/app/public/media/YYYY/MM
```

Uploaded media is also registered in the application's `media` table, providing application-level traceability for stored assets.

---

# Sensitive Information in Uploaded Content

Uploaded screenshots and other media can contain sensitive information even when the file itself is technically valid.

The application therefore provides user-facing warnings to remove sensitive information before publication.

Examples include:

- Email addresses.
- Credentials.
- Passwords.
- API keys.
- Authentication tokens.
- Sensitive IP information.
- Personal documents.
- Other confidential data.

The platform does not represent ordinary image validation as automatic PII detection.

---

# Community Content and Moderation

FireShark Community is a technical knowledge-sharing platform and therefore supports legitimate cybersecurity discussion while maintaining controls for prohibited or harmful content.

Community rules address areas such as:

- Credential exposure.
- Doxxing.
- Harassment.
- Malicious content.
- Unauthorized disclosure of sensitive information.
- Other prohibited or dangerous material.

Moderation is performed through explicit application functionality and authorized human roles rather than relying exclusively on automated or AI moderation.

Authorized moderation actions include operations such as:

- Hiding content.
- Restoring content.
- Closing questions.
- Deleting content.
- Warning users.
- Suspending users.
- Reviewing reports.

---

# Moderation Audit Trail

Significant moderation operations are recorded for accountability and review.

Audit information can include:

- Moderator identity.
- Affected target.
- Action performed.
- Reason.
- Relevant metadata.
- Timestamp.

This creates a traceable record for privileged content-management actions.

---

# Abuse Reporting Controls

User reporting functionality is rate limited.

Current baseline:

```text
5 reports / minute / user
```

The application also restricts unnecessary duplicate open reports against the same target by the same reporter where the applicable report constraint exists.

These controls help limit report flooding and automated abuse of moderation workflows.

---

# API Rate Limiting

Rate limiting is applied across multiple classes of API activity.

Current baseline controls include:

| Surface | Limit |
| --- | --- |
| General authenticated API activity | 60/minute/user |
| Authentication endpoints | 10/minute/IP |
| Registration | 5/hour/IP |
| Content writes | 20/minute/user |
| Search | 30/minute |
| Reports | 5/minute/user |
| Username availability | 20/minute/IP |
| OTP verification | 10/minute/IP/identifier |
| OTP resend | 3/minute/IP |

These controls reduce automated abuse such as:

- Brute-force attempts.
- Content flooding.
- Search abuse.
- Report flooding.
- Authentication abuse.
- Automated resource consumption.
- Common forms of account and interaction manipulation.

Rate limiting is an application-abuse control and is not represented as a substitute for volumetric DDoS protection.

---

# Email Abuse Protection

Email delivery has an additional security boundary because authentication workflows can cause external email traffic and provider-side resource consumption.

FireShark Community therefore applies dedicated email budgets **before the external mail provider is called**.

The email protection model combines:

1. Endpoint rate limiting.
2. Per-IP email budgets.
3. Per-identifier email budgets.
4. Per-endpoint email budgets.
5. Global hourly budgets.
6. Global daily budgets.
7. Concurrency-safe database counters.

This prevents a single bypass of an ordinary request limiter from automatically becoming unrestricted email delivery.

---

# Global Email Budgets

The application currently enforces hard global email limits of:

| Scope | Limit |
| --- | ---: |
| Global hourly email budget | 500 |
| Global daily email budget | 5,000 |

When the applicable global budget is exhausted, the email operation is rejected before ZeptoMail is invoked.

These are enforcement controls, not merely reporting counters.

---

# Per-Endpoint Email Budgets

Security-email generation is additionally constrained per operation type.

Current hourly limits are:

| Email Operation | Hourly Limit |
| --- | ---: |
| Login OTP | 200 |
| Signup OTP | 100 |
| Password reset OTP | 150 |
| Email verification resend | 50 |

This prevents one email-generating feature from consuming the entire global budget.

---

# Per-IP and Per-Identifier Email Budgets

Additional email limits are applied independently by source and account identifier.

### Per IP

```text
50 security emails / hour / IP
```

### Per Identifier

```text
10 security emails / hour / identifier
```

The identifier-level control limits repeated targeting of one account or email address, while the IP-level control limits abuse originating from a single source.

Together with endpoint and global budgets, these limits provide protection against both concentrated and distributed abuse patterns.

---

# Concurrency-Safe Email Accounting

Email budget counters are stored in MySQL using the:

```text
email_budget_counters
```

table.

The counter implementation uses:

- Unique `bucket_key` values.
- Database-backed persistent counters.
- MySQL/InnoDB atomic update behavior.
- `INSERT ... ON DUPLICATE KEY UPDATE`.
- Window start and end timestamps.
- Separate bucket types and scopes.

This is designed to prevent race conditions in which multiple concurrent requests could otherwise read the same old counter value and all proceed as though capacity were still available.

---

# Email Budget Enforcement

The enforcement order is intentionally placed before external email delivery:

```text
Request
  │
  ▼
Validation / Authentication
  │
  ▼
Endpoint Rate Limit
  │
  ▼
Security Operation
  │
  ▼
Email Budget Check
  │
  ├── Exceeded ──► Reject
  │
  ▼
ZeptoMail
  │
  ▼
Email Delivery
```

The budget system therefore acts as an actual outbound-email control boundary rather than a post-delivery monitoring mechanism.

---

# Email Budget Monitoring

The email budget system has alert thresholds for elevated usage.

Current thresholds include:

| Scope | Alert Threshold |
| --- | ---: |
| Hourly | 100 |
| Daily | 1,000 |

These thresholds are intended to surface unusual or elevated email activity before a hard limit is reached.

---

# Cloudflare Proxy and Client IP Handling

Production traffic passes through Cloudflare.

The application includes dedicated Cloudflare proxy handling through:

```text
TrustCloudflareProxies
```

This allows application-level controls that depend on client IP information—such as rate limiting, abuse detection, email budgeting, and security logging—to operate correctly behind the trusted proxy layer.

Forwarded client information is not intended to be blindly trusted from arbitrary sources.

---

# Cloudflare Turnstile

The backend includes dedicated server-side Turnstile verification through:

```text
VerifyTurnstile
```

The middleware supports server-side verification against Cloudflare and handles verification failures, including invalid, expired, or duplicate tokens.

The verification path is designed to fail closed when it is explicitly enforced.

## Current Status

The backend Turnstile implementation is **available but not currently enforced on production authentication routes**.

The frontend integration required to generate and submit Turnstile tokens has not yet been completed. The application therefore retains its currently active rate-limiting and email-budget controls without falsely representing Turnstile as an active production enforcement layer.

---

# Security Headers

Production responses include security-oriented browser controls such as:

```text
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy
Permissions-Policy
```

These controls reduce common browser-side attack surfaces including:

- MIME-type sniffing.
- Unwanted framing.
- Excessive referrer disclosure.
- Unnecessary browser capability exposure.

---

# Transport Security

The production application is served through HTTPS.

The production traffic model is:

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

Production authentication cookies are configured to use secure transport.

HSTS is also part of the production security-header strategy.

---

# Production Debug Protection

Production configuration uses:

```text
APP_ENV=production
APP_DEBUG=false
```

This prevents normal production responses from exposing Laravel debugging pages, stack traces, environment information, or other development-only diagnostic details.

---

# Error Handling

API failures are handled through the application's API-aware exception handling rather than exposing development diagnostics to clients.

The application does not intentionally expose through normal production error responses:

- Database credentials.
- Application secrets.
- Passwords.
- Authentication tokens.
- Session secrets.
- Internal filesystem paths.
- Development stack traces.

Errors should therefore provide controlled application responses while retaining server-side diagnostic information for operational investigation.

---

# Security Logging

Security-relevant events are recorded server-side to support detection, troubleshooting, and investigation.

Relevant events can include:

- Authentication anomalies.
- Email-budget violations.
- OTP/security events.
- Reputation events.
- Badge-related security events.
- Moderation actions.
- Turnstile verification failures where the middleware is enforced.
- Security-related application exceptions.

Logs are intended to provide investigation value without becoming a secondary location for storing credentials or authentication secrets.

## Sensitive Data Logging

The application must not intentionally log:

- Passwords.
- Authentication tokens.
- OTP secrets.
- API keys.
- Database credentials.
- Session secrets.

Security logging should capture the context needed for investigation without reproducing sensitive authentication material.

---

# Email Provider Security

Security-sensitive email is delivered through ZeptoMail.

The provider is treated as a privileged external service rather than as the primary abuse-control layer.

Before a security email is sent, the application can enforce:

1. Endpoint rate limits.
2. IP rate limits.
3. Identifier rate limits.
4. Endpoint email budgets.
5. Global hourly email budgets.
6. Global daily email budgets.

Only after those controls succeed is the external email provider invoked.

Provider-side delivery failure is handled as an application-level failure and does not remove the application's own outbound-email restrictions.

---

# Scheduled Security Cleanup

Temporary security data is subject to scheduled cleanup.

Relevant cleanup includes:

- Pending registration data.
- Expired OTP/security challenges.

This limits unnecessary retention of temporary authentication-related state.

---

# Security Principles

The platform's implementation follows several core principles.

### Server-Side Authority

Authentication, authorization, validation, moderation, and security-sensitive state changes are enforced by the backend.

### Defense in Depth

No single control is assumed to be sufficient for a high-risk workflow.

### Least Privilege

Administrative and moderation capabilities are restricted according to role and policy.

### Untrusted Input

User-submitted text, Markdown, files, and request parameters are treated as untrusted until validated and sanitized.

### Resource Protection

External resources—particularly email delivery—are protected with independent budgets and rate limits.

### Database Enforcement

Important integrity rules are reinforced with database constraints rather than relying only on interface behavior.

### Auditable Security Actions

Security-sensitive and moderation-sensitive operations are logged where appropriate.

---

# Current Security Baseline

The currently implemented production security baseline includes:

| Security Control | Status |
| --- | --- |
| Password hashing | Active |
| Sanctum authentication | Active |
| Database-backed sessions | Active |
| CSRF protection | Active |
| Authentication rate limiting | Active |
| Registration rate limiting | Active |
| OTP verification limiting | Active |
| OTP resend limiting | Active |
| Password-reset protection | Active |
| Global email budgets | Active |
| Per-IP email budgets | Active |
| Per-identifier email budgets | Active |
| Per-endpoint email budgets | Active |
| Concurrency-safe email counters | Active |
| Role-based authorization | Active |
| Laravel Policies | Active |
| Mass-assignment protection | Active |
| SQL injection defenses | Active |
| XSS sanitization | Active |
| Upload validation | Active |
| Image re-encoding | Active |
| Moderation audit trail | Active |
| Security headers | Active |
| HTTPS | Active |
| Production debug disabled | Active |
| Cloudflare proxy handling | Active |
| Turnstile backend verification | Implemented |
| Turnstile frontend integration | Pending |
| Turnstile production enforcement | Pending |

---

# Responsible Security Disclosure

Security vulnerabilities should be reported responsibly through the official FireShark Community project communication channels.

A useful report should include:

- A clear description of the issue.
- The affected endpoint, feature, or component.
- Reproduction steps.
- Expected behavior.
- Actual behavior.
- Security impact.
- A minimal proof of concept where appropriate.
- Relevant screenshots or logs with credentials and secrets removed.

Researchers should avoid destructive testing, denial-of-service activity, unauthorized access to other users' information, uncontrolled email generation, and modification or deletion of production data.

The objective of responsible disclosure is to provide enough evidence to reproduce and remediate a vulnerability without unnecessarily increasing risk to the platform or its users.

---

# Security Scope

This document describes security controls that are implemented or explicitly identified in the current FireShark Community application.

It is not a statement that the application is immune to compromise. Security is continuously affected by application changes, dependency vulnerabilities, infrastructure configuration, credential security, browser behavior, and newly discovered attack techniques.

Security controls are therefore expected to be reviewed, tested, and strengthened as the platform evolves.
