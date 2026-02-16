<?php

namespace App\Policies;

use App\Models\User;

class UserPolicy
{
    public function before($user, $ability)
    {
        // only admins can manage users; handled in specific methods too
    }

    public function create(User $user)
    {
        return method_exists($user, 'hasRole') && $user->hasRole('admin');
    }

    public function delete(User $user, User $model)
    {
        return method_exists($user, 'hasRole') && $user->hasRole('admin');
    }

    public function viewAny(User $user)
    {
        return method_exists($user, 'hasRole') && $user->hasRole('admin');
    }
}
