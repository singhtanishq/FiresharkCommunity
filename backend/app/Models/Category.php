<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Category extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = ['name', 'slug', 'description', 'icon', 'sort_order', 'is_active'];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * Public URLs use the human-readable slug (e.g. /categories/networking),
     * not the numeric primary key, so route model binding matches the right
     * column on the show endpoint.
     */
    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    public function questions(): HasMany
    {
        return $this->hasMany(Question::class);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true)->orderBy('sort_order')->orderBy('name');
    }
}
