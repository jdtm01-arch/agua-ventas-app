<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Venta;
use App\Http\Requests\StoreVentaRequest;
use App\Http\Resources\VentaResource;


class VentaController extends Controller
{
    public function index()
    {
        $ventas = Venta::with('cliente')->orderBy('created_at', 'desc')->get();

        return VentaResource::collection($ventas);
    }

    public function store(StoreVentaRequest $request)
    {
        $venta = Venta::create([
            'cliente_id' => $request->cliente_id,
            'tipo_venta' => $request->tipo_venta,
            'monto' => $request->monto,
            'status' => 'pendiente'
        ]);

        $venta->load('cliente');
        return response()->json([
            'message' => 'Venta creada',
            'venta' => new VentaResource($venta)
        ], 201);
    }

    public function updateStatus(Request $request, Venta $venta)
    {
        $request->validate([
            'status' => 'required|in:pendiente,por_entregar,pagado'
        ]);

        $venta->status = $request->status;
        $venta->save();

        return response()->json([
            'message' => 'Estado actualizado',
            'venta' => $venta
        ]);
    }
}