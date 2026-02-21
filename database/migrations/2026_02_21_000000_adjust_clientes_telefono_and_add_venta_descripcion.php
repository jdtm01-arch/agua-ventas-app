<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Drop unique constraint on telefono and recreate as non-unique
        Schema::table('clientes', function (Blueprint $table) {
            $table->dropUnique(['telefono']);
            $table->string('telefono')->nullable()->change();
        });

        // Add descripcion field to ventas
        Schema::table('ventas', function (Blueprint $table) {
            $table->text('descripcion')->nullable()->after('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Restore unique constraint on telefono
        Schema::table('clientes', function (Blueprint $table) {
            $table->string('telefono')->unique()->change();
        });

        // Remove descripcion from ventas
        Schema::table('ventas', function (Blueprint $table) {
            $table->dropColumn('descripcion');
        });
    }
};
