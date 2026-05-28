<?php

namespace Database\Seeders;

use App\Models\Center;
use Illuminate\Database\Seeder;

class CenterSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        foreach ($this->centers() as $center) {
            $model = Center::withTrashed()->updateOrCreate(
                ['email' => $center['email']],
                $center,
            );
            $model->restore();
        }
    }

    /**
     * @return array<int, array<string, string>>
     */
    private function centers(): array
    {
        return [
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
        ];
    }
}
