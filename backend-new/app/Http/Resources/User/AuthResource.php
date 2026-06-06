<?php

namespace App\Http\Resources\User;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Used on login/register — includes the bearer token.
 */
class AuthResource extends JsonResource
{
    public string $token;

    public function __construct($resource, string $token)
    {
        parent::__construct($resource);
        $this->token = $token;
    }

    public function toArray(Request $request): array
    {
        return [
            'user'  => new UserResource($this->resource),
            'token' => $this->token,
        ];
    }
}
