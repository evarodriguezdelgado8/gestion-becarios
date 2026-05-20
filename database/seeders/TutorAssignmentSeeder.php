<?php

namespace Database\Seeders;

use App\Models\Intern;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class TutorAssignmentSeeder extends Seeder
{
    public function run(): void
    {
        $tutors = collect([
            ['name' => 'Tutor Prueba', 'email' => 'tutor@ejemplo.com'],
            ['name' => 'Laura Martín Tutor', 'email' => 'laura.tutor@gestion-becarios.test'],
            ['name' => 'Diego Santos Tutor', 'email' => 'diego.tutor@gestion-becarios.test'],
            ['name' => 'Marta Gil Tutor', 'email' => 'marta.tutor@gestion-becarios.test'],
        ])->map(function (array $data) {
            $user = User::firstOrCreate(
                ['email' => $data['email']],
                [
                    'name' => $data['name'],
                    'password' => Hash::make('12345678'),
                    'email_verified_at' => now(),
                ],
            );

            if (! $user->hasRole('tutor')) {
                $user->assignRole('tutor');
            }

            return $user;
        })->values();

        if ($tutors->isEmpty()) {
            return;
        }

        Intern::query()
            ->orderBy('id')
            ->get()
            ->each(function (Intern $intern, int $index) use ($tutors) {
                $intern->update([
                    'tutor_id' => $intern->tutor_id ?: $tutors[$index % $tutors->count()]->id,
                ]);
            });
    }
}
