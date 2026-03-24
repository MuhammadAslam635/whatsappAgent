<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Conversation extends Model
{
    protected $table = 'conversations';
    protected $fillable = [
        'user_id',
        'contact_id',
        'last_message_at',
        'unread_count',
    ];

    protected $casts = [
        'last_message_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function contact()
    {
        return $this->belongsTo(Contact::class);
    }

    public function messages()
    {
        return $this->hasMany(Message::class);
    }

    protected static function booted()
    {
        $clearCaches = function ($conv) {
            // Invalidate individual lookup cache
            \Illuminate\Support\Facades\Cache::forget("conv_lookup_{$conv->user_id}_{$conv->contact_id}");
            
            // Increment version to invalidate ALL paginated list cache for this user
            $listKey = "conv_list_version_{$conv->user_id}";
            \Illuminate\Support\Facades\Cache::forever($listKey, (int)\Illuminate\Support\Facades\Cache::get($listKey, 0) + 1);


            // Also clear dashboard stats for this user
            $ranges = ['daily', 'weekly', 'monthly', 'yearly'];
            foreach ($ranges as $range) {
                \Illuminate\Support\Facades\Cache::forget("user_stats_{$conv->user_id}_{$range}");
            }
        };

        static::saved($clearCaches);
        static::deleted($clearCaches);
    }
}


