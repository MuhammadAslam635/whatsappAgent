<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\Contact;
use App\Models\Integration;
use App\Jobs\SendBulkMessageJob;
use App\Services\WhatsAppService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class ChatController extends Controller
{
    public function unreadCount(Request $request): \Illuminate\Http\JsonResponse
    {
        $userId = $request->user()->id;
        $totalUnread = Conversation::where('user_id', $userId)->sum('unread_count');
        return response()->json(['unread_count' => (int)$totalUnread]);
    }

    public function unreadConversations(Request $request): \Illuminate\Http\JsonResponse
    {
        $userId = $request->user()->id;
        $conversations = Conversation::where('user_id', $userId)
            ->where('unread_count', '>', 0)
            ->with(['contact', 'messages' => function ($query) {
                $query->latest()->limit(1);
            }])
            ->orderByDesc('last_message_at')
            ->limit(5)
            ->get();

        return response()->json($conversations);
    }

    public function index(Request $request): \Illuminate\Http\JsonResponse
    {
        $userId = $request->user()->id;
        $page = $request->get('page', 1);
        
        // Use a version key to handle invalidation of all pages at once
        $versionKey = "conv_list_version_{$userId}";
        $version = \Illuminate\Support\Facades\Cache::get($versionKey, 1);
        $cacheKey = "user_conversations_{$userId}_v{$version}_page_{$page}";

        $conversations = \Illuminate\Support\Facades\Cache::remember($cacheKey, now()->addHours(1), function () use ($userId) {
            return Conversation::where('user_id', $userId)
                ->with(['contact', 'messages' => function ($query) {
                    $query->latest()->limit(1);
                }])
                ->orderByDesc('last_message_at')
                ->paginate(20);
        });

        return response()->json($conversations);
    }

    public function show(Conversation $conversation, Request $request): \Illuminate\Http\JsonResponse
    {
        if ($conversation->user_id !== $request->user()->id) {
            abort(403);
        }

        $page = $request->get('page', 1);
        $convId = $conversation->id;
        
        // Versioned key for message history
        $versionKey = "conv_msg_version_{$convId}";
        $version = \Illuminate\Support\Facades\Cache::get($versionKey, 1);
        $cacheKey = "conversation_messages_{$convId}_v{$version}_page_{$page}";

        $messages = \Illuminate\Support\Facades\Cache::remember($cacheKey, now()->addHours(1), function () use ($conversation) {
            return $conversation->messages()
                ->orderBy('created_at', 'asc')
                ->paginate(50);
        });

        return response()->json($messages);
    }


    public function markAsRead(Conversation $conversation, Request $request): \Illuminate\Http\JsonResponse
    {
        if ($conversation->user_id !== $request->user()->id) {
            abort(403);
        }

        $conversation->update(['unread_count' => 0]);
        $conversation->messages()->where('sender', 'contact')->update(['status' => 'read', 'read_at' => now()]);

        return response()->json(['message' => 'Conversation marked as read']);
    }

    public function sendMessage(Request $request): \Illuminate\Http\JsonResponse
    {
        $validated = $request->validate([
            'contact_id' => 'required|exists:contacts,id',
            'content' => 'nullable|string',
            'attachment' => 'nullable|file|max:10240',
        ]);

        $user = $request->user();
        $contact = Contact::findOrFail($validated['contact_id']);

        $attachmentPath = null;
        $type = 'text';
        $mediaUrl = null;
        
        if ($request->hasFile('attachment')) {
            $file = $request->file('attachment');
            $attachmentPath = $file->store('attachments', 'public');
            $mediaUrl = asset('storage/' . $attachmentPath);
            
            $mime = $file->getMimeType();
            if (str_starts_with($mime, 'image/')) $type = 'image';
            elseif (str_starts_with($mime, 'video/')) $type = 'video';
            elseif (str_starts_with($mime, 'audio/')) $type = 'audio';
            else $type = 'document';
        }

        $content = $validated['content'] ?? '';

        return DB::transaction(function () use ($user, $contact, $content, $attachmentPath, $type, $mediaUrl) {
            $conversation = Conversation::firstOrCreate([
                'user_id' => $user->id,
                'contact_id' => $contact->id,
            ]);

            $integration = Integration::where('user_id', $user->id)->first();

            if (!$integration) {
                return response()->json(['message' => 'No active WhatsApp integration found'], 400);
            }

            $displayContent = $attachmentPath
                ? ($content ? $content . " (📎 Attached: " . basename($attachmentPath) . ")" : "📎 Attached: " . basename($attachmentPath))
                : $content;

            $message = Message::create([
                'conversation_id' => $conversation->id,
                'sender' => 'user',
                'content' => $content ?: ($attachmentPath ? '[Media Message]' : ''),
                'type' => $type,
                'media_url' => $mediaUrl,
                'caption' => $type !== 'text' ? $content : null,
                'status' => 'pending',
            ]);

            $result = WhatsAppService::sendMessage($integration, $contact->phone_number, $content, $mediaUrl);

            if ($result['success']) {
                $message->update([
                    'whatsapp_message_id' => $result['message_id'],
                    'status' => 'sent',
                ]);
                $conversation->update(['last_message_at' => now()]);
                return response()->json($message);
            }

            $message->update(['status' => 'failed']);
            return response()->json(['message' => 'Failed to send message via WhatsApp', 'error' => $result['error'] ?? 'Unknown error'], 500);
        });
    }

    public function bulkSendMessage(Request $request)
    {
        $validated = $request->validate([
            'contact_ids' => 'required|array',
            'contact_ids.*' => 'exists:contacts,id',
            'content' => 'required|string',
        ]);

        $user = $request->user();
        $integration = Integration::where('user_id', $user->id)->first();

        if (!$integration) {
            return response()->json(['message' => 'No active WhatsApp integration found'], 400);
        }

        foreach ($validated['contact_ids'] as $contactId) {
            $contact = Contact::find($contactId);
            if ($contact) {
                SendBulkMessageJob::dispatch($integration, $contact, $validated['content']);
            }
        }

        return response()->json([
            'message' => 'Bulk messaging queued successfully.',
            'count' => count($validated['contact_ids']),
        ]);
    }

    public function clearMessages(Conversation $conversation, Request $request): \Illuminate\Http\JsonResponse
    {
        if ($conversation->user_id !== $request->user()->id) {
            abort(403);
        }

        $conversation->messages()->delete();
        $conversation->update(['unread_count' => 0]);

        return response()->json(['message' => 'Messages cleared successfully']);
    }

    public function destroy(Conversation $conversation, Request $request): \Illuminate\Http\JsonResponse
    {
        if ($conversation->user_id !== $request->user()->id) {
            abort(403);
        }

        $conversation->messages()->delete();
        $conversation->delete();

        return response()->json(['message' => 'Conversation deleted successfully']);
    }
}
