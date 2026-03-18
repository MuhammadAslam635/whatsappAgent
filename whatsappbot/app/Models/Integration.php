<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Integration extends Model
{
    protected $table = 'integrations';
    protected $fillable = [
        'user_id',
        'type',
        'phone_number',
        'webhook_secret',
        'webhook_url',
        'api_key',
        'secret_key',
    ];
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
