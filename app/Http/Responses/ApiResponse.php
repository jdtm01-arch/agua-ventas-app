<?php

namespace App\Http\Responses;

use Illuminate\Http\JsonResponse;

class ApiResponse
{
    public static function success(mixed $data = null, string $message = 'OK', int $code = 200, array $meta = []): JsonResponse
    {
        $payload = [
            'message' => $message,
            'data' => $data,
        ];

        if (!empty($meta)) {
            $payload['meta'] = $meta;
        }

        return response()->json($payload, $code);
    }

    public static function error(string $message = 'Error', array $errors = [], int $code = 400): JsonResponse
    {
        $payload = [
            'message' => $message,
            'errors' => $errors,
        ];

        return response()->json($payload, $code);
    }
}
