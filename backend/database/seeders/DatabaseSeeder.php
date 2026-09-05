<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

/**
 * Safe, production-ready seed data: categories, badges, reputation rules and
 * site settings. Contains NO fake users or fake questions (see
 * DevelopmentSeeder for local test data, never run in production).
 */
class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            CategorySeeder::class,
            BadgeSeeder::class,
            ReputationRuleSeeder::class,
            SettingSeeder::class,
        ]);
    }
}
