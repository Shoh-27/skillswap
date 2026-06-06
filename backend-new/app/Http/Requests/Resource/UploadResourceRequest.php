<?php

namespace App\Http\Requests\Resource;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UploadResourceRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        $type = $this->input('type', 'file');

        return [
            'title'   => ['required', 'string', 'max:200'],
            'type'    => ['required', Rule::in(['file', 'link', 'note'])],

            // Fayl
            'file'    => [
                Rule::requiredIf($type === 'file'),
                'file',
                'max:20480', // 20 MB
            ],

            // Havola
            'url'     => [
                Rule::requiredIf($type === 'link'),
                'nullable', 'url', 'max:500',
            ],

            // Eslatma
            'content' => [
                Rule::requiredIf($type === 'note'),
                'nullable', 'string', 'max:5000',
            ],
        ];
    }
}
