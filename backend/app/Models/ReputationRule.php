<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReputationRule extends Model
{
    protected $fillable = ['action', 'label', 'points', 'is_enabled'];

    protected function casts(): array
    {
        return [
            'is_enabled' => 'boolean',
        ];
    }
}
