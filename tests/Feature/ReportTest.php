<?php

use App\Models\Center;
use App\Models\Intern;
use App\Models\ReportTemplate;
use App\Models\Task;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;
use Maatwebsite\Excel\Facades\Excel;

test('admin can preview reports and save templates', function () {
    $this->seed(RoleSeeder::class);

    $admin = User::factory()->create();
    $admin->assignRole('admin');
    $center = Center::factory()->create(['name' => 'IES Reportes']);
    Intern::factory()->create([
        'center_id' => $center->id,
        'status' => 'active',
        'completed_hours' => 200,
        'total_hours' => 400,
    ]);

    $this->actingAs($admin)
        ->get(route('reportes.index', [
            'report_type' => 'interns',
            'fields' => ['name', 'center', 'hours_progress'],
            'filters' => ['center_id' => $center->id],
        ]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('reportes/index')
            ->where('selected.report_type', 'interns')
            ->where('preview.headings.0', 'Becario')
            ->where('preview.rows.0.center', 'IES Reportes')
            ->where('preview.rows.0.hours_progress', '50%')
        );

    $this->actingAs($admin)
        ->post(route('reportes.templates.store'), [
            'name' => 'Becarios por centro',
            'report_type' => 'interns',
            'fields' => ['name', 'center'],
            'filters' => ['center_id' => $center->id],
            'group_by' => 'center',
        ])
        ->assertSessionHasNoErrors();

    expect(ReportTemplate::query()->where('name', 'Becarios por centro')->exists())->toBeTrue();
});

test('tutor reports are scoped to assigned interns', function () {
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

    Task::create([
        'title' => 'Visible',
        'description' => 'Tarea del tutor',
        'status' => 'pending',
        'priority' => 'high',
        'creator_id' => $firstTutor->id,
        'intern_id' => $visibleIntern->id,
        'center_id' => $center->id,
        'due_date' => '2026-05-28',
        'order_index' => 0,
    ]);
    Task::create([
        'title' => 'Oculta',
        'description' => 'Tarea de otro tutor',
        'status' => 'pending',
        'priority' => 'high',
        'creator_id' => $secondTutor->id,
        'intern_id' => $hiddenIntern->id,
        'center_id' => $center->id,
        'due_date' => '2026-05-28',
        'order_index' => 0,
    ]);

    $this->actingAs($firstTutor)
        ->get(route('reportes.index', [
            'report_type' => 'tasks',
            'fields' => ['title', 'intern'],
        ]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('preview.rows.0.title', 'Visible')
            ->has('preview.rows', 1)
        );
});

test('admin can group report preview rows', function () {
    $this->seed(RoleSeeder::class);

    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $north = Center::factory()->create(['name' => 'IES Norte']);
    $south = Center::factory()->create(['name' => 'IES Sur']);

    Intern::factory()->create([
        'center_id' => $south->id,
        'name' => 'Becaria',
        'last_name' => 'Sur',
    ]);
    Intern::factory()->create([
        'center_id' => $north->id,
        'name' => 'Becario',
        'last_name' => 'Norte',
    ]);

    $this->actingAs($admin)
        ->get(route('reportes.index', [
            'report_type' => 'interns',
            'fields' => ['name', 'center'],
            'group_by' => 'center',
        ]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('preview.rows.0.__group', true)
            ->where('preview.rows.0.__label', 'IES Norte')
            ->where('preview.rows.0.__count', 1)
            ->where('preview.rows.1.center', 'IES Norte')
            ->where('preview.rows.2.__group', true)
            ->where('preview.rows.2.__label', 'IES Sur')
            ->where('preview.rows.3.center', 'IES Sur')
        );
});

test('admin can group by calculated report fields', function () {
    $this->seed(RoleSeeder::class);

    $admin = User::factory()->create();
    $admin->assignRole('admin');
    $center = Center::factory()->create();

    Intern::factory()->create([
        'center_id' => $center->id,
        'completed_hours' => 200,
        'total_hours' => 400,
    ]);

    $this->actingAs($admin)
        ->get(route('reportes.index', [
            'report_type' => 'interns',
            'fields' => ['name', 'hours_progress'],
            'group_by' => 'hours_progress',
        ]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('preview.rows.0.__group', true)
            ->where('preview.rows.0.__label', '50%')
            ->where('preview.rows.1.hours_progress', '50%')
        );
});

test('intern cannot access report builder', function () {
    $this->seed(RoleSeeder::class);

    $intern = User::factory()->create();
    $intern->assignRole('intern');

    $this->actingAs($intern)
        ->get(route('reportes.index'))
        ->assertForbidden();
});

test('admin can export reports to excel', function () {
    Carbon::setTestNow('2026-05-26 10:00:00');

    try {
        $this->seed(RoleSeeder::class);
        Excel::fake();

        $admin = User::factory()->create();
        $admin->assignRole('admin');
        $center = Center::factory()->create();
        Intern::factory()->create(['center_id' => $center->id]);

        $this->actingAs($admin)
            ->get(route('reportes.export', [
                'format' => 'xlsx',
                'report_type' => 'interns',
                'fields' => ['name', 'center'],
            ]))
            ->assertOk();

        Excel::assertDownloaded('informe-interns-2026-05-26-100000.xlsx');
    } finally {
        Carbon::setTestNow();
    }
});
