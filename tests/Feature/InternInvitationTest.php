<?php

use App\Models\Center;
use App\Models\Intern;
use App\Models\User;
use App\Notifications\InternRegistrationInvitation;
use Database\Seeders\RoleSeeder;
use Illuminate\Support\Facades\Notification;

test('admin can invite an intern to create account password', function () {
    $this->seed(RoleSeeder::class);
    Notification::fake();

    $admin = User::factory()->create();
    $admin->assignRole('admin');
    $center = Center::factory()->create();
    $intern = Intern::factory()->create([
        'center_id' => $center->id,
        'email' => 'becario.invitable@example.com',
        'user_id' => null,
    ]);

    $this->actingAs($admin)
        ->post(route('becarios.invite', $intern))
        ->assertRedirect()
        ->assertSessionHas('success');

    $intern->refresh();
    $user = User::query()->where('email', 'becario.invitable@example.com')->first();

    expect($user)->not->toBeNull()
        ->and($intern->user_id)->toBe($user->id)
        ->and($user->hasRole('intern'))->toBeTrue();

    Notification::assertSentTo($user, InternRegistrationInvitation::class);
});

test('tutor can only invite assigned interns', function () {
    $this->seed(RoleSeeder::class);
    Notification::fake();

    $firstTutor = User::factory()->create();
    $firstTutor->assignRole('tutor');
    $secondTutor = User::factory()->create();
    $secondTutor->assignRole('tutor');
    $center = Center::factory()->create();

    $visibleIntern = Intern::factory()->create([
        'center_id' => $center->id,
        'tutor_id' => $firstTutor->id,
        'email' => 'visible.invite@example.com',
        'user_id' => null,
    ]);
    $hiddenIntern = Intern::factory()->create([
        'center_id' => $center->id,
        'tutor_id' => $secondTutor->id,
        'email' => 'hidden.invite@example.com',
        'user_id' => null,
    ]);

    $this->actingAs($firstTutor)
        ->post(route('becarios.invite', $visibleIntern))
        ->assertRedirect()
        ->assertSessionHas('success');

    $this->actingAs($firstTutor)
        ->post(route('becarios.invite', $hiddenIntern))
        ->assertForbidden();

    expect(User::query()->where('email', 'visible.invite@example.com')->exists())->toBeTrue()
        ->and(User::query()->where('email', 'hidden.invite@example.com')->exists())->toBeFalse();
});

test('admin can invite selected interns in bulk', function () {
    $this->seed(RoleSeeder::class);
    Notification::fake();

    $admin = User::factory()->create();
    $admin->assignRole('admin');
    $center = Center::factory()->create();
    $interns = Intern::factory(3)->create([
        'center_id' => $center->id,
        'user_id' => null,
    ]);

    $this->actingAs($admin)
        ->post(route('becarios.invite.bulk'), [
            'mode' => 'selected',
            'intern_ids' => $interns->pluck('id')->all(),
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    $interns->each(function (Intern $intern) {
        $user = User::query()->where('email', $intern->email)->first();

        expect($user)->not->toBeNull();
        Notification::assertSentTo($user, InternRegistrationInvitation::class);
    });
});

test('tutor bulk filtered invitations only include assigned interns', function () {
    $this->seed(RoleSeeder::class);
    Notification::fake();

    $tutor = User::factory()->create();
    $tutor->assignRole('tutor');
    $otherTutor = User::factory()->create();
    $otherTutor->assignRole('tutor');
    $center = Center::factory()->create();

    $visibleInterns = Intern::factory(2)->create([
        'center_id' => $center->id,
        'tutor_id' => $tutor->id,
        'user_id' => null,
    ]);
    $hiddenIntern = Intern::factory()->create([
        'center_id' => $center->id,
        'tutor_id' => $otherTutor->id,
        'user_id' => null,
    ]);

    $this->actingAs($tutor)
        ->post(route('becarios.invite.bulk'), [
            'mode' => 'filtered',
            'filters' => [],
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    $visibleInterns->each(function (Intern $intern) {
        $user = User::query()->where('email', $intern->email)->first();

        expect($user)->not->toBeNull();
        Notification::assertSentTo($user, InternRegistrationInvitation::class);
    });

    expect(User::query()->where('email', $hiddenIntern->email)->exists())->toBeFalse();
});

test('tutor cannot bulk invite unassigned selected interns', function () {
    $this->seed(RoleSeeder::class);
    Notification::fake();

    $tutor = User::factory()->create();
    $tutor->assignRole('tutor');
    $otherTutor = User::factory()->create();
    $otherTutor->assignRole('tutor');
    $center = Center::factory()->create();

    $visibleIntern = Intern::factory()->create([
        'center_id' => $center->id,
        'tutor_id' => $tutor->id,
        'user_id' => null,
    ]);
    $hiddenIntern = Intern::factory()->create([
        'center_id' => $center->id,
        'tutor_id' => $otherTutor->id,
        'user_id' => null,
    ]);

    $this->actingAs($tutor)
        ->post(route('becarios.invite.bulk'), [
            'mode' => 'selected',
            'intern_ids' => [$visibleIntern->id, $hiddenIntern->id],
        ])
        ->assertForbidden();

    expect(User::query()->where('email', $visibleIntern->email)->exists())->toBeFalse()
        ->and(User::query()->where('email', $hiddenIntern->email)->exists())->toBeFalse();
});
