<?php

use App\Models\Absence;
use App\Models\Center;
use App\Models\Intern;
use App\Models\TimeRegistry;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;

test('manual bulk registry rolls back when one intern has an overlapping registry', function () {
    $this->seed(RoleSeeder::class);

    $tutor = User::factory()->create();
    $tutor->assignRole('tutor');
    $center = Center::factory()->create();

    $firstUser = User::factory()->create();
    Intern::factory()->create(['user_id' => $firstUser->id, 'center_id' => $center->id]);

    $secondUser = User::factory()->create();
    Intern::factory()->create(['user_id' => $secondUser->id, 'center_id' => $center->id]);

    TimeRegistry::create([
        'user_id' => $secondUser->id,
        'check_in' => '2026-05-04 09:30:00',
        'check_out' => '2026-05-04 11:00:00',
        'total_hours' => 1.5,
        'type' => 'manual',
        'status' => 'normal',
    ]);

    $response = $this->actingAs($tutor)->post(route('time.manual'), [
        'user_ids' => [$firstUser->id, $secondUser->id],
        'check_in' => '2026-05-04 09:00:00',
        'check_out' => '2026-05-04 10:00:00',
        'status' => 'normal',
        'note' => 'Registro masivo',
    ]);

    $response->assertSessionHasErrors('check_in');

    expect(TimeRegistry::query()->where('user_id', $firstUser->id)->count())->toBe(0)
        ->and(TimeRegistry::query()->where('user_id', $secondUser->id)->count())->toBe(1);
});

test('manual registry stores decimal hours from real minutes', function () {
    $this->seed(RoleSeeder::class);

    $tutor = User::factory()->create();
    $tutor->assignRole('tutor');
    $center = Center::factory()->create();

    $internUser = User::factory()->create();
    Intern::factory()->create(['user_id' => $internUser->id, 'center_id' => $center->id]);

    $response = $this->actingAs($tutor)->post(route('time.manual'), [
        'user_ids' => [$internUser->id],
        'check_in' => '2026-05-04 08:00:00',
        'check_out' => '2026-05-04 14:30:00',
        'status' => 'normal',
        'note' => 'Jornada de mañana',
    ]);

    $response->assertSessionHasNoErrors();

    expect((float) TimeRegistry::query()->where('user_id', $internUser->id)->sole()->total_hours)
        ->toBe(6.5);
});

test('manual registry accepts punctual status as a normal registry alias', function () {
    $this->seed(RoleSeeder::class);

    $tutor = User::factory()->create();
    $tutor->assignRole('tutor');
    $center = Center::factory()->create();

    $internUser = User::factory()->create();
    Intern::factory()->create(['user_id' => $internUser->id, 'center_id' => $center->id]);

    $response = $this->actingAs($tutor)->post(route('time.manual'), [
        'user_ids' => [$internUser->id],
        'check_in' => '2026-05-04 08:00:00',
        'check_out' => '2026-05-04 14:30:00',
        'status' => 'puntual',
        'note' => 'Jornada puntual',
    ]);

    $response->assertSessionHasNoErrors();

    expect(TimeRegistry::query()->where('user_id', $internUser->id)->sole()->status)
        ->toBe('normal');
});

test('approved absences count as reviewed today in the manager dashboard', function () {
    Carbon::setTestNow('2026-05-13 10:00:00');

    try {
        $this->seed(RoleSeeder::class);

        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $center = Center::factory()->create();
        $internUser = User::factory()->create();
        Intern::factory()->create([
            'user_id' => $internUser->id,
            'center_id' => $center->id,
        ]);

        $absence = Absence::create([
            'user_id' => $internUser->id,
            'date' => '2026-05-20',
            'reason' => 'Cita médica',
            'status' => 'pending',
        ]);

        $response = $this->actingAs($admin)->put(route('absences.update', $absence), [
            'status' => 'approved',
            'tutor_comment' => 'Aprobada',
        ]);

        $response->assertSessionHasNoErrors();

        $absence->refresh();

        expect($absence->status)->toBe('approved')
            ->and($absence->reviewed_at?->toDateString())->toBe('2026-05-13');

        $this->actingAs($admin)
            ->get(route('control-horario'))
            ->assertInertia(fn (Assert $page) => $page
                ->component('control-horario/index')
                ->has('managerAbsences', 1)
                ->where('managerAbsences.0.id', $absence->id)
                ->where('managerAbsences.0.reviewed_at', '2026-05-13 10:00:00')
            );
    } finally {
        Carbon::setTestNow();
    }
});
