<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\User;
use App\Models\TipoDeGasto;
use App\Models\Gasto;
use Spatie\Permission\Models\Role;

class GastosApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_vendedor_can_create_and_list_own_gastos()
    {
        Role::firstOrCreate(['name' => 'vendedor']);
        $seller = User::factory()->create();
        $seller->assignRole('vendedor');

        $tipo = TipoDeGasto::create(['nombre' => 'Operativos']);

        $this->actingAs($seller, 'sanctum')
            ->postJson('/api/gastos', ['tipo_de_gasto_id'=>$tipo->id,'monto'=>25,'descripcion'=>'Taxi'])
            ->assertStatus(201)
            ->assertJson(['message' => 'Gasto registrado']);

        $resp = $this->actingAs($seller, 'sanctum')->getJson('/api/gastos')->assertStatus(200)->json();
        $this->assertCount(1, $resp['data']);
        $this->assertEquals(25.0, $resp['data'][0]['monto']);
    }

    public function test_admin_can_list_all_and_create_for_any_user()
    {
        Role::firstOrCreate(['name' => 'admin']);
        Role::firstOrCreate(['name' => 'vendedor']);

        $admin = User::factory()->create(); $admin->assignRole('admin');
        $seller = User::factory()->create(); $seller->assignRole('vendedor');

        $tipo = TipoDeGasto::create(['nombre' => 'Flota']);

        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/gastos', ['tipo_de_gasto_id'=>$tipo->id,'monto'=>100,'user_id'=>$seller->id,'descripcion'=>'Pago flota'])
            ->assertStatus(201);

        $respAdmin = $this->actingAs($admin, 'sanctum')->getJson('/api/gastos')->assertStatus(200)->json();
        $this->assertCount(1, $respAdmin['data']);

        $respSeller = $this->actingAs($seller, 'sanctum')->getJson('/api/gastos')->assertStatus(200)->json();
        $this->assertCount(1, $respSeller['data']);
    }
}
