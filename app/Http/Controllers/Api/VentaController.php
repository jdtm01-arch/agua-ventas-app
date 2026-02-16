<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Venta;
use App\Http\Requests\StoreVentaRequest;
use App\Http\Resources\VentaResource;
use App\Http\Responses\ApiResponse;
use Illuminate\Database\QueryException;


class VentaController extends Controller
{
    public function index()
    {
        $ventas = Venta::with('cliente')->orderBy('created_at', 'desc')->get();

        return VentaResource::collection($ventas);
    }

    public function store(StoreVentaRequest $request)
    {
        try {
            $venta = Venta::create([
                'cliente_id' => $request->cliente_id,
                'tipo_venta' => $request->tipo_venta,
                'monto' => $request->monto ?? $request->total,
                'status' => $request->status ?? 'pendiente'
            ]);

            $venta->load('cliente');
            return response()->json([
                'message' => 'Venta creada',
                'venta' => new VentaResource($venta)
            ], 201);
        } catch (QueryException $ex) {
            // Logically normalize DB/constraint errors to a friendly message
            return ApiResponse::error('No se pudo crear la venta. Revisa los datos enviados.', [], 400);
        } catch (\Throwable $ex) {
            return ApiResponse::error('Error interno al crear la venta', [], 500);
        }
    }

    public function updateStatus(Request $request, Venta $venta)
    {
        $request->validate([
            'status' => 'required|in:pendiente,entregado,pagado'
        ]);

        $venta->status = $request->status;
        $venta->save();

        return response()->json([
            'message' => 'Estado actualizado',
            'venta' => $venta
        ]);
    }
}