<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\User;

class BackfillVentasCreatedBySeeder extends Seeder
{
    public function run()
    {
        $adminEmail = env('INITIAL_ADMIN_EMAIL');
        $admin = null;

        if ($adminEmail) {
            $admin = User::where('email', $adminEmail)->first();
        }

        if (! $admin) {
            $admin = User::whereHas('roles', function ($q) {
                $q->where('name', 'admin');
            })->first();
        }

        if (! $admin) {
            $admin = User::first();
        }

        if (! $admin) {
            $this->command->info('No users found to backfill ventas.created_by.');
            return;
        }

        DB::table('ventas')->whereNull('created_by')->update(['created_by' => $admin->id]);

        $this->command->info('Backfilled ventas.created_by with user id: ' . $admin->id);
    }
}
