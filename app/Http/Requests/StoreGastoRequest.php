<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreGastoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $rules = [
            'tipo_de_gasto_id' => 'required|exists:tipos_de_gasto,id',
            'monto' => 'required|numeric|min:0',
            'date' => 'sometimes|date',
            'user_id' => 'sometimes|exists:users,id'
        ];

        if ($this->isMethod('post')) {
            $rules['descripcion'] = 'required|string';
        } else {
            // allow partial updates: descripcion only validated if present
            $rules['descripcion'] = 'sometimes|string';
        }

        return $rules;
    }
}
