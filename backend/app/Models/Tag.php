<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Tag extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'slug', 'description', 'created_by'];

    public function questions(): BelongsToMany
    {
        return $this->belongsToMany(Question::class, 'question_tags');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
