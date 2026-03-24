<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Message extends Model
{
    protected $table = 'messages';
    protected $fillable = [
        'conversation_id',
        'whatsapp_message_id',
        'sender',
        'content',
        'type',
        'media_url',
        'caption',
        'status',
        'delivered_at',
        'read_at',

    ];

    protected $casts = [
        'delivered_at' => 'datetime',
        'read_at' => 'datetime',
    ];

    public function conversation()
    {
        return $this->belongsTo(Conversation::class);
    }

    protected static function booted()
    {
        $incrementVersions = function ($message) {
            $conv = $message->conversation;
            if ($conv) {
                // Invalidate message history cache for this conversation
                $msgKey = "conv_msg_version_{$conv->id}";
                \Illuminate\Support\Facades\Cache::forever($msgKey, (int)\Illuminate\Support\Facades\Cache::get($msgKey, 0) + 1);
                
                // Increment version to invalidate ALL paginated list cache for this user
            $listKey = "conv_list_version_{$conv->user_id}";
            \Illuminate\Support\Facades\Cache::forever($listKey, (int)\Illuminate\Support\Facades\Cache::get($listKey, 0) + 1);

            }

        };

        static::saved($incrementVersions);
        static::deleted($incrementVersions);
    }
}

