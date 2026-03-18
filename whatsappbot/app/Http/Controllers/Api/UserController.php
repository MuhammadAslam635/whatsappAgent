<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return response()->json(User::all());
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'whatsapp_connection' => ['nullable', Rule::in(['wasenderapi', 'meta'])],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'whatsapp_connection' => $validated['whatsapp_connection'] ?? null,
        ]);

        return response()->json($user, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(User $user)
    {
        return response()->json($user);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => ['sometimes', 'required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'password' => 'sometimes|required|string|min:8',
            'whatsapp_connection' => ['nullable', Rule::in(['wasenderapi', 'meta'])],
        ]);

        if (isset($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        }

        $user->update($validated);

        return response()->json($user);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(User $user)
    {
        $user->delete();

        return response()->json(['message' => 'User deleted successfully']);
    }

    /**
     * Get the authenticated user's bot settings.
     */
    public function getBotSettings(Request $request)
    {
        $user = $request->user();
        return response()->json([
            'bot_active' => $user->bot_active,
            'bot_system_prompt' => $user->bot_system_prompt,
        ]);
    }

    /**
     * Update the authenticated user's bot settings.
     */
    public function updateBotSettings(Request $request)
    {
        $validated = $request->validate([
            'bot_active' => 'required|boolean',
            'bot_system_prompt' => 'nullable|string|max:1000',
        ]);

        $user = $request->user();
        $user->update([
            'bot_active' => $validated['bot_active'],
            'bot_system_prompt' => $validated['bot_system_prompt'],
        ]);

        return response()->json([
            'message' => 'Bot settings updated successfully.',
            'bot_active' => $user->bot_active,
            'bot_system_prompt' => $user->bot_system_prompt,
        ]);
    }
}
