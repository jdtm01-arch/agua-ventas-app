<?php

namespace App\Http\Controllers;

use App\Models\Cliente;
use Illuminate\Http\Request;
use App\Http\Requests\StoreClienteRequest;
use App\Http\Resources\ClienteResource;

class ClienteController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $this->authorize('viewAny', Cliente::class);

        $q = $request->query('q');
        if ($q) {
            // Case-insensitive search compatible with SQLite, PostgreSQL and MySQL
            $clientes = Cliente::whereRaw('LOWER(nombre) like ?', ['%'.strtolower($q).'%'])
                ->orWhereRaw('LOWER(telefono) like ?', ['%'.strtolower($q).'%'])
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get();
        } else {
            $clientes = Cliente::orderBy('created_at', 'desc')->get();
        }

        return ClienteResource::collection($clientes);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreClienteRequest $request)
    {
        $this->authorize('create', Cliente::class);
        $cliente = Cliente::create($request->validated());

        return (new ClienteResource($cliente))->response()->setStatusCode(201);
    }


    /**
     * Display the specified resource.
     */
    public function show(Cliente $cliente)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Cliente $cliente)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Cliente $cliente)
    {
        $this->authorize('update', $cliente);

        $data = $request->only(['nombre', 'telefono', 'direccion']);
        $cliente->update($data);

        return new ClienteResource($cliente);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Cliente $cliente)
    {
        //
    }
}
