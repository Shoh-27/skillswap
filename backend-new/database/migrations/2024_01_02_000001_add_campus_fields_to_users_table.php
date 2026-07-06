<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->timestamp('last_active_at')->nullable()->after('timezone');
            $table->unsignedSmallInteger('streak_days')->default(0)->after('last_active_at');
            $table->date('last_streak_date')->nullable()->after('streak_days');
            $table->unsignedSmallInteger('weekly_minutes')->default(0)->after('last_streak_date');
            $table->date('weekly_reset_date')->nullable()->after('weekly_minutes');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'last_active_at', 'streak_days',
                'last_streak_date', 'weekly_minutes', 'weekly_reset_date',
            ]);
        });
    }
};
