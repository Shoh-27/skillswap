<?php

namespace App\Http\Requests\GroupSession;

use Illuminate\Foundation\Http\FormRequest;

class CreateGroupSessionRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'title'            => ['required', 'string', 'max:150'],
            'description'      => ['sometimes', 'nullable', 'string', 'max:2000'],
            'starts_at'        => ['required', 'date', 'after:now'],
            'duration_minutes' => ['sometimes', 'integer', 'min:15', 'max:480'],
            'max_participants' => ['sometimes', 'integer', 'min:2', 'max:100'],
            'skill_id'         => ['sometimes', 'nullable', 'integer', 'exists:skills,id'],
            'price'            => ['sometimes', 'integer', 'min:0'],
        ];
    }
}
