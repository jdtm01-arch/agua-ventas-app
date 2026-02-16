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
        // For SQLite we need to recreate the table to change CHECK constraints
        DB::beginTransaction();
        try {
            Schema::create('ventas_new', function (Blueprint $table) {
                $table->id();
                $table->foreignId('cliente_id')->constrained()->cascadeOnDelete();
                $table->enum('tipo_venta', ['primera', 'recarga']);
                $table->decimal('monto', 8, 2);
                $table->enum('status', ['pendiente', 'entregado', 'pagado'])->default('pendiente');
                $table->timestamps();
            });

            // Copy data, mapping legacy values to canonical ones
            DB::statement(<<<'SQL'
INSERT INTO ventas_new (id, cliente_id, tipo_venta, monto, status, created_at, updated_at)
SELECT id, cliente_id, tipo_venta, monto,
  CASE
    WHEN status = 'por_entregar' THEN 'pendiente'
    WHEN status NOT IN ('pendiente','entregado','pagado') THEN 'pendiente'
    ELSE status
  END as status,
  created_at, updated_at
FROM ventas;
SQL
            );

            Schema::dropIfExists('ventas');
            DB::statement('ALTER TABLE ventas_new RENAME TO ventas');

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Attempt to restore original schema: create previous ventas_old with old enum
        DB::beginTransaction();
        try {
            Schema::create('ventas_old', function (Blueprint $table) {
                $table->id();
                $table->foreignId('cliente_id')->constrained()->cascadeOnDelete();
                $table->enum('tipo_venta', ['primera', 'recarga']);
                $table->decimal('monto', 8, 2);
                $table->enum('status', ['pendiente', 'por_entregar', 'pagado'])->default('pendiente');
                $table->timestamps();
            });

            DB::statement(<<<'SQL'
INSERT INTO ventas_old (id, cliente_id, tipo_venta, monto, status, created_at, updated_at)
SELECT id, cliente_id, tipo_venta, monto,
  CASE
    WHEN status = 'entregado' THEN 'por_entregar'
    ELSE status
  END as status,
  created_at, updated_at
FROM ventas;
SQL
            );

            Schema::dropIfExists('ventas');
            DB::statement('ALTER TABLE ventas_old RENAME TO ventas');

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }
    }
};
