<?php

namespace App\Http\Requests;

class StoreAnswerRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'body' => ['required', 'string', 'min:30', 'max:60000'],
        ];
    }
}
