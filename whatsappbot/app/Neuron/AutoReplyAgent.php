<?php

namespace App\Neuron;

use NeuronAI\Agent\Agent;
use NeuronAI\Agent\SystemPrompt;
use NeuronAI\Providers\OpenAI\OpenAI;
use NeuronAI\Providers\AIProviderInterface;

class AutoReplyAgent extends Agent
{
    protected string $context;
    protected string $customPrompt;

    public function __construct(string $context, string $customPrompt = '')
    {
        $this->context = $context;
        $this->customPrompt = $customPrompt;
        parent::__construct();
    }

    protected function provider(): AIProviderInterface
    {
        $apiKey = env('OPENAI_API_KEY');
        if (empty($apiKey)) {
            throw new \Exception("OPENAI_API_KEY is not set.");
        }

        return new OpenAI(
            key: $apiKey,
            model: 'gpt-4o-mini',
        );
    }

    protected function instructions(): string
    {
        $background = [
            "You are an AI customer support bot responding to WhatsApp messages.",
            "Always be helpful, concise, and polite.",
            "Use the provided Knowledge Base context to answer questions.",
        ];

        if (!empty($this->customPrompt)) {
            $background[] = "USER CUSTOM INSTRUCTIONS: " . $this->customPrompt;
        }

        $background[] = "KNOWLEDGE BASE CONTEXT:\n" . $this->context;

        return (string) new SystemPrompt(
            background: $background,
            steps: [
                "Read the unread user query.",
                "Find the answer in the Knowledge Base context.",
                "If the answer is not in the context, politely state that you do not know."
            ],
            output: [
                "ABSOLUTELY NO MARKDOWN. Do NOT use asterisks (*) for bolding. Do NOT use hashtags (#) for headers. Do NOT use underscores (_).",
                "WhatsApp ONLY supports plain text. Make the response look clean without any formatting symbols.",
                "Keep the response brief and conversational."
            ]
        );
    }

    protected function tools(): array
    {
        return [];
    }
}
