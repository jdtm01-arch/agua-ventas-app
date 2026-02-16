<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Convert legacy status values to canonical ones
        DB::table('ventas')->where('status', 'por_entregar')->update(['status' => 'pendiente']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // no-op: do not revert converted statuses
    }
};
