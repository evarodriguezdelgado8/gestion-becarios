<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Intern extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'center_id', 
        'name', 
        'last_name', 
        'dni', 
        'email', 
        'phone', 
        'address', 
        'status', 
        'start_date'
    ];

    public function center(): BelongsTo
    {
        return $this->belongsTo(Center::class);
    }
}