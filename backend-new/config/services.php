<?php

return [
    'anthropic' => [
        'key'   => env('ANTHROPIC_API_KEY', ''),
        'model' => env('ANTHROPIC_MODEL', 'claude-opus-4-5'),
    ],
];
