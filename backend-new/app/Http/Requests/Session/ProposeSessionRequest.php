<?php

namespace App\Http\Requests\Session;

use Illuminate\Foundation\Http\FormRequest;

class ProposeSessionRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'proposed_at'      => ['required', 'date', 'after:now'],
            'duration_minutes' => ['sometimes', 'integer', 'min:15', 'max:480'],
            'title'            => ['sometimes', 'nullable', 'string', 'max:150'],
            'notes'            => ['sometimes', 'nullable', 'string', 'max:2000'],
            'meet_link'        => ['sometimes', 'nullable', 'url', 'max:500'],
            'skill_tag'        => ['sometimes', 'nullable', 'string', 'max:100'],
        ];
    }

    public function messages(): array
    {
        return [
            'proposed_at.after' => 'Session time must be in the future.',
        ];
    }
}
