<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Evaluation extends Model
{
    protected $fillable = ['intern_id', 'tutor_id', 'type', 'period_name', 'final_grade', 'comments'];

    public function results()
    {
        return $this->hasMany(EvaluationResult::class);
    }

    public function intern()
    {
        return $this->belongsTo(User::class, 'intern_id');
    }

    public function tutor()
    {
        return $this->belongsTo(User::class, 'tutor_id');
    }

    // Calcula la nota media ponderada usando los pesos configurados.
    public function calculateGrade()
    {
        $total = 0;
        $totalWeight = 0;
        $results = $this->results()->with('criterion')->get();

        foreach ($results as $result) {
            $weight = (float) $result->criterion->weight;
            $totalWeight += $weight;
            $total += ($result->score * ($weight / 100));
        }

        $grade = $totalWeight > 0 ? $total / ($totalWeight / 100) : 0;

        $this->update(['final_grade' => $grade]);

        return $grade;
    }
}
