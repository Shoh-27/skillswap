<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@skillswap.uz'],
            [
                'name'     => 'SkillSwap Admin',
                'password' => 'admin12345',
                'role'     => 'admin',
            ]
        );
    }
}
