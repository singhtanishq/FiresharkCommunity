<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BadgeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'icon' => $this->icon,
            'tier' => $this->tier,
            'award_type' => $this->award_type,
            'is_active' => $this->is_active,
            'awarded_at' => $this->when(isset($this->pivot), fn () => $this->pivot->created_at),
        ];
    }
}
