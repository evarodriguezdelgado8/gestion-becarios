<?php

use App\Models\Center;
use App\Models\Intern;
use App\Models\User;
use Database\Seeders\RoleSeeder;

function validInternPayload(User $tutor, Center $center, array $overrides = []): array
{
    return array_merge([
        'name' => 'Eva',
        'last_name' => 'Rodriguez',
        'dni' => '12345678Z',
        'email' => 'eva.intern@example.com',
        'phone' => '600111222',
        'address' => 'Calle Practicas 4',
        'center_id' => $center->id,
        'tutor_id' => $tutor->id,
        'academic_cycle' => 'DAW',
        'academic_tutor' => 'Tutor Academico',
        'start_date' => '2026-03-02',
        'end_date' => '2026-05-28',
        'total_hours' => 400,
        'completed_hours' => 0,
        'status' => 'active',
    ], $overrides);
}

test('admin can create update and soft delete interns', function () {
    $this->seed(RoleSeeder::class);

    $admin = User::factory()->create();
    $admin->assignRole('admin');
    $tutor = User::factory()->create();
    $tutor->assignRole('tutor');
    $center = Center::factory()->create();

    $this->actingAs($admin)
        ->post(route('becarios.store'), validInternPayload($tutor, $center))
        ->assertRedirect(route('becarios.index'));

    $intern = Intern::query()->where('dni', '12345678Z')->sole();

    expect($intern->user_id)->not->toBeNull()
        ->and($intern->user?->hasRole('intern'))->toBeTrue();

    $this->actingAs($admin)
        ->put(route('becarios.update', $intern), validInternPayload($tutor, $center, [
            'name' => 'Eva Maria',
            'email' => 'eva.maria@example.com',
        ]))
        ->assertRedirect(route('becarios.index'));

    expect($intern->refresh()->name)->toBe('Eva Maria');

    $this->actingAs($admin)
        ->delete(route('becarios.destroy', $intern))
        ->assertRedirect(route('becarios.index'));

    $this->assertSoftDeleted('interns', ['id' => $intern->id]);
});

test('tutor cannot manage interns', function () {
    $this->seed(RoleSeeder::class);

    $tutor = User::factory()->create();
    $tutor->assignRole('tutor');
    $center = Center::factory()->create();

    $this->actingAs($tutor)
        ->post(route('becarios.store'), validInternPayload($tutor, $center))
        ->assertForbidden();
});
