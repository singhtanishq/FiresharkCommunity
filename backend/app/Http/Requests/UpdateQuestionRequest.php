<?php

namespace App\Http\Requests;

use Illuminate\Validation\Rule;

class UpdateQuestionRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'title' => ['sometimes', 'string', 'min:15', 'max:180'],
            'body' => ['sometimes', 'string', 'min:30', 'max:60000'],
            'category_id' => ['sometimes', 'integer', Rule::exists('categories', 'id')->where('is_active', true)],
            'tags' => ['nullable', 'array', 'max:5'],
            'tags.*' => ['string', 'max:60'],
        ];
    }
}
