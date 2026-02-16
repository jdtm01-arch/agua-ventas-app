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
	Route::post('/ventas', [VentaController::class, 'store']);
	Route::put('/ventas/{venta}', [VentaController::class, 'update']);
	Route::delete('/ventas/{venta}', [VentaController::class, 'destroy']);
	Route::patch('/ventas/{venta}/status', [VentaController::class, 'updateStatus']);
	Route::apiResource('clientes', ClienteController::class);
});