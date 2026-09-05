<?php

namespace App\Http\Requests;

class StoreCommentRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'body' => ['required', 'string', 'min:2', 'max:2000'],
        ];
    }
}
