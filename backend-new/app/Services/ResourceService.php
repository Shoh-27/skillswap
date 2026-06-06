<?php

namespace App\Services;

use App\Models\Resource;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

class ResourceService
{
    /**
     * Havola yoki eslatma yaratish (fayl yuklashsiz).
     */
    public function createLink(User $uploader, object $resourceable, array $data): Resource
    {
        return Resource::create([
            'uploader_id'       => $uploader->id,
            'resourceable_type' => get_class($resourceable),
            'resourceable_id'   => $resourceable->id,
            'title'             => $data['title'],
            'type'              => 'link',
            'url'               => $data['url'],
        ]);
    }

    public function createNote(User $uploader, object $resourceable, array $data): Resource
    {
        return Resource::create([
            'uploader_id'       => $uploader->id,
            'resourceable_type' => get_class($resourceable),
            'resourceable_id'   => $resourceable->id,
            'title'             => $data['title'],
            'type'              => 'note',
            'content'           => $data['content'],
        ]);
    }

    /**
     * Fayl yuklash va resource yaratish.
     */
    public function uploadFile(User $uploader, object $resourceable, array $data, UploadedFile $file): Resource
    {
        // Max 20 MB
        if ($file->getSize() > 20 * 1024 * 1024) {
            throw ValidationException::withMessages([
                'file' => ['File must be under 20 MB.'],
            ]);
        }

        $allowedMimes = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'application/pdf',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain',
            'application/zip',
            'video/mp4', 'video/webm',
        ];

        if (! in_array($file->getMimeType(), $allowedMimes)) {
            throw ValidationException::withMessages([
                'file' => ['This file type is not allowed.'],
            ]);
        }

        // S3 yoki local storage
        $path = $file->store(
            'resources/' . date('Y/m'),
            config('filesystems.default')
        );

        return Resource::create([
            'uploader_id'       => $uploader->id,
            'resourceable_type' => get_class($resourceable),
            'resourceable_id'   => $resourceable->id,
            'title'             => $data['title'] ?? $file->getClientOriginalName(),
            'type'              => 'file',
            'file_path'         => $path,
            'file_name'         => $file->getClientOriginalName(),
            'mime_type'         => $file->getMimeType(),
            'file_size'         => $file->getSize(),
        ]);
    }

    /**
     * Resursni o'chirish (faqat uploader).
     */
    public function delete(User $user, int $resourceId): void
    {
        $resource = Resource::findOrFail($resourceId);

        if ($resource->uploader_id !== $user->id) {
            throw new AccessDeniedHttpException('You can only delete your own resources.');
        }

        if ($resource->type === 'file' && $resource->file_path) {
            Storage::delete($resource->file_path);
        }

        $resource->delete();
    }

    /**
     * Biror kontekstdagi barcha resurslar.
     */
    public function listFor(object $resourceable): \Illuminate\Database\Eloquent\Collection
    {
        return Resource::where('resourceable_type', get_class($resourceable))
            ->where('resourceable_id', $resourceable->id)
            ->with('uploader')
            ->latest()
            ->get();
    }
}
