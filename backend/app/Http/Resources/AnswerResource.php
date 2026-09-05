<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AnswerResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'question_id' => $this->question_id,
            'body' => $this->body,
            'status' => $this->status,
            'votes_score' => $this->votes_score,
            'accepted' => $this->accepted_at !== null,
            'accepted_at' => $this->accepted_at,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'user' => new UserSummaryResource($this->whenLoaded('user')),
            'comments' => CommentResource::collection($this->whenLoaded('comments')),
            'my_vote' => $this->when(isset($this->my_vote), fn () => $this->my_vote),
        ];
    }
}
