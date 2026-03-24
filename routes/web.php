<?php

use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;
use App\Http\Controllers\CenterController;
use App\Http\Controllers\InternController;

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');

    Route::resource('centros', CenterController::class)->parameters([
    'centros' => 'center'
    ]);
    Route::get('becarios/export', [InternController::class, 'export'])->name('becarios.export');
    
    Route::resource('becarios', InternController::class)->parameters([
        'becarios' => 'intern'
    ]);

    Route::inertia('tareas', 'tareas/index')->name('tareas');
    Route::inertia('control-horario', 'control-horario/index')->name('control-horario');
    Route::inertia('evaluacion', 'evaluacion/index')->name('evaluacion');
});

require __DIR__.'/settings.php';
