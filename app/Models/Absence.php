<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Absence extends Model
{
    protected $fillable = ['user_id', 'date', 'reason', 'status', 'tutor_comment'];
}
