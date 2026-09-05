<?php

namespace App\Http\Requests;

use Illuminate\Validation\Rule;

class StoreReportRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'reportable_type' => ['required', Rule::in(['question', 'answer', 'comment'])],
            'reportable_id' => ['required', 'integer', 'min:1'],
            'reason' => ['required', Rule::in([
                'spam', 'abuse', 'personal_information', 'malicious_content',
                'off_topic', 'duplicate', 'misleading', 'copyright', 'other',
            ])],
            'description' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
