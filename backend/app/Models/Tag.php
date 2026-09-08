<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Tag extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'slug', 'description', 'created_by'];

    /**
     * Public URLs use the slug (e.g. /tags/nmap), not the primary key.
     */
    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    public function questions(): BelongsToMany
    {
        return $this->belongsToMany(Question::class, 'question_tags');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
