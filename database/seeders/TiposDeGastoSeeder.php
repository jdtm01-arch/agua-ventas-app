<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\TipoDeGasto;

class TiposDeGastoSeeder extends Seeder
{
    public function run(): void
    {
        $types = ['Operativos', 'Flota', 'Combustible'];
        foreach ($types as $t) {
            TipoDeGasto::firstOrCreate(['nombre' => $t]);
        }
    }
}
