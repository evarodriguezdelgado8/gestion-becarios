<?php

use App\Models\Center;
use App\Models\Intern;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Inertia\Testing\AssertableInertia as Assert;

test('admin can view tutor assignments', function () {
    $this->seed(RoleSeeder::class);

    $admin = User::factory()->create();
    $admin->assignRole('admin');
    $tutor = User::factory()->create(['name' => 'Tutor Visible']);
    $tutor->assignRole('tutor');
    $center = Center::factory()->create();
    Intern::factory()->create([
        'center_id' => $center->id,
        'tutor_id' => $tutor->id,
    ]);

    $this->actingAs($admin)
        ->get(route('admin.tutor-assignments.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/tutor-assignments')
            ->where('tutors.0.name', 'Tutor Visible')
            ->where('tutors.0.assigned_interns_count', 1)
            ->has('interns.data', 1)
        );
});

test('admin can assign and unassign an intern tutor', function () {
    $this->seed(RoleSeeder::class);

    $admin = User::factory()->create();
    $admin->assignRole('admin');
    $tutor = User::factory()->create();
    $tutor->assignRole('tutor');
    $center = Center::factory()->create();
    $intern = Intern::factory()->create([
        'center_id' => $center->id,
        'tutor_id' => null,
    ]);

    $this->actingAs($admin)
        ->patch(route('admin.tutor-assignments.update', $intern), [
            'tutor_id' => $tutor->id,
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    expect($intern->fresh()->tutor_id)->toBe($tutor->id);

    $this->patch(route('admin.tutor-assignments.update', $intern), [
        'tutor_id' => null,
    ])->assertRedirect()
        ->assertSessionHas('success');

    expect($intern->fresh()->tutor_id)->toBeNull();
});

test('non tutor users cannot be assigned as tutor', function () {
    $this->seed(RoleSeeder::class);

    $admin = User::factory()->create();
    $admin->assignRole('admin');
    $notTutor = User::factory()->create();
    $notTutor->assignRole('intern');
    $center = Center::factory()->create();
    $intern = Intern::factory()->create(['center_id' => $center->id]);

    $this->actingAs($admin)
        ->patch(route('admin.tutor-assignments.update', $intern), [
            'tutor_id' => $notTutor->id,
        ])
        ->assertRedirect()
        ->assertSessionHasErrors('tutor_id');
});

test('tutors cannot access tutor assignment administration', function () {
    $this->seed(RoleSeeder::class);

    $tutor = User::factory()->create();
    $tutor->assignRole('tutor');

    $this->actingAs($tutor)
        ->get(route('admin.tutor-assignments.index'))
        ->assertForbidden();
});
