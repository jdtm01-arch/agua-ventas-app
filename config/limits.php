<?php

return [
    /**
     * Límite de antigüedad en días para permitir edición/eliminación de registros
     * después de cambiar status a 'pagado' (ventas) o por defecto (gastos).
     * Este valor debe sincronizarse con LIMITE_EDICION en frontend/src/config.js
     */
    'edicion' => env('LIMITE_EDICION', 60),
];
