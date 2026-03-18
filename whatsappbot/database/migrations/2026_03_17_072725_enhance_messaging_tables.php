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
        Schema::table('conversations', function (Blueprint $table) {
            $table->timestamp('last_message_at')->nullable()->after('contact_id');
            $table->integer('unread_count')->default(0)->after('last_message_at');
        });

        Schema::table('messages', function (Blueprint $table) {
            $table->string('whatsapp_message_id')->nullable()->after('conversation_id')->index();
            $table->enum('status', ['pending', 'sent', 'delivered', 'read', 'failed'])->default('pending')->after('whatsapp_message_id');
            $table->timestamp('delivered_at')->nullable()->after('content');
            $table->timestamp('read_at')->nullable()->after('delivered_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('conversations', function (Blueprint $table) {
            $table->dropColumn(['last_message_at', 'unread_count']);
        });

        Schema::table('messages', function (Blueprint $table) {
            $table->dropColumn(['whatsapp_message_id', 'status', 'delivered_at', 'read_at']);
        });
    }
};
