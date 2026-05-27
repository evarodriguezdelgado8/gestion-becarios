<?php

use App\Models\Absence;
use App\Models\Center;
use App\Models\Intern;
use App\Models\Task;
use App\Models\TimeRegistry;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Inertia\Testing\AssertableInertia as Assert;

test('tutor only sees assigned interns in intern listing and detail', function () {
    $this->seed(RoleSeeder::class);

    $firstTutor = User::factory()->create();
    $firstTutor->assignRole('tutor');
    $secondTutor = User::factory()->create();
    $secondTutor->assignRole('tutor');
    $center = Center::factory()->create();

    $visibleIntern = Intern::factory()->create([
        'name' => 'Visible',
        'last_name' => 'Tutor',
        'center_id' => $center->id,
        'tutor_id' => $firstTutor->id,
    ]);
    $hiddenIntern = Intern::factory()->create([
        'name' => 'Oculto',
        'last_name' => 'Tutor',
        'center_id' => $center->id,
        'tutor_id' => $secondTutor->id,
    ]);

    $this->actingAs($firstTutor)
        ->get(route('becarios.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('interns.data.0.id', $visibleIntern->id)
            ->has('interns.data', 1)
        );

    $this->actingAs($firstTutor)
        ->get(route('becarios.show', $hiddenIntern))
        ->assertForbidden();
});

test('tutor only sees and opens tasks for assigned interns', function () {
    $this->seed(RoleSeeder::class);

    $firstTutor = User::factory()->create();
    $firstTutor->assignRole('tutor');
    $secondTutor = User::factory()->create();
    $secondTutor->assignRole('tutor');
    $center = Center::factory()->create();

    $visibleIntern = Intern::factory()->create([
        'center_id' => $center->id,
        'tutor_id' => $firstTutor->id,
    ]);
    $hiddenIntern = Intern::factory()->create([
        'center_id' => $center->id,
        'tutor_id' => $secondTutor->id,
    ]);

    $visibleTask = Task::create([
        'title' => 'Visible',
        'description' => 'Tarea asignada al tutor',
        'status' => 'pending',
        'priority' => 'medium',
        'creator_id' => $firstTutor->id,
        'intern_id' => $visibleIntern->id,
        'center_id' => $center->id,
        'due_date' => now()->addDay()->toDateString(),
        'order_index' => 0,
    ]);
    $hiddenTask = Task::create([
        'title' => 'Oculta',
        'description' => 'Tarea de otro tutor',
        'status' => 'pending',
        'priority' => 'medium',
        'creator_id' => $secondTutor->id,
        'intern_id' => $hiddenIntern->id,
        'center_id' => $center->id,
        'due_date' => now()->addDay()->toDateString(),
        'order_index' => 1,
    ]);

    $this->actingAs($firstTutor)
        ->get(route('tareas.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('kanban.pending.0.id', $visibleTask->id)
            ->has('kanban.pending', 1)
        );

    $this->actingAs($firstTutor)
        ->get(route('tareas.show', $hiddenTask))
        ->assertForbidden();
});

test('tutor cannot manage time records or absences for another tutor intern', function () {
    $this->seed(RoleSeeder::class);

    $firstTutor = User::factory()->create();
    $firstTutor->assignRole('tutor');
    $secondTutor = User::factory()->create();
    $secondTutor->assignRole('tutor');
    $center = Center::factory()->create();

    $hiddenUser = User::factory()->create();
    Intern::factory()->create([
        'user_id' => $hiddenUser->id,
        'center_id' => $center->id,
        'tutor_id' => $secondTutor->id,
    ]);
    $hiddenRegistry = TimeRegistry::create([
        'user_id' => $hiddenUser->id,
        'check_in' => '2026-05-04 09:00:00',
        'check_out' => '2026-05-04 10:00:00',
        'total_hours' => 1,
        'type' => 'manual',
        'status' => 'normal',
    ]);
    $hiddenAbsence = Absence::create([
        'user_id' => $hiddenUser->id,
        'date' => '2026-05-20',
        'reason' => 'Cita',
        'status' => 'pending',
    ]);

    $this->actingAs($firstTutor)
        ->post(route('time.manual'), [
            'user_ids' => [$hiddenUser->id],
            'check_in' => '2026-05-05 09:00:00',
            'check_out' => '2026-05-05 10:00:00',
            'status' => 'normal',
        ])
        ->assertForbidden();

    $this->actingAs($firstTutor)
        ->put(route('time.update-manual', $hiddenRegistry), [
            'check_in' => '2026-05-04 09:00:00',
            'check_out' => '2026-05-04 11:00:00',
            'status' => 'normal',
        ])
        ->assertForbidden();

    $this->actingAs($firstTutor)
        ->put(route('absences.update', $hiddenAbsence), [
            'status' => 'approved',
        ])
        ->assertForbidden();
});
