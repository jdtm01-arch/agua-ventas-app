<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Venta;

class Cliente extends Model
{
    protected $fillable = [
        'nombre',
        'telefono',
        'direccion',
        'latitud',
        'longitud'
    ];

    public function ventas()
    {
        return $this->hasMany(Venta::class);
    }
}