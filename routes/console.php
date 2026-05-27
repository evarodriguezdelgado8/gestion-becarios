<?php

use App\Models\Intern;
use App\Models\User;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('interns:link-users', function () {
    Role::firstOrCreate(['name' => 'intern']);

    $created = 0;
    $linked = 0;

    DB::transaction(function () use (&$created, &$linked) {
        Intern::query()
            ->whereNull('user_id')
            ->orderBy('id')
            ->get()
            ->each(function (Intern $intern) use (&$created, &$linked) {
                $user = User::query()
                    ->where('email', $intern->email)
                    ->whereDoesntHave('roles', fn ($query) => $query->where('name', 'admin'))
                    ->first();

                if (! $user || Intern::query()->where('user_id', $user->id)->exists()) {
                    $email = $intern->email;
                    if (User::query()->where('email', $email)->exists()) {
                        $email = 'becario-'.$intern->id.'@gestion-becarios.test';
                    }

                    $user = User::create([
                        'name' => trim($intern->name.' '.$intern->last_name),
                        'email' => $email,
                        'password' => Hash::make($intern->dni ?: '12345678'),
                    ]);
                    $created++;
                }

                $user->assignRole('intern');
                $intern->update(['user_id' => $user->id]);
                $linked++;
            });
    });

    $this->info("Becarios conectados: {$linked}. Usuarios creados: {$created}.");
})->purpose('Create and link intern users for existing interns without user_id');
