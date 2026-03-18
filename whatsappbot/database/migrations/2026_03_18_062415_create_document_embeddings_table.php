<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Ensure pgvector extension is available
        DB::statement('CREATE EXTENSION IF NOT EXISTS vector;');

        Schema::create('document_embeddings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('document_name');
            $table->string('chunk_id')->nullable();
            $table->text('content');
            $table->json('metadata')->nullable();
            $table->timestamps();
        });

        // Add the pgvector column (assuming OpenAI default string length of 1536)
        DB::statement('ALTER TABLE document_embeddings ADD COLUMN embedding vector(1536);');
        
        // Add HNSW index for fast similarity search
        DB::statement('CREATE INDEX document_embeddings_embedding_index ON document_embeddings USING hnsw (embedding vector_l2_ops);');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('document_embeddings');
    }
};
