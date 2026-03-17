<?php

use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;
use App\Http\Controllers\CenterController;

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
    Route::resource('centros', CenterController::class)->parameters([
    'centros' => 'center'
    ]);

    Route::inertia('becarios', 'becarios/index')->name('becarios');
    Route::inertia('tareas', 'tareas/index')->name('tareas');
    Route::inertia('control-horario', 'control-horario/index')->name('control-horario');
    Route::inertia('evaluacion', 'evaluacion/index')->name('evaluacion');
});

require __DIR__.'/settings.php';
