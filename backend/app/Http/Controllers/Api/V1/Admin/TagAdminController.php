<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Question;
use App\Models\Tag;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class TagAdminController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $perPage = min((int) $request->query('per_page', 30), 100);

        $tags = Tag::query()
            ->when($request->filled('q'), fn ($q) => $q->where('name', 'like', '%'.$request->query('q').'%'))
            ->orderByDesc('questions_count')
            ->paginate($perPage)
            ->withQueryString();

        return $this->paginated($tags->through(fn ($tag) => [
            'id' => $tag->id,
            'name' => $tag->name,
            'slug' => $tag->slug,
            'description' => $tag->description,
            'questions_count' => $tag->questions_count,
            'created_at' => $tag->created_at,
        ]));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:60'],
            'description' => ['nullable', 'string', 'max:1000'],
        ]);

        $slug = Str::slug($data['name']);

        if (Tag::query()->where('slug', $slug)->exists()) {
            return $this->error('A tag with that name already exists.', 409);
        }

        $tag = Tag::create([
            'name' => $data['name'],
            'slug' => $slug,
            'description' => $data['description'] ?? null,
            'created_by' => $request->user()->id,
        ]);

        return $this->success($tag, 'Tag created.', 201);
    }

    public function update(Request $request, Tag $tag): JsonResponse
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:60'],
            'description' => ['nullable', 'string', 'max:1000'],
        ]);

        $tag->fill($data);

        if ($tag->isDirty('name')) {
            $newSlug = Str::slug($tag->name);

            if (Tag::query()->where('slug', $newSlug)->where('id', '!=', $tag->id)->exists()) {
                return $this->error('A tag with that name already exists.', 409);
            }

            $tag->slug = $newSlug;
        }

        $tag->save();

        return $this->success($tag, 'Tag updated.');
    }

    public function destroy(Tag $tag): JsonResponse
    {
        $tag->questions()->detach();
        $tag->delete();

        return $this->success(null, 'Tag deleted.');
    }

    /**
     * Merge one tag into another: all question associations move to the
     * target, the source disappears, and target counters are refreshed.
     */
    public function merge(Request $request, Tag $tag): JsonResponse
    {
        $data = $request->validate([
            'target_id' => ['required', 'integer', 'exists:tags,id', 'different:'.$tag->id],
        ]);

        $target = Tag::findOrFail($data['target_id']);

        DB::transaction(function () use ($tag, $target) {
            $questionIds = $tag->questions()->pluck('questions.id');

            $target->questions()->syncWithoutDetaching($questionIds);
            $tag->questions()->detach();
            $tag->delete();

            $target->update([
                'questions_count' => $target->questions()->count(),
            ]);
        });

        return $this->success(null, "Tag \"{$tag->name}\" merged into \"{$target->name}\".");
    }
}
