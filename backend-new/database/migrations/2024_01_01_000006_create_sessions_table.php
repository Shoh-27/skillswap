<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sessions_table', function (Blueprint $table) {
            $table->id();
            $table->foreignId('connection_id')->constrained()->cascadeOnDelete();
            $table->foreignId('proposed_by')->constrained('users')->cascadeOnDelete();

            // Vaqt
            $table->dateTime('proposed_at');          // taklif qilingan vaqt
            $table->dateTime('confirmed_at')->nullable(); // tasdiqlangan vaqt
            $table->integer('duration_minutes')->default(60);

            // Holat
            $table->enum('status', [
                'proposed',   // taklif yuborildi
                'confirmed',  // ikkinchi tomon tasdiqladi
                'done',       // sessiya tugadi
                'cancelled',  // bekor qilindi
            ])->default('proposed');

            // Qo'shimcha ma'lumot
            $table->string('title')->nullable();
            $table->text('notes')->nullable();
            $table->string('meet_link')->nullable(); // Google Meet / Zoom link

            $table->timestamps();

            $table->index(['connection_id', 'status']);
            $table->index('proposed_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sessions_table');
    }
};
