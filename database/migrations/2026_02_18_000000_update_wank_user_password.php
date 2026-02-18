<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::table('users')->where('email', 'wank@gua.com')->update([
            'password' => Hash::make('WANK@GUA2026')
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Esta migración actualiza la contraseña, en caso de revertir mantiene la actual
        // ya que no tenemos la contraseña anterior
    }
};
