<?php

use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;
use Inertia\Inertia;
use App\Http\Controllers\CenterController;
use App\Http\Controllers\InternController;
use App\Http\Controllers\TaskController;

// --- RUTAS PÚBLICAS ---
Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

// --- RUTAS PROTEGIDAS (Requieren Login) ---
Route::middleware(['auth', 'verified'])->group(function () {
    
    Route::get('/dashboard', fn() => Inertia::render('dashboard'))->name('dashboard');
    Route::inertia('control-horario', 'control-horario/index')->name('control-horario');

    // --- BLOQUE ADMINISTRACIÓN (Centros y Becarios) ---
    Route::middleware(['role:admin|tutor'])->group(function () {
            
        // 1. PRIMERO: Las rutas fijas de creación (Solo Admin)
        Route::middleware(['role:admin'])->group(function () {
            Route::get('/centros/create', [CenterController::class, 'create'])->name('centros.create');
            Route::post('/centros', [CenterController::class, 'store'])->name('centros.store');
        });

        // 2. SEGUNDO: Las rutas generales y de visualización
        Route::get('/centros', [CenterController::class, 'index'])->name('centros.index');
        Route::get('/centros/{center}', [CenterController::class, 'show'])->name('centros.show');
        Route::get('becarios/export', [InternController::class, 'export'])->name('becarios.export');

        // 3. TERCERO: El resto de acciones de Admin (Edit, Update, Destroy)
        Route::middleware(['role:admin'])->group(function () {
            Route::get('/centros/{center}/edit', [CenterController::class, 'edit'])->name('centros.edit');
            Route::put('/centros/{center}', [CenterController::class, 'update'])->name('centros.update');
            Route::delete('/centros/{center}', [CenterController::class, 'destroy'])->name('centros.destroy');
            
            Route::resource('becarios', InternController::class)
                ->parameters(['becarios' => 'intern']) 
                ->except(['index', 'show']);
        });

        // 4. CUARTO: Rutas de visualización de becarios
        Route::get('/becarios', [InternController::class, 'index'])->name('becarios.index');
        Route::get('/becarios/{intern}', [InternController::class, 'show'])->name('becarios.show');
    });

    // --- BLOQUE TAREAS  ---
    // Listado y creación
    Route::get('/tareas', [TaskController::class, 'index'])->name('tareas.index');
    Route::post('/tareas', [TaskController::class, 'store'])->name('tareas.store');

    // Rutas con ID específico
    Route::patch('/tareas/{task}/status', [TaskController::class, 'updateStatus'])->name('tareas.updateStatus');
    Route::post('/tareas/{task}/comments', [TaskController::class, 'storeComment'])->name('tareas.comments.store');
    Route::post('/tareas/{task}/deliveries', [TaskController::class, 'storeDelivery'])->name('tareas.deliveries.store');

    
    // ELIMINAR
    Route::delete('/tareas/{task}', [TaskController::class, 'destroy'])->name('tareas.destroy');

    // EDITAR 
    Route::match(['post', 'put'], '/tareas/{task}', [TaskController::class, 'update'])->name('tareas.update');

    // Ver detalle
    Route::get('/tareas/{task}', [TaskController::class, 'show'])->name('tareas.show');
    
    // --- EVALUACIÓN ---
    Route::middleware(['role:admin|tutor|intern'])->group(function () {
        Route::inertia('evaluacion', 'evaluacion/index')->name('evaluacion');
    });
});

require __DIR__.'/settings.php';