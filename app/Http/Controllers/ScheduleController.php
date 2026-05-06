<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Schedule;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ScheduleController extends Controller
{
    /**
     * Mostrar los horarios de un becario específico.
     */
    public function edit(User $intern)
    {
        return Inertia::render('control-horario/config', [
            'intern' => $intern, 
            'currentSchedules' => $intern->schedules,
        ]);
    }

    /**
     * Guardar el horario semanal.
     */
    public function store(Request $request, User $intern)
    {
        $request->validate([
            'schedules' => 'required|array',
            'schedules.*.day_of_week' => 'required|integer|min:1|max:7',
            'schedules.*.start_time' => 'nullable|date_format:H:i',
            'schedules.*.end_time' => 'nullable|date_format:H:i',
            'schedules.*.enabled' => 'required|boolean',
        ]);

        $intern->schedules()->delete();

        foreach ($request->schedules as $schedule) {
            if (!($schedule['enabled'] ?? false)) {
                continue;
            }

            $intern->schedules()->create([
                'day_of_week' => $schedule['day_of_week'],
                'start_time' => $schedule['start_time'],
                'end_time' => $schedule['end_time'],
            ]);
        }

        return back()->with('success', 'Horario actualizado correctamente.');
    }
}