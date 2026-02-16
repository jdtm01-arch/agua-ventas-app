<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\TipoDeGasto;

class TipoDeGastoController extends Controller
{
    public function index()
    {
        $types = TipoDeGasto::orderBy('nombre')->get();
        return response()->json(['data' => $types]);
    }
}
