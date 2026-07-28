<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AdminSessionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $connection = $this->whenLoaded('sessionConnection');

        return [
            'id'               => $this->id,
            'status'           => $this->status,
            'title'            => $this->title,
            'skill_tag'        => $this->skill_tag,
            'proposed_at'      => $this->proposed_at?->toISOString(),
            'confirmed_at'     => $this->confirmed_at?->toISOString(),
            'duration_minutes' => $this->duration_minutes,
            'sender'           => $connection?->sender ? [
                'id' => $connection->sender->id, 'name' => $connection->sender->name,
            ] : null,
            'receiver'         => $connection?->receiver ? [
                'id' => $connection->receiver->id, 'name' => $connection->receiver->name,
            ] : null,
            'created_at'       => $this->created_at->toISOString(),
        ];
    }
}
