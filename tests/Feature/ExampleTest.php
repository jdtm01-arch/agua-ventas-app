<?php

namespace Tests\Feature;

// use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    /**
     * A basic test example.
     */
    public function test_the_application_returns_a_successful_response(): void
    {
        // As this is an API-only application, the root web route may not exist.
        // Verify an API endpoint is protected and returns 401 when unauthenticated.
        $response = $this->getJson('/api/ventas');

        $response->assertStatus(401);
    }
}
