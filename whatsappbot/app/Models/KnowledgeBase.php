<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KnowledgeBase extends Model
{
    protected $table = 'knowledge_bases';
    protected $fillable = [
        'user_id',
        'file_name',
        'file_type',
        'content',
        'metadata',
        'embedding',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
