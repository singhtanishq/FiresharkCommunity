<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class Setting extends Model
{
    protected $fillable = ['key', 'value', 'type'];

    protected function casts(): array
    {
        return [
            'value' => match ($this->type ?? 'text') {
                'boolean' => 'boolean',
                'integer' => 'integer',
                'json' => 'array',
                default => 'string',
            },
        ];
    }

    public static function get(string $key, mixed $default = null): mixed
    {
        return Cache::remember("settings:{$key}", 600, function () use ($key, $default) {
            $setting = static::query()->where('key', $key)->first();

            return $setting?->value ?? $default;
        });
    }

    public static function set(string $key, mixed $value, string $type = 'text'): void
    {
        static::updateOrCreate(['key' => $key], ['value' => $value, 'type' => $type]);
        Cache::forget("settings:{$key}");
    }
}
