<?php

namespace App\Http\Requests;

use App\Models\Tag;
use Illuminate\Validation\Rule;

class StoreQuestionRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'min:15', 'max:180'],
            'body' => ['required', 'string', 'min:30', 'max:60000'],
            'category_id' => ['required', 'integer', Rule::exists('categories', 'id')->where('is_active', true)],
            'tags' => ['nullable', 'array', 'max:5'],
            'tags.*' => ['string', 'max:60'],
            'status' => ['nullable', 'in:draft,published'],
        ];
    }
}
