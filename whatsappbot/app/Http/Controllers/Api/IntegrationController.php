<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Integration;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class IntegrationController extends Controller
{
    public function index(Request $request)
    {
        return $request->user()->integrations;
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'type' => 'required|in:wa_sender,meta',
            'phone_number' => 'nullable|string',
            'api_key' => 'required|string',
            'secret_key' => 'nullable|string',
            'webhook_secret' => 'nullable|string',
            'app_id' => 'nullable|string',
            'phone_number_id' => 'nullable|string',
            'waba_id' => 'nullable|string',
        ]);


        $user = $request->user();
        
        // Check if there's any existing integration for this user
        $existing = Integration::where('user_id', $user->id)->first();
        
        if ($existing && $existing->type !== $validated['type']) {
            return response()->json([
                'message' => "You already have an active {$existing->type} integration. Please delete it before switching."
            ], 400);
        }

        // Use the existing one if it exists (regardless of phone number, since we only allow one)
        $integration = $existing;

        if ($integration) {
            $integration->update($validated);
        } else {
            $integration = new Integration($validated);
            $integration->user_id = $user->id;
            if (empty($validated['webhook_secret'])) {
                $integration->webhook_secret = Str::random(32);
            }
            $integration->save();
        }

        
        // Construct the full URL using the APP_URL or current request
        $routeName = ($integration->type === 'meta') ? 'webhooks.meta' : 'webhooks.wasender';
        $integration->webhook_url = route($routeName, ['integration' => $integration->id]);
        $integration->save();


        return response()->json([
            'message' => 'Integration saved successfully',
            'integration' => $integration,
            'webhook_url' => url("/api/webhooks/wasender/{$integration->id}")
        ]);
    }

    public function show(Integration $integration, Request $request)
    {
        if ($integration->user_id !== $request->user()->id) {
            abort(403, 'Unauthorized action.');
        }
        return $integration;
    }

    public function update(Request $request, Integration $integration)
    {
        if ($integration->user_id !== $request->user()->id) {
            abort(403, 'Unauthorized action.');
        }
        
        $validated = $request->validate([
            'phone_number' => 'nullable|string',
            'api_key' => 'sometimes|required|string',
            'secret_key' => 'nullable|string',
            'webhook_secret' => 'nullable|string',
            'app_id' => 'nullable|string',
            'phone_number_id' => 'nullable|string',
            'waba_id' => 'nullable|string',
        ]);


        $integration->update($validated);

        return $integration;
    }

    public function destroy(Integration $integration, Request $request)
    {
        if ($integration->user_id !== $request->user()->id) {
            abort(403, 'Unauthorized action.');
        }
        $integration->delete();
        return response()->json(['message' => 'Integration deleted']);
    }
}
