<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class SettingSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            ['key' => 'site_name', 'value' => 'FireShark Community', 'type' => 'text'],
            ['key' => 'site_description', 'value' => 'A technical community for cybersecurity professionals, learners, ethical hackers and technology enthusiasts.', 'type' => 'text'],
            ['key' => 'support_url', 'value' => 'https://fireshark.in/', 'type' => 'text'],
            ['key' => 'registration_enabled', 'value' => '1', 'type' => 'boolean'],
        ];

        foreach ($settings as $setting) {
            Setting::updateOrCreate(['key' => $setting['key']], $setting);
        }
    }
}
