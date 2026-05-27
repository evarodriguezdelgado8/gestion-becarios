<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Center extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'nif',
        'name',
        'address',
        'phone',
        'email',
        'web',
        'contact_name',
        'contact_role',
        'contact_phone',
        'contact_email',
    ];

    public function interns()
    {
 
        return $this->hasMany(Intern::class);
    }
}
