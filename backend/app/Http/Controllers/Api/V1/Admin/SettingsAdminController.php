<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Services\LeaderboardService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingsAdminController extends Controller
{
    use ApiResponse;

    protected const ALLOWED_KEYS = [
        'site_name' => 'text',
        'site_description' => 'text',
        'community_guidelines' => 'text',
        'about_content' => 'text',
        'support_url' => 'text',
        'leaderboard_rewards_note' => 'text',
        'registration_enabled' => 'boolean',
    ];

    public function __construct(protected LeaderboardService $leaderboard)
    {
    }

    public function index(): JsonResponse
    {
        $settings = [];

        foreach (array_keys(self::ALLOWED_KEYS) as $key) {
            $settings[$key] = Setting::get($key);
        }

        return $this->success($settings);
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate(
            collect(self::ALLOWED_KEYS)
                ->mapWithKeys(fn ($type, $key) => [
                    $key => [match ($type) {
                        'boolean' => 'boolean',
                        default => 'nullable|string|max:20000',
                    }],
                ])
                ->all()
        );

        foreach ($data as $key => $value) {
            if (array_key_exists($key, self::ALLOWED_KEYS)) {
                Setting::set($key, $value, self::ALLOWED_KEYS[$key]);
            }
        }

        return $this->success(null, 'Settings saved.');
    }

    public function leaderboardIndex(): JsonResponse
    {
        return $this->success([
            'periods' => $this->leaderboard->finalizedPeriods(),
            'current' => $this->leaderboard->current(),
        ]);
    }

    public function leaderboardFinalize(Request $request): JsonResponse
    {
        $data = $request->validate([
            'period_key' => ['required', 'string', 'date_format:Y-m'],
        ]);

        $period = $this->leaderboard->finalize($data['period_key']);

        if (! $period) {
            return $this->error('Period not found or already finalized.', 404);
        }

        return $this->success(null, "Leaderboard for {$data['period_key']} finalized.");
    }
}
