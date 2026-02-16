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
        'status',
        'created_by'
    ];

    public function cliente()
    {
        return $this->belongsTo(Cliente::class);
    }

    public function creator()
    {
        return $this->belongsTo(\App\Models\User::class, 'created_by');
    }
}




