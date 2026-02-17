<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $email = env('INITIAL_ADMIN_EMAIL', 'admin@test.com');

        $affected = DB::table('users')
            ->where('email', $email)
            ->update([
                'password' => Hash::make('Admin12345@@'),
                'updated_at' => now(),
            ]);

        logger("Filas afectadas: " . $affected);
    }
};

