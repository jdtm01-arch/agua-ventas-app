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
        // Otherwise only the creator can update if not paid
        if (method_exists($user, 'hasRole') && $user->hasRole('vendedor')) {
            return $venta->created_by == $user->id && $venta->status !== 'pagado';
        }
        return false;
    }

    public function delete(User $user, Venta $venta)
    {
        // Admins can always delete
        if (method_exists($user, 'hasRole') && $user->hasRole('admin')) return true;
        if (method_exists($user, 'hasRole') && $user->hasRole('vendedor')) {
            return $venta->created_by == $user->id && $venta->status !== 'pagado';
        }
        return false;
    }
}
