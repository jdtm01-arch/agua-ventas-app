<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Cliente;

class Venta extends Model
{
    protected $fillable = [
        'cliente_id',
        'tipo_venta',
        'monto',
        'status'
    ];

    public function cliente()
    {
        return $this->belongsTo(Cliente::class);
    }
}




