<?php

use App\Models\Center;
use App\Models\Intern;
use App\Models\Task;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected to the login page', function () {
    $response = $this->get(route('dashboard'));
    $response->assertRedirect(route('login'));
});

test('authenticated users can visit the dashboard', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $response = $this->get(route('dashboard'));
    $response->assertOk();
});

test('admin dashboard exposes global metrics and center distribution', function () {
    Carbon::setTestNow('2026-05-26 09:00:00');

    try {
        $this->seed(RoleSeeder::class);

        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $center = Center::factory()->create(['name' => 'IES Norte']);
        $internUser = User::factory()->create();
        $intern = Intern::factory()->create([
            'user_id' => $internUser->id,
            'center_id' => $center->id,
            'status' => 'active',
            'end_date' => '2026-06-10',
            'total_hours' => 400,
            'completed_hours' => 200,
        ]);

        Task::create([
            'title' => 'Entrega vencida',
            'description' => 'Preparar documentacion',
            'status' => 'pending',
            'priority' => 'medium',
            'creator_id' => $admin->id,
            'intern_id' => $intern->id,
            'center_id' => $center->id,
            'due_date' => '2026-05-20',
            'order_index' => 0,
        ]);
        Task::create([
            'title' => 'Entrega pendiente',
            'description' => 'Preparar entrega proxima',
            'status' => 'pending',
            'priority' => 'medium',
            'creator_id' => $admin->id,
            'intern_id' => $intern->id,
            'center_id' => $center->id,
            'due_date' => '2026-05-28',
            'order_index' => 1,
        ]);
        Task::create([
            'title' => 'Entrega completada',
            'description' => 'Tarea resuelta',
            'status' => 'completed',
            'priority' => 'medium',
            'creator_id' => $admin->id,
            'intern_id' => $intern->id,
            'center_id' => $center->id,
            'due_date' => '2026-05-24',
            'completed_at' => '2026-05-24 09:00:00',
            'created_at' => '2026-05-22 09:00:00',
            'updated_at' => '2026-05-24 09:00:00',
            'order_index' => 0,
        ]);

        $this->actingAs($admin)
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('dashboard')
                ->where('role', 'admin')
                ->has('kpis', 6)
                ->where('kpis.0.value', 1)
                ->where('kpis.1.value', 2)
                ->where('kpis.2.value', 1)
                ->where('kpis.3.value', '50%')
                ->where('kpis.4.value', 1)
                ->where('kpis.5.value', 1)
                ->where('internsByCenter.0.center', 'IES Norte')
                ->where('internsByCenter.0.total', 1)
                ->where('taskStatusDistribution.0.total', 2)
                ->where('taskStatusDistribution.3.total', 1)
                ->where('internProgress.0.centerId', $center->id)
                ->where('internProgress.0.center', 'IES Norte')
                ->where('internProgress.0.academicCycle', $intern->academic_cycle)
                ->where('internProgress.0.totalTasks', 3)
                ->where('internProgress.0.completedTasks', 1)
                ->where('internProgress.0.pendingTasks', 2)
                ->where('internProgress.0.taskCompletionRate', 33.3)
                ->where('internProgress.0.statusDistribution.0.total', 2)
                ->where('internProgress.0.statusDistribution.3.total', 1)
                ->has('internProgress.0.nextTasks', 1)
                ->where('internProgress.0.nextTasks.0.title', 'Entrega pendiente')
                ->has('alerts', 2)
            );
    } finally {
        Carbon::setTestNow();
    }
});

test('tutor dashboard is scoped to assigned interns', function () {
    $this->seed(RoleSeeder::class);

    $firstTutor = User::factory()->create();
    $firstTutor->assignRole('tutor');
    $secondTutor = User::factory()->create();
    $secondTutor->assignRole('tutor');

    $firstCenter = Center::factory()->create(['name' => 'IES Tutor Uno']);
    $secondCenter = Center::factory()->create(['name' => 'IES Tutor Dos']);

    $firstInternUser = User::factory()->create();
    $firstIntern = Intern::factory()->create([
        'user_id' => $firstInternUser->id,
        'tutor_id' => $firstTutor->id,
        'center_id' => $firstCenter->id,
        'status' => 'active',
    ]);

    $secondInternUser = User::factory()->create();
    $secondIntern = Intern::factory()->create([
        'user_id' => $secondInternUser->id,
        'tutor_id' => $secondTutor->id,
        'center_id' => $secondCenter->id,
        'status' => 'active',
    ]);

    Task::create([
        'title' => 'Tarea visible',
        'description' => 'Pertenece al tutor autenticado',
        'status' => 'pending',
        'priority' => 'high',
        'creator_id' => $firstTutor->id,
        'intern_id' => $firstIntern->id,
        'center_id' => $firstCenter->id,
        'due_date' => now()->addDay()->toDateString(),
        'order_index' => 0,
    ]);

    Task::create([
        'title' => 'Tarea oculta',
        'description' => 'Pertenece a otro tutor',
        'status' => 'pending',
        'priority' => 'high',
        'creator_id' => $secondTutor->id,
        'intern_id' => $secondIntern->id,
        'center_id' => $secondCenter->id,
        'due_date' => now()->addDay()->toDateString(),
        'order_index' => 0,
    ]);

    $this->actingAs($firstTutor)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('dashboard')
            ->where('role', 'tutor')
            ->where('kpis.0.value', 1)
            ->where('kpis.1.value', 1)
            ->where('internsByCenter.0.center', 'IES Tutor Uno')
            ->where('internsByCenter.0.total', 1)
            ->has('internsByCenter', 1)
        );
});

test('dashboard task status distribution refreshes after kanban status update', function () {
    Cache::flush();
    $this->seed(RoleSeeder::class);

    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $center = Center::factory()->create();
    $intern = Intern::factory()->create([
        'center_id' => $center->id,
        'status' => 'active',
    ]);

    $task = Task::create([
        'title' => 'Mover en Kanban',
        'description' => 'Debe refrescar el dashboard',
        'status' => 'pending',
        'priority' => 'medium',
        'creator_id' => $admin->id,
        'intern_id' => $intern->id,
        'center_id' => $center->id,
        'due_date' => now()->addDay()->toDateString(),
        'order_index' => 0,
    ]);

    $this->actingAs($admin)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('taskStatusDistribution.0.total', 1)
            ->where('taskStatusDistribution.3.total', 0)
        );

    $this->patch(route('tareas.updateStatus', $task), [
        'status' => 'completed',
        'new_index' => 0,
    ])->assertRedirect();

    $this->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('taskStatusDistribution.0.total', 0)
            ->where('taskStatusDistribution.3.total', 1)
        );
});
