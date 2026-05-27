<?php

namespace Database\Seeders;

use App\Models\Center;
use App\Models\Intern;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        $this->call([RoleSeeder::class]);

        $admin = User::factory()->create([
            'name' => 'Eva Rodriguez Delgado',
            'email' => 'prueba@gestion-becarios.com',
            'password' => bcrypt('12345678'),
        ]);
        $admin->assignRole('admin');

        $centers = Center::factory(20)->create();

        $internUser = User::factory()->create([
            'name' => 'Becario Prueba',
            'email' => 'becario@ejemplo.com',
            'password' => Hash::make('12345678'),
        ]);
        $internUser->assignRole('intern');

        Intern::factory()->create([
            'center_id' => $centers->first()->id,
            'user_id' => $internUser->id,
            'name' => 'Becario',
            'last_name' => 'Prueba',
            'email' => $internUser->email,
        ]);

        $centers->each(function (Center $center) {
            Intern::factory(rand(2, 5))->make([
                'center_id' => $center->id,
            ])->each(function (Intern $intern) {
                $user = User::factory()->create([
                    'name' => trim($intern->name.' '.$intern->last_name),
                    'email' => $intern->email,
                    'password' => Hash::make(Str::random(48)),
                ]);
                $user->assignRole('intern');

                $intern->user_id = $user->id;
                $intern->save();
            });
        });

        $this->call([TutorAssignmentSeeder::class]);
    }
}
