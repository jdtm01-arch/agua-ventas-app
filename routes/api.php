<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\VentaController;
use App\Http\Controllers\ClienteController;

Route::get('/ventas', [VentaController::class, 'index']);
Route::post('/ventas', [VentaController::class, 'store']);
Route::patch('/ventas/{venta}/status', [VentaController::class, 'updateStatus']);
Route::apiResource('clientes', ClienteController::class);