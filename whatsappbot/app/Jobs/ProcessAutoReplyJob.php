<?php

namespace App\Jobs;

use App\Models\Conversation;
use App\Models\Integration;
use App\Models\Message;
use App\Neuron\AutoReplyAgent;
use App\Services\RAGService;
use App\Services\WhatsAppService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use NeuronAI\Chat\Messages\UserMessage;

class ProcessAutoReplyJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $integration;
    public $conversation;
    public $content;
    public $phone;

    public function __construct(Integration $integration, Conversation $conversation, string $content, string $phone)
    {
        $this->integration = $integration;
        $this->conversation = $conversation;
        $this->content = $content;
        $this->phone = $phone;
    }

    public function handle(): void
    {
        $this->integration->load('user');

        try {
            Log::info("[JOB] Starting AI reply generation", ['phone' => $this->phone]);

            $ragService = app(RAGService::class);
            $searchResults = $ragService->similaritySearch($this->content, $this->integration->user_id);

            $contextStr = "";
            foreach ($searchResults as $hit) {
                $contextStr .= "Document: {$hit->document_name}\nContent: {$hit->content}\n\n";
            }

            $customPrompt = $this->integration->user->bot_system_prompt ?? '';
            $agent = new AutoReplyAgent($contextStr, $customPrompt);

            $agentHandler = $agent->chat(new UserMessage($this->content));
            $replyText = $agentHandler->getMessage()->getContent();
            $replyText = preg_replace('/[\*#_~`\[\]]/', '', $replyText);

            Log::info("[JOB GENERATED] AI Reply generated successfully.");

            $result = WhatsAppService::sendMessage($this->integration, $this->phone, $replyText);

            if ($result['success']) {
                Log::info("[JOB SENT] AI Message dispatched successfully.");
                Message::create([
                    'conversation_id' => $this->conversation->id,
                    'whatsapp_message_id' => $result['message_id'] ?? ('bot_' . uniqid()),
                    'sender' => 'user',
                    'content' => $replyText,
                    'status' => 'sent',
                ]);
            } else {
                Log::error("[JOB ERROR] Send failed", ['error' => $result['error']]);
            }
        } catch (\Exception $e) {
            Log::error("[JOB EXCEPTION] " . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
        }
    }
}
