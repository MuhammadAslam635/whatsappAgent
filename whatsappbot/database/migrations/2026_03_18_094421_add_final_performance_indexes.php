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
        Schema::table('messages', function (Blueprint $table) {
            $table->index('conversation_id');
            $table->index('sender');
        });

        Schema::table('contacts', function (Blueprint $table) {
            $table->index('phone_number');
            $table->index('user_id');
        });

        Schema::table('conversations', function (Blueprint $table) {
            $table->index(['user_id', 'contact_id']);
        });

        Schema::table('integrations', function (Blueprint $table) {
            $table->index('user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->dropIndex(['conversation_id']);
            $table->dropIndex(['sender']);
        });

        Schema::table('contacts', function (Blueprint $table) {
            $table->dropIndex(['phone_number']);
            $table->dropIndex(['user_id']);
        });

        Schema::table('conversations', function (Blueprint $table) {
            $table->dropIndex(['user_id', 'contact_id']);
        });

        Schema::table('integrations', function (Blueprint $table) {
            $table->dropIndex(['user_id']);
        });
    }
};
