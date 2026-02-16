<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Cliente;
use Illuminate\Foundation\Testing\RefreshDatabase;

class VentaOwnershipTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->artisan('db:seed', ['--class' => 'Database\\Seeders\\RolesSeeder']);
    }

    public function test_vendedor_can_update_and_delete_own_unpaid_venta()
    {
        $vendedor = User::factory()->create();
        $vendedor->assignRole('vendedor');

        $cliente = Cliente::create([
            'nombre' => 'Cliente Test',
            'telefono' => '000000000',
            'direccion' => 'Direccion Test',
        ]);
        $this->actingAs($vendedor, 'sanctum');

        $response = $this->postJson('/api/ventas', [
            'cliente_id' => $cliente->id,
            'tipo_venta' => 'primera',
            'monto' => 100,
            'status' => 'pendiente',
        ]);
        $response->assertStatus(201);
        $ventaId = $response->json('venta.id');

        $this->putJson("/api/ventas/{$ventaId}", ['monto' => 150])->assertStatus(200);
        $this->deleteJson("/api/ventas/{$ventaId}")->assertStatus(200);
    }

    public function test_vendedor_cannot_update_or_delete_others_venta()
    {
        $creator = User::factory()->create(); $creator->assignRole('vendedor');
        $other = User::factory()->create(); $other->assignRole('vendedor');

        $cliente = Cliente::create([
            'nombre' => 'Cliente Test',
            'telefono' => '000000001',
            'direccion' => 'Direccion Test',
        ]);

        $this->actingAs($creator, 'sanctum');
        $create = $this->postJson('/api/ventas', [
            'cliente_id' => $cliente->id,
            'tipo_venta' => 'primera',
            'monto' => 200,
            'status' => 'pendiente',
        ]);
        $ventaId = $create->json('venta.id');

        $this->actingAs($other, 'sanctum');
        $this->putJson("/api/ventas/{$ventaId}", ['monto' => 250])->assertStatus(403);
        $this->deleteJson("/api/ventas/{$ventaId}")->assertStatus(403);
    }

    public function test_vendedor_cannot_modify_paid_venta_even_if_creator()
    {
        $vendedor = User::factory()->create(); $vendedor->assignRole('vendedor');
        $cliente = Cliente::create([
            'nombre' => 'Cliente Test',
            'telefono' => '000000002',
            'direccion' => 'Direccion Test',
        ]);
        $this->actingAs($vendedor, 'sanctum');

        $create = $this->postJson('/api/ventas', [
            'cliente_id' => $cliente->id,
            'tipo_venta' => 'primera',
            'monto' => 300,
            'status' => 'pagado',
        ]);
        $ventaId = $create->json('venta.id');

        $this->putJson("/api/ventas/{$ventaId}", ['monto' => 350])->assertStatus(403);
        $this->deleteJson("/api/ventas/{$ventaId}")->assertStatus(403);
    }

    public function test_admin_can_modify_any_venta()
    {
        $admin = User::factory()->create(); $admin->assignRole('admin');
        $vendedor = User::factory()->create(); $vendedor->assignRole('vendedor');
        $cliente = Cliente::create([
            'nombre' => 'Cliente Test',
            'telefono' => '000000003',
            'direccion' => 'Direccion Test',
        ]);

        $this->actingAs($vendedor, 'sanctum');
        $create = $this->postJson('/api/ventas', [
            'cliente_id' => $cliente->id,
            'tipo_venta' => 'primera',
            'monto' => 400,
            'status' => 'pagado',
        ]);
        $ventaId = $create->json('venta.id');

        $this->actingAs($admin, 'sanctum');
        $this->putJson("/api/ventas/{$ventaId}", ['monto' => 450])->assertStatus(200);
        $this->deleteJson("/api/ventas/{$ventaId}")->assertStatus(200);
    }
}
