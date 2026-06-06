<?php

namespace App\Http\Resources\Notification;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NotificationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'         => $this->id,
            'type'       => $this->type,
            'data'       => $this->data,
            'read_at'    => $this->read_at?->toISOString(),
            'is_read'    => ! is_null($this->read_at),
            'created_at' => $this->created_at->toISOString(),
        ];
    }
}
