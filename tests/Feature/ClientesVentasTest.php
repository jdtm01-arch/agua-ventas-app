<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\User;
use Database\Seeders\RolesSeeder;

class ClientesVentasTest extends TestCase
{
    use RefreshDatabase;

    public function test_protected_endpoints_require_auth()
    {
        $this->getJson('/api/clientes')->assertStatus(401);
        $this->postJson('/api/clientes', [])->assertStatus(401);
        $this->getJson('/api/ventas')->assertStatus(401);
        $this->postJson('/api/ventas', [])->assertStatus(401);
    }

    public function test_create_and_list_clientes_and_ventas_with_auth()
    {
        // Ensure roles exist
        $this->seed(RolesSeeder::class);

        // Create user and authenticate via Sanctum
        $user = User::factory()->create();
        if (method_exists($user, 'assignRole')) {
            $user->assignRole('vendedor');
        }

        $this->actingAs($user, 'sanctum');

        // Create a cliente
        $clienteData = [
            'nombre' => 'Cliente Test',
            'telefono' => '12345678',
            'direccion' => 'Calle Falsa 123'
        ];

        $resp = $this->postJson('/api/clientes', $clienteData);
        $resp->assertStatus(201);
        $this->assertNotNull($resp->json('data.id'));
        $clienteId = $resp->json('data.id');

        // List clientes
        $this->getJson('/api/clientes')
             ->assertStatus(200)
             ->assertJsonFragment(['nombre' => 'Cliente Test']);

        // Create a venta for the cliente
        $ventaData = [
            'cliente_id' => $clienteId,
            'tipo_venta' => 'recarga',
            'monto' => 25.5,
            'status' => 'pendiente'
        ];

        $vresp = $this->postJson('/api/ventas', $ventaData);
        $vresp->assertStatus(201);
        $this->assertNotNull($vresp->json('venta.id'));

        // List ventas
        $this->getJson('/api/ventas')
             ->assertStatus(200)
             ->assertJsonFragment(['tipo_venta' => 'recarga']);
    }
}
