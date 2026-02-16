<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Venta;
use App\Http\Requests\StoreVentaRequest;


class VentaController extends Controller
{
    public function index()
    {
        $ventas = Venta::orderBy('created_at', 'desc')->get();

        return response()->json([
            'ventas' => $ventas
        ]);
    }

    public function store(StoreVentaRequest $request)
    {
        $venta = Venta::create([
            'cliente_id' => $request->cliente_id,
            'tipo_venta' => $request->tipo_venta,
            'monto' => $request->monto,
            'status' => 'pendiente'
        ]);

        return response()->json([
            'message' => 'Venta creada',
            'venta' => $venta->load('cliente')
        ]);
    }

    public function updateStatus(Request $request, Venta $venta)
    {
        $request->validate([
            'status' => 'required|in:pendiente,en_ruta,entregado,cancelado'
        ]);

        $venta->status = $request->status;
        $venta->save();

        return response()->json([
            'message' => 'Estado actualizado',
            'venta' => $venta
        ]);
    }
}