<?php

namespace App\Services;

use Smalot\PdfParser\Parser;
use OpenAI\Client;
use OpenAI;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class RAGService
{
    protected Client $client;

    public function __construct()
    {
        // Require OPENAI_API_KEY in .env
        $apiKey = env('OPENAI_API_KEY', '');
        if (empty($apiKey)) {
            throw new \Exception("OPENAI_API_KEY is not set.");
        }
        $this->client = OpenAI::client($apiKey);
    }

    /**
     * Parse PDF, chunk it, embed it, and store in DB.
     */
    public function processUpload($file, $userId)
    {
        // 1. Parse PDF text
        $parser = new Parser();
        $pdf = $parser->parseFile($file->getRealPath());
        $text = $pdf->getText();

        $originalName = $file->getClientOriginalName();

        // 2. Chunk the text
        $chunks = $this->chunkText($text, 1000, 200);

        // 3. Generate Embeddings & Store in pgvector
        foreach ($chunks as $index => $chunk) {
            $chunk = trim($chunk);
            if (empty($chunk)) continue;

            $embedding = $this->getEmbedding($chunk);

            // Convert array of floats to Postgres vector literal format: [0.1, 0.2, ...]
            $vectorLiteral = '[' . implode(',', $embedding) . ']';
            
            // Generate deterministic chunk ID
            $chunkId = Str::random(10) . '_' . $index;

            DB::table('document_embeddings')->insert([
                'user_id' => $userId,
                'document_name' => $originalName,
                'chunk_id' => $chunkId,
                'content' => $chunk,
                'embedding' => $vectorLiteral,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        return [
            'success' => true,
            'document' => $originalName,
            'chunks_processed' => count($chunks)
        ];
    }

    /**
     * Get OpenAI Embedding for a string.
     */
    public function getEmbedding(string $text): array
    {
        $response = $this->client->embeddings()->create([
            'model' => 'text-embedding-3-small',
            'input' => $text,
        ]);

        return $response->embeddings[0]->embedding;
    }

    /**
     * Basic Text Splitter (by character length with overlap).
     */
    private function chunkText(string $text, int $chunkSize = 1000, int $overlap = 200): array
    {
        $chunks = [];
        $length = mb_strlen($text);
        $start = 0;

        while ($start < $length) {
            $chunks[] = mb_substr($text, $start, $chunkSize);
            $start += $chunkSize - $overlap;
        }

        return $chunks;
    }

    /**
     * Perform Similarity Search using pgvector.
     */
    public function similaritySearch(string $query, int $userId, int $limit = 3): array
    {
        $queryEmbedding = $this->getEmbedding($query);
        $vectorLiteral = '[' . implode(',', $queryEmbedding) . ']';

        // L2 distance operator: <->
        $results = DB::select(
            "SELECT content, document_name, embedding <-> ?::vector AS distance 
             FROM document_embeddings 
             WHERE user_id = ? 
             ORDER BY distance ASC 
             LIMIT ?",
            [$vectorLiteral, $userId, $limit]
        );

        return $results;
    }
}
