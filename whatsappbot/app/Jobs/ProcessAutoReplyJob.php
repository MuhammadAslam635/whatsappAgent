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
     * The number of times the job may be attempted.
     *
     * @var int
     */
    public $tries = 5;

    /**
     * The number of seconds to wait before retrying the job.
     *
     * @var int
     */
    public $backoff = [60, 120, 240, 480]; // Wait 1m, 2m, 4m, 8m on failure

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
            } elseif ($response->status() === 429) {
                Log::warning("[JOB RATE LIMIT] Wasender rate limit hit. Retrying...", ['body' => $response->body()]);
                throw new \Exception("Wasender Rate Limit: " . $response->json('message', 'Too many requests'));
            } else {
                Log::error("[JOB ERROR] Wasender failed", ['body' => $response->body()]);
                // For other errors, we might not want to retry, but let's just log it.
            }
        } catch (\Exception $e) {
            // If it's a rate limit from OpenAI, rethrow to trigger queue retry
            if (str_contains($e->getMessage(), 'rate limit') || str_contains($e->getMessage(), 'Rate limit')) {
                Log::warning("[JOB RATE LIMIT] OpenAI rate limit hit. Retrying...", ['msg' => $e->getMessage()]);
                throw $e;
            }

            Log::error("[JOB EXCEPTION] " . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            // Re-throw so the job is marked as failed and can be retried if it's potentially transient
            throw $e;
        }
    }

}
