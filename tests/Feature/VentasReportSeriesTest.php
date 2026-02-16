<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\User;
use App\Models\Venta;
use App\Models\Cliente;
use Spatie\Permission\Models\Role;
use Carbon\Carbon;

class VentasReportSeriesTest extends TestCase
{
    use RefreshDatabase;

    public function test_day_series_fills_missing_days()
    {
        Role::firstOrCreate(['name' => 'admin']);
        Role::firstOrCreate(['name' => 'vendedor']);

        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $seller = User::factory()->create();
        $seller->assignRole('vendedor');

        $cliente = Cliente::create(['nombre' => 'C', 'telefono' => '+100000001']);

        // Create ventas on 2026-01-01, 2026-01-03, 2026-01-05
        $v1 = Venta::create(['cliente_id'=>$cliente->id,'tipo_venta'=>'p','monto'=>10,'status'=>'pagado','created_by'=>$seller->id]);
        $v1->created_at = Carbon::parse('2026-01-01 10:00'); $v1->save();

        $v2 = Venta::create(['cliente_id'=>$cliente->id,'tipo_venta'=>'p','monto'=>20,'status'=>'entregado','created_by'=>$seller->id]);
        $v2->created_at = Carbon::parse('2026-01-03 11:00'); $v2->save();

        $v3 = Venta::create(['cliente_id'=>$cliente->id,'tipo_venta'=>'p','monto'=>30,'status'=>'pagado','created_by'=>$seller->id]);
        $v3->created_at = Carbon::parse('2026-01-05 12:00'); $v3->save();

        $resp = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/ventas/report?from=2026-01-01&to=2026-01-05&period=day')
            ->assertStatus(200)
            ->json();

        $this->assertCount(5, $resp['series']);
        $this->assertEquals('2026-01-01', $resp['series'][0]['period']);
        $this->assertEquals(10.0, $resp['series'][0]['recaudado']);
        $this->assertEquals(0.0, $resp['series'][1]['recaudado']);
        $this->assertEquals(0.0, $resp['series'][2]['recaudado']);
        $this->assertEquals(30.0, $resp['series'][4]['recaudado']);
    }

    public function test_month_series_fills_missing_months()
    {
        Role::firstOrCreate(['name' => 'admin']);
        Role::firstOrCreate(['name' => 'vendedor']);

        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $cliente = Cliente::create(['nombre' => 'C2', 'telefono' => '+100000002']);

        // ventas in Jan and Mar 2026
        $v1 = Venta::create(['cliente_id'=>$cliente->id,'tipo_venta'=>'p','monto'=>100,'status'=>'pagado','created_by'=>$admin->id]);
        $v1->created_at = Carbon::parse('2026-01-15'); $v1->save();

        $v2 = Venta::create(['cliente_id'=>$cliente->id,'tipo_venta'=>'p','monto'=>200,'status'=>'entregado','created_by'=>$admin->id]);
        $v2->created_at = Carbon::parse('2026-03-03'); $v2->save();

        $resp = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/ventas/report?from=2026-01-01&to=2026-03-31&period=month')
            ->assertStatus(200)
            ->json();

        // Expect months: 2026-01, 2026-02, 2026-03
        $this->assertCount(3, $resp['series']);
        $this->assertEquals('2026-01', $resp['series'][0]['period']);
        $this->assertEquals(100.0, $resp['series'][0]['recaudado']);
        $this->assertEquals('2026-02', $resp['series'][1]['period']);
        $this->assertEquals(0.0, $resp['series'][1]['recaudado']);
        $this->assertEquals('2026-03', $resp['series'][2]['period']);
        $this->assertEquals(0.0, $resp['series'][2]['recaudado']);
    }

    public function test_week_series_fills_missing_weeks()
    {
        Role::firstOrCreate(['name' => 'admin']);
        Role::firstOrCreate(['name' => 'vendedor']);

        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $seller = User::factory()->create();
        $seller->assignRole('vendedor');

        $cliente = Cliente::create(['nombre' => 'CW', 'telefono' => '+100000003']);

        // Create ventas on two non-consecutive weeks
        $v1 = Venta::create(['cliente_id'=>$cliente->id,'tipo_venta'=>'p','monto'=>10,'status'=>'pagado','created_by'=>$seller->id]);
        $v1->created_at = Carbon::parse('2026-01-04'); $v1->save();

        $v2 = Venta::create(['cliente_id'=>$cliente->id,'tipo_venta'=>'p','monto'=>20,'status'=>'pagado','created_by'=>$seller->id]);
        $v2->created_at = Carbon::parse('2026-01-18'); $v2->save();

        $resp = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/ventas/report?from=2026-01-04&to=2026-01-24&period=week')
            ->assertStatus(200)
            ->json();

        $this->assertCount(3, $resp['series']);
        $this->assertEquals(10.0, $resp['series'][0]['recaudado']);
        $this->assertEquals(0.0, $resp['series'][1]['recaudado']);
        $this->assertEquals(20.0, $resp['series'][2]['recaudado']);
    }
}
