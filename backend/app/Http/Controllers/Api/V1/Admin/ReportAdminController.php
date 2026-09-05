<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Report;
use App\Services\ModerationService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ReportAdminController extends Controller
{
    use ApiResponse;

    public function __construct(protected ModerationService $moderation)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $perPage = min((int) $request->query('per_page', 20), 100);

        $reports = Report::query()
            ->with(['reporter:id,name,username,avatar_path', 'handledBy:id,name,username'])
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->query('status')))
            ->orderByRaw("FIELD(status, 'pending', 'reviewing', 'resolved', 'dismissed')")
            ->orderByDesc('created_at')
            ->paginate($perPage)
            ->withQueryString();

        return $this->paginated($reports->through(fn ($report) => [
            'id' => $report->id,
            'reason' => $report->reason,
            'description' => $report->description,
            'status' => $report->status,
            'reportable_type' => $report->reportable_type,
            'reportable_id' => $report->reportable_id,
            'reporter' => $report->reporter ? ['name' => $report->reporter->name, 'username' => $report->reporter->username] : null,
            'handled_by' => $report->handledBy ? ['name' => $report->handledBy->name, 'username' => $report->handledBy->username] : null,
            'resolution_note' => $report->resolution_note,
            'created_at' => $report->created_at,
            'resolved_at' => $report->resolved_at,
            'target_excerpt' => $this->targetExcerpt($report),
        ]));
    }

    public function updateStatus(Request $request, Report $report): JsonResponse
    {
        $data = $request->validate([
            'status' => ['required', Rule::in(['reviewing', 'resolved', 'dismissed'])],
            'resolution_note' => ['nullable', 'string', 'max:1000'],
            'action' => ['nullable', Rule::in(['none', 'hide', 'delete', 'warn'])],
        ]);

        $moderator = $request->user();
        $target = $report->reportable;

        if ($data['action'] && $data['action'] !== 'none' && $target && ! $report->resolved_at) {
            switch ($data['action']) {
                case 'hide':
                    $this->moderation->hide($target, $moderator, 'Report #'.$report->id.': '.$report->reason);
                    break;
                case 'delete':
                    $this->moderation->delete($target, $moderator, 'Report #'.$report->id.': '.$report->reason);
                    break;
                case 'warn':
                    if ($target) {
                        $this->moderation->warn($target->user, $moderator, 'Your content was reported and reviewed by moderators. Please follow the community guidelines.');
                    }
                    break;
            }
        }

        $report->forceFill([
            'status' => $data['status'],
            'handled_by' => $moderator->id,
            'resolution_note' => $data['resolution_note'] ?? $report->resolution_note,
            'resolved_at' => in_array($data['status'], ['resolved', 'dismissed']) ? now() : null,
        ])->save();

        return $this->success(null, "Report {$data['status']}.");
    }

    protected function targetExcerpt(Report $report): ?string
    {
        $target = $report->reportable;

        if (! $target) {
            return null;
        }

        return match ($report->reportable_type) {
            'question' => $target->title,
            default => str_limit_excerpt($target->body, 160),
        };
    }
}
