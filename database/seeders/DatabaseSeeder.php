<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

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

        $tutor = User::factory()->create([
            'name' => 'Tutor Prueba',
            'email' => 'tutor@ejemplo.com',
            'password' => bcrypt('12345678'),
        ]);
        $tutor->assignRole('tutor');

        $internUser = User::factory()->create([
            'name' => 'Becario Prueba',
            'email' => 'becario@ejemplo.com',
            'password' => bcrypt('12345678'),
        ]);
        $internUser->assignRole('intern');


        \App\Models\Center::factory(20)
        ->create()
        ->each(function ($center) {
            \App\Models\Intern::factory(rand(2, 5))->create([
                'center_id' => $center->id,
            ]);
        });
    }
}
