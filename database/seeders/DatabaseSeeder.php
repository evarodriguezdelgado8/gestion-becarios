<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
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

        $user = User::factory()->create([
            'name' => 'Eva Rodriguez Delgado',
            'email' => 'prueba@gestion-becarios.com',
            'password' => bcrypt('12345678'),
        ]);

        //$user->assignRole('admin');


        \App\Models\Center::factory(20)
        ->create()
        ->each(function ($center) {
            \App\Models\Intern::factory(rand(2, 5))->create([
                'center_id' => $center->id,
            ]);
        });
    }
}
