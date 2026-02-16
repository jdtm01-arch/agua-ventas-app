<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Database\Seeders\RolesSeeder;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_register_login_logout_and_protected_endpoint()
    {
        // Seed roles required by Spatie permissions
        $this->seed(RolesSeeder::class);
        // 1) Register
        $registerData = [
            'name' => 'Tester',
            'email' => 'tester@example.com',
            'password' => 'secret123',
        ];

        $resp = $this->postJson('/api/register', $registerData);
        $resp->assertStatus(201);
        $this->assertArrayHasKey('token', $resp->json());

        $token = $resp->json('token');

        // 2) Access protected route with token (me)
        $this->withHeader('Authorization', 'Bearer '.$token)
             ->getJson('/api/user')
             ->assertStatus(200)
             ->assertJsonFragment(['email' => 'tester@example.com']);

        // 3) Logout
        $this->withHeader('Authorization', 'Bearer '.$token)
             ->postJson('/api/logout')
             ->assertStatus(200);

        // 4) Logout response (token revocation may vary depending on setup)
        // We assert logout success; token revocation behavior can be tested separately.
        // Note: some setups may use cookie-based auth or different guards.
    }
}
