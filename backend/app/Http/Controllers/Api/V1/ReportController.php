<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreReportRequest;
use App\Models\Answer;
use App\Models\Comment;
use App\Models\Question;
use App\Models\Report;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    use ApiResponse;

    public function store(StoreReportRequest $request): JsonResponse
    {
        $data = $request->validated();

        $reportableClass = match ($data['reportable_type']) {
            'question' => Question::class,
            'answer' => Answer::class,
            'comment' => Comment::class,
        };

        $morphType = (new $reportableClass)->getMorphClass();

        $target = $reportableClass::query()->findOrFail($data['reportable_id']);

        // One open report per reporter per target.
        $alreadyOpen = Report::query()
            ->where('reporter_id', $request->user()->id)
            ->where('reportable_type', $morphType)
            ->where('reportable_id', $target->getKey())
            ->whereIn('status', ['pending', 'reviewing'])
            ->exists();

        if ($alreadyOpen) {
            return $this->error('You already have an open report for this content.', 409);
        }

        Report::create([
            'reporter_id' => $request->user()->id,
            'reportable_type' => $morphType,
            'reportable_id' => $target->getKey(),
            'reason' => $data['reason'],
            'description' => $data['description'] ?? null,
            'status' => 'pending',
        ]);

        return $this->success(null, 'Report submitted. Our moderators will review it.', 201);
    }
}
