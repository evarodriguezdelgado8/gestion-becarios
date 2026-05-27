<?php

use App\Models\Center;
use App\Models\Evaluation;
use App\Models\Intern;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Inertia\Testing\AssertableInertia as Assert;

test('tutor evaluations are scoped to assigned interns', function () {
    $this->seed(RoleSeeder::class);

    $firstTutor = User::factory()->create();
    $firstTutor->assignRole('tutor');
    $secondTutor = User::factory()->create();
    $secondTutor->assignRole('tutor');
    $center = Center::factory()->create();

    $visibleUser = User::factory()->create(['name' => 'Visible Becario']);
    Intern::factory()->create([
        'user_id' => $visibleUser->id,
        'center_id' => $center->id,
        'tutor_id' => $firstTutor->id,
    ]);
    $hiddenUser = User::factory()->create(['name' => 'Oculto Becario']);
    Intern::factory()->create([
        'user_id' => $hiddenUser->id,
        'center_id' => $center->id,
        'tutor_id' => $secondTutor->id,
    ]);

    $visibleEvaluation = Evaluation::create([
        'intern_id' => $visibleUser->id,
        'tutor_id' => $firstTutor->id,
        'type' => 'weekly',
        'period_name' => 'Semana visible',
        'final_grade' => 4,
        'comments' => 'Visible',
    ]);
    $hiddenEvaluation = Evaluation::create([
        'intern_id' => $hiddenUser->id,
        'tutor_id' => $secondTutor->id,
        'type' => 'weekly',
        'period_name' => 'Semana oculta',
        'final_grade' => 4,
        'comments' => 'Oculta',
    ]);

    $this->actingAs($firstTutor)
        ->get(route('evaluaciones.history'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('evaluaciones.0.id', $visibleEvaluation->id)
            ->has('evaluaciones', 1)
        );

    $this->actingAs($firstTutor)
        ->get(route('evaluaciones.edit', $hiddenEvaluation))
        ->assertForbidden();
});
