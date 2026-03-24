<?php

namespace App\Jobs;

use App\Models\Contact;
use App\Models\Conversation;
use App\Models\Integration;
use App\Models\Message;
use App\Services\WhatsAppService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SendBulkMessageJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $integration;
    public $contact;
    public $content;

    public function __construct(Integration $integration, Contact $contact, string $content)
    {
        $this->integration = $integration;
        $this->contact = $contact;
        $this->content = $content;
    }

    public function handle(): void
    {
        $conversation = Conversation::firstOrCreate([
            'user_id' => $this->integration->user_id,
            'contact_id' => $this->contact->id,
        ]);

        $message = Message::create([
            'conversation_id' => $conversation->id,
            'sender' => 'user',
            'content' => $this->content,
            'status' => 'pending',
        ]);

        $result = WhatsAppService::sendMessage($this->integration, $this->contact->phone_number, $this->content);

        if ($result['success']) {
            $message->update([
                'whatsapp_message_id' => $result['message_id'],
                'status' => 'sent',
            ]);
            $conversation->update(['last_message_at' => now()]);
        } else {
            $message->update(['status' => 'failed']);
            Log::error("Bulk send failed for contact {$this->contact->id}: " . $result['error']);
        }
    }
}
