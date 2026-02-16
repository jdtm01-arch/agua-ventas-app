<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

return new class extends Migration
{
    public function up()
    {
        if (Schema::hasTable('ventas') && ! Schema::hasColumn('ventas', 'created_by')) {
            Schema::table('ventas', function (Blueprint $table) {
                $table->unsignedBigInteger('created_by')->nullable()->after('id');
                $table->foreign('created_by')->references('id')->on('users')->onDelete('set null');
            });
        }
    }

    public function down()
    {
        if (Schema::hasTable('ventas') && Schema::hasColumn('ventas', 'created_by')) {
            Schema::table('ventas', function (Blueprint $table) {
                $table->dropForeign(['created_by']);
                $table->dropColumn('created_by');
            });
        }
    }
};
