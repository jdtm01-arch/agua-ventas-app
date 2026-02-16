<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TipoDeGasto extends Model
{
    protected $table = 'tipos_de_gasto';
    protected $fillable = ['nombre'];

    public function gastos()
    {
        return $this->hasMany(Gasto::class, 'tipo_de_gasto_id');
    }
}
