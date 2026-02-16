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
        $this->authorize('viewAny', Venta::class);
        $ventas = Venta::with('cliente')->orderBy('created_at', 'desc')->get();

        return VentaResource::collection($ventas);
    }

    public function store(StoreVentaRequest $request)
    {
        $this->authorize('create', Venta::class);
        try {
            $venta = Venta::create([
                'cliente_id' => $request->cliente_id,
                'tipo_venta' => $request->tipo_venta,
                'monto' => $request->monto ?? $request->total,
                'status' => $request->status ?? 'pendiente',
                'created_by' => $request->user()->id ?? null,
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

        $this->authorize('update', $venta);

        $venta->status = $request->status;
        $venta->save();

        return response()->json([
            'message' => 'Estado actualizado',
            'venta' => $venta
        ]);
    }

    public function update(Request $request, Venta $venta)
    {
        $this->authorize('update', $venta);

        $data = $request->only(['monto', 'tipo_venta']);

        $validator = \Validator::make($data, [
            'monto' => 'sometimes|numeric|min:0',
            'tipo_venta' => 'sometimes|in:primera,recarga'
        ]);

        if ($validator->fails()) {
            return ApiResponse::error('Datos inválidos', $validator->errors(), 422);
        }

        $venta->fill($data);
        $venta->save();

        return response()->json([
            'message' => 'Venta actualizada',
            'venta' => new VentaResource($venta->load('cliente'))
        ]);
    }

    public function destroy(Venta $venta)
    {
        $this->authorize('delete', $venta);

        $venta->delete();

        return response()->json(['message' => 'Venta eliminada']);
    }
}