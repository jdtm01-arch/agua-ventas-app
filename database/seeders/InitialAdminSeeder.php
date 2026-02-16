<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Spatie\Permission\Models\Role;

class InitialAdminSeeder extends Seeder
{
    public function run()
    {
        $email = env('INITIAL_ADMIN_EMAIL', 'admin@example.com');
        $password = env('INITIAL_ADMIN_PASSWORD', 'Admin12345');
        $name = env('INITIAL_ADMIN_NAME', 'Administrator');

        $admin = User::where('email', $email)->first();
        if (! $admin) {
            $admin = User::create([
                'name' => $name,
                'email' => $email,
                'password' => bcrypt($password),
            ]);
        }

        Role::firstOrCreate(['name' => 'admin']);

        if (method_exists($admin, 'assignRole')) {
            $admin->assignRole('admin');
        }

        $this->command->info("Initial admin ensured: {$email}");
    }
}
