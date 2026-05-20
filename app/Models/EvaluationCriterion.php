<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EvaluationCriterion extends Model
{
    protected $fillable = ['evaluation_category_id', 'evaluation_type', 'name', 'description', 'weight', 'rubric'];

    protected $casts = [
        'rubric' => 'array',
        'weight' => 'decimal:2',
    ];

    public function category()
    {
        return $this->belongsTo(EvaluationCategory::class, 'evaluation_category_id');
    }

    public function results()
    {
        return $this->hasMany(EvaluationResult::class);
    }
}
