<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

abstract class ApiRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        // Trim scalar string inputs to avoid whitespace-only content.
        foreach ($this->all() as $key => $value) {
            if (is_string($value)) {
                $this->merge([$key => trim($value)]);
            }
        }
    }
}
