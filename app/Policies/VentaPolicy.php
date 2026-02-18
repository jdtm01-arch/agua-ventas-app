<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Venta;

class VentaPolicy
{
    public function before($user, $ability)
    {
        if (method_exists($user, 'hasRole') && $user->hasRole('admin')) {
            return true;
        }
    }

    public function viewAny(User $user)
    {
        return method_exists($user, 'hasRole') && ($user->hasRole('vendedor') || $user->hasRole('admin'));
    }

    public function view(User $user, Venta $venta)
    {
        return $this->viewAny($user);
    }

    public function create(User $user)
    {
        return method_exists($user, 'hasRole') && ($user->hasRole('vendedor') || $user->hasRole('admin'));
    }

    public function update(User $user, Venta $venta)
    {
        // Admins can always update
        if (method_exists($user, 'hasRole') && $user->hasRole('admin')) return true;
        // Creators can update if:
        // - status is not 'pagado', OR
        // - status is 'pagado' AND age <= LIMITE_EDICION days
        if (method_exists($user, 'hasRole') && $user->hasRole('vendedor')) {
            if ($venta->created_by != $user->id) return false;
            if ($venta->status !== 'pagado') return true;
            // If pagado, check age
            $limiteEdicion = config('limits.edicion', 5);
            $ageDays = now()->diffInDays($venta->created_at);
            return $ageDays <= $limiteEdicion;
        }
        return false;
    }

    public function delete(User $user, Venta $venta)
    {
        // Admins can always delete
        if (method_exists($user, 'hasRole') && $user->hasRole('admin')) return true;
        // Creators can delete if:
        // - status is not 'pagado', OR
        // - status is 'pagado' AND age <= LIMITE_EDICION days
        if (method_exists($user, 'hasRole') && $user->hasRole('vendedor')) {
            if ($venta->created_by != $user->id) return false;
            if ($venta->status !== 'pagado') return true;
            // If pagado, check age
            $limiteEdicion = config('limits.edicion', 5);
            $ageDays = now()->diffInDays($venta->created_at);
            return $ageDays <= $limiteEdicion;
        }
        return false;
    }
}
