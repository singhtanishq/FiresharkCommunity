<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class QuestionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'url' => '/questions/'.$this->slug,
            'body' => $this->when($request->routeIs('questions.show') || $request->boolean('with_body'), $this->body),
            'excerpt' => $this->when(! $request->routeIs('questions.show'), fn () => str_limit_excerpt($this->body, 240)),
            'status' => $this->status->value,
            'is_solved' => $this->is_solved,
            'closed_reason' => $this->closed_reason,
            'views' => $this->views,
            'votes_score' => $this->votes_score,
            'answers_count' => $this->answers_count,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'last_activity_at' => $this->last_activity_at,
            'user' => new UserSummaryResource($this->whenLoaded('user')),
            'category' => new CategoryResource($this->whenLoaded('category')),
            'tags' => TagResource::collection($this->whenLoaded('tags')),
            'accepted_answer_id' => $this->accepted_answer_id,
            'my_vote' => $this->when(isset($this->my_vote), fn () => $this->my_vote),
            'bookmarked' => $this->when(isset($this->bookmarked), fn () => (bool) $this->bookmarked),
            'following' => $this->when(isset($this->following), fn () => (bool) $this->following),
        ];
    }
}
