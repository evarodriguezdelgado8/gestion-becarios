<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Evaluation extends Model
{
    protected $fillable = ['intern_id', 'tutor_id', 'type', 'period_name', 'final_grade', 'comments'];

    public function results() {
        return $this->hasMany(EvaluationResult::class);
    }

    public function intern() {
        return $this->belongsTo(User::class, 'intern_id');
    }

    // Método para calcular la nota media ponderada
    public function calculateGrade()
    {
        $total = 0;
        $results = $this->results()->with('criterion')->get();

        foreach ($results as $result) {
            // (Nota * Peso) / 100
            $total += ($result->score * ($result->criterion->weight / 100));
        }

        $this->update(['final_grade' => $total]);
        return $total;
    }
}
