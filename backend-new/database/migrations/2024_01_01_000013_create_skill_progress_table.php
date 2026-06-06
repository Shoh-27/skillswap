<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('skill_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('skill_id')->constrained()->cascadeOnDelete();

            // Sessiyalar soni (done bo'lgan)
            $table->unsignedSmallInteger('sessions_completed')->default(0);
            $table->unsignedSmallInteger('sessions_as_learner')->default(0);
            $table->unsignedSmallInteger('sessions_as_teacher')->default(0);

            // Umumiy vaqt (daqiqalarda)
            $table->unsignedInteger('total_minutes')->default(0);

            // O'rganildi deb belgilash (5 sessiyadan keyin avtomatik yoki qo'lda)
            $table->boolean('is_completed')->default(false);
            $table->timestamp('completed_at')->nullable();

            // Milestonelar (JSON: ["first_session", "five_sessions"])
            $table->json('milestones')->nullable();

            $table->timestamps();

            $table->unique(['user_id', 'skill_id']);
            $table->index(['user_id', 'is_completed']);
        });

        // Milestonelar (achievement) jadvali — alohida saqlaymiz
        Schema::create('achievements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('type');           // first_session, five_sessions, ten_sessions, streak_7
            $table->string('title');
            $table->string('description')->nullable();
            $table->string('icon')->default('🏆');
            $table->json('meta')->nullable(); // qo'shimcha ma'lumot
            $table->timestamps();

            $table->unique(['user_id', 'type']); // har achievement faqat bir marta
            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('achievements');
        Schema::dropIfExists('skill_progress');
    }
};
