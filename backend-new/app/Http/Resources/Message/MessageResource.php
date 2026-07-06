<?php

namespace App\Http\Resources\Message;

use App\Http\Resources\User\UserResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MessageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'            => $this->id,
            'connection_id' => $this->connection_id,
            'sender'        => new UserResource($this->whenLoaded('sender')),
            'message'       => $this->message,
            'created_at'    => $this->created_at->toISOString(),
        ];
    }
}
