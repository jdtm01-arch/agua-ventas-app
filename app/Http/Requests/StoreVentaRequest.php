<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreVentaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'cliente_id' => 'required|exists:clientes,id',            
            'status' => 'sometimes|in:pendiente,en_ruta,entregado,cancelado',
            'tipo_venta' => 'required|in:primera,recarga',
            'monto' => 'required|numeric|min:0'
        ];
    }
}