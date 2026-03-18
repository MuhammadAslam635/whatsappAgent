<?php

namespace App\Jobs;

use App\Models\Contact;
use App\Models\Conversation;
use App\Models\Integration;
use App\Models\Message;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SendBulkMessageJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $integration;
    public $contact;
    public $content;

    /**
     * Create a new job instance.
     */
    public function __construct(Integration $integration, Contact $contact, string $content)
    {
        $this->integration = $integration;
        $this->contact = $contact;
        $this->content = $content;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $integration = $this->integration;
        $contact = $this->contact;
        $content = $this->content;

        // 1. Find or create conversation
        $conversation = Conversation::firstOrCreate([
            'user_id' => $integration->user_id,
            'contact_id' => $contact->id,
        ]);

        // 2. Create local message record
        $message = Message::create([
            'conversation_id' => $conversation->id,
            'sender' => 'user',
            'content' => $content,
            'status' => 'pending',
        ]);

        try {
            // 3. Send via Wasender API
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $integration->api_key,
                'Accept' => 'application/json',
            ])->post("https://api.wasenderapi.com/api/send-message", [
                'to' => $contact->phone_number,
                'text' => $content
            ]);

            if ($response->successful()) {
                $data = $response->json();
                $waId = $data['data']['msgId'] ?? null;
                
                $message->update([
                    'whatsapp_message_id' => $waId,
                    'status' => 'sent'
                ]);
                $conversation->update(['last_message_at' => now()]);
            } else {
                $message->update(['status' => 'failed']);
                Log::error("Bulk send failed for contact {$contact->id}: " . $response->body());
            }
        } catch (\Exception $e) {
            $message->update(['status' => 'failed']);
            Log::error("Bulk send exception for contact {$contact->id}: " . $e->getMessage());
        }
    }
}
