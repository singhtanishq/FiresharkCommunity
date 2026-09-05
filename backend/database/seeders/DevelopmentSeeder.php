<?php

namespace Database\Seeders;

use App\Models\Answer;
use App\Models\Category;
use App\Models\Question;
use App\Models\Tag;
use App\Models\User;
use App\Services\AnswerService;
use App\Services\QuestionService;
use App\Services\VoteService;
use Illuminate\Database\Seeder;

/**
 * ⚠️ DEVELOPMENT-ONLY DATA — NEVER RUN IN PRODUCTION.
 *
 * Creates a small, realistic set of users, questions, answers, comments and
 * votes so the local environment can be exercised end to end. Content is
 * created through the domain services so reputation, badges, counters and
 * notifications behave exactly as they would in production.
 *
 * Usage: php artisan migrate:fresh --seed --seeder=DevelopmentSeeder
 */
class DevelopmentSeeder extends Seeder
{
    public function run(): void
    {
        if (app()->environment('production')) {
            $this->command->error('Refusing to seed development data in production.');

            return;
        }

        // Production baseline first.
        $this->call([
            CategorySeeder::class,
            BadgeSeeder::class,
            ReputationRuleSeeder::class,
            SettingSeeder::class,
        ]);

        $users = $this->createUsers();
        $this->createContent($users);
    }

    protected function createUsers(): array
    {
        $definition = [
            'admin' => ['name' => 'Tanishq Singh', 'username' => 'tanishq', 'role' => 'admin', 'bio' => 'Full-stack developer. Building the FireShark Community.', 'expertise' => 'Web security, PHP, React'],
            'mod' => ['name' => 'Meera Kapoor', 'username' => 'meera', 'role' => 'moderator', 'bio' => 'Security analyst and community moderator.', 'expertise' => 'SOC, SIEM, incident response'],
            'instructor' => ['name' => 'Arjun Mehta', 'username' => 'arjun', 'role' => 'user', 'bio' => 'Instructor at FireShark Academy. Networking and ethical hacking.', 'expertise' => 'CCNA, CEH, penetration testing', 'verification' => 'instructor'],
            'riya' => ['name' => 'Riya Sharma', 'username' => 'riya', 'role' => 'user', 'bio' => 'Bug bounty hunter in training.', 'expertise' => 'Web security'],
            'dev' => ['name' => 'Dev Patel', 'username' => 'devp', 'role' => 'user', 'bio' => 'SOC analyst. Love log analysis.', 'expertise' => 'Splunk, ELK'],
            'karan' => ['name' => 'Karan Verma', 'username' => 'karan', 'role' => 'user', 'bio' => 'Networking student preparing for CCNA.', 'expertise' => 'Routing & switching'],
        ];

        $created = [];

        foreach ($definition as $key => $attrs) {
            $user = User::updateOrCreate(
                ['email' => "{$key}@fireshark.test"],
                [
                    'name' => $attrs['name'],
                    'username' => $attrs['username'],
                    'password' => 'Password123!',
                    'email_verified_at' => now(),
                    'role' => $attrs['role'],
                    'bio' => $attrs['bio'],
                    'expertise' => $attrs['expertise'] ?? null,
                    'location' => 'India',
                    'notification_preferences' => ['answers' => true, 'comments' => true, 'mentions' => true, 'badges' => true, 'moderation' => true],
                ]
            );

            if (! empty($attrs['verification'])) {
                $user->verifications()->firstOrCreate(['type' => $attrs['verification']], [
                    'verified_by' => $user->id,
                    'created_at' => now(),
                ]);
            }

            $created[$key] = $user;
        }

        // Convenience aliases: some content seeds reference users by username.
        $created['tanishq'] = $created['admin'];
        $created['arjun'] = $created['instructor'];

        return $created;
    }

    protected function createContent(array $users): void
    {
        $questions = QuestionService::class;
        $answers = AnswerService::class;
        $votes = VoteService::class;

        $questionService = app($questions);
        $answerService = app($answers);
        $voteService = app($votes);

        $cat = fn (string $slug) => Category::query()->where('slug', $slug)->firstOrFail();

        $seedQuestions = [
            [
                'author' => 'karan', 'category' => 'networking',
                'title' => 'How can I troubleshoot an Nmap scan that shows no open ports?',
                'body' => "I am scanning a host on my home lab network and Nmap reports all 1000 filtered ports, even though I know SSH is running.\n\n```bash\nnmap -sS 192.168.1.10\n```\n\nWhat I have tried:\n\n1. Confirmed the host is up with a ping\n2. Tried `-Pn` to skip host discovery\n3. Checked from the target itself with `ss -tlnp` — port 22 is listening\n\n**What else should I check?** Is this likely a firewall issue on the target, or something about my scan type?",
                'tags' => ['nmap', 'networking', 'firewall'],
                'answers' => [
                    ['author' => 'instructor', 'body' => "This is almost always a firewall dropping **SYN** packets silently, which makes Nmap report `filtered`.\n\nTry these steps in order:\n\n1. **Compare a TCP connect scan** — it completes the full handshake and often behaves differently through stateful firewalls:\n   ```bash\n   nmap -sT -p 22 192.168.1.10\n   ```\n2. **Scan from inside the same subnet** — a default gateway ACL may be filtering cross-subnet traffic.\n3. **Check the target firewall** on the host itself:\n   ```bash\n   sudo ufw status verbose\n   ```\n4. If SYN packets are being dropped rather than rejected, `-Pn` helps only with host discovery, not port filtering.\n\nIf `-sT` shows the port open while `-sS` shows filtered, the firewall is specifically handling SYN in an unusual way (e.g. SYN proxy or drop rules)."],
                    ['author' => 'riya', 'body' => "Also worth checking whether you are scanning over a VPN or virtual network interface — I once spent an hour on this and the traffic was leaving through a different interface than expected. Run `tcpdump port 22` on the target while scanning to confirm packets actually arrive."],
                ],
                'accept' => 0,
                'comments' => [
                    ['author' => 'karan', 'target' => 0, 'body' => 'Thanks — the -sT comparison immediately revealed the difference. It was UFW dropping SYN.'],
                ],
                'votes' => [['user' => 'riya', 'value' => 1], ['user' => 'dev', 'value' => 1], ['user' => 'tanishq', 'value' => 1]],
            ],
            [
                'author' => 'riya', 'category' => 'web-security',
                'title' => 'What is the correct way to test for SQL injection in a login form during an authorized pentest?',
                'body' => "I have written authorization to test a client's staging environment. Their login form takes a username and password.\n\nWhat is a **methodical** way to test for SQL injection there, beyond throwing random payloads? I want to be able to explain the vulnerability class clearly in my report, not just say \"sqlmap found it\".",
                'tags' => ['sql-injection', 'web-security', 'burp-suite'],
                'answers' => [
                    ['author' => 'instructor', 'body' => "Good instinct wanting to understand the class, not just the tool. A methodical approach:\n\n### 1. Establish baseline behaviour\n\nSubmit a valid username with a wrong password and note the exact response (status code, body, timing). You need this to recognise *changes*.\n\n### 2. Break the syntax deliberately\n\nAppend a single quote to the username: `admin'`. Two distinct outcomes are meaningful:\n\n- **500 error or SQL error text** → the quote reached the database interpreter\n- **Same response as baseline** → parameterised or properly escaped\n\n### 3. Confirm with boolean logic\n\nTry `admin'--` (if the backend appends the password clause, commenting it out may log you in or change the response). Compare responses character by character.\n\n### 4. Timing side channels\n\n`admin' AND SLEEP(5)--` — if the response takes ~5s longer, the input is being evaluated.\n\n### 5. Then automate\n\nOnly now run sqlmap **against the confirmed parameter** with `--level` tuned, through Burp with `--proxy`. Automation without understanding produces false negatives on WAFs and blind contexts.\n\nIn your report, classify it as CWE-89, show the request/response evidence, and describe impact via data exposure."],
                    ['author' => 'tanishq', 'body' => "One addition: check for the injection point in *every* input — headers included. `X-Forwarded-For` and cookies sometimes get logged to a database with no parameterisation at all."],
                ],
                'accept' => 0,
                'comments' => [
                    ['author' => 'dev', 'target' => 0, 'body' => 'The baseline step is underrated — most false positives I see come from not recording the normal response first.'],
                ],
                'votes' => [['user' => 'dev', 'value' => 1], ['user' => 'mod', 'value' => 1]],
            ],
            [
                'author' => 'dev', 'category' => 'soc-blue-team',
                'title' => 'How do I distinguish legitimate PowerShell activity from malicious usage in SIEM alerts?',
                'body' => "Our SIEM keeps flagging `powershell.exe -EncodedCommand` alerts. Most turn out to be software deployment scripts.\n\nWhat indicators do experienced SOC analysts use to triage these alerts quickly and reduce false positives without missing real threats?",
                'tags' => ['powershell', 'siem', 'soc'],
                'answers' => [
                    ['author' => 'mod', 'body' => "Triage along these lines:\n\n**Context beats content.** For each alert capture:\n\n1. **Parent process** — `winword.exe` spawning PowerShell is very different from `sccm.exe` doing it\n2. **User context** — service account vs. interactive user vs. admin\n3. **Encoded command size** — huge base64 blobs (tens of KB) are rare in legitimate deployment\n4. **Network follow-on** — did the process then open connections to unusual destinations?\n\n**Decoding workflow:** decode `-EncodedCommand` (base64 → UTF-16LE) in your sandbox, then look for `DownloadString`, `IEX`, `FromBase64String` chains and suspicious hosts.\n\n**Longer term:** alert on *behaviour* (PowerShell writing to disk, creating scheduled tasks, accessing LSASS) instead of the encoding flag itself, and maintain an allowlist of signed deployment scripts hashed per version."],
                    ['author' => 'karan', 'body' => 'Also enable Script Block Logging (4104) if it is not on — then you see the decoded command directly in the event log and do not have to decode manually at all.'],
                ],
                'accept' => 0,
                'comments' => [],
                'votes' => [['user' => 'tanishq', 'value' => 1]],
            ],
            [
                'author' => 'tanishq', 'category' => 'api-security',
                'title' => 'How should I secure a REST API authentication flow with refresh tokens in Laravel?',
                'body' => "I am designing authentication for a Laravel REST API consumed by a React SPA. I want short-lived access tokens plus refresh tokens.\n\n- Should refresh tokens be stored in the database with rotation?\n- How do I prevent refresh token replay?\n- What belongs in the access token claims vs. the session?\n\nLooking for practical patterns that work on shared hosting (no Redis).",
                'tags' => ['laravel', 'api-security', 'authentication'],
                'answers' => [
                    ['author' => 'arjun', 'body' => "For a same-origin SPA, honestly evaluate whether you need refresh tokens at all — ** Sanctum's SPA cookie mode** gives you httpOnly session cookies with CSRF protection and zero token storage in JavaScript. That is the simplest secure baseline.\n\nIf you genuinely need tokens (mobile clients, third-party APIs):\n\n1. **Access tokens**: 5–15 minutes, carry only the user id + scopes, never roles you cannot afford to go stale\n2. **Refresh tokens**: opaque random strings stored hashed in the DB, one row per session\n3. **Rotation with replay detection**: every refresh issues a new token and invalidates the old one. If a *revoked* token is ever presented, treat the whole chain as compromised and revoke the family\n4. Shared hosting is fine — this is all just MySQL rows and indexed lookups\n\nKeep the access token *dumb* and the server authoritative; do not encode permissions into JWT claims and then trust them."],
                    ['author' => 'instructor', 'body' => "Agreed on rotation. One more thing: rate-limit the refresh endpoint hard (we use 10/min) and alert on refresh failures — a spike in invalid refresh attempts is usually replay or theft."],
                ],
                'accept' => 0,
                'comments' => [
                    ['author' => 'tanishq', 'target' => 0, 'body' => 'The replay-detection point about revoking the whole family is exactly what I was missing. Thank you.'],
                ],
                'votes' => [['user' => 'riya', 'value' => 1], ['user' => 'mod', 'value' => 1], ['user' => 'dev', 'value' => 1], ['user' => 'karan', 'value' => 1]],
            ],
            [
                'author' => 'riya', 'category' => 'bug-bounty',
                'title' => 'Is testing a self-hosted open source app copy for vulnerabilities considered ethical for learning?',
                'body' => "I want to sharpen my web security skills by auditing an open source project on my own machine (fully offline, my own copy, no external traffic).\n\nIs this an acceptable way to practice, and at what point would it cross a line? I want to make sure I stay within responsible bounds while learning.",
                'tags' => ['bug-bounty', 'ethics', 'web-security'],
                'answers' => [
                    ['author' => 'mod', 'body' => "Auditing software you run locally is not just ethical — it is one of the best forms of practice, and many projects actively welcome security reports.\n\nStay within these lines and you are fine:\n\n1. **Your environment only** — localhost/VMs, no traffic towards systems you do not own\n2. **Responsible disclosure** — if you find something real, check the project's `SECURITY.md` and report privately; do not open public issues with exploit details\n3. **Do not publish working exploit code** for patched-slowly vulnerabilities before a fix ships\n4. Same rules apply to deliberately vulnerable training apps (DVWA, Juice Shop) — they are designed exactly for this\n\nWhere it *would* cross a line: scanning public instances of the project, testing SaaS copies without permission, or selling undisclosed findings."],
                    ['author' => 'arjun', 'body' => 'Second this. Also read the project licence — some copyleft licences have disclosure expectations. And keep notes as you go: your methodology write-up becomes a portfolio piece even if you find nothing.'],
                ],
                'accept' => 0,
                'comments' => [],
                'votes' => [['user' => 'karan', 'value' => 1], ['user' => 'dev', 'value' => 1], ['user' => 'tanishq', 'value' => 1]],
            ],
            [
                'author' => 'karan', 'category' => 'certifications',
                'title' => 'Which certification should I pursue first as a beginner: CEH or CCNA?',
                'body' => "I am starting my cybersecurity career path and torn between starting with **CEH** (ethical hacking) or **CCNA** (networking).\n\nMy goal is offensive security long-term. Does it make sense to skip networking and go straight to CEH, or is the networking foundation essential first?",
                'tags' => ['ceh', 'ccna', 'career'],
                'answers' => [
                    ['author' => 'instructor', 'body' => "For offensive security specifically, **networking fundamentals are non-negotiable**. You cannot understand what Nmap is telling you, why a MITM works, or how to pivot without TCP/IP fluency.\n\nA pragmatic path:\n\n1. CCNA-level knowledge (you do not necessarily need the exam) — 2 to 3 months of serious study\n2. Linux fundamentals in parallel\n3. Then CEH or a more hands-on alternative (PNPT, eJPT) depending on budget\n4. Home lab throughout — attack boxes you own teach what exams cannot\n\nCEH is well-recognised for HR filters, but treat it as vocabulary; the hands-on certs prove skill."],
                ],
                'accept' => 0,
                'comments' => [],
                'votes' => [['user' => 'riya', 'value' => 1], ['user' => 'mod', 'value' => 1], ['user' => 'dev', 'value' => 1], ['user' => 'tanishq', 'value' => 1]],
            ],
            [
                'author' => 'dev', 'category' => 'incident-response',
                'title' => 'What are the first five actions during a suspected ransomware incident on a small business network?',
                'body' => "Writing our small team's first incident response runbook. If ransomware is suspected (files being encrypted, unusual extension writes):\n\nWhat are the **first five concrete actions** in the first minutes, before any external help arrives?",
                'tags' => ['ransomware', 'incident-response', 'blue-team'],
                'answers' => [
                    ['author' => 'mod', 'body' => "First minutes — in order:\n\n1. **Isolate, do not power off.** Disconnect affected machines from the network (unplug / disable NIC). RAM holds evidence; shutdown can also trigger some variants to finish encryption.\n2. **Stop the spread.** Disable Wi-Fi, isolate VLANs, block SMB lateral movement at the switch level if you can.\n3. **Preserve evidence.** Snapshot logs (EDR, firewall, AD), photograph running screens. Note exact times.\n4. **Identify patient zero and the clock.** Which host, which user, when did encryption start? This defines your scope and backup window.\n5. **Invoke the escalation path.** Your IR contact / insurance / legal — notification duties start early, and ransom negotiation is a specialist task.\n\nThen and only then: restore from **offline-verified** backups. Everything before this step exists to keep the blast radius from growing."],
                    ['author' => 'arjun', 'body' => 'Add a sixth from hard experience: agree on a single communications channel out-of-band (phone/Signal). If the adversary is in your email, your IR coordination may be monitored.'],
                ],
                'accept' => 0,
                'comments' => [
                    ['author' => 'dev', 'target' => 0, 'body' => 'Isolate-not-shutdown is the point I keep getting wrong in tabletop exercises — thank you for the RAM evidence rationale.'],
                ],
                'votes' => [['user' => 'tanishq', 'value' => 1], ['user' => 'riya', 'value' => 1]],
            ],
            [
                'author' => 'tanishq', 'category' => 'security-tools',
                'title' => 'Wireshark shows many TCP retransmissions on my lab network — what are common causes?',
                'body' => "While analysing a capture on my home lab I see lots of `TCP Retransmission` and `Dup ACK` packets.\n\nWhat are the most common root causes for these in a simple wired network, and how do I narrow it down in Wireshark?",
                'tags' => ['wireshark', 'tcp', 'troubleshooting'],
                'answers' => [
                    ['author' => 'karan', 'body' => "Common causes in order of likelihood on a small network:\n\n1. **Packet loss** — bad cable, flaky switch port, bufferbloat on the router. Check `expert information` for congestion indicators\n2. **MTU/fragmentation issues** — VPNs or tunnels shrinking path MTU cause retransmits on large segments\n3. **Asymmetric routing** in more complex topologies\n4. **Failing NIC offload** — try disabling checksum offload on the capture host; what Wireshark reports as bad checksums is sometimes just the capturing NIC\n\nIn Wireshark: use `tcp.analysis.retransmission` as a display filter, then `Statistics → Conversations` to see whether retransmits cluster on one host/stream. One stream → application/socket issue. Everywhere → physical layer."],
                    ['author' => 'instructor', 'body' => 'Nice summary. For labs, I would add: mirror the switch port properly (SPAN) — capturing through the router double-NATs and confuses everything.'],
                ],
                'accept' => 0,
                'comments' => [],
                'votes' => [['user' => 'riya', 'value' => 1]],
            ],
            [
                'author' => 'riya', 'category' => 'ethical-hacking',
                'title' => 'Building a small home pentest lab safely — what hardware and network segmentation do I need?',
                'body' => "I want to build a proper home lab for practising penetration testing: a couple of deliberately vulnerable VMs, Kali, and maybe a small firewall VM.\n\nWhat is a sensible setup that keeps everything **contained** so experiments never touch my home network or the internet?",
                'tags' => ['home-lab', 'kali-linux', 'virtualization'],
                'answers' => [
                    ['author' => 'arjun', "body" => "Keep it boring and layered:\n\n**Network shape**\n\n- A dedicated lab interface/VLAN on your router, or better: no uplink at all while practising\n- Virtual network isolation: set VMs to a *Host-only* or *Internal* network in VirtualBox/VMware — the host acts as the router and nothing leaks\n- Firewall VM (pfSense/OPNsense) between lab and home LAN with an explicit deny-all out rule\n\n**Compute** — any machine with 32 GB RAM comfortably runs Kali + 2-3 targets + pfSense. 16 GB works with lighter targets.\n\n**Targets to start**: Metasploitable 2/3, DVWA inside a small Debian VM, VulnHub images, or a local Hack The Box Pro Lab offline alternative.\n\n**Habits that matter more than hardware**: snapshot before every session, keep a lab notebook, and re-verify isolation with a quick `ping 8.8.8.8` from the lab before running anything aggressive."],
                    ['author' => 'mod', 'body' => '+1 to the `ping 8.8.8.8` check. I also put the lab on its own physical NIC that I unplug when idle — belt and braces.'],
                ],
                'accept' => 0,
                'comments' => [],
                'votes' => [['user' => 'karan', 'value' => 1], ['user' => 'dev', 'value' => 1]],
            ],
            [
                'author' => 'karan', 'category' => 'cloud-security',
                'title' => 'What are the most important IAM mistakes to avoid when securing a small AWS account?',
                'body' => "I am setting up a small AWS account for a project and want to get IAM right from the start rather than retrofit security later.\n\nWhich IAM mistakes matter most for a small account, and what does a sane minimal setup look like?",
                'tags' => ['aws', 'iam', 'cloud-security'],
                'answers' => [
                    ['author' => 'tanishq', 'body' => "The high-impact ones:\n\n1. **No root user usage** — root stays behind MFA for billing/break-glass only; everything else is IAM Identity Center users\n2. **No long-lived access keys for humans** — use SSO sessions; keys only for machine identities, rotated\n3. **Wildcards in policies** — `\"Action\": \"*\"` on `\"Resource\": \"*\"` is how small accounts become big incidents. Start from zero permissions and add\n4. **No MFA on privileged users** — non-negotiable, including the break-glass root\n5. **Wildcard-principal trust policies** on roles — pin trust to specific role ARNs, add external-id conditions for third parties\n\nSane minimal setup: Identity Center → one admin user (you), one read-only user, per-project roles with scoped policies, CloudTrail on, and a budget alarm so compromise shows up in your inbox."],
                ],
                'accept' => 0,
                'comments' => [],
                'votes' => [['user' => 'dev', 'value' => 1], ['user' => 'mod', 'value' => 1]],
            ],
        ];

        $allTags = collect($seedQuestions)->flatMap(fn ($q) => $q['tags'] ?? [])->unique()->values();

        foreach ($allTags as $tagName) {
            Tag::firstOrCreate(
                ['slug' => \Illuminate\Support\Str::slug($tagName)],
                ['name' => $tagName, 'created_by' => $users['admin']->id]
            );
        }

        foreach ($seedQuestions as $seed) {
            $author = $users[$seed['author']];

            $question = $questionService->create($author, [
                'title' => $seed['title'],
                'body' => $seed['body'],
                'category_id' => $cat($seed['category'])->id,
                'tags' => $seed['tags'] ?? [],
            ]);

            $createdAnswers = [];
            foreach ($seed['answers'] ?? [] as $answerSeed) {
                $createdAnswers[] = $answerService->create(
                    $question,
                    $users[$answerSeed['author']],
                    $answerSeed['body']
                );
            }

            foreach ($seed['comments'] ?? [] as $commentSeed) {
                $target = $commentSeed['target'] === 0 ? $question : $createdAnswers[$commentSeed['target']];

                app(\App\Services\CommentService::class)->create(
                    $target,
                    $users[$commentSeed['author']],
                    $commentSeed['body']
                );
            }

            foreach ($seed['votes'] ?? [] as $voteSeed) {
                $voteService->vote($users[$voteSeed['user']], $question, $voteSeed['value']);
            }

            foreach ($seed['answer_votes'] ?? [] as $voteSeed) {
                $voteService->vote($users[$voteSeed['user']], $createdAnswers[$voteSeed['answer']], $voteSeed['value']);
            }

            if (isset($seed['accept']) && $createdAnswers) {
                $answerService->accept($question, $createdAnswers[$seed['accept']], $author);
            }
        }

        // Sync cached counters after all the activity.
        foreach (User::all() as $user) {
            $user->forceFill([
                'questions_count' => $user->questions()->count(),
                'answers_count' => $user->answers()->count(),
                'accepted_answers_count' => $user->answers()->whereNotNull('accepted_at')->count(),
            ])->saveQuietly();
        }

        foreach (Category::all() as $category) {
            $category->forceFill(['questions_count' => $category->questions()->count()])->saveQuietly();
        }

        foreach (Tag::all() as $tag) {
            $tag->forceFill(['questions_count' => $tag->questions()->count()])->saveQuietly();
        }

        $this->command->info('Development data seeded: '.User::count().' users, '.Question::count().' questions, '.Answer::count().' answers.');
        $this->command->warn('All dev users use password: Password123!');
    }
}
