<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_skills', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('skill_id')->constrained()->cascadeOnDelete();
            $table->enum('type', ['teach', 'learn']);
            $table->timestamps();

            // A user can only have a skill once per type
            $table->unique(['user_id', 'skill_id', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_skills');
    }
};
