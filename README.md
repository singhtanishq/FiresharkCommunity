# FireShark Community

A technical Q&A and knowledge-sharing platform for the FireShark community — built to help cybersecurity professionals, learners, developers, and technology enthusiasts ask questions, exchange knowledge, and build expertise together.

**Production domain:** `community.fireshark.in`

**Technology:** React 19 · TypeScript · Vite · Laravel 13 · PHP 8.3+ · MySQL 8+ · Laravel Sanctum

---

## Overview

FireShark Community provides a structured environment for technical discussions, questions, answers, and knowledge sharing.

The platform combines Q&A functionality with community-driven reputation, badges, leaderboards, moderation, notifications, and searchable technical content.

Key capabilities include:

* Technical questions and answers
* Rich content and code formatting
* Categories and tags
* Voting and accepted answers
* Reputation and badges
* Monthly leaderboards
* User profiles and verification
* Search and discovery
* Notifications and mentions
* Community moderation
* Administrative controls
* SEO-friendly public content

---

## Features

| Area                    | Highlights                                                                                                                               |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **Questions & Answers** | Rich editor, code blocks, image uploads, drafts, revisions, slugs, and question status                                                   |
| **Voting**              | Upvotes, downvotes, duplicate-vote prevention, self-vote protection, and score tracking                                                  |
| **Accepted Answers**    | Question-author acceptance, staff override, single accepted answer, and solved status                                                    |
| **Reputation**          | Auditable reputation ledger with configurable rules and contribution-based scoring                                                       |
| **Badges**              | Criteria-based achievements and manually assigned recognition badges                                                                     |
| **Leaderboard**         | Monthly contributor rankings with historical leaderboard records                                                                         |
| **Profiles**            | Public profiles, reputation, badges, contributions, accepted answers, and verification                                                   |
| **Categories & Tags**   | Structured content organization and topic-based discovery                                                                                |
| **Search**              | Search across questions, answers, categories, and tags with filtering and pagination                                                     |
| **Notifications**       | In-app notifications, user preferences, mentions, answers, comments, votes, and achievements                                             |
| **Moderation**          | Reports, content review, hiding/restoring, closing/reopening, deletion, suspension, and audit history                                    |
| **Administration**      | Dashboard, users, content, categories, tags, badges, reputation rules, leaderboard, and system settings                                  |
| **SEO**                 | Dynamic metadata, canonical URLs, Open Graph, Twitter metadata, Q&A structured data, sitemap, and robots.txt                             |
| **Security**            | Authentication, authorization policies, request validation, rate limiting, content sanitisation, upload validation, and security headers |

---

## Community Scope

The platform is designed primarily around technical and professional topics, including:

* Cybersecurity
* Ethical hacking
* Penetration testing
* Bug bounty
* Web and API security
* Networking
* Cloud security
* SOC and Blue Team
* Red Team
* Digital forensics
* Incident response
* Security tools
* Certifications
* Labs and projects
* Cybersecurity careers
* Technical troubleshooting

Content organization is managed through configurable categories and tags rather than being hard-coded into the frontend.

---

## Technology Stack

### Frontend

* **React 19**
* **TypeScript**
* **Vite**
* **React Router**
* REST API integration
* Responsive component-based UI

### Backend

* **Laravel 13**
* **PHP 8.3+**
* RESTful API architecture
* Laravel Sanctum authentication
* Policies and authorization
* Request validation
* Queue and scheduler support where required

### Database

* **MySQL 8+**
* Relational data model
* Foreign-key relationships
* Indexed queries
* Laravel migrations and seeders

### Infrastructure

* **Hostinger** — production hosting
* **Cloudflare** — DNS, proxy, SSL, and edge layer
* **Docker** — optional local development environment

---

## Architecture

The application follows a straightforward full-stack architecture:

```text
                    ┌─────────────────────┐
                    │      Cloudflare     │
                    │   DNS / Proxy / SSL │
                    └──────────┬──────────┘
                               │
                               ▼
                  community.fireshark.in
                               │
                               ▼
                    ┌─────────────────────┐
                    │      Hostinger      │
                    │   Shared Hosting    │
                    └──────────┬──────────┘
                               │
                    ┌──────────┴──────────┐
                    │                     │
                    ▼                     ▼
              React Frontend        Laravel Backend
              Production Build          REST API
                    │                     │
                    └──────────┬──────────┘
                               ▼
                            MySQL
```

During development, the frontend and backend can run independently:

```text
React / Vite
localhost:5173
       │
       ▼
Laravel API
localhost:8000
       │
       ▼
MySQL
```

For production, the React application is compiled into a production build and served alongside Laravel, allowing the platform to operate from a single origin without requiring a continuously running Node.js application server.

---

## Repository Structure

```text
fireshark-community/
│
├── backend/                    # Laravel application
│   ├── app/
│   ├── database/
│   ├── public/
│   ├── resources/
│   ├── routes/
│   ├── storage/
│   └── tests/
│
├── frontend/                   # React + TypeScript application
│   ├── public/
│   ├── src/
│   ├── package.json
│   └── vite.config.*
│
├── docs/                       # Project documentation
│   ├── architecture.md
│   ├── api.md
│   ├── database.md
│   ├── local-development.md
│   ├── testing.md
│   ├── deployment-hostinger.md
│   ├── cloudflare.md
│   ├── security.md
│   ├── administration.md
│   └── community-rules.md
│
├── deployment/                 # Production deployment utilities
│
├── docker-compose.yml          # Optional local development services
│
└── README.md
```

---

## Local Development

### Prerequisites

Install the following:

* PHP 8.3+
* Composer
* Node.js 20+
* MySQL 8+
* Git

Docker can optionally be used to provide local infrastructure such as MySQL.

---

### Backend Setup

```bash
cd backend

cp .env.example .env

composer install

php artisan key:generate
```

Configure the database connection in `.env`, then run:

```bash
php artisan migrate --seed

php artisan storage:link

php artisan serve
```

Laravel will be available at:

```text
http://localhost:8000
```

---

### Frontend Setup

In a separate terminal:

```bash
cd frontend

npm install

npm run dev
```

The Vite development server will be available at:

```text
http://localhost:5173
```

---

### Create an Administrator

After the backend has been configured:

```bash
cd backend

php artisan community:create-admin
```

Follow the interactive prompts to create the initial administrator account.

---

## Development Data

Development-only sample data can be generated when required:

```bash
php artisan migrate:fresh --seed --seeder=DevelopmentSeeder
```

This should only be used in local development environments.

Production databases must never be reset using destructive migration commands.

---

## Email Configuration

Email functionality is configurable through Laravel's mail configuration.

For local development, the application can use Laravel's log mailer so that email messages are recorded in:

```text
backend/storage/logs/laravel.log
```

Email verification requirements can be configured through the application's environment settings.

---

## Production Build

The project includes a production build process:

```bash
./deployment/build-production.sh
```

The build process:

1. Compiles the React application.
2. Places the production frontend assets into the Laravel application.
3. Prepares Laravel for production.
4. Optimizes the application configuration and routes where applicable.

The resulting application is designed to run from a single production origin:

```text
https://community.fireshark.in
```

---

## Production Deployment

The production environment is designed for deployment on the existing FireShark hosting infrastructure.

### Hosting

**Hostinger**

The Laravel application and MySQL database are hosted through the FireShark Hostinger account.

### Domain

```text
community.fireshark.in
```

### DNS

DNS is managed through **Cloudflare**.

The `community` subdomain should point to the appropriate Hostinger server using the production server address provided by Hostinger.

The exact DNS target should be taken from the production hosting environment rather than hard-coded in project documentation.

### SSL

The recommended production configuration is:

```text
Browser
   ↓ HTTPS
Cloudflare
   ↓ HTTPS
Hostinger
```

Cloudflare should use **Full (strict)** SSL when the Hostinger origin has a valid SSL certificate.

Detailed deployment instructions are available in:

* [Hostinger Deployment](docs/deployment-hostinger.md)
* [Cloudflare Configuration](docs/cloudflare.md)

---

## Authentication & Authorization

Authentication is handled through Laravel Sanctum.

The platform supports role-based access for:

* **Users**
* **Moderators**
* **Administrators**

Authorization is enforced server-side through Laravel policies and permissions.

Frontend restrictions are used for user experience, but they are never treated as the actual security boundary.

---

## Content & Community Management

The platform provides administrative controls for:

* Users
* Questions
* Answers
* Comments
* Categories
* Tags
* Reports
* Badges
* Reputation rules
* Leaderboards
* Notifications
* Community settings

Moderators can review reported content and take appropriate actions, while administrators have complete platform-level control.

---

## SEO

Public community content is designed to be discoverable through search engines.

The platform supports:

* Dynamic page titles
* Meta descriptions
* Canonical URLs
* Open Graph metadata
* Social sharing metadata
* XML sitemap
* `robots.txt`
* SEO-friendly slugs
* Q&A structured data
* Indexable public question pages

Individual question pages use structured data appropriate for community Q&A content.

---

## Security

Security is treated as a core application requirement.

The application includes protections and controls for:

* Authentication
* Authorization
* Request validation
* CSRF protection
* XSS prevention and content sanitisation
* SQL injection protection
* Rate limiting
* Secure password hashing
* File upload validation
* File size restrictions
* Security headers
* Access control
* Moderation
* Audit logging

Production configuration must use:

```text
APP_ENV=production
APP_DEBUG=false
```

Sensitive configuration values must be provided through environment variables and must never be committed to the repository.

---

## Testing

The project includes automated backend testing and critical application-flow testing.

Tests cover core functionality such as:

* Authentication
* Authorization
* Questions
* Answers
* Voting
* Accepted answers
* Reputation
* Badges
* Leaderboards
* Notifications
* Reports
* Moderation
* API validation

Run the Laravel test suite with:

```bash
cd backend

php artisan test
```

Frontend and end-to-end testing should also be performed for the primary user journeys before every production release.

---

## Documentation

Detailed project documentation is maintained under `docs/`.

| Document                                             | Description                                          |
| ---------------------------------------------------- | ---------------------------------------------------- |
| [Architecture](docs/architecture.md)                 | Application architecture and request flow            |
| [Database](docs/database.md)                         | Database schema, relationships, indexes, and seeders |
| [API](docs/api.md)                                   | REST API endpoints and request/response structures   |
| [Local Development](docs/local-development.md)       | Development environment and workflow                 |
| [Testing](docs/testing.md)                           | Test strategy and execution                          |
| [Hostinger Deployment](docs/deployment-hostinger.md) | Production deployment procedure                      |
| [Cloudflare](docs/cloudflare.md)                     | DNS, proxy, and SSL configuration                    |
| [Security](docs/security.md)                         | Security architecture and review checklist           |
| [Administration](docs/administration.md)             | Administrator and moderator operations               |
| [Community Rules](docs/community-rules.md)           | Public community guidelines                          |

---

## Environment Configuration

Production credentials and secrets must never be committed to Git.

Use:

```text
.env.example
```

as the reference for required environment variables.

Typical production configuration includes:

```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://community.fireshark.in

DB_CONNECTION=mysql
DB_HOST=
DB_PORT=3306
DB_DATABASE=
DB_USERNAME=
DB_PASSWORD=
```

Actual production values must be configured directly in the hosting environment.

---

## Deployment Checklist

Before going live, verify:

* [ ] Production environment configured
* [ ] `APP_DEBUG=false`
* [ ] MySQL database created
* [ ] Database migrations completed
* [ ] Storage permissions configured
* [ ] React production build generated
* [ ] Laravel production optimizations applied
* [ ] SSL enabled
* [ ] `community.fireshark.in` configured in Hostinger
* [ ] Cloudflare DNS configured
* [ ] Cloudflare SSL configured
* [ ] Authentication tested
* [ ] Question creation tested
* [ ] Answer submission tested
* [ ] Voting tested
* [ ] Notifications tested
* [ ] Moderation tested
* [ ] File uploads tested
* [ ] Sitemap verified
* [ ] Robots configuration verified
* [ ] SEO metadata verified
* [ ] Mobile responsiveness verified
* [ ] Security checks completed
* [ ] Production backups configured

---

## FireShark Ecosystem

The community operates as part of the broader FireShark ecosystem.

* **Main Website:** `fireshark.in`
* **Academy:** `academy.fireshark.in`
* **Learning Platform:** `learn.fireshark.in`
* **Technology Platform:** `fireshark.ai`
* **Community:** `community.fireshark.in`

The community is maintained as an independent application while remaining visually and structurally aligned with the wider FireShark ecosystem.

---

## License & Ownership

**Proprietary — FireShark. All rights reserved.**
