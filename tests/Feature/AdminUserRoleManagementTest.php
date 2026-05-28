<?php

use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\Facades\Notification;
use Inertia\Testing\AssertableInertia as Assert;

test('admin can view the user role management page', function () {
    $this->seed(RoleSeeder::class);

    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $this->actingAs($admin)
        ->get(route('admin.users.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/users')
            ->has('users.data')
            ->where('creationRoleOptions.0', 'admin')
            ->where('creationRoleOptions.1', 'tutor')
        );
});

test('admin can create tutors and send access email', function () {
    $this->seed(RoleSeeder::class);
    Notification::fake();

    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $this->actingAs($admin)
        ->post(route('admin.users.store'), [
            'name' => 'Nuevo Tutor',
            'email' => 'nuevo.tutor@example.com',
            'role' => 'tutor',
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    $created = User::query()->where('email', 'nuevo.tutor@example.com')->first();

    expect($created)->not->toBeNull()
        ->and($created->hasRole('tutor'))->toBeTrue()
        ->and($created->email_verified_at)->not->toBeNull();

    Notification::assertSentTo($created, ResetPassword::class);
});

test('admin can change a user role', function () {
    $this->seed(RoleSeeder::class);

    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $internUser = User::factory()->create();
    $internUser->assignRole('intern');

    $this->actingAs($admin)
        ->patch(route('admin.users.role.update', $internUser), [
            'role' => 'tutor',
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    $internUser->refresh();

    expect($internUser->hasRole('tutor'))->toBeTrue()
        ->and($internUser->hasRole('intern'))->toBeFalse();
});

test('admin cannot change their own role', function () {
    $this->seed(RoleSeeder::class);

    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $this->actingAs($admin)
        ->patch(route('admin.users.role.update', $admin), [
            'role' => 'tutor',
        ])
        ->assertRedirect()
        ->assertSessionHasErrors('role');

    expect($admin->fresh()->hasRole('admin'))->toBeTrue();
});
