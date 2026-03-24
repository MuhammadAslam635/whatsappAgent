<?php

namespace App\Services;

use App\Models\Integration;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WhatsAppService
{
    /**
     * Send a text message via the appropriate provider (Wasender or Meta).
     *
     * @return array{success: bool, message_id: string|null, error: string|null}
     */
    public static function sendMessage(Integration $integration, string $to, string $text, ?string $mediaUrl = null): array
    {
        if ($integration->isMeta()) {
            return self::sendViaMeta($integration, $to, $text, $mediaUrl);
        }

        return self::sendViaWaSender($integration, $to, $text, $mediaUrl);
    }

    protected static function sendViaWaSender(Integration $integration, string $to, string $text, ?string $mediaUrl = null): array
    {
        try {
            $payload = ['to' => $to, 'text' => $text];
            if ($mediaUrl) {
                $payload['media'] = $mediaUrl;
            }

            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $integration->api_key,
                'Accept' => 'application/json',
            ])->post('https://api.wasenderapi.com/api/send-message', $payload);

            if ($response->successful()) {
                $data = $response->json();
                return [
                    'success' => true,
                    'message_id' => $data['data']['msgId'] ?? null,
                    'error' => null,
                ];
            }

            Log::error('[WaSender] Send failed', ['body' => $response->body()]);
            return ['success' => false, 'message_id' => null, 'error' => $response->body()];
        } catch (\Exception $e) {
            Log::error('[WaSender] Exception: ' . $e->getMessage());
            return ['success' => false, 'message_id' => null, 'error' => $e->getMessage()];
        }
    }

    protected static function sendViaMeta(Integration $integration, string $to, string $text, ?string $mediaUrl = null): array
    {
        try {
            $phoneNumberId = $integration->meta_phone_number_id;
            $accessToken = $integration->meta_access_token;

            // Strip '+' prefix — Meta expects plain digits
            $to = ltrim($to, '+');

            $payload = [
                'messaging_product' => 'whatsapp',
                'recipient_type' => 'individual',
                'to' => $to,
            ];

            if ($mediaUrl) {
                // Send as document/image based on extension
                $payload['type'] = 'image';
                $payload['image'] = ['link' => $mediaUrl];
            } else {
                $payload['type'] = 'text';
                $payload['text'] = ['preview_url' => false, 'body' => $text];
            }

            $response = Http::withToken($accessToken)
                ->post("https://graph.facebook.com/v21.0/{$phoneNumberId}/messages", $payload);

            if ($response->successful()) {
                $data = $response->json();
                $waId = $data['messages'][0]['id'] ?? null;
                return [
                    'success' => true,
                    'message_id' => $waId,
                    'error' => null,
                ];
            }

            Log::error('[Meta] Send failed', ['body' => $response->body()]);
            return ['success' => false, 'message_id' => null, 'error' => $response->body()];
        } catch (\Exception $e) {
            Log::error('[Meta] Exception: ' . $e->getMessage());
            return ['success' => false, 'message_id' => null, 'error' => $e->getMessage()];
        }
    }

    /**
     * Mark a message as read via Meta Cloud API.
     */
    public static function markAsReadMeta(Integration $integration, string $messageId): void
    {
        try {
            Http::withToken($integration->meta_access_token)
                ->post("https://graph.facebook.com/v21.0/{$integration->meta_phone_number_id}/messages", [
                    'messaging_product' => 'whatsapp',
                    'status' => 'read',
                    'message_id' => $messageId,
                ]);
        } catch (\Exception $e) {
            Log::error('[Meta] Mark read failed: ' . $e->getMessage());
        }
    }
}
