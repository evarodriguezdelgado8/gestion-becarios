<?php

use App\Models\Center;
use App\Models\Intern;
use App\Models\TimeRegistry;
use App\Models\User;
use Database\Seeders\RoleSeeder;

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
