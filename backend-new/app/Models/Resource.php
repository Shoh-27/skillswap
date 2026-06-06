<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Support\Facades\Storage;

class Resource extends Model
{
    protected $fillable = [
        'uploader_id', 'resourceable_type', 'resourceable_id',
        'title', 'type', 'file_path', 'file_name', 'mime_type',
        'file_size', 'url', 'content',
    ];

    protected $casts = [
        'file_size' => 'integer',
    ];

    // ── Relations ────────────────────────────────────────────────────────

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploader_id');
    }

    public function resourceable(): MorphTo
    {
        return $this->morphTo();
    }

    // ── Helpers ──────────────────────────────────────────────────────────

    /** Faylni yuklab olish URL'ini qaytaradi */
    public function getDownloadUrlAttribute(): ?string
    {
        if ($this->type !== 'file' || ! $this->file_path) {
            return null;
        }
        return Storage::temporaryUrl($this->file_path, now()->addHours(2));
    }

    /** Fayl hajmini inson o'qiy oladigan formatda qaytaradi */
    public function getFormattedSizeAttribute(): ?string
    {
        if (! $this->file_size) return null;
        $units = ['B', 'KB', 'MB', 'GB'];
        $size  = $this->file_size;
        $i     = 0;
        while ($size >= 1024 && $i < count($units) - 1) {
            $size /= 1024;
            $i++;
        }
        return round($size, 1) . ' ' . $units[$i];
    }
}
