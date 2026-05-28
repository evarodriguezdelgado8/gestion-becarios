<?php

namespace Database\Seeders;

use App\Models\Center;
use App\Models\Intern;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([RoleSeeder::class]);

        $admin = $this->seedUser(
            'prueba@gestion-becarios.com',
            'Eva Rodriguez Delgado',
            '12345678',
        );
        $admin->assignRole('admin');

        $centers = collect([
            [
                'nif' => 'A10000001',
                'name' => 'IES Monteverde',
                'address' => 'Calle Mayor 12, Madrid',
                'phone' => '910 100 001',
                'email' => 'monteverde@gestion-becarios.test',
                'web' => 'https://monteverde.example.com',
                'contact_name' => 'Ana Perez',
                'contact_role' => 'Coordinadora de practicas',
                'contact_phone' => '610 100 001',
                'contact_email' => 'ana.perez@monteverde.test',
            ],
            [
                'nif' => 'A10000002',
                'name' => 'Centro Formativo Norte',
                'address' => 'Avenida Europa 45, Alcobendas',
                'phone' => '910 100 002',
                'email' => 'norte@gestion-becarios.test',
                'web' => 'https://norte.example.com',
                'contact_name' => 'Carlos Medina',
                'contact_role' => 'Tutor academico',
                'contact_phone' => '610 100 002',
                'contact_email' => 'carlos.medina@norte.test',
            ],
            [
                'nif' => 'A10000003',
                'name' => 'Escuela Profesional Central',
                'address' => 'Plaza de la Industria 8, Getafe',
                'phone' => '910 100 003',
                'email' => 'central@gestion-becarios.test',
                'web' => 'https://central.example.com',
                'contact_name' => 'Lucia Ramos',
                'contact_role' => 'Responsable de FCT',
                'contact_phone' => '610 100 003',
                'contact_email' => 'lucia.ramos@central.test',
            ],
            [
                'nif' => 'A10000004',
                'name' => 'Instituto Tecnologico Sur',
                'address' => 'Calle Innovacion 23, Leganes',
                'phone' => '910 100 004',
                'email' => 'sur@gestion-becarios.test',
                'web' => 'https://sur.example.com',
                'contact_name' => 'Sergio Diaz',
                'contact_role' => 'Coordinador de practicas',
                'contact_phone' => '610 100 004',
                'contact_email' => 'sergio.diaz@sur.test',
            ],
            [
                'nif' => 'A10000005',
                'name' => 'Campus Digital Este',
                'address' => 'Ronda del Software 5, Alcala de Henares',
                'phone' => '910 100 005',
                'email' => 'este@gestion-becarios.test',
                'web' => 'https://este.example.com',
                'contact_name' => 'Marta Leon',
                'contact_role' => 'Jefa de estudios',
                'contact_phone' => '610 100 005',
                'contact_email' => 'marta.leon@este.test',
            ],
        ])->map(function (array $center) {
            $model = Center::withTrashed()->updateOrCreate(
                ['email' => $center['email']],
                $center,
            );
            $model->restore();

            return $model;
        })->values();

        $interns = [
            ['Becario', 'Prueba', '12345678A', 'becario@ejemplo.com', 'DAW', 'active', 0, 18, 280],
            ['Claudia', 'Navas', '10000001A', 'claudia.navas@gestion-becarios.test', 'DAW', 'active', 1, 22, 160],
            ['Mario', 'Soler', '10000002B', 'mario.soler@gestion-becarios.test', 'DAM', 'active', 2, 30, 210],
            ['Irene', 'Vega', '10000003C', 'irene.vega@gestion-becarios.test', 'ASIR', 'active', 3, 26, 120],
            ['Daniel', 'Cortes', '10000004D', 'daniel.cortes@gestion-becarios.test', 'DAW', 'finished', 4, -2, 400],
            ['Nerea', 'Castro', '10000005E', 'nerea.castro@gestion-becarios.test', 'DAM', 'active', 4, 35, 90],
            ['Hugo', 'Molina', '10000006F', 'hugo.molina@gestion-becarios.test', 'ASIR', 'abandoned', 0, 4, 60],
            ['Paula', 'Santos', '10000007G', 'paula.santos@gestion-becarios.test', 'DAW', 'active', 0, 12, 320],
            ['Adrian', 'Lopez', '10000008H', 'adrian.lopez@gestion-becarios.test', 'DAM', 'active', 1, 16, 250],
            ['Sara', 'Martin', '10000009J', 'sara.martin@gestion-becarios.test', 'ASIR', 'finished', 4, -6, 400],
            ['Raul', 'Ortega', '10000010K', 'raul.ortega@gestion-becarios.test', 'DAW', 'active', 2, 20, 190],
            ['Elena', 'Prieto', '10000011L', 'elena.prieto@gestion-becarios.test', 'DAM', 'active', 3, 28, 140],
        ];

        foreach ($interns as $index => [$name, $lastName, $dni, $email, $cycle, $status, $centerIndex, $endWeeks, $hours]) {
            $center = $centers->get($centerIndex) ?? $centers[$index % $centers->count()];

            $user = $this->seedUser(
                $email,
                trim($name.' '.$lastName),
                $email === 'becario@ejemplo.com' ? '12345678' : 'password',
            );
            $user->assignRole('intern');

            $intern = Intern::withTrashed()->updateOrCreate(
                ['email' => $email],
                [
                    'user_id' => $user->id,
                    'center_id' => $center->id,
                    'name' => $name,
                    'last_name' => $lastName,
                    'dni' => $dni,
                    'phone' => '600 200 '.str_pad((string) ($index + 1), 3, '0', STR_PAD_LEFT),
                    'address' => 'Calle Practicas '.($index + 1),
                    'academic_cycle' => $cycle,
                    'academic_tutor' => 'Tutor academico '.($index + 1),
                    'status' => $status,
                    'start_date' => now()->subWeeks(12)->addWeeks($index % 4)->toDateString(),
                    'end_date' => now()->addWeeks($endWeeks)->toDateString(),
                    'total_hours' => 400,
                    'completed_hours' => $hours,
                ],
            );
            $intern->restore();
        }

        $this->call([TutorAssignmentSeeder::class]);
    }

    private function seedUser(string $email, string $name, string $password): User
    {
        $user = User::firstOrNew(['email' => $email]);

        $user->forceFill([
            'name' => $name,
            'password' => Hash::make($password),
            'email_verified_at' => $user->email_verified_at ?? now(),
        ])->save();

        return $user;
    }
}
