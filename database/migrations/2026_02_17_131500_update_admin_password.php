<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UpdateAdminPassword20260217 extends Migration
{
    public function up()
    {
        $email = env('INITIAL_ADMIN_EMAIL', 'admin@local.test');
        DB::table('users')->where('email', $email)->update([
            'password' => Hash::make('Admin12345@@'),
            'updated_at' => now(),
        ]);
    }

    public function down()
    {
        // no-op: cannot safely revert admin password
    }
}
