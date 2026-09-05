<?php

namespace Database\Seeders;

use App\Models\ReputationRule;
use Illuminate\Database\Seeder;

class ReputationRuleSeeder extends Seeder
{
    public function run(): void
    {
        $rules = [
            ['action' => 'question_posted', 'label' => 'Question posted', 'points' => 2],
            ['action' => 'answer_posted', 'label' => 'Answer posted', 'points' => 5],
            ['action' => 'question_upvoted', 'label' => 'Your question was upvoted', 'points' => 5],
            ['action' => 'question_downvoted', 'label' => 'Your question was downvoted', 'points' => -2],
            ['action' => 'answer_upvoted', 'label' => 'Your answer was upvoted', 'points' => 10],
            ['action' => 'answer_downvoted', 'label' => 'Your answer was downvoted', 'points' => -5],
            ['action' => 'answer_accepted', 'label' => 'Your answer was accepted', 'points' => 15],
            ['action' => 'moderation_violation', 'label' => 'Moderation violation penalty', 'points' => -50],
        ];

        foreach ($rules as $rule) {
            ReputationRule::updateOrCreate(
                ['action' => $rule['action']],
                $rule + ['is_enabled' => true]
            );
        }
    }
}
