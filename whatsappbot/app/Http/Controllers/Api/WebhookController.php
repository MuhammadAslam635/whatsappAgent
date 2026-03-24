<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Integration;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\Contact;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use App\Jobs\ProcessAutoReplyJob;
use Illuminate\Support\Facades\Storage;



class WebhookController extends Controller
{
    public function handleWaSender(Request $request, $integration_id): \Illuminate\Http\JsonResponse
    {
        $integration = Integration::findOrFail($integration_id);
        
        $payload = $request->all();
        Log::info("RAW WEBHOOK PAYLOAD: " . json_encode($payload));
        $event = $payload['event'] ?? null;
        $data = $payload['data'] ?? [];


        Log::info("Webhook Event: {$event}", ['data' => $data]);
        
        // Ensure version increments for the conversation list 
        $userId = $integration->user_id;
        $listKey = "conv_list_version_{$userId}";
        \Illuminate\Support\Facades\Cache::forever($listKey, (int)\Illuminate\Support\Facades\Cache::get($listKey, 0) + 1);


        switch ($event) {
            case 'messages.upsert':
            case 'message-received':
            case 'message-upsert':
                $payloadData = $data['messages'] ?? $data;
                $this->handleIncomingMessage($integration, $payloadData);
                break;


            
            case 'messages.update':
            case 'message-status-update':
            case 'message-update':
                $this->handleMessageStatusUpdate($data);
                break;
        }

        return response()->json(['status' => 'success']);
    }

    protected function handleIncomingMessage(Integration $integration, $data)
    {
        Log::info("handleIncomingMessage called with data type: " . gettype($data));
        // If data is an array of messages (upsert usually is), take the first one or loop
        $messages = isset($data['key']) ? [$data] : $data;
        Log::info("Processing " . count($messages) . " messages");
        
        foreach ($messages as $msgData) {
            $remoteJid = $msgData['key']['remoteJid'] ?? null;
            $senderLid = $msgData['key']['senderLid'] ?? null;
            $cleanedPn = $msgData['key']['cleanedSenderPn'] ?? null;
            
            if (!$remoteJid) {
                Log::warning("Skipping message: remoteJid is missing", ['msg_data' => $msgData]);
                continue;
            }


            $phone = null;

            // 1. Try cleanedSenderPn first (standardized number like "5551234567")
            if ($cleanedPn) {
                $phone = (string) phone($cleanedPn, 'AUTO')->formatE164();
            } 
            // 2. Try remoteJid (e.g. 123456789@s.whatsapp.net or 123456789@lid)
            else {
                $phoneRaw = explode('@', $remoteJid)[0];
                $phone = (string) phone($phoneRaw, 'AUTO')->formatE164();
            }

            if (!$phone) continue;
            $fromMe = $msgData['key']['fromMe'] ?? false;
            $userId = $integration->user_id;

            // 1. Find or create contact with Cache
            $contactCacheKey = "contact_lookup_{$userId}_{$phone}";
            $contact = Cache::remember($contactCacheKey, now()->addHours(1), function () use ($userId, $phone, $msgData) {
                $found = Contact::where('user_id', $userId)
                    ->where('phone_number', $phone)
                    ->first();

                if (!$found) {
                    $suffix = substr($phone, -10);
                    $found = Contact::where('user_id', $userId)
                        ->where('phone_number', 'like', '%' . $suffix)
                        ->first();
                    
                    if ($found) {
                        $found->update(['phone_number' => $phone]);
                    } else {
                        $found = Contact::create([
                            'user_id' => $userId,
                            'name' => $msgData['pushName'] ?? $phone,
                            'phone_number' => $phone,
                        ]);
                    }
                }
                return $found;
            });

            // 2. Find or create conversation with Cache
            $convCacheKey = "conv_lookup_{$userId}_{$contact->id}";
            $conversation = Cache::remember($convCacheKey, now()->addHours(1), function () use ($userId, $contact) {
                return Conversation::firstOrCreate([
                    'user_id' => $userId,
                    'contact_id' => $contact->id,
                ]);
            });


            $waId = $msgData['key']['id'];
            $content = $msgData['message']['conversation'] ?? 
                       $msgData['message']['extendedTextMessage']['text'] ?? 
                       null;

            
            $type = 'text';
            $mediaUrl = null;
            $caption = null;

            if (isset($msgData['message'])) {
                $m = $msgData['message'];
                
                // Handle viewOnceMessage wrap
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

                Log::info("Message details: from=" . $phone . ", type=" . $type . ", mediaUrl=" . ($mediaUrl ?: 'none'));

            }

            // If it's media and we have a caption, use it as content
            // Otherwise if it's media and no content, use fallback
            if ($type !== 'text') {
                $content = $caption ?: ($content ?: '[Media Message]');
            } else {
                $content = $content ?: '[Unsupported Message]';
            }

            // Store message if it doesn't exist
            $waId = $msgData['key']['id'] ?? null;
            $trimmedContent = trim($content);
            
            file_put_contents('php://stderr', "\n📢 [WEBHOOK] Message: {$waId} | Type: {$type} | fromMe: " . ($fromMe ? 'True' : 'False') . "\n");

            // PREVENT DUPLICATION: If this is an outgoing message (fromMe), 
            // check if we already have a pending/sent message with same content in this conversation
            if ($fromMe) {
                // Find recent message from this user to this contact with similar content
                $existingMessage = Message::where('conversation_id', $conversation->id)
                    ->where('sender', 'user')
                    ->where(function($q) use ($trimmedContent) {
                        $q->where('content', $trimmedContent)
                          ->orWhere('content', 'like', $trimmedContent . '%');
                    })
                    ->where('created_at', '>=', now()->subMinutes(5))
                    ->orderByDesc('id')
                    ->first();

                if ($existingMessage) {
                    $existingMessage->update([
                        'whatsapp_message_id' => $waId,
                        'status' => 'delivered',
                        'type' => $type,
                        'media_url' => $mediaUrl,
                        'caption' => $caption
                    ]);
                    error_log("✨ [MERGED] Matched local record ID: {$existingMessage->id}");
                    continue;
                }
            }

            $message = Message::where('whatsapp_message_id', $waId)->first();
            if (!$message) {
                DB::transaction(function () use ($conversation, $waId, $fromMe, $content, $integration, $phone, $type, $mediaUrl, $caption) {
                    $message = Message::create([
                        'conversation_id' => $conversation->id,
                        'whatsapp_message_id' => $waId,
                        'sender' => $fromMe ? 'user' : 'contact',
                        'content' => $content,
                        'type' => $type,
                        'media_url' => $mediaUrl,
                        'caption' => $caption,
                        'status' => 'delivered',
                    ]);

                    error_log("📝 [NEW] Created " . ($fromMe ? "OUTGOING" : "INCOMING") . " record: {$waId}");
                    
                    $updates = ['last_message_at' => now()];
                    if (!$fromMe) $updates['unread_count'] = $conversation->unread_count + 1;
                    $conversation->update($updates);

                    if (!$fromMe && $integration->user->bot_active) {
                        ProcessAutoReplyJob::dispatch($integration, $conversation, $content, $phone);
                    }
                });
            } else if ($mediaUrl && !$message->media_url) {
                // Update media_url if it was missing
                $message->update([
                    'media_url' => $mediaUrl,
                    'type' => $type,
                    'caption' => $caption ?: $message->caption
                ]);
                error_log("🔄 [UPDATE] Populated missing media_url for record: {$waId}");
            }


        }
    }

    protected function handleMessageStatusUpdate($data): void
    {
        // Handle both single update and array of updates
        $updates = isset($data['key']) ? [$data] : (isset($data['update']) ? [$data] : $data);

        foreach ($updates as $update) {
            // Some webhooks put the actual update inside an 'update' key
            $actualUpdate = $update['update'] ?? $update;
            $msgId = $update['key']['id'] ?? $actualUpdate['key']['id'] ?? null;
            $status = $actualUpdate['status'] ?? null;

            if (!$msgId || $status === null) {
                file_put_contents('php://stderr', "⚠️ [STATUS SKIP] No ID or status found\n");
                continue;
            }

            $message = Message::where('whatsapp_message_id', $msgId)->first();
            if (!$message) {
                Log::warning('Webhook: Message not found for status update', ['msgId' => $msgId]);
                continue;
            }

            // Wasender Status Codes:
            // 0: ERROR, 1: PENDING, 2: SENT, 3: DELIVERED, 4: READ, 5: PLAYED
            $statusMap = [
                0 => 'failed',
                1 => 'pending',
                2 => 'sent',
                3 => 'delivered',
                4 => 'read',
                5 => 'read', // played is read
            ];

            $newStatus = $statusMap[$status] ?? $message->status;
            
            error_log("📊 [STATUS] {$msgId} -> " . strtoupper($newStatus));

            $updateData = ['status' => $newStatus];
            if ($newStatus === 'delivered' && !$message->delivered_at) $updateData['delivered_at'] = now();
            if ($newStatus === 'read' && !$message->read_at) $updateData['read_at'] = now();

            $message->update($updateData);
        }
    }

    public function handleMeta(Request $request, $integration_id)

    {
        $integration = Integration::findOrFail($integration_id);

        if ($request->isMethod('get')) {
            $mode = $request->query('hub_mode');
            $token = $request->query('hub_verify_token');
            $challenge = $request->query('hub_challenge');

            if ($mode === 'subscribe' && $token === $integration->webhook_secret) {
                return response($challenge, 200);
            }

            return response('Forbidden', 403);
        }

        // POST: Handle incoming messages
        $payload = $request->all();
        Log::info('Meta Webhook Received', ['payload' => $payload]);

        // Meta payload structure: entry -> changes -> value -> messages
        if (isset($payload['entry'][0]['changes'][0]['value']['messages'][0])) {
            $this->handleMetaIncomingMessage($integration, $payload['entry'][0]['changes'][0]['value']);
        }

        return response()->json(['status' => 'success']);
    }

    protected function handleMetaIncomingMessage(Integration $integration, $value)
    {
        $msgData = $value['messages'][0];
        $from = '+' . $msgData['from'];
        $waId = $msgData['id'];
        $userId = $integration->user_id;

        // 1. Find or create contact with Cache
        $contactCacheKey = "contact_lookup_{$userId}_{$from}";
        $contact = Cache::remember($contactCacheKey, now()->addHours(1), function () use ($userId, $from, $value) {
            $found = Contact::where('user_id', $userId)
                ->where('phone_number', $from)
                ->first();

            if (!$found) {
                $found = Contact::create([
                    'user_id' => $userId,
                    'name' => $value['contacts'][0]['profile']['name'] ?? $from,
                    'phone_number' => $from,
                ]);
            }
            return $found;
        });

        // 2. Find or create conversation with Cache
        $convCacheKey = "conv_lookup_{$userId}_{$contact->id}";
        $conversation = Cache::remember($convCacheKey, now()->addHours(1), function () use ($userId, $contact) {
            return Conversation::firstOrCreate([
                'user_id' => $userId,
                'contact_id' => $contact->id,
            ]);
        });


        $type = $msgData['type'] ?? 'text';
        $content = '';
        $mediaUrl = null;
        $caption = null;

        if ($type === 'text') {
            $content = $msgData['text']['body'] ?? '';
        } else {
            // Media handling for Meta (requires extra API call to get URL)
            // For now, store the ID in media_url as a placeholder
            $mediaId = $msgData[$type]['id'] ?? null;
            $caption = $msgData[$type]['caption'] ?? null;
            $mediaUrl = "https://graph.facebook.com/v17.0/{$mediaId}"; // Partial URL
            $content = $caption ?: "[Meta Media: {$type}]";
        }

        if (!Message::where('whatsapp_message_id', $waId)->exists()) {
            DB::transaction(function () use ($conversation, $waId, $content, $integration, $from, $type, $mediaUrl, $caption) {
                $conversation->messages()->create([
                    'whatsapp_message_id' => $waId,
                    'sender' => 'contact',
                    'content' => $content,
                    'type' => $type,
                    'media_url' => $mediaUrl,
                    'caption' => $caption,
                    'status' => 'delivered',
                ]);

                $conversation->update([
                    'last_message_at' => now(),
                    'unread_count' => $conversation->unread_count + 1
                ]);

                if ($integration->user->bot_active) {
                    ProcessAutoReplyJob::dispatch($integration, $conversation, $content, $from);
                }
            });
        }
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


