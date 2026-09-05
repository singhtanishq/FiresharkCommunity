<?php

namespace Database\Seeders;

use App\Models\Badge;
use Illuminate\Database\Seeder;

class BadgeSeeder extends Seeder
{
    public function run(): void
    {
        $badges = [
            ['name' => 'First Question', 'slug' => 'first-question', 'description' => 'Asked your first question.', 'tier' => 'bronze', 'award_type' => 'automatic', 'criteria' => ['type' => 'questions_count', 'count' => 1], 'sort_order' => 1],
            ['name' => 'First Answer', 'slug' => 'first-answer', 'description' => 'Provided your first answer.', 'tier' => 'bronze', 'award_type' => 'automatic', 'criteria' => ['type' => 'answers_count', 'count' => 1], 'sort_order' => 2],
            ['name' => 'Helpful', 'slug' => 'helpful', 'description' => 'Received 5 upvotes on your contributions.', 'tier' => 'bronze', 'award_type' => 'automatic', 'criteria' => ['type' => 'upvotes_received', 'count' => 5], 'sort_order' => 3],
            ['name' => 'Problem Solver', 'slug' => 'problem-solver', 'description' => 'Had 3 answers accepted.', 'tier' => 'silver', 'award_type' => 'automatic', 'criteria' => ['type' => 'accepted_answers', 'count' => 3], 'sort_order' => 4],
            ['name' => 'Community Contributor', 'slug' => 'community-contributor', 'description' => 'Reached 100 reputation.', 'tier' => 'silver', 'award_type' => 'automatic', 'criteria' => ['type' => 'reputation', 'count' => 100], 'sort_order' => 5],
            ['name' => 'Mentor', 'slug' => 'mentor', 'description' => 'Had 10 answers accepted — consistently helping others succeed.', 'tier' => 'gold', 'award_type' => 'automatic', 'criteria' => ['type' => 'accepted_answers', 'count' => 10], 'sort_order' => 6],
            ['name' => 'Expert Contributor', 'slug' => 'expert-contributor', 'description' => 'Reached 500 reputation through high-quality contributions.', 'tier' => 'gold', 'award_type' => 'automatic', 'criteria' => ['type' => 'reputation', 'count' => 500], 'sort_order' => 7],
            ['name' => 'FireShark Instructor', 'slug' => 'fireshark-instructor', 'description' => 'Verified FireShark instructor.', 'tier' => 'gold', 'award_type' => 'manual', 'criteria' => null, 'sort_order' => 8],
            ['name' => 'FireShark Professional', 'slug' => 'fireshark-professional', 'description' => 'Verified FireShark team or professional account.', 'tier' => 'gold', 'award_type' => 'manual', 'criteria' => null, 'sort_order' => 9],
        ];

        foreach ($badges as $badge) {
            Badge::updateOrCreate(['slug' => $badge['slug']], $badge);
        }
    }
}
