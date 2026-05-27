<?php

use App\Models\Center;
use App\Models\Intern;
use App\Models\User;
use Database\Seeders\RoleSeeder;

function validCenterPayload(array $overrides = []): array
{
    return array_merge([
        'nif' => 'A1234567B',
        'name' => 'IES Pruebas',
        'address' => 'Calle Principal 1',
        'phone' => '600111222',
        'email' => 'centro@example.com',
        'web' => 'https://example.com',
        'contact_name' => 'Coordinador Centro',
        'contact_role' => 'Coordinador',
        'contact_phone' => '600333444',
        'contact_email' => 'contacto@example.com',
    ], $overrides);
}

test('admin can create update and delete centers', function () {
    $this->seed(RoleSeeder::class);

    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $this->actingAs($admin)
        ->post(route('centros.store'), validCenterPayload())
        ->assertRedirect(route('centros.index'));

    $center = Center::query()->where('nif', 'A1234567B')->sole();

    $this->actingAs($admin)
        ->put(route('centros.update', $center), validCenterPayload([
            'name' => 'IES Actualizado',
            'email' => 'actualizado@example.com',
        ]))
        ->assertRedirect(route('centros.index'));

    expect($center->refresh()->name)->toBe('IES Actualizado');

    $this->actingAs($admin)
        ->delete(route('centros.destroy', $center))
        ->assertRedirect(route('centros.index'));

    $this->assertSoftDeleted('centers', ['id' => $center->id]);
});

test('center with active interns cannot be deleted', function () {
    $this->seed(RoleSeeder::class);

    $admin = User::factory()->create();
    $admin->assignRole('admin');
    $center = Center::factory()->create();
    Intern::factory()->create([
        'center_id' => $center->id,
        'status' => 'active',
    ]);

    $this->actingAs($admin)
        ->delete(route('centros.destroy', $center))
        ->assertSessionHas('error');

    expect($center->fresh())->not->toBeNull();
});

test('tutor cannot manage centers', function () {
    $this->seed(RoleSeeder::class);

    $tutor = User::factory()->create();
    $tutor->assignRole('tutor');

    $this->actingAs($tutor)
        ->post(route('centros.store'), validCenterPayload())
        ->assertForbidden();
});
