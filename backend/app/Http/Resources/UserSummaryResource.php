<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserSummaryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        // Some queries select a narrow user column set, so role may be null.
        $role = $this->role?->value ?? 'user';

        $verification = $this->resource->relationLoaded('verifications')
            ? $this->resource->verifications->first(fn ($v) => $v->revoked_at === null)
            : null;

        return [
            'id' => $this->id,
            'name' => $this->name,
            'username' => $this->username,
            'avatar_path' => $this->avatar_path,
            'role' => $role,
            'reputation' => $this->reputation ?? 0,
            'verification' => $verification?->type,
        ];
    }
}
