<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Integration;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\Contact;
use App\Services\WhatsAppService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use App\Jobs\ProcessAutoReplyJob;
use Illuminate\Support\Facades\Storage;



class WebhookController extends Controller
{
    // ─── WaSender Webhook ───────────────────────────────────────────

    public function handleWaSender(Request $request, $integration_id): \Illuminate\Http\JsonResponse
    {
        $integration = Integration::findOrFail($integration_id);

        $payload = $request->all();
        Log::info("WaSender Webhook RAW: " . json_encode($payload));
        $event = $payload['event'] ?? null;
        $data = $payload['data'] ?? [];

        Log::info("WaSender Webhook Event: {$event}", ['data' => $data]);

        // Ensure version increments for the conversation list 
        $userId = $integration->user_id;
        $listKey = "conv_list_version_{$userId}";
        Cache::forever($listKey, (int)Cache::get($listKey, 0) + 1);

        switch ($event) {
            case 'messages.upsert':
            case 'message-received':
            case 'message-upsert':
                $this->handleWaSenderIncoming($integration, $data);
                break;

            case 'messages.update':
            case 'message-status-update':
            case 'message-update':
                $this->handleWaSenderStatusUpdate($data);
                break;
        }

        return response()->json(['status' => 'success']);
    }

    protected function handleWaSenderIncoming(Integration $integration, $data): void
    {
        Log::info("handleWaSenderIncoming called");
        $messages = isset($data['key']) ? [$data] : $data;

        foreach ($messages as $msgData) {
            $remoteJid = $msgData['key']['remoteJid'] ?? null;
            $cleanedPn = $msgData['key']['cleanedSenderPn'] ?? null;

            if (!$remoteJid) continue;

            $phone = null;
            if ($cleanedPn) {
                $phone = (string) phone($cleanedPn, 'AUTO')->formatE164();
            } else {
                $phoneRaw = explode('@', $remoteJid)[0];
                $phone = (string) phone($phoneRaw, 'AUTO')->formatE164();
            }
            if (!$phone) continue;

            $fromMe = $msgData['key']['fromMe'] ?? false;
            $userId = $integration->user_id;

            $contact = $this->findOrCreateContact($userId, $phone, $msgData['pushName'] ?? $phone);

            $conversation = Conversation::firstOrCreate([
                'user_id' => $userId,
                'contact_id' => $contact->id,
            ]);

            $waId = $msgData['key']['id'];
            $content = $msgData['message']['conversation'] ?? 
                       $msgData['message']['extendedTextMessage']['text'] ?? 
                       null;
            
            $type = 'text';
            $mediaUrl = null;
            $caption = null;

            if (isset($msgData['message'])) {
                $m = $msgData['message'];
                
                if (isset($m['viewOnceMessage']['message'])) {
                    $m = $m['viewOnceMessage']['message'];
                } elseif (isset($m['viewOnceMessageV2']['message'])) {
                    $m = $m['viewOnceMessageV2']['message'];
                }
                if (isset($m['imageMessage'])) {
                    $type = 'image';
                    $mediaUrl = $this->decryptMedia($m['imageMessage'], 'image', $waId);
                    $caption = $m['imageMessage']['caption'] ?? null;
                } elseif (isset($m['videoMessage'])) {
                    $type = 'video';
                    $mediaUrl = $this->decryptMedia($m['videoMessage'], 'video', $waId);
                    $caption = $m['videoMessage']['caption'] ?? null;
                } elseif (isset($m['audioMessage'])) {
                    $type = 'audio';
                    $mediaUrl = $this->decryptMedia($m['audioMessage'], 'audio', $waId);
                } elseif (isset($m['documentMessage'])) {
                    $type = 'document';
                    $mediaUrl = $this->decryptMedia($m['documentMessage'], 'document', $waId);
                    $caption = $m['documentMessage']['title'] ?? $m['documentMessage']['fileName'] ?? null;
                } elseif (isset($m['stickerMessage'])) {
                    $type = 'sticker';
                    $mediaUrl = $this->decryptMedia($m['stickerMessage'], 'sticker', $waId);
                }
            }

            if ($type !== 'text') {
                $content = $caption ?: ($content ?: '[Media Message]');
            } else {
                $content = $content ?: '[Unsupported Message]';
            }

            $trimmedContent = trim($content);

            // Dedup outgoing messages
            if ($fromMe) {
                $existing = Message::where('conversation_id', $conversation->id)
                    ->where('sender', 'user')
                    ->where(function ($q) use ($trimmedContent) {
                        $q->where('content', $trimmedContent)
                          ->orWhere('content', 'like', $trimmedContent . '%');
                    })
                    ->where('created_at', '>=', now()->subMinutes(5))
                    ->orderByDesc('id')
                    ->first();

                if ($existing) {
                    $existing->update([
                        'whatsapp_message_id' => $waId, 
                        'status' => 'delivered',
                        'type' => $type,
                        'media_url' => $mediaUrl,
                        'caption' => $caption
                    ]);
                    continue;
                }
            }

            if (Message::where('whatsapp_message_id', $waId)->exists()) {
                // Update media if missing
                $msg = Message::where('whatsapp_message_id', $waId)->first();
                if ($mediaUrl && !$msg->media_url) {
                    $msg->update(['media_url' => $mediaUrl, 'type' => $type, 'caption' => $caption]);
                }
                continue;
            }

            DB::transaction(function () use ($conversation, $waId, $fromMe, $content, $integration, $phone, $type, $mediaUrl, $caption) {
                Message::create([
                    'conversation_id' => $conversation->id,
                    'whatsapp_message_id' => $waId,
                    'sender' => $fromMe ? 'user' : 'contact',
                    'content' => $content,
                    'type' => $type,
                    'media_url' => $mediaUrl,
                    'caption' => $caption,
                    'status' => 'delivered',
                ]);

                $updates = ['last_message_at' => now()];
                if (!$fromMe) $updates['unread_count'] = $conversation->unread_count + 1;
                $conversation->update($updates);

                $integration->load('user');
                if (!$fromMe && $integration->user->bot_active) {
                    ProcessAutoReplyJob::dispatch($integration, $conversation, $content, $phone);
                }
            });
        }
    }

    protected function handleWaSenderStatusUpdate($data): void
    {
        $updates = isset($data['key']) ? [$data] : (isset($data['update']) ? [$data] : $data);

        foreach ($updates as $update) {
            $actualUpdate = $update['update'] ?? $update;
            $msgId = $update['key']['id'] ?? $actualUpdate['key']['id'] ?? null;
            $status = $actualUpdate['status'] ?? null;

            if (!$msgId || $status === null) continue;

            $message = Message::where('whatsapp_message_id', $msgId)->first();
            if (!$message) continue;

            $statusMap = [0 => 'failed', 1 => 'pending', 2 => 'sent', 3 => 'delivered', 4 => 'read', 5 => 'read'];
            $newStatus = $statusMap[$status] ?? $message->status;

            $updateData = ['status' => $newStatus];
            if ($newStatus === 'delivered' && !$message->delivered_at) $updateData['delivered_at'] = now();
            if ($newStatus === 'read' && !$message->read_at) $updateData['read_at'] = now();

            $message->update($updateData);
        }
    }

    // ─── Meta Cloud API Webhook ─────────────────────────────────────

    /**
     * GET — Meta webhook verification (hub.challenge).
     *
     * Meta sends: ?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=CHALLENGE_STRING
     * Laravel converts dots to underscores in query keys, so hub.mode → hub_mode.
     *
     * The verify token is matched against META_WEBHOOK_VERIFY_TOKEN in .env.
     * In your Meta App Dashboard → WhatsApp → Configuration → Callback URL:
     *   - Callback URL: https://yourdomain.com/api/webhooks/meta
     *   - Verify Token: (same value you set in META_WEBHOOK_VERIFY_TOKEN)
     */
    public function verifyMetaWebhook(Request $request): \Illuminate\Http\Response
    {
        $verifyToken = env('META_WEBHOOK_VERIFY_TOKEN', '');

        // Laravel auto-converts hub.mode → hub_mode etc.
        $mode = $request->query('hub_mode');
        $token = $request->query('hub_verify_token');
        $challenge = $request->query('hub_challenge');

        Log::info('[Meta Webhook Verify] Attempt', [
            'mode' => $mode,
            'token_match' => $token === $verifyToken,
        ]);

        if ($mode === 'subscribe' && hash_equals($verifyToken, $token ?? '')) {
            Log::info('[Meta Webhook] Verified successfully.');
            return response($challenge, 200)->header('Content-Type', 'text/plain');
        }

        Log::warning('[Meta Webhook] Verification failed.', [
            'received_token' => $token,
            'expected_token_set' => !empty($verifyToken),
        ]);
        return response('Forbidden', 403);
    }

    /**
     * POST — Meta webhook for incoming messages & status updates.
     */
    public function handleMetaWebhook(Request $request): \Illuminate\Http\JsonResponse
    {
        $payload = $request->all();
        Log::info('[Meta Webhook] Payload received', ['object' => $payload['object'] ?? null]);

        if (($payload['object'] ?? null) !== 'whatsapp_business_account') {
            return response()->json(['status' => 'ignored']);
        }

        foreach ($payload['entry'] ?? [] as $entry) {
            foreach ($entry['changes'] ?? [] as $change) {
                if (($change['field'] ?? '') !== 'messages') continue;

                $value = $change['value'] ?? [];
                $phoneNumberId = $value['metadata']['phone_number_id'] ?? null;

                if (!$phoneNumberId) continue;

                // Find integration by meta_phone_number_id
                $integration = Integration::where('type', 'meta')
                    ->where('meta_phone_number_id', $phoneNumberId)
                    ->first();

                if (!$integration) {
                    Log::warning('[Meta Webhook] No integration for phone_number_id: ' . $phoneNumberId);
                    continue;
                }

                // Handle incoming messages
                foreach ($value['messages'] ?? [] as $msg) {
                    $this->handleMetaIncomingMessage($integration, $msg, $value['contacts'] ?? []);
                }

                // Handle status updates
                foreach ($value['statuses'] ?? [] as $statusUpdate) {
                    $this->handleMetaStatusUpdate($statusUpdate);
                }
            }
        }

        return response()->json(['status' => 'success']);
    }

    protected function handleMetaIncomingMessage(Integration $integration, array $msg, array $contacts): void
    {
        $from = $msg['from'] ?? null; // e.g. "923001234567"
        $waId = $msg['id'] ?? null;
        $type = $msg['type'] ?? 'text';
        $timestamp = $msg['timestamp'] ?? null;

        if (!$from || !$waId) return;

        $phone = (string) phone('+' . $from, 'AUTO')->formatE164();

        // Get contact name from webhook payload
        $pushName = $phone;
        foreach ($contacts as $c) {
            if (($c['wa_id'] ?? '') === $from) {
                $pushName = $c['profile']['name'] ?? $phone;
                break;
            }
        }

        // Extract content based on message type
        $content = match ($type) {
            'text' => $msg['text']['body'] ?? '',
            'image' => '[Image] ' . ($msg['image']['caption'] ?? ''),
            'video' => '[Video] ' . ($msg['video']['caption'] ?? ''),
            'audio' => '[Audio Message]',
            'document' => '[Document] ' . ($msg['document']['filename'] ?? ''),
            'sticker' => '[Sticker]',
            'location' => '[Location: ' . ($msg['location']['latitude'] ?? '') . ',' . ($msg['location']['longitude'] ?? '') . ']',
            'reaction' => '[Reaction: ' . ($msg['reaction']['emoji'] ?? '') . ']',
            default => '[' . ucfirst($type) . ' Message]',
        };

        if (Message::where('whatsapp_message_id', $waId)->exists()) return;

        $contact = $this->findOrCreateContact($integration->user_id, $phone, $pushName);

        $conversation = Conversation::firstOrCreate([
            'user_id' => $integration->user_id,
            'contact_id' => $contact->id,
        ]);

        DB::transaction(function () use ($conversation, $waId, $content, $integration, $phone) {
            Message::create([
                'conversation_id' => $conversation->id,
                'whatsapp_message_id' => $waId,
                'sender' => 'contact',
                'content' => $content,
                'status' => 'delivered',
            ]);

            $conversation->update([
                'last_message_at' => now(),
                'unread_count' => $conversation->unread_count + 1,
            ]);

            // Auto-reply if bot is active
            $integration->load('user');
            if ($integration->user->bot_active) {
                ProcessAutoReplyJob::dispatch($integration, $conversation, $content, $phone);
            }

            // Mark as read on Meta side
            WhatsAppService::markAsReadMeta($integration, $waId);
        });
    }

    protected function handleMetaStatusUpdate(array $statusUpdate): void
    {
        $waId = $statusUpdate['id'] ?? null;
        $status = $statusUpdate['status'] ?? null;

        if (!$waId || !$status) return;

        $message = Message::where('whatsapp_message_id', $waId)->first();
        if (!$message) return;

        $statusMap = [
            'sent' => 'sent',
            'delivered' => 'delivered',
            'read' => 'read',
            'failed' => 'failed',
        ];

        $newStatus = $statusMap[$status] ?? $message->status;

        $updateData = ['status' => $newStatus];
        if ($newStatus === 'delivered' && !$message->delivered_at) $updateData['delivered_at'] = now();
        if ($newStatus === 'read' && !$message->read_at) $updateData['read_at'] = now();

        $message->update($updateData);
    }

    // ─── Shared Helpers ─────────────────────────────────────────────

    protected function findOrCreateContact(int $userId, string $phone, string $name): Contact
    {
        $contact = Contact::where('user_id', $userId)
            ->where('phone_number', $phone)
            ->first();

        if (!$contact) {
            $suffix = substr($phone, -10);
            $contact = Contact::where('user_id', $userId)
                ->where('phone_number', 'like', '%' . $suffix)
                ->first();

            if ($contact) {
                $contact->update(['phone_number' => $phone]);
            } else {
                $contact = Contact::create([
                    'user_id' => $userId,
                    'name' => $name,
                    'phone_number' => $phone,
                ]);
            }
        }

        return $contact;
    }

    protected function decryptMedia(array $mediaData, string $mediaType, string $waId): ?string
    {
        Log::info("Starting decryption for {$mediaType}", ['url' => $mediaData['url'] ?? 'none', 'waId' => $waId]);
        try {
            $url = $mediaData['url'] ?? null;
            $mediaKey = $mediaData['mediaKey'] ?? null;

            if (!$url || !$mediaKey) {
                Log::warning("Missing URL or mediaKey for media decryption", ['mediaData' => $mediaData]);
                return null;
            }

            // 1. Download encrypted data
            Log::info("Downloading encrypted media from: {$url}");
            $response = Http::timeout(30)->get($url);
            if (!$response->successful()) {
                Log::error("Failed to download media: " . $url . " | Status: " . $response->status());
                return null;
            }
            $encryptedData = $response->body();

            // 2. Derive keys
            $info = match ($mediaType) {
                'image', 'sticker' => 'WhatsApp Image Keys',
                'video'           => 'WhatsApp Video Keys',
                'audio'           => 'WhatsApp Audio Keys',
                'document'        => 'WhatsApp Document Keys',
                default           => null,
            };
            
            if (!$info) return null;

            $mediaKeyDecoded = base64_decode($mediaKey);
            Log::info("Deriving keys for info: {$info}");
            $keys = hash_hkdf('sha256', $mediaKeyDecoded, 112, $info, '');
            
            $iv = substr($keys, 0, 16);
            $cipherKey = substr($keys, 16, 32);
            $ciphertext = substr($encryptedData, 0, -10);

            // 3. Decrypt
            Log::info("Decrypting ciphertext (length: " . strlen($ciphertext) . ")");
            $decryptedData = openssl_decrypt($ciphertext, 'aes-256-cbc', $cipherKey, OPENSSL_RAW_DATA, $iv);
            if ($decryptedData === false) {
                Log::error("Failed to decrypt media (openssl_decrypt returned false) for ID: " . $waId . " | Error: " . openssl_error_string());
                return null;
            }

            // 4. Determine path and extension
            $mimeType = $mediaData['mimetype'] ?? 'application/octet-stream';
            $extension = explode('/', $mimeType)[1] ?? 'bin';
            if (strpos($extension, ';') !== false) $extension = explode(';', $extension)[0];
            
            // Cleanup extension (e.g. image/jpeg -> jpeg)
            $extension = preg_replace('/[^a-zA-Z0-9]/', '', $extension);
            
            $filename = ($mediaData['fileName'] ?? $waId);
            // Ensure no duplicate extension
            if (!str_ends_with(strtolower($filename), '.' . strtolower($extension))) {
                $filename .= '.' . $extension;
            }
            
            $path = "media/" . basename($filename);

            // 5. Store
            Log::info("Storing decrypted media to: {$path}");
            Storage::disk('public')->put($path, $decryptedData);

            $storedUrl = Storage::url($path);
            Log::info("Media stored successfully. Public URL: {$storedUrl}");

            return $storedUrl;
        } catch (\Exception $e) {
            Log::error("Media Decryption Error: " . $e->getMessage());
            return null;
        }
    }
}
