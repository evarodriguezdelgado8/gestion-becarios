<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EvaluationResult extends Model
{
    protected $fillable = ['evaluation_criterion_id', 'score', 'feedback'];

    public function evaluation()
    {
        return $this->belongsTo(Evaluation::class);
    }

    public function criterion()
    {
        return $this->belongsTo(EvaluationCriterion::class, 'evaluation_criterion_id');
    }
}
