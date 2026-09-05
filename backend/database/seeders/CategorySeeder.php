<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['name' => 'Cybersecurity', 'slug' => 'cybersecurity', 'description' => 'General cybersecurity questions — concepts, practices and fundamentals.', 'icon' => 'shield'],
            ['name' => 'Ethical Hacking', 'slug' => 'ethical-hacking', 'description' => 'Ethical hacking tools, methodologies and labs.', 'icon' => 'terminal'],
            ['name' => 'Penetration Testing', 'slug' => 'penetration-testing', 'description' => 'Web, network, API and infrastructure penetration testing.', 'icon' => 'crosshair'],
            ['name' => 'Bug Bounty', 'slug' => 'bug-bounty', 'description' => 'Responsible vulnerability research and bug bounty workflows.', 'icon' => 'bug'],
            ['name' => 'Networking', 'slug' => 'networking', 'description' => 'Networking concepts, protocols, routing, switching and troubleshooting.', 'icon' => 'network'],
            ['name' => 'Cloud Security', 'slug' => 'cloud-security', 'description' => 'AWS, Azure, GCP and cloud security.', 'icon' => 'cloud'],
            ['name' => 'SOC & Blue Team', 'slug' => 'soc-blue-team', 'description' => 'Monitoring, SIEM, detection, incident response and defensive security.', 'icon' => 'radar'],
            ['name' => 'Red Team', 'slug' => 'red-team', 'description' => 'Adversary simulation, attack techniques and offensive security.', 'icon' => 'target'],
            ['name' => 'Web Security', 'slug' => 'web-security', 'description' => 'Web application security, OWASP and application vulnerabilities.', 'icon' => 'globe'],
            ['name' => 'API Security', 'slug' => 'api-security', 'description' => 'REST APIs, authentication, authorization and API vulnerabilities.', 'icon' => 'api'],
            ['name' => 'Digital Forensics', 'slug' => 'digital-forensics', 'description' => 'Forensics, investigation and evidence handling.', 'icon' => 'search'],
            ['name' => 'Incident Response', 'slug' => 'incident-response', 'description' => 'Incident investigation, containment and recovery.', 'icon' => 'alert'],
            ['name' => 'Security Tools', 'slug' => 'security-tools', 'description' => 'Questions about security tools and platforms.', 'icon' => 'tool'],
            ['name' => 'Certifications', 'slug' => 'certifications', 'description' => 'CEH, CPENT, CCNA, security certifications and preparation.', 'icon' => 'certificate'],
            ['name' => 'Cybersecurity Careers', 'slug' => 'cybersecurity-careers', 'description' => 'Career paths, interviews, resumes and professional development.', 'icon' => 'briefcase'],
            ['name' => 'Labs & Projects', 'slug' => 'labs-projects', 'description' => 'Hands-on projects and laboratory troubleshooting.', 'icon' => 'flask'],
        ];

        foreach ($categories as $index => $category) {
            Category::updateOrCreate(
                ['slug' => $category['slug']],
                $category + ['sort_order' => $index + 1, 'is_active' => true]
            );
        }
    }
}
