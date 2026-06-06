<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Rating statistikasi — har safar hisoblash o'rniga saqlash
            $table->decimal('avg_rating', 3, 2)->default(0)->after('bio');
            $table->unsignedInteger('total_reviews')->default(0)->after('avg_rating');
            $table->unsignedInteger('total_sessions')->default(0)->after('total_reviews');

            // Qidiruv uchun joylashuv (ixtiyoriy)
            $table->string('city')->nullable()->after('total_sessions');
            $table->string('timezone')->default('Asia/Tashkent')->after('city');

            // Qidiruv uchun indeks
            $table->index('avg_rating');
            $table->index('city');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'avg_rating', 'total_reviews', 'total_sessions',
                'city', 'timezone',
            ]);
        });
    }
};
