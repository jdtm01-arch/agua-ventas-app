<?php

namespace App\Exceptions;

use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Throwable;
use Illuminate\Validation\ValidationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Symfony\Component\HttpKernel\Exception\HttpException;
use App\Http\Responses\ApiResponse;

class Handler extends ExceptionHandler
{
    /**
     * A list of the inputs that are never flashed for validation exceptions.
     *
     * @var array<int, string>
     */
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    public function register(): void
    {
        $this->reportable(function (Throwable $e) {
            //
        });
    }

    public function render($request, Throwable $e)
    {
        if ($request->is('api/*') || $request->expectsJson()) {
            if ($e instanceof ValidationException) {
                return ApiResponse::error('Validation failed', $e->errors(), 422);
            }

            if ($e instanceof AuthenticationException) {
                return ApiResponse::error($e->getMessage() ?: 'Unauthenticated', [], 401);
            }

            if ($e instanceof ModelNotFoundException) {
                return ApiResponse::error('Resource not found', [], 404);
            }

            if ($e instanceof HttpException) {
                return ApiResponse::error($e->getMessage() ?: 'Error', [], $e->getStatusCode());
            }

            $code = method_exists($e, 'getStatusCode') ? $e->getStatusCode() : 500;
            $message = $e->getMessage() ?: ($code === 500 ? 'Server Error' : 'Error');

            return ApiResponse::error($message, [], $code);
        }

        return parent::render($request, $e);
    }
}
