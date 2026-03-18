<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('integrations', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id')->constrained("users");
            $table->enum('type', ['wa_sender', 'meta'])->default('wa_sender');
            $table->string('phone_number')->nullable()->unique();
            $table->string('webhook_secret')->nullable()->unique();
            $table->string('webhook_url')->nullable()->unique();
            $table->string('api_key');
            $table->string('secret_key');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('integrations');
    }
};
