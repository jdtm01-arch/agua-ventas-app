<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Gasto;
use App\Models\TipoDeGasto;
use App\Http\Requests\StoreGastoRequest;

class GastoController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Gasto::with(['tipo', 'user'])->orderBy('created_at', 'desc');
        if (! $user->hasRole('admin')) {
            $query->where('user_id', $user->id);
        }

        // Support both 'per_page' (Laravel paginate standard) and 'limit' (legacy)
        $perPage = intval($request->query('per_page', $request->query('limit', 15)));
        if ($perPage <= 0) $perPage = 15;
        if ($perPage > 100) $perPage = 100; // cap max

        $gastos = $query->paginate($perPage);

        return response()->json($gastos);
    }

    public function store(StoreGastoRequest $request)
    {
        $user = $request->user();

        $userId = $request->input('user_id');
        if ($user->hasRole('admin') && $userId) {
            $ownerId = $userId;
        } else {
            $ownerId = $user->id;
        }

        $gasto = Gasto::create([
            'user_id' => $ownerId,
            'tipo_de_gasto_id' => $request->tipo_de_gasto_id,
            'monto' => $request->monto,
            'descripcion' => $request->descripcion ?? null,
        ]);

        if ($request->filled('date')) {
            try { $gasto->created_at = \Carbon\Carbon::parse($request->date); $gasto->save(); } catch (\Exception $e) {}
        }

        return response()->json(['message' => 'Gasto registrado', 'gasto' => $gasto], 201);
    }

    public function update(StoreGastoRequest $request, Gasto $gasto)
    {
        $user = $request->user();

        $isAdmin = $user->hasRole('admin');
        $isOwner = $gasto->user_id === $user->id;

        // Vendedor puede editar solo si es dueño y gasto no mayor a LIMITE_EDICION días de antigüedad
        if (! $isAdmin) {
            if (! $isOwner) {
                return response()->json(['message' => 'No autorizado'], 403);
            }
            $limiteEdicion = config('limits.edicion', 5);
            $ageDays = now()->diffInDays($gasto->created_at);
            if ($ageDays > $limiteEdicion) {
                return response()->json(['message' => 'No puede editar gastos con más de ' . $limiteEdicion . ' días de antigüedad'], 403);
            }
        }

        $gasto->tipo_de_gasto_id = $request->tipo_de_gasto_id ?? $gasto->tipo_de_gasto_id;
        $gasto->monto = $request->monto ?? $gasto->monto;
        $gasto->descripcion = $request->descripcion ?? $gasto->descripcion;
        if ($request->filled('date')) {
            try { $gasto->created_at = \Carbon\Carbon::parse($request->date); } catch (\Exception $e) {}
        }
        $gasto->save();

        return response()->json(['message' => 'Gasto actualizado', 'gasto' => $gasto]);
    }

    public function destroy(Request $request, Gasto $gasto)
    {
        $user = $request->user();

        $isAdmin = $user->hasRole('admin');
        $isOwner = $gasto->user_id === $user->id;

        if (! $isAdmin) {
            if (! $isOwner) return response()->json(['message' => 'No autorizado'], 403);
            $limiteEdicion = config('limits.edicion', 5);
            $ageDays = now()->diffInDays($gasto->created_at);
            if ($ageDays > $limiteEdicion) return response()->json(['message' => 'No puede eliminar gastos con más de ' . $limiteEdicion . ' días de antigüedad'], 403);
        }

        // Require explicit confirmation from the client
        if (! $request->boolean('confirm')) {
            return response()->json(['message' => 'Eliminación no autorizada: falta confirmación'], 422);
        }

        $gasto->delete();
        return response()->json(['message' => 'Gasto eliminado']);
    }
}
