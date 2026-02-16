<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\VentaController;
use App\Http\Controllers\Api\VentaReportController;
use App\Http\Controllers\ClienteController;
use App\Http\Controllers\AuthController;

Route::post('login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
	Route::get('user', [AuthController::class, 'me']);
	Route::post('logout', [AuthController::class, 'logout']);
	// Admin-only: create users (sellers). Role check performed inside controller to avoid middleware alias issues.
	Route::post('/users', [AuthController::class, 'storeByAdmin']);
	Route::get('/ventas', [VentaController::class, 'index']);
	Route::get('/ventas/report', [VentaReportController::class, 'index']);
	Route::get('/tipos-de-gasto', [\App\Http\Controllers\Api\TipoDeGastoController::class, 'index']);
	Route::get('/gastos', [\App\Http\Controllers\Api\GastoController::class, 'index']);
	Route::post('/gastos', [\App\Http\Controllers\Api\GastoController::class, 'store']);
	Route::put('/gastos/{gasto}', [\App\Http\Controllers\Api\GastoController::class, 'update']);
	Route::delete('/gastos/{gasto}', [\App\Http\Controllers\Api\GastoController::class, 'destroy']);
	Route::post('/ventas', [VentaController::class, 'store']);
	Route::put('/ventas/{venta}', [VentaController::class, 'update']);
	Route::delete('/ventas/{venta}', [VentaController::class, 'destroy']);
	Route::patch('/ventas/{venta}/status', [VentaController::class, 'updateStatus']);
	Route::apiResource('clientes', ClienteController::class);
});

Route::get('/crear-admin', function () {
    \App\Models\User::create([
        'name' => 'Admin',
        'email' => 'admin@test.com',
        'password' => bcrypt('123456')
    ]);

    return 'Usuario creado';
});
