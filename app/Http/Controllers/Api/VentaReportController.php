<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Venta;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Carbon\CarbonPeriod;

class VentaReportController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $from = $request->query('from');
        $to = $request->query('to');
        $period = $request->query('period'); // day, month, year

        try {
            $fromDate = $from ? Carbon::parse($from)->startOfDay() : Carbon::now()->subDays(30)->startOfDay();
            $toDate = $to ? Carbon::parse($to)->endOfDay() : Carbon::now()->endOfDay();
        } catch (\Exception $e) {
            return response()->json(['message' => 'Fecha inválida'], 422);
        }

        $baseQuery = Venta::query()->whereBetween('created_at', [$fromDate, $toDate]);

        if (! $user->hasRole('admin')) {
            $baseQuery->where('created_by', $user->id);
        }

        $totalRecaudado = (clone $baseQuery)->where('status', 'pagado')->sum('monto');
        $totalPorCobrar = (clone $baseQuery)->where('status', 'entregado')->sum('monto');
        $totalCount = (clone $baseQuery)->count();

        // Sum gastos in same period and scope
        $gastoQuery = \App\Models\Gasto::query()->whereBetween('created_at', [$fromDate, $toDate]);
        if (! $user->hasRole('admin')) {
            $gastoQuery->where('user_id', $user->id);
        }
        $totalGastos = (float) $gastoQuery->sum('monto');

        $totalRecaudadoNeto = (float) $totalRecaudado - $totalGastos;

        $series = [];
        if (in_array($period, ['day', 'week', 'month', 'year'])) {
            // Build a full list of periods between from and to
            if ($period === 'day') {
                $step = '1 day';
                $format = 'Y-m-d';
                $periodExpr = "DATE(created_at) as period";
            } elseif ($period === 'week') {
                $step = '1 week';
                $format = 'o-W';
                $periodExpr = "TO_CHAR(created_at, 'IYYY-IW') as period";
            } elseif ($period === 'month') {
                $step = '1 month';
                $format = 'Y-m';
                $periodExpr = "TO_CHAR(created_at, 'YYYY-MM') as period";
            } else {
                $step = '1 year';
                $format = 'Y';
                $periodExpr = "TO_CHAR(created_at, 'YYYY') as period";
            }


            if ($period === 'week') {
                // SQLite week formatting can differ from PHP's ISO week; aggregate in PHP to ensure consistent keys
                $raw = (clone $baseQuery)->get(['created_at', 'status', 'monto']);
                $tmp = [];
                foreach ($raw as $r) {
                    $k = Carbon::parse($r->created_at)->format($format);
                    if (! isset($tmp[$k])) {
                        $tmp[$k] = ['recaudado' => 0.0, 'por_cobrar' => 0.0];
                    }
                    if ($r->status === 'pagado') {
                        $tmp[$k]['recaudado'] += (float) $r->monto;
                    } elseif ($r->status === 'entregado') {
                        $tmp[$k]['por_cobrar'] += (float) $r->monto;
                    }
                }
                $rows = $tmp;
            } else {
                $rows = (clone $baseQuery)
                    ->selectRaw($periodExpr . ", SUM(CASE WHEN status='pagado' THEN monto ELSE 0 END) as recaudado, SUM(CASE WHEN status='entregado' THEN monto ELSE 0 END) as por_cobrar")
                    ->groupBy('period')
                    ->orderBy('period')
                    ->get()
                    ->mapWithKeys(function ($r) {
                        return [ $r->period => [ 'recaudado' => (float)$r->recaudado, 'por_cobrar' => (float)$r->por_cobrar ] ];
                    })
                    ->toArray();
            }

                // compute gastos per period using same key logic
                if ($period === 'week') {
                    $gastoTmp = [];
                    $gastoRaw = $gastoQuery->get(['created_at', 'monto']);
                    foreach ($gastoRaw as $r) {
                        $k = Carbon::parse($r->created_at)->format($format);
                        if (! isset($gastoTmp[$k])) $gastoTmp[$k] = 0.0;
                        $gastoTmp[$k] += (float) $r->monto;
                    }
                    $gastoRows = $gastoTmp;
                } else {
                    $gastoRows = (clone $gastoQuery)
                        ->selectRaw($periodExpr . ", SUM(monto) as gastos")
                        ->groupBy('period')
                        ->orderBy('period')
                        ->get()
                        ->mapWithKeys(function ($r) {
                            return [ $r->period => (float)$r->gastos ];
                        })
                        ->toArray();
                }

            $periodStart = Carbon::parse($fromDate);
            $periodEnd = Carbon::parse($toDate);
            $carbonPeriod = CarbonPeriod::create($periodStart, $step, $periodEnd);

            foreach ($carbonPeriod as $dt) {
                $key = $dt->format($format);
                $values = $rows[$key] ?? ['recaudado' => 0.0, 'por_cobrar' => 0.0];

                // Human-friendly label in dd-mm-aaaa
                if ($period === 'day') {
                    $label = $dt->format('d-m-Y');
                } elseif ($period === 'week') {
                    $weekStart = $dt->copy()->startOfWeek();
                    $weekEnd = $dt->copy()->endOfWeek();
                    $label = $weekStart->format('d-m-Y') . ' — ' . $weekEnd->format('d-m-Y');
                } elseif ($period === 'month') {
                    $label = $dt->copy()->startOfMonth()->format('d-m-Y');
                } else {
                    $label = $dt->copy()->startOfYear()->format('d-m-Y');
                }

                $series[] = [
                    'period' => $key,
                    'label' => $label,
                    'recaudado' => (float) $values['recaudado'],
                    'por_cobrar' => (float) $values['por_cobrar'],
                    'gastos' => (float) ($gastoRows[$key] ?? 0.0),
                ];
            }
        }

        $fromLabel = Carbon::parse($fromDate)->format('d-m-Y');
        $toLabel = Carbon::parse($toDate)->format('d-m-Y');
        $rangeLabel = $fromLabel . ' — ' . $toLabel;

        return response()->json([
            'total_recaudado' => (float) $totalRecaudado,
            'total_por_cobrar' => (float) $totalPorCobrar,
            'total_ventas' => $totalCount,
            'total_gastos' => $totalGastos,
            'total_recaudado_neto' => $totalRecaudadoNeto,
            'range_label' => $rangeLabel,
            'from_label' => $fromLabel,
            'to_label' => $toLabel,
            'series' => $series,
        ]);
    }
}
