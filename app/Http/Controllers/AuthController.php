<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $data = $request->only(['name','email','password']);
        $validator = Validator::make($data, [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
        ]);
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => bcrypt($data['password']),
        ]);

        if (method_exists($user, 'assignRole')) {
            $user->assignRole('user');
        }

        $token = $user->createToken('api-token')->plainTextToken;

        return response()->json(['user' => $user, 'token' => $token], 201);
    }

    public function login(Request $request)
    {
        $data = $request->only(['email','password']);
        $validator = Validator::make($data, [
            'email' => 'required|email',
            'password' => 'required|string',
        ]);
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = User::where('email', $data['email'])->first();
        if (!$user || !Hash::check($data['password'], $user->password)) {
            return response()->json(['message' => 'Credenciales inválidas'], 401);
        }

        $token = $user->createToken('api-token')->plainTextToken;
        return response()->json(['user' => $user, 'token' => $token, 'is_admin' => method_exists($user, 'hasRole') ? $user->hasRole('admin') : false]);
    }

    public function logout(Request $request)
    {
        $user = $request->user();
        if ($user) {
            // Revoke all tokens for the user to ensure logout invalidates access
            if (method_exists($user, 'tokens')) {
                $user->tokens()->delete();
            }
        }
        return response()->json(['message' => 'Logged out']);
    }

    public function me(Request $request)
    {
        $user = $request->user();
        return response()->json(['user' => $user, 'is_admin' => method_exists($user, 'hasRole') ? $user->hasRole('admin') : false]);
    }

    // Admin creates users (e.g. vendedores)
    public function storeByAdmin(Request $request)
    {
        $actor = $request->user();
        if (! $actor) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }
        if (! method_exists($actor, 'hasRole') || ! $actor->hasRole('admin')) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $data = $request->only(['name','email','password']);
        $validator = Validator::make($data, [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
        ]);
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $password = $data['password'] ?? Str::random(10);

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => bcrypt($password),
        ]);

        if (method_exists($user, 'assignRole')) {
            // Ensure role exists (create if missing) and assign it. Use guard 'web'.
            try {
                \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'vendedor', 'guard_name' => 'web']);
            } catch (\Throwable $e) {
                // ignore if role table not available yet
            }
            $user->assignRole('vendedor');
        }

        // Do not create auth token for created users; return created resource
        return response()->json(['user' => $user], 201);
    }
}
