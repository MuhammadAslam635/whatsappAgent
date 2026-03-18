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
use App\Jobs\ProcessAutoReplyJob;

class WebhookController extends Controller
{
    public function handleWaSender(Request $request, $integration_id): \Illuminate\Http\JsonResponse
    {
        $integration = Integration::findOrFail($integration_id);
        
        $payload = $request->all();
        $event = $payload['event'] ?? null;
        $data = $payload['data'] ?? [];

        Log::info("Webhook Event: {$event}", ['data' => $data]);

        switch ($event) {
            case 'messages.upsert':
            case 'message-received':
            case 'message-upsert':
                $this->handleIncomingMessage($integration, $data);
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
        // If data is an array of messages (upsert usually is), take the first one or loop
        $messages = isset($data['key']) ? [$data] : $data;
        
        foreach ($messages as $msgData) {
            file_put_contents(storage_path('logs/webhook_debug.log'), "📢 [DEBUG MSG DATA] " . json_encode($msgData) . "\n", FILE_APPEND);
            // Extract phone number from JID or cleanedSenderPn
            $remoteJid = $msgData['key']['remoteJid'] ?? null;
            $senderLid = $msgData['key']['senderLid'] ?? null;
            $cleanedPn = $msgData['key']['cleanedSenderPn'] ?? null;
            
            if (!$remoteJid) continue;

            $phone = null;

            // 1. Try cleanedSenderPn first (standardized number like "5551234567")
            if ($cleanedPn) {
                $phone = '+' . preg_replace('/[^0-9]/', '', $cleanedPn);
            } 
            // 2. Try remoteJid (e.g. 123456789@s.whatsapp.net or 123456789@lid)
            else {
                $phoneRaw = explode('@', $remoteJid)[0];
                $phone = '+' . preg_replace('/[^0-9]/', '', $phoneRaw);
            }

            if (!$phone) continue;
            $fromMe = $msgData['key']['fromMe'] ?? false;
            
            // Find or create contact using standardized phone number
            $contact = Contact::where('user_id', $integration->user_id)
                ->where('phone_number', $phone)
                ->first();

            if (!$contact) {
                // LAST RESORT: Search for contact by last 10 digits (Suffix Match)
                // This covers +92..., 92..., 03... etc.
                $suffix = substr($phone, -10);
                $contact = Contact::where('user_id', $integration->user_id)
                    ->where('phone_number', 'like', '%' . $suffix)
                    ->first();
                
                if ($contact) {
                    // Standardize if found via suffix
                    $contact->update(['phone_number' => $phone]);
                } else {
                    $contact = Contact::create([
                        'user_id' => $integration->user_id,
                        'name' => $msgData['pushName'] ?? $phone,
                        'phone_number' => $phone,
                    ]);
                }
            }

            // Find or create conversation
            $conversation = Conversation::firstOrCreate([
                'user_id' => $integration->user_id,
                'contact_id' => $contact->id,
            ]);

            // Get content
            $content = $msgData['message']['conversation'] ?? 
                       $msgData['message']['extendedTextMessage']['text'] ?? 
                       '[Media Message]';

            // Store message if it doesn't exist
            $waId = $msgData['key']['id'] ?? null;
            $trimmedContent = trim($content);
            
            file_put_contents('php://stderr', "\n📢 [WEBHOOK] Message: {$waId} | fromMe: " . ($fromMe ? 'True' : 'False') . "\n");

            // PREVENT DUPLICATION: If this is an outgoing message (fromMe), 
            // check if we already have a pending/sent message with same content in this conversation
            if ($fromMe) {
                // Find recent message from this user to this contact with similar content
                // IGNORE THE ID - we want to match by content+time because Wasender returns a different ID than the webhook sometimes
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
                        'status' => 'delivered'
                    ]);
                    error_log("✨ [MERGED] Matched local record ID: {$existingMessage->id}");
                    continue;
                }
                error_log("❓ [NEW OUTGOING] No local match for: " . substr($trimmedContent, 0, 15) . "...");
            }

            $exists = Message::where('whatsapp_message_id', $waId)->exists();
            if (!$exists) {
                DB::transaction(function () use ($conversation, $waId, $fromMe, $content, $integration, $phone) {
                    $message = Message::create([
                        'conversation_id' => $conversation->id,
                        'whatsapp_message_id' => $waId,
                        'sender' => $fromMe ? 'user' : 'contact',
                        'content' => $content,
                        'status' => 'delivered',
                    ]);

                    error_log("📝 [NEW] Created " . ($fromMe ? "OUTGOING" : "INCOMING") . " record: {$waId}");
                    
                    $updates = ['last_message_at' => now()];
                    if (!$fromMe) $updates['unread_count'] = $conversation->unread_count + 1;
                    $conversation->update($updates);

                    $integration->load('user');
                    error_log("🤖 [BOT CHECK] fromMe=".($fromMe?'true':'false').", bot_active=".($integration->user->bot_active?'true':'false'));
                    if (!$fromMe && $integration->user->bot_active) {
                        error_log("🤖 [BOT QUEUED] Dispatching reply job for: " . substr($content, 0, 30));
                        ProcessAutoReplyJob::dispatch($integration, $conversation, $content, $phone);
                    }
                });
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
}
