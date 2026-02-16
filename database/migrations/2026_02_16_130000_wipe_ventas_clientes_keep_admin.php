<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up()
    {
        // Disable foreign keys for SQLite and other DBs while wiping data
        try {
            DB::statement('PRAGMA foreign_keys = OFF');
        } catch (\Throwable $e) {
            // not SQLite or PRAGMA not supported — continue
        }

        // Wipe ventas and clientes
        if (Schema::hasTable('ventas')) {
            DB::table('ventas')->delete();
        }
        if (Schema::hasTable('clientes')) {
            DB::table('clientes')->delete();
        }

        // Keep only the admin user identified by INITIAL_ADMIN_EMAIL
        $adminEmail = env('INITIAL_ADMIN_EMAIL', 'admin@local.test');
        if (Schema::hasTable('users')) {
            DB::table('users')->where('email', '!=', $adminEmail)->delete();
        }

        // Reset sqlite sequences if present
        try {
            DB::statement("DELETE FROM sqlite_sequence WHERE name IN ('ventas','clientes','users')");
        } catch (\Throwable $e) {
            // ignore if not sqlite
        }

        try {
            DB::statement('PRAGMA foreign_keys = ON');
        } catch (\Throwable $e) {
            // ignore
        }
    }

    public function down()
    {
        // no-op: data wipe can't be reverted
    }
};
