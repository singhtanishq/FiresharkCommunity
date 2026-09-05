<?php

namespace Database\Factories;

use App\Models\Category;
use App\Models\Question;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Question>
 */
class QuestionFactory extends Factory
{
    protected $model = Question::class;

    public function definition(): array
    {
        $title = ucfirst(fake()->words(6, true));

        return [
            'user_id' => User::factory(),
            'category_id' => Category::factory(),
            'title' => 'How can I '.$title.'?',
            'slug' => \Illuminate\Support\Str::slug('how-can-i-'.$title).'-'.\Illuminate\Support\Str::lower(\Illuminate\Support\Str::random(6)),
            'body' => fake()->paragraphs(3, true),
            'status' => 'published',
            'last_activity_at' => now(),
        ];
    }
}
