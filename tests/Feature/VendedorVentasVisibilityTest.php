<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\User;
use App\Models\Venta;
use Spatie\Permission\Models\Role;

class VendedorVentasVisibilityTest extends TestCase
{
    use RefreshDatabase;

    public function test_vendedor_sees_only_their_ventas_and_admin_sees_all()
    {
        // ensure roles exist
        Role::firstOrCreate(['name' => 'admin']);
        Role::firstOrCreate(['name' => 'vendedor']);

        // create users
        $admin = User::factory()->create(); $admin->assignRole('admin');
        $sellerA = User::factory()->create(); $sellerA->assignRole('vendedor');
        $sellerB = User::factory()->create(); $sellerB->assignRole('vendedor');

        // create clientes for ventas
        $cliente1 = \App\Models\Cliente::create(['nombre' => 'C1', 'telefono' => '900000001']);
        $cliente2 = \App\Models\Cliente::create(['nombre' => 'C2', 'telefono' => '900000002']);
        $cliente3 = \App\Models\Cliente::create(['nombre' => 'C3', 'telefono' => '900000003']);

        // create ventas: some by A, some by B
        $ventaA1 = Venta::create(['cliente_id' => $cliente1->id, 'tipo_venta' => 'recarga', 'monto' => 10, 'status' => 'pagado', 'created_by' => $sellerA->id]);
        $ventaA2 = Venta::create(['cliente_id' => $cliente2->id, 'tipo_venta' => 'recarga', 'monto' => 5, 'status' => 'pendiente', 'created_by' => $sellerA->id]);
        $ventaB1 = Venta::create(['cliente_id' => $cliente3->id, 'tipo_venta' => 'primera', 'monto' => 20, 'status' => 'pagado', 'created_by' => $sellerB->id]);

        // as seller A
        $respA = $this->actingAs($sellerA, 'sanctum')->getJson('/api/ventas')->assertStatus(200)->json();
        $idsA = array_map(fn($v) => $v['id'], $respA['data']);
        $this->assertContains($ventaA1->id, $idsA);
        $this->assertContains($ventaA2->id, $idsA);
        $this->assertNotContains($ventaB1->id, $idsA);

        // as seller B
        $respB = $this->actingAs($sellerB, 'sanctum')->getJson('/api/ventas')->assertStatus(200)->json();
        $idsB = array_map(fn($v) => $v['id'], $respB['data']);
        $this->assertContains($ventaB1->id, $idsB);
        $this->assertNotContains($ventaA1->id, $idsB);

        // as admin
        $respAdmin = $this->actingAs($admin, 'sanctum')->getJson('/api/ventas')->assertStatus(200)->json();
        $idsAdmin = array_map(fn($v) => $v['id'], $respAdmin['data']);
        $this->assertContains($ventaA1->id, $idsAdmin);
        $this->assertContains($ventaA2->id, $idsAdmin);
        $this->assertContains($ventaB1->id, $idsAdmin);
    }
}
