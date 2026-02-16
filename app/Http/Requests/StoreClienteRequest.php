<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreClienteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nombre' => 'required|string|max:255',
            'telefono' => 'required|string|max:20|unique:clientes,telefono',
            'direccion' => 'nullable|string|max:500',
        ];
    }
}
