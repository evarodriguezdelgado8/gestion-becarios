<?php

namespace App\Http\Controllers;

use App\Models\Intern;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class ScheduleController extends Controller
{
    /**
     * Mostrar los horarios de un becario específico.
     */
    public function edit(Intern $intern)
    {
        $scheduleOwner = $intern->user;

        abort_unless($scheduleOwner, 404, 'El becario no tiene un usuario asociado.');

        return Inertia::render('control-horario/config', [
            'intern' => $intern, 
            'currentSchedules' => $scheduleOwner->schedules,
        ]);
    }

    /**
     * Guardar el horario semanal.
     */
    public function store(Request $request, Intern $intern)
    {
        $scheduleOwner = $intern->user;

        abort_unless($scheduleOwner, 404, 'El becario no tiene un usuario asociado.');

        $request->validate([
            'schedules' => 'required|array',
            'schedules.*.day_of_week' => 'required|integer|min:1|max:7',
            'schedules.*.start_time' => 'nullable|date_format:H:i',
            'schedules.*.end_time' => 'nullable|date_format:H:i',
            'schedules.*.enabled' => 'required|boolean',
        ]);

        foreach ($request->schedules as $schedule) {
            if (! ($schedule['enabled'] ?? false)) {
                continue;
            }

            if (empty($schedule['start_time']) || empty($schedule['end_time']) || $schedule['end_time'] <= $schedule['start_time']) {
                throw ValidationException::withMessages([
                    'schedules' => 'Cada dia activo necesita una hora de inicio y fin valida.',
                ]);
            }
        }

        $scheduleOwner->schedules()->delete();

        foreach ($request->schedules as $schedule) {
            if (!($schedule['enabled'] ?? false)) {
                continue;
            }

            $scheduleOwner->schedules()->create([
                'day_of_week' => $schedule['day_of_week'],
                'start_time' => $schedule['start_time'],
                'end_time' => $schedule['end_time'],
            ]);
        }

        return back()->with('success', 'Horario actualizado correctamente.');
    }
}
