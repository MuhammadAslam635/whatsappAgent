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
            'phone_number' => 'required|string',
            'api_key' => 'required|string',
            'secret_key' => 'nullable|string',
            'webhook_secret' => 'nullable|string',
        ]);

        $integration = Integration::where('user_id', $request->user()->id)
            ->where('phone_number', $validated['phone_number'])
            ->first();

        if ($integration) {
            $integration->update($validated);
        } else {
            $integration = new Integration($validated);
            $integration->user_id = $request->user()->id;
            if (empty($validated['webhook_secret'])) {
                $integration->webhook_secret = Str::random(32);
            }
            $integration->save();
        }
        
        // Construct the full URL using the APP_URL or current request
        $integration->webhook_url = route('webhooks.wasender', ['integration' => $integration->id]);
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
            'phone_number' => 'sometimes|required|string',
            'api_key' => 'sometimes|required|string',
            'secret_key' => 'nullable|string',
            'webhook_secret' => 'nullable|string',
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
