<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('knowledge_bases');
    }

    public function down(): void
    {
        Schema::create('knowledge_bases', function ($table) {
            $table->id();
            $table->unsignedBigInteger('user_id')->constrained('users');
            $table->string('file_name');
            $table->string('file_type');
            $table->text('content');
            $table->json('metadata')->nullable();
            $table->json('embedding')->nullable();
            $table->timestamps();
        });
    }
};
