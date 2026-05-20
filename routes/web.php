<?php

use App\Http\Controllers\CenterController;
use App\Http\Controllers\InternController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\TimeRegistryController;
use App\Http\Controllers\AbsenceController;
use App\Http\Controllers\EvaluationController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

// --- RUTAS PÚBLICAS ---
Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

// --- RUTAS PROTEGIDAS ---
Route::middleware(['auth', 'verified'])->group(function () {

    Route::get('/dashboard', fn() => Inertia::render('dashboard'))->name('dashboard');

    // --- MÓDULO: CENTROS EDUCATIVOS ---
    
    // 1. Primero las rutas de GESTIÓN (CREATE debe ir antes que {center})
    Route::middleware(['can:manage centers'])->group(function () {
        Route::get('/centros/create', [CenterController::class, 'create'])->name('centros.create');
        Route::post('/centros', [CenterController::class, 'store'])->name('centros.store');
        Route::get('/centros/{center}/edit', [CenterController::class, 'edit'])->name('centros.edit');
        Route::put('/centros/{center}', [CenterController::class, 'update'])->name('centros.update');
        Route::delete('/centros/{center}', [CenterController::class, 'destroy'])->name('centros.destroy');
    });

    // 2. Después las rutas de VISUALIZACIÓN
    Route::middleware(['permission:view centers|manage centers'])->group(function () {
        Route::get('/centros', [CenterController::class, 'index'])->name('centros.index');
        Route::get('/centros/{center}', [CenterController::class, 'show'])->name('centros.show');
    });

    // --- MÓDULO: BECARIOS (INTERNS) ---

    // 1. Acciones disponibles para admin y tutor
    Route::middleware(['permission:view interns|manage interns'])->group(function () {
        Route::get('becarios/export', [InternController::class, 'export'])->name('becarios.export');
    
        Route::post('/control-horario/manual', [TimeRegistryController::class, 'storeManual'])->name('time.manual');
        Route::put('/control-horario/{timeRegistry}', [TimeRegistryController::class, 'updateManual'])->name('time.update-manual');
        Route::delete('/control-horario/{timeRegistry}', [TimeRegistryController::class, 'destroy'])->name('time.destroy');
        Route::put('/control-horario/ausencias/{absence}', [AbsenceController::class, 'update'])->name('absences.update');
        
        Route::post('/control-horario/bulk-schedule', [TimeRegistryController::class, 'bulkSchedule'])->name('time.bulk-schedule');
    });

    // 2. Gestión exclusiva de admin
    Route::middleware(['can:manage interns'])->group(function () {
        Route::resource('becarios', InternController::class)
            ->parameters(['becarios' => 'intern'])
            ->except(['index', 'show']);
    });

    // 3. Visualización ({intern} después de export/create)
    Route::middleware(['permission:view interns|manage interns'])->group(function () {
        Route::get('/becarios', [InternController::class, 'index'])->name('becarios.index');
        Route::get('/becarios/{intern}', [InternController::class, 'show'])->name('becarios.show');
    });

    // --- MÓDULO: TAREAS ---
    Route::middleware(['can:view own tasks'])->group(function () {
        Route::get('/tareas', [TaskController::class, 'index'])->name('tareas.index');
        Route::get('/tareas/{task}', [TaskController::class, 'show'])->name('tareas.show');
        Route::post('/tareas/{task}/comments', [TaskController::class, 'storeComment'])->name('tareas.comments.store');
        Route::post('/tareas/{task}/deliveries', [TaskController::class, 'storeDelivery'])->name('tareas.deliveries.store');
    });
    
    Route::middleware(['can:update task status'])->group(function () {
        Route::patch('/tareas/{task}/status', [TaskController::class, 'updateStatus'])->name('tareas.updateStatus');
    });

    Route::middleware(['permission:create tasks|edit any task|delete tasks'])->group(function () {
        Route::post('/tareas', [TaskController::class, 'store'])->name('tareas.store');
        Route::match(['post', 'put'], '/tareas/{task}', [TaskController::class, 'update'])->name('tareas.update');
        Route::delete('/tareas/{task}', [TaskController::class, 'destroy'])->name('tareas.destroy');
    });

    // --- MÓDULO: CONTROL HORARIO ---
    Route::middleware(['auth', 'can:view own tasks'])->group(function () {
        
        Route::get('/control-horario', [TimeRegistryController::class, 'index'])->name('control-horario');
        Route::get('/control-horario/parte-horas/pdf', [TimeRegistryController::class, 'exportPdf'])->name('control-horario.pdf');
        Route::post('/control-horario/check-in', [TimeRegistryController::class, 'store'])->name('control-horario.check-in');
        Route::patch('/control-horario/{timeRegistry}/check-out', [TimeRegistryController::class, 'update'])->name('control-horario.check-out');
        Route::post('/control-horario/ausencias', [AbsenceController::class, 'store'])->name('absences.store');

    });

    // --- MÓDULO: EVALUACIÓN ---
    Route::middleware(['auth'])->group(function () {
        Route::get('/evaluaciones/{evaluation}/pdf', [EvaluationController::class, 'exportPdf'])->name('evaluaciones.pdf');
        
        // Rutas compartidas por Admin y Tutor (Evaluar y Ver Historial)
        Route::middleware(['role:admin|tutor'])->group(function () {
            Route::get('/evaluaciones', [EvaluationController::class, 'index'])->name('evaluaciones.index');
            Route::get('/evaluaciones/historico', [EvaluationController::class, 'history'])->name('evaluaciones.history');
            Route::get('/evaluaciones/crear/{intern}', [EvaluationController::class, 'create'])->name('evaluaciones.create');
            Route::post('/evaluaciones', [EvaluationController::class, 'store'])->name('evaluaciones.store');
            Route::get('/evaluaciones/{evaluation}/editar', [EvaluationController::class, 'edit'])->name('evaluaciones.edit');
            Route::put('/evaluaciones/{evaluation}', [EvaluationController::class, 'update'])->name('evaluaciones.update');
            Route::delete('/evaluaciones/{evaluation}', [EvaluationController::class, 'destroy'])->name('evaluaciones.destroy');
        });

        Route::middleware(['role:admin'])->group(function () {
            
            // Configuracion de Criterios
            Route::get('/evaluaciones/configuracion', [EvaluationController::class, 'config'])->name('evaluaciones.config');
            Route::post('/evaluaciones/categorias', [EvaluationController::class, 'storeCategory'])->name('evaluaciones.categories.store');
            Route::put('/evaluaciones/categorias/{category}', [EvaluationController::class, 'updateCategory'])->name('evaluaciones.categories.update');
            Route::delete('/evaluaciones/categorias/{category}', [EvaluationController::class, 'destroyCategory'])->name('evaluaciones.categories.destroy');
            Route::post('/evaluaciones/criterios', [EvaluationController::class, 'storeCriterion'])->name('evaluaciones.criteria.store');
            Route::put('/evaluaciones/criterios/{criterion}', [EvaluationController::class, 'updateCriterion'])->name('evaluaciones.criteria.update');
            Route::delete('/evaluaciones/criterios/{criterion}', [EvaluationController::class, 'destroyCriterion'])->name('evaluaciones.criteria.destroy');
        });

        // Ruta para que el becario vea sus propias notas
        Route::middleware(['role:intern'])->group(function () {
            Route::get('/mis-evaluaciones', [EvaluationController::class, 'myEvaluations'])->name('evaluaciones.mine');
        });
    });

    // --- MÓDULO: ADMINISTRACIÓN (Solo Admin) ---
    Route::middleware(['role:admin'])->group(function () {
        Route::get('/admin', [RoleController::class, 'index'])->name('admin.index');
        Route::post('/admin/roles/{role}', [RoleController::class, 'update'])->name('admin.roles.update');
    });
});

require __DIR__.'/settings.php';
