<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class Media extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'user_id', 'path', 'disk', 'mime_type', 'size', 'original_name', 'width', 'height', 'created_at',
    ];

    protected function casts(): array
    {
        return [
            'created_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function getUrlAttribute(): string
    {
        return str_starts_with($this->path, 'http')
            ? $this->path
            : Storage::disk($this->disk)->url($this->path);
    }
}
