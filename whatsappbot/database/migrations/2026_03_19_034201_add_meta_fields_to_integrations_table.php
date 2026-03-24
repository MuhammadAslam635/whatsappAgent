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
        Schema::table('integrations', function (Blueprint $table) {
            $table->string('app_id')->after('api_key')->nullable()->index();
            $table->string('phone_number_id')->after('app_id')->nullable()->index();
            $table->string('waba_id')->after('phone_number_id')->nullable()->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('integrations', function (Blueprint $table) {
            $table->dropColumn(['app_id', 'phone_number_id', 'waba_id']);
        });
    }

};
