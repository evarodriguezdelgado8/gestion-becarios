<?php

namespace App\Http\Controllers;

use App\Models\TimeRegistry;
use App\Models\User;
use App\Models\Intern;
use App\Models\Center;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class TimeRegistryController extends Controller
{
    public function index(Request $request): Response
    {
        /** @var User $user */
        $user = Auth::user();
        $data = [];

        if ($user->hasRole('intern')) {
            $data['activeSession'] = $user->timeRegistries()->whereNull('check_out')->first();
            $data['registries'] = $user->timeRegistries()->latest()->get();
            $data['schedules'] = $user->schedules()->get();
            $data['role'] = 'intern';
        } 
        else {
            $query = Intern::query()->with(['center:id,name', 'user']);

            $hasFilters = $request->filled('intern_id') || $request->filled('center_id') || $request->filled('academic_cycle');

            if ($hasFilters) {
                if ($request->filled('intern_id')) {
                    $query->whereIn('id', explode(',', $request->intern_id));
                }
                if ($request->filled('center_id')) {
                    $query->whereIn('center_id', explode(',', $request->center_id));
                }
                if ($request->filled('academic_cycle')) {
                    $query->whereIn('academic_cycle', explode(',', $request->academic_cycle));
                }
                
                $data['becarios'] = $query->get()->map(fn($i) => [
                    'id' => $i->id,
                    'user_id' => $i->user_id,
                    'name' => $i->name,
                    'last_name' => $i->last_name,
                    'center' => $i->center,
                ]);
            } else {
                $data['becarios'] = [];
            }

            $data['centers'] = Center::all(['id', 'name']);
            $data['allInterns'] = Intern::all(['id', 'name', 'last_name']);
            $data['cycleOptions'] = Intern::whereNotNull('academic_cycle')->distinct()->pluck('academic_cycle')
                ->map(fn($c) => ['label' => $c, 'value' => $c])->values();

            $data['role'] = 'manager';
            $data['filters'] = $request->only(['intern_id', 'center_id', 'academic_cycle']);
        }

        return Inertia::render('control-horario/index', $data);
    }

    // Registro manual para uno o varios becarios
    public function storeManual(Request $request)
    {
        $request->validate([
            'user_ids' => 'required|array',
            'check_in' => 'required|date',
            'check_out' => 'required|date|after:check_in',
            'note' => 'nullable|string'
        ]);

        $checkIn = Carbon::parse($request->check_in);
        $checkOut = Carbon::parse($request->check_out);
        $hours = round($checkIn->diffInMinutes($checkOut) / 60, 2);

        foreach ($request->user_ids as $userId) {
            TimeRegistry::create([
                'user_id' => $userId,
                'check_in' => $checkIn,
                'check_out' => $checkOut,
                'total_hours' => $hours,
                'type' => 'manual',
                'status' => $request->status ?? 'normal',
                'note' => $request->note
            ]);
        }

        return back()->with('success', 'Registros manuales creados correctamente.');
    }

    // Configuración de horarios masiva
    public function bulkSchedule(Request $request)
    {
        $request->validate([
            'user_ids' => 'required|array',
            'schedules' => 'required|array' // Array de {day, start, end}
        ]);

        foreach ($request->user_ids as $userId) {
            $user = User::find($userId);
            foreach ($request->schedules as $dayNum => $times) {
                if ($times['start'] && $times['end']) {
                    $user->schedules()->updateOrCreate(
                        ['day_of_week' => $dayNum],
                        ['start_time' => $times['start'], 'end_time' => $times['end']]
                    );
                }
            }
        }

        return back()->with('success', 'Horarios actualizados correctamente.');
    }
    /**
     * Registrar la entrada (Check-in) con lógica de retraso.
     */
    public function store(Request $request)
    {
        /** @var User $user */
        $user = Auth::user();

        $activeRegistry = $user->timeRegistries()->whereNull('check_out')->first();
        if ($activeRegistry) {
            return back()->with('error', 'Ya tienes un turno activo.');
        }

        $now = Carbon::now();
        $status = 'normal';

        // Lógica de Retraso: Buscamos el horario de hoy (ISO: 1 Lunes - 7 Domingo)
        $schedule = $user->schedules()->where('day_of_week', $now->dayOfWeekIso)->first();

        if ($schedule) {
            $plannedStart = Carbon::createFromTimeString($schedule->start_time);
            if ($now->toTimeString() > $plannedStart->addMinutes(15)->toTimeString()) {
                $status = 'late';
            }
        }

        $user->timeRegistries()->create([
            'check_in' => $now,
            'type' => 'automatic',
            'status' => $status,
        ]);

        return back()->with('success', $status === 'late' ? 'Entrada registrada con retraso.' : 'Entrada registrada correctamente.');
    }

    /**
     * Registrar la salida (Check-out).
     */
    public function update(Request $request, TimeRegistry $timeRegistry)
    {
        // Verificar pertenencia
        if ($timeRegistry->user_id !== Auth::id() || $timeRegistry->check_out !== null) {
            return back()->with('error', 'Acción no permitida.');
        }

        $checkOut = Carbon::now();
        $checkIn = Carbon::parse($timeRegistry->check_in);

        // Calcular horas
        $totalHours = $checkIn->diffInMinutes($checkOut) / 60;

        $timeRegistry->update([
            'check_out' => $checkOut,
            'total_hours' => round($totalHours, 2),
        ]);

        return back()->with('success', 'Salida registrada correctamente.');
    }

    public function updateManual(Request $request, TimeRegistry $timeRegistry)
    {
        // Solo admins o tutores pueden editar registros de otros
        /** @var \App\Models\User|null $user */
        $user = Auth::user();
        if (!$user || !$user->hasAnyRole(['admin', 'tutor'])) {
            abort(403);
        }

        $request->validate([
            'check_in' => 'required|date',
            'check_out' => 'required|date|after:check_in',
            'status' => 'required|string',
            'note' => 'nullable|string'
        ]);

        $checkIn = Carbon::parse($request->check_in);
        $checkOut = Carbon::parse($request->check_out);
        $hours = round($checkIn->diffInMinutes($checkOut) / 60, 2);

        $timeRegistry->update([
            'check_in' => $checkIn,
            'check_out' => $checkOut,
            'total_hours' => $hours,
            'status' => $request->status,
            'note' => $request->note,
            'type' => 'manual' // Marcamos como manual si el tutor lo toca
        ]);

        return back()->with('success', 'Fichaje actualizado correctamente.');
    }

    public function destroy(TimeRegistry $timeRegistry)
    {
        /** @var \App\Models\User|null $user */
        $user = Auth::user();
        if (!$user || !$user->hasAnyRole(['admin', 'tutor'])) {
            abort(403);
        }

        $timeRegistry->delete();
        return back()->with('success', 'Fichaje eliminado.');
    }
}