<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Absence extends Model
{
    protected $fillable = ['user_id', 'date', 'reason', 'attachment_path', 'status', 'tutor_comment', 'reviewed_at'];

    protected $casts = [
        'date' => 'date',
        'reviewed_at' => 'datetime',
    ];
}
