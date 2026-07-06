<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * sessions_table jadvalidagi meet_link
     * V2 da qo'lda kiritilardi, V3 da confirm bo'lganda avtomatik yaratiladi.
     * Qo'shimcha o'zgarish kerak emas — meet_link allaqachon bor.
     * Bu migration faqat hujjat sifatida qoladi.
     */
    public function up(): void
    {
        // sessions_table.meet_link already exists from V2 migration.
        // No schema change needed — SessionService now auto-generates it on confirm.
    }

    public function down(): void {}
};
