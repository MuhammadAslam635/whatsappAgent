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
        return $request->user()->integrations->map(function ($integration) {
            return array_merge($integration->toArray(), [
                'api_key' => $integration->api_key ? str_repeat('*', 6) . substr($integration->api_key, -4) : null,
                'meta_access_token' => $integration->meta_access_token ? str_repeat('*', 6) . substr($integration->meta_access_token, -4) : null,
            ]);
        });
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'type' => 'required|in:wa_sender,meta',
            'phone_number' => 'required|string',
            'api_key' => 'required_if:type,wa_sender|nullable|string',
            'secret_key' => 'nullable|string',
            'webhook_secret' => 'nullable|string',
            'meta_phone_number_id' => 'required_if:type,meta|nullable|string',
            'meta_access_token' => 'required_if:type,meta|nullable|string',
            'meta_waba_id' => 'nullable|string',
        ]);

        $userId = $request->user()->id;

        // Remove other type — user picks one
        Integration::where('user_id', $userId)
            ->where('type', '!=', $validated['type'])
            ->delete();

        $integration = Integration::where('user_id', $userId)
            ->where('type', $validated['type'])
            ->first();

        if ($integration) {
            $integration->update($validated);
        } else {
            $integration = new Integration($validated);
            $integration->user_id = $userId;
            if (empty($validated['webhook_secret'])) {
                $integration->webhook_secret = Str::random(32);
            }
            $integration->save();
        }

        if ($integration->isWaSender()) {
            $integration->webhook_url = route('webhooks.wasender', ['integration' => $integration->id]);
        } else {
            $integration->webhook_url = route('webhooks.meta');
        }
        $integration->save();

        return response()->json([
            'message' => 'Integration saved successfully',
            'integration' => $integration,
            'webhook_url' => $integration->webhook_url,
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
            'api_key' => 'sometimes|nullable|string',
            'secret_key' => 'nullable|string',
            'webhook_secret' => 'nullable|string',
            'meta_phone_number_id' => 'nullable|string',
            'meta_access_token' => 'nullable|string',
            'meta_waba_id' => 'nullable|string',
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
