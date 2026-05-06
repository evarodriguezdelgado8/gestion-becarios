<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TimeRegistry extends Model
{
    protected $fillable = ['user_id', 'check_in', 'check_out', 'total_hours', 'type', 'note', 'status'];

    protected $casts = [
        'check_in' => 'datetime',
        'check_out' => 'datetime',
    ];
}
