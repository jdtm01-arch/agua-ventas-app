<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\User;
use App\Models\Venta;
use App\Models\Cliente;
use Spatie\Permission\Models\Role;

class VentasReportTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_sees_aggregate_for_all_ventas()
    {
        Role::firstOrCreate(['name' => 'admin']);
        Role::firstOrCreate(['name' => 'vendedor']);

        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $seller1 = User::factory()->create();
        $seller1->assignRole('vendedor');

        $seller2 = User::factory()->create();
        $seller2->assignRole('vendedor');

        $cliente = Cliente::create(['nombre' => 'Cliente A', 'telefono' => '+1000000001']);

        Venta::create(['cliente_id' => $cliente->id, 'tipo_venta' => 'producto', 'monto' => 100, 'status' => 'pagado', 'created_by' => $seller1->id]);
        Venta::create(['cliente_id' => $cliente->id, 'tipo_venta' => 'producto', 'monto' => 50, 'status' => 'entregado', 'created_by' => $seller1->id]);
        Venta::create(['cliente_id' => $cliente->id, 'tipo_venta' => 'producto', 'monto' => 200, 'status' => 'pagado', 'created_by' => $seller2->id]);

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/ventas/report')
            ->assertStatus(200)
            ->assertJson([
                'total_recaudado' => 300.0,
                'total_por_cobrar' => 50.0,
                'total_ventas' => 3,
            ]);
    }

    public function test_vendedor_sees_only_their_ventas()
    {
        Role::firstOrCreate(['name' => 'admin']);
        Role::firstOrCreate(['name' => 'vendedor']);

        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $seller1 = User::factory()->create();
        $seller1->assignRole('vendedor');

        $seller2 = User::factory()->create();
        $seller2->assignRole('vendedor');

        $cliente = Cliente::create(['nombre' => 'Cliente A', 'telefono' => '+1000000002']);

        Venta::create(['cliente_id' => $cliente->id, 'tipo_venta' => 'producto', 'monto' => 100, 'status' => 'pagado', 'created_by' => $seller1->id]);
        Venta::create(['cliente_id' => $cliente->id, 'tipo_venta' => 'producto', 'monto' => 50, 'status' => 'entregado', 'created_by' => $seller1->id]);
        Venta::create(['cliente_id' => $cliente->id, 'tipo_venta' => 'producto', 'monto' => 200, 'status' => 'pagado', 'created_by' => $seller2->id]);

        $this->actingAs($seller1, 'sanctum')
            ->getJson('/api/ventas/report')
            ->assertStatus(200)
            ->assertJson([
                'total_recaudado' => 100.0,
                'total_por_cobrar' => 50.0,
                'total_ventas' => 2,
            ]);
    }
}
