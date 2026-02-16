<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\VentaController;
use App\Http\Controllers\ClienteController;
use App\Http\Controllers\AuthController;

Route::post('register', [AuthController::class, 'register']);
Route::post('login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
	Route::get('user', [AuthController::class, 'me']);
	Route::post('logout', [AuthController::class, 'logout']);
	Route::get('/ventas', [VentaController::class, 'index']);
	Route::post('/ventas', [VentaController::class, 'store']);
	Route::patch('/ventas/{venta}/status', [VentaController::class, 'updateStatus']);
	Route::apiResource('clientes', ClienteController::class);
});