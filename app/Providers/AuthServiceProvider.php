<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Gate;
use App\Models\Cliente;
use App\Models\Venta;
use App\Models\User;
use App\Policies\ClientePolicy;
use App\Policies\VentaPolicy;
use App\Policies\UserPolicy;

class AuthServiceProvider extends ServiceProvider
{
    public function register()
    {
        //
    }

    public function boot()
    {
        // Register policies
        Gate::policy(Cliente::class, ClientePolicy::class);
        Gate::policy(Venta::class, VentaPolicy::class);
        Gate::policy(User::class, UserPolicy::class);
    }
}
