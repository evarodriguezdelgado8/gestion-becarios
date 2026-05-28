<?php

use App\Models\Evaluation;
use App\Models\EvaluationCategory;
use App\Models\EvaluationCriterion;
use App\Models\User;

test('evaluation final grade is calculated with criterion weights', function () {
    $intern = User::factory()->create();
    $tutor = User::factory()->create();

    $evaluation = Evaluation::create([
        'intern_id' => $intern->id,
        'tutor_id' => $tutor->id,
        'type' => 'weekly',
        'period_name' => 'Semana 1',
    ]);

    $category = EvaluationCategory::create([
        'name' => 'Desempeno',
        'description' => 'Criterios semanales',
        'evaluation_type' => 'weekly',
    ]);

    $technical = EvaluationCriterion::create([
        'evaluation_category_id' => $category->id,
        'evaluation_type' => 'weekly',
        'name' => 'Tecnica',
        'weight' => 60,
    ]);

    $attitude = EvaluationCriterion::create([
        'evaluation_category_id' => $category->id,
        'evaluation_type' => 'weekly',
        'name' => 'Actitud',
        'weight' => 40,
    ]);

    $evaluation->results()->create([
        'evaluation_criterion_id' => $technical->id,
        'score' => 4,
    ]);

    $evaluation->results()->create([
        'evaluation_criterion_id' => $attitude->id,
        'score' => 5,
    ]);

    expect($evaluation->calculateGrade())->toBe(4.4)
        ->and((float) $evaluation->refresh()->final_grade)->toBe(4.4);
});

test('evaluation final grade is zero without weighted results', function () {
    $intern = User::factory()->create();
    $tutor = User::factory()->create();

    $evaluation = Evaluation::create([
        'intern_id' => $intern->id,
        'tutor_id' => $tutor->id,
        'type' => 'monthly',
        'period_name' => 'Mayo',
    ]);

    expect($evaluation->calculateGrade())->toBe(0)
        ->and((float) $evaluation->refresh()->final_grade)->toBe(0.0);
});
