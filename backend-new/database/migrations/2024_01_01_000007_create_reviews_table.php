<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reviews', function (Blueprint $table) {
            $table->id();

            // Qaysi sessiya uchun
            $table->foreignId('session_id')
                  ->constrained('sessions_table')
                  ->cascadeOnDelete();

            // Kim yozdi, kimga yozdi
            $table->foreignId('reviewer_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('reviewee_id')->constrained('users')->cascadeOnDelete();

            // Baho
            $table->unsignedTinyInteger('rating'); // 1-5
            $table->text('comment')->nullable();

            $table->timestamps();

            // Bir sessiya uchun bir foydalanuvchi faqat bir marta yozishi mumkin
            $table->unique(['session_id', 'reviewer_id']);

            $table->index(['reviewee_id', 'rating']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reviews');
    }
};
