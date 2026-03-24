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
        'meta_phone_number_id',
        'meta_access_token',
        'meta_waba_id',
    ];

    protected $hidden = [
        'api_key',
        'secret_key',
        'meta_access_token',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function isWaSender(): bool
    {
        return $this->type === 'wa_sender';
    }

    public function isMeta(): bool
    {
        return $this->type === 'meta';
    }
}
