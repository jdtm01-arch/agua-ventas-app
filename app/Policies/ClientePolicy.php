<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Cliente;

class ClientePolicy
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

    public function view(User $user, Cliente $cliente)
    {
        return $this->viewAny($user);
    }

    public function create(User $user)
    {
        return method_exists($user, 'hasRole') && ($user->hasRole('vendedor') || $user->hasRole('admin'));
    }

    public function update(User $user, Cliente $cliente)
    {
        return $this->create($user);
    }

    public function delete(User $user, Cliente $cliente)
    {
        return $this->create($user);
    }
}
