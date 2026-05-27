<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EvaluationCategory extends Model
{
    protected $fillable = ['name', 'description', 'evaluation_type'];

    public function criteria()
    {
        return $this->hasMany(EvaluationCriterion::class);
    }
}
