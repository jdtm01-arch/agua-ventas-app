<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Gasto extends Model
{
    protected $table = 'gastos';
    protected $fillable = ['user_id', 'tipo_de_gasto_id', 'monto', 'descripcion', 'created_at'];

    public function tipo()
    {
        return $this->belongsTo(TipoDeGasto::class, 'tipo_de_gasto_id');
    }

    public function user()
    {
        return $this->belongsTo(\App\Models\User::class, 'user_id');
    }
}
