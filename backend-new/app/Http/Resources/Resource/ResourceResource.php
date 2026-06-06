<?php

namespace App\Http\Resources\Resource;

use App\Http\Resources\User\UserResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ResourceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'             => $this->id,
            'title'          => $this->title,
            'type'           => $this->type,

            // Fayl
            'file_name'      => $this->file_name,
            'mime_type'      => $this->mime_type,
            'file_size'      => $this->file_size,
            'formatted_size' => $this->formatted_size,
            'download_url'   => $this->download_url,

            // Havola
            'url'            => $this->url,

            // Eslatma
            'content'        => $this->content,

            'uploader'       => new UserResource($this->whenLoaded('uploader')),
            'created_at'     => $this->created_at->toISOString(),
        ];
    }
}
