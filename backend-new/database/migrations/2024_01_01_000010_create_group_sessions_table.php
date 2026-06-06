<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('group_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('host_id')->constrained('users')->cascadeOnDelete();

            $table->string('title');
            $table->text('description')->nullable();
            $table->dateTime('starts_at');
            $table->integer('duration_minutes')->default(60);
            $table->unsignedSmallInteger('max_participants')->default(10);

            // Qaysi skill bo'yicha
            $table->foreignId('skill_id')->nullable()->constrained()->nullOnDelete();

            // Video uchun
            $table->string('meet_link')->nullable();

            $table->enum('status', ['upcoming', 'live', 'done', 'cancelled'])->default('upcoming');

            // Bepul yoki to'lovli (V5 uchun tayyor)
            $table->unsignedInteger('price')->default(0); // 0 = bepul

            $table->timestamps();

            $table->index(['status', 'starts_at']);
            $table->index('host_id');
        });

        // Ishtirokchilar jadvali
        Schema::create('group_session_participants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('group_session_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->enum('status', ['registered', 'attended', 'no_show'])->default('registered');
            $table->timestamps();

            $table->unique(['group_session_id', 'user_id']);
            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('group_session_participants');
        Schema::dropIfExists('group_sessions');
    }
};
