<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('resources', function (Blueprint $table) {
            $table->id();
            $table->foreignId('uploader_id')->constrained('users')->cascadeOnDelete();

            // Resurs qayerga tegishli — session yoki group_session yoki connection (chat)
            $table->nullableMorphs('resourceable'); // resourceable_type + resourceable_id

            $table->string('title');
            $table->enum('type', ['file', 'link', 'note']);

            // Fayl uchun
            $table->string('file_path')->nullable();   // storage path
            $table->string('file_name')->nullable();   // original name
            $table->string('mime_type')->nullable();
            $table->unsignedBigInteger('file_size')->nullable(); // bytes

            // Havola uchun
            $table->string('url')->nullable();

            // Eslatma uchun
            $table->text('content')->nullable();

            $table->timestamps();

            $table->index('uploader_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('resources');
    }
};
