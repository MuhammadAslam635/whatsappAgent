<?php

namespace App\Jobs;

use App\Models\Conversation;
use App\Models\Integration;
use App\Models\Message;
use App\Neuron\AutoReplyAgent;
use App\Services\RAGService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use NeuronAI\Chat\Messages\UserMessage;

class ProcessAutoReplyJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $integration;
    public $conversation;
    public $content;
    public $phone;

    /**
     * Create a new job instance.
     */
    public function __construct(Integration $integration, Conversation $conversation, string $content, string $phone)
    {
        $this->integration = $integration;
        $this->conversation = $conversation;
        $this->content = $content;
        $this->phone = $phone;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $integration = $this->integration;
        $conversation = $this->conversation;
        $content = $this->content;
        $phone = $this->phone;

        // Ensure user is loaded
        $integration->load('user');

        try {
            Log::info("[JOB] Starting AI reply generation", ['phone' => $phone]);
            
            // 1. Get Context from Vector DB
            $ragService = app(RAGService::class);
            $searchResults = $ragService->similaritySearch($content, $integration->user_id);
            
            $contextStr = "";
            foreach ($searchResults as $hit) {
                $contextStr .= "Document: {$hit->document_name}\nContent: {$hit->content}\n\n";
            }
            Log::info("[JOB SEARCH] Found " . count($searchResults) . " context matches.");

            // 2. Instantiate Neuron AI Agent
            $customPrompt = $integration->user->bot_system_prompt ?? '';
            $agent = new AutoReplyAgent($contextStr, $customPrompt);
            
            // 3. Generate Answer
            $agentHandler = $agent->chat(new UserMessage($content));
            $replyMessage = $agentHandler->getMessage();
            $replyText = $replyMessage->getContent();
            
            // Strip markdown
            $replyText = preg_replace('/[\*#_~`\[\]]/', '', $replyText);

            Log::info("[JOB GENERATED] AI Reply generated successfully.");

            // 4. Send Message via Wasender API
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $integration->api_key,
                'Accept' => 'application/json',
            ])->post("https://api.wasenderapi.com/api/send-message", [
                'to' => $phone,
                'text' => $replyText
            ]);

            if ($response->successful()) {
                Log::info("[JOB SENT] AI Message successfully dispatched via Wasender.");
                
                // Store bot reply
                Message::create([
                    'conversation_id' => $conversation->id,
                    'whatsapp_message_id' => 'bot_' . uniqid(),
                    'sender' => 'user', 
                    'content' => $replyText,
                    'status' => 'sent',
                ]);
            } else {
                Log::error("[JOB ERROR] Wasender failed", ['body' => $response->body()]);
            }
        } catch (\Exception $e) {
            Log::error("[JOB EXCEPTION] " . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
        }
    }
}
