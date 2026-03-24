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
            } elseif (isset($result['status']) && $result['status'] === 429) { // Assuming WhatsAppService returns status for rate limit
                Log::warning("[JOB RATE LIMIT] WhatsAppService rate limit hit. Retrying...", ['body' => $result['error']]);
                throw new \Exception("WhatsAppService Rate Limit: " . ($result['error'] ?? 'Too many requests'));
            } else {
                Log::error("[JOB ERROR] Send failed", ['error' => $result['error']]);
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
