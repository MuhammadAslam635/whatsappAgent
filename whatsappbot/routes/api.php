<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\IntegrationController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\WebhookController;
use App\Http\Controllers\Api\DocumentController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);

    // User Management
    Route::apiResource('users', UserController::class);
    Route::post('user/bot-settings', [UserController::class, 'updateBotSettings']);
    Route::get('user/bot-settings', [UserController::class, 'getBotSettings']);
    
    // Integrations
    Route::apiResource('integrations', IntegrationController::class);

    // Dashboard Stats
    Route::get('dashboard/stats', [\App\Http\Controllers\Api\DashboardController::class, 'stats']);

    // Contacts
    Route::post('contacts/bulk', [\App\Http\Controllers\Api\ContactController::class, 'bulkStore']);
    Route::delete('contacts/bulk', [\App\Http\Controllers\Api\ContactController::class, 'bulkDestroy']);
    Route::apiResource('contacts', \App\Http\Controllers\Api\ContactController::class);
    
    // Chat
    Route::get('conversations/unread', [\App\Http\Controllers\Api\ChatController::class, 'unreadConversations']);
    Route::get('conversations/unread-count', [\App\Http\Controllers\Api\ChatController::class, 'unreadCount']);


    Route::get('conversations', [\App\Http\Controllers\Api\ChatController::class, 'index']);

    Route::get('conversations/{conversation}/messages', [\App\Http\Controllers\Api\ChatController::class, 'show']);
    Route::post('conversations/{conversation}/read', [\App\Http\Controllers\Api\ChatController::class, 'markAsRead']);
    Route::delete('conversations/{conversation}/messages', [\App\Http\Controllers\Api\ChatController::class, 'clearMessages']);
    Route::delete('conversations/{conversation}', [\App\Http\Controllers\Api\ChatController::class, 'destroy']);
    Route::post('messages/send', [\App\Http\Controllers\Api\ChatController::class, 'sendMessage']);
    Route::post('messages/bulk-send', [\App\Http\Controllers\Api\ChatController::class, 'bulkSendMessage']);

    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // RAG Auto-Reply Documents
    Route::get('documents', [DocumentController::class, 'index']);
    Route::post('documents/upload', [DocumentController::class, 'upload']);
    Route::delete('documents/{name}', [DocumentController::class, 'destroy']);
});

// Webhooks
Route::post('webhooks/wasender/{integration}', [WebhookController::class, 'handleWaSender'])->name('webhooks.wasender');
Route::match(['get', 'post'], 'webhooks/meta/{integration}', [WebhookController::class, 'handleMeta'])->name('webhooks.meta');

