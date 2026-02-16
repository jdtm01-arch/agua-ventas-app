<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\User;
use App\Models\Gasto;
use App\Models\TipoDeGasto;
use Spatie\Permission\Models\Role;
use Carbon\Carbon;

class GastosUpdateDeleteAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_vendedor_cannot_update_or_delete_gasto_older_than_one_month()
    {
        Role::firstOrCreate(['name' => 'vendedor']);
        $seller = User::factory()->create();
        $seller->assignRole('vendedor');

        $tipo = TipoDeGasto::create(['nombre' => 'Operativos']);

        $gastoOld = Gasto::create([
            'user_id' => $seller->id,
            'tipo_de_gasto_id' => $tipo->id,
            'monto' => 20,
            'descripcion' => 'Gasto viejo'
        ]);
        $gastoOld->created_at = Carbon::now()->subDays(40);
        $gastoOld->save();

        $this->actingAs($seller, 'sanctum')
            ->putJson("/api/gastos/{$gastoOld->id}", ['monto' => 999, 'tipo_de_gasto_id' => $tipo->id])
            ->assertStatus(403);

        $this->actingAs($seller, 'sanctum')
            ->deleteJson("/api/gastos/{$gastoOld->id}", ['confirm' => true])
            ->assertStatus(403);
    }

    public function test_vendedor_can_update_and_delete_own_recent_gasto_and_admin_can_manage_any()
    {
        Role::firstOrCreate(['name' => 'vendedor']);
        Role::firstOrCreate(['name' => 'admin']);

        $seller = User::factory()->create();
        $seller->assignRole('vendedor');
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $tipo = TipoDeGasto::create(['nombre' => 'Flota']);

        $gastoRecent = Gasto::create([
            'user_id' => $seller->id,
            'tipo_de_gasto_id' => $tipo->id,
            'monto' => 30,
            'descripcion' => 'Gasto reciente'
        ]);
        $gastoRecent->created_at = Carbon::now()->subDays(10);
        $gastoRecent->save();

        // vendedor updates recent
        $this->actingAs($seller, 'sanctum')
            ->putJson("/api/gastos/{$gastoRecent->id}", ['monto' => 55, 'tipo_de_gasto_id' => $tipo->id])
            ->assertStatus(200);

        $this->assertDatabaseHas('gastos', ['id' => $gastoRecent->id, 'monto' => 55]);

        // vendedor deletes recent
        $this->actingAs($seller, 'sanctum')
            ->deleteJson("/api/gastos/{$gastoRecent->id}", ['confirm' => true])
            ->assertStatus(200);

        $this->assertDatabaseMissing('gastos', ['id' => $gastoRecent->id]);

        // admin can manage an old gasto
        $gastoOld2 = Gasto::create([
            'user_id' => $seller->id,
            'tipo_de_gasto_id' => $tipo->id,
            'monto' => 75,
            'descripcion' => 'Gasto muy viejo'
        ]);
        $gastoOld2->created_at = Carbon::now()->subDays(60);
        $gastoOld2->save();

        $this->actingAs($admin, 'sanctum')
            ->putJson("/api/gastos/{$gastoOld2->id}", ['monto' => 10, 'tipo_de_gasto_id' => $tipo->id])
            ->assertStatus(200);

        $this->actingAs($admin, 'sanctum')
            ->deleteJson("/api/gastos/{$gastoOld2->id}", ['confirm' => true])
            ->assertStatus(200);

        $this->assertDatabaseMissing('gastos', ['id' => $gastoOld2->id]);
    }
}
