<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\User;
use App\Models\Venta;
use App\Models\Cliente;
use App\Models\Gasto;
use App\Models\TipoDeGasto;
use Spatie\Permission\Models\Role;
use Carbon\Carbon;

class GastosReportTest extends TestCase
{
    use RefreshDatabase;

    public function test_report_subtracts_gastos_from_recaudado()
    {
        Role::firstOrCreate(['name' => 'admin']);
        Role::firstOrCreate(['name' => 'vendedor']);

        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $seller = User::factory()->create();
        $seller->assignRole('vendedor');

        $cliente = Cliente::create(['nombre' => 'C', 'telefono' => '+100000010']);

        Venta::create(['cliente_id'=>$cliente->id,'tipo_venta'=>'p','monto'=>500,'status'=>'pagado','created_by'=>$seller->id,'created_at'=>Carbon::now()]);

        $tipo = TipoDeGasto::create(['nombre' => 'Operativos']);
        Gasto::create(['user_id'=>$seller->id,'tipo_de_gasto_id'=>$tipo->id,'monto'=>50,'descripcion'=>'Combustible','created_at'=>Carbon::now()]);

        $resp = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/ventas/report')
            ->assertStatus(200)
            ->json();

        $this->assertEquals(500.0, $resp['total_recaudado']);
        $this->assertEquals(50.0, $resp['total_gastos']);
        $this->assertEquals(450.0, $resp['total_recaudado_neto']);
    }
}
