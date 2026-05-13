<?php

namespace App\Http\Controllers;

use App\Models\Absence;
use App\Models\Center;
use App\Models\Intern;
use App\Models\TimeRegistry;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

use function Spatie\LaravelPdf\Support\pdf;

class TimeRegistryController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        if (! $user instanceof User) {
            abort(403);
        }

        $data = [];

        if ($user->hasRole('intern')) {
            $intern = Intern::query()
                ->where('user_id', $user->id)
                ->first(['id', 'user_id', 'name', 'last_name', 'total_hours', 'completed_hours', 'start_date', 'end_date']);

            $data['activeSession'] = $user->timeRegistries()->whereNull('check_out')->first();
            $data['registries'] = $user->timeRegistries()->latest()->get();
            $data['schedules'] = $user->schedules()->get();
            $data['intern'] = $intern ? [
                'id' => $intern->id,
                'user_id' => $intern->user_id,
                'name' => $intern->name,
                'last_name' => $intern->last_name,
                'total_hours' => $intern->total_hours,
                'completed_hours' => $this->workedHoursForUser($user->id),
                'start_date' => $intern->start_date,
                'end_date' => $intern->end_date,
            ] : null;
            $data['absences'] = $user->absences()
                ->latest('date')
                ->get()
                ->map(fn ($absence) => [
                    'id' => $absence->id,
                    'date' => $absence->date?->toDateString(),
                    'reason' => $absence->reason,
                    'status' => $absence->status,
                    'tutor_comment' => $absence->tutor_comment,
                    'attachment_url' => $this->publicStorageUrl($absence->attachment_path),
                ]);
            $data['role'] = 'intern';
        } else {
            $query = Intern::query()->with(['center:id,name', 'user.schedules:id,user_id,day_of_week,start_time,end_time']);
            $data['managerRegistries'] = [];
            $data['managerAbsences'] = [];

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

                $interns = $query->get();
                $internIndex = $interns
                    ->filter(fn ($intern) => ! empty($intern->user_id))
                    ->keyBy('user_id');

                $data['becarios'] = $interns->map(fn ($i) => [
                    'id' => $i->id,
                    'user_id' => $i->user_id,
                    'name' => $i->name,
                    'last_name' => $i->last_name,
                    'center' => $i->center,
                    'total_hours' => $i->total_hours,
                    'completed_hours' => $i->user_id ? $this->workedHoursForUser($i->user_id) : 0,
                    'schedules' => $i->user?->schedules?->values() ?? [],
                ]);

                $data['managerRegistries'] = TimeRegistry::query()
                    ->whereIn('user_id', $internIndex->keys())
                    ->orderByDesc('check_in')
                    ->get()
                    ->map(function ($registry) use ($internIndex) {
                        $intern = $internIndex->get($registry->user_id);

                        return [
                            'id' => $registry->id,
                            'user_id' => $registry->user_id,
                            'intern_id' => $intern?->id,
                            'intern_name' => trim(($intern?->name ?? '').' '.($intern?->last_name ?? '')),
                            'center_name' => $intern?->center?->name,
                            'check_in' => $registry->check_in,
                            'check_out' => $registry->check_out,
                            'total_hours' => $registry->total_hours,
                            'type' => $registry->type,
                            'status' => $registry->status,
                            'note' => $registry->note,
                        ];
                    })
                    ->values();

                $data['managerAbsences'] = Absence::query()
                    ->whereIn('user_id', $internIndex->keys())
                    ->orderByDesc('date')
                    ->get()
                    ->map(function ($absence) use ($internIndex) {
                        $intern = $internIndex->get($absence->user_id);

                        return [
                            'id' => $absence->id,
                            'user_id' => $absence->user_id,
                            'intern_id' => $intern?->id,
                            'intern_name' => trim(($intern?->name ?? '').' '.($intern?->last_name ?? '')),
                            'center_name' => $intern?->center?->name,
                            'date' => $absence->date?->toDateString(),
                            'reason' => $absence->reason,
                            'status' => $absence->status,
                            'tutor_comment' => $absence->tutor_comment,
                            'reviewed_at' => $absence->reviewed_at?->toDateTimeString(),
                            'updated_at' => $absence->updated_at?->toDateTimeString(),
                            'attachment_url' => $this->publicStorageUrl($absence->attachment_path),
                        ];
                    })
                    ->values();
            } else {
                $today = Carbon::today();
                $interns = $query->get();
                $internIndex = $interns
                    ->filter(fn ($intern) => ! empty($intern->user_id))
                    ->keyBy('user_id');

                $data['becarios'] = $interns->map(fn ($i) => [
                    'id' => $i->id,
                    'user_id' => $i->user_id,
                    'name' => $i->name,
                    'last_name' => $i->last_name,
                    'center' => $i->center,
                    'total_hours' => $i->total_hours,
                    'completed_hours' => $i->user_id ? $this->workedHoursForUser($i->user_id) : 0,
                    'schedules' => $i->user?->schedules?->values() ?? [],
                ]);

                $data['managerRegistries'] = TimeRegistry::query()
                    ->whereIn('user_id', $internIndex->keys())
                    ->where(function ($query) use ($today) {
                        $query->whereDate('check_in', $today)
                            ->orWhereNull('check_out')
                            ->orWhere(function ($query) use ($today) {
                                $query->where('status', 'late')
                                    ->where('check_in', '>=', $today->copy()->subDays(7)->startOfDay());
                            });
                    })
                    ->orderByDesc('check_in')
                    ->limit(80)
                    ->get()
                    ->map(function ($registry) use ($internIndex) {
                        $intern = $internIndex->get($registry->user_id);

                        return [
                            'id' => $registry->id,
                            'user_id' => $registry->user_id,
                            'intern_id' => $intern?->id,
                            'intern_name' => trim(($intern?->name ?? '').' '.($intern?->last_name ?? '')),
                            'center_name' => $intern?->center?->name,
                            'check_in' => $registry->check_in,
                            'check_out' => $registry->check_out,
                            'total_hours' => $registry->total_hours,
                            'type' => $registry->type,
                            'status' => $registry->status,
                            'note' => $registry->note,
                        ];
                    })
                    ->values();

                $data['managerAbsences'] = Absence::query()
                    ->whereIn('user_id', $internIndex->keys())
                    ->where(function ($query) use ($today) {
                        $query->where('status', 'pending')
                            ->orWhereDate('date', $today)
                            ->orWhereDate('reviewed_at', $today)
                            ->orWhere(function ($query) use ($today) {
                                $query->whereNull('reviewed_at')
                                    ->whereIn('status', ['approved', 'rejected'])
                                    ->whereDate('updated_at', $today);
                            });
                    })
                    ->orderByDesc('date')
                    ->limit(80)
                    ->get()
                    ->map(function ($absence) use ($internIndex) {
                        $intern = $internIndex->get($absence->user_id);

                        return [
                            'id' => $absence->id,
                            'user_id' => $absence->user_id,
                            'intern_id' => $intern?->id,
                            'intern_name' => trim(($intern?->name ?? '').' '.($intern?->last_name ?? '')),
                            'center_name' => $intern?->center?->name,
                            'date' => $absence->date?->toDateString(),
                            'reason' => $absence->reason,
                            'status' => $absence->status,
                            'tutor_comment' => $absence->tutor_comment,
                            'reviewed_at' => $absence->reviewed_at?->toDateTimeString(),
                            'updated_at' => $absence->updated_at?->toDateTimeString(),
                            'attachment_url' => $this->publicStorageUrl($absence->attachment_path),
                        ];
                    })
                    ->values();
            }

            $data['centers'] = Center::all(['id', 'name']);
            $data['allInterns'] = Intern::all(['id', 'name', 'last_name']);
            $data['cycleOptions'] = Intern::whereNotNull('academic_cycle')
                ->distinct()
                ->pluck('academic_cycle')
                ->map(fn ($c) => ['label' => $c, 'value' => $c])
                ->values();

            $data['role'] = 'manager';
            $data['filters'] = $request->only(['intern_id', 'center_id', 'academic_cycle']);
        }

        return Inertia::render('control-horario/index', $data);
    }

    private function publicStorageUrl(?string $path): ?string
    {
        return $path ? asset('storage/'.$path) : null;
    }

    private function workedHoursForUser(int $userId): float
    {
        return (float) TimeRegistry::query()
            ->where('user_id', $userId)
            ->whereNotNull('check_out')
            ->sum('total_hours');
    }

    private function syncInternCompletedHours(int $userId): void
    {
        Intern::query()
            ->where('user_id', $userId)
            ->update(['completed_hours' => round($this->workedHoursForUser($userId))]);
    }

    private function normalizeRegistryStatus(?string $status): string
    {
        return $status === 'late' ? 'late' : 'normal';
    }

    private function ensureInternUser(?User $user): User
    {
        if (! $user || ! $user->hasRole('intern') || ! Intern::where('user_id', $user->id)->exists()) {
            abort(403);
        }

        return $user;
    }

    private function ensureNoOverlap(int $userId, Carbon $checkIn, Carbon $checkOut, ?int $exceptRegistryId = null): void
    {
        $overlaps = TimeRegistry::query()
            ->where('user_id', $userId)
            ->when($exceptRegistryId, fn ($query) => $query->whereKeyNot($exceptRegistryId))
            ->where('check_in', '<', $checkOut)
            ->where(fn ($query) => $query
                ->whereNull('check_out')
                ->orWhere('check_out', '>', $checkIn))
            ->exists();

        if ($overlaps) {
            throw ValidationException::withMessages([
                'check_in' => 'El fichaje se solapa con otro registro existente.',
            ]);
        }
    }

    // Registro manual para uno o varios becarios
    public function storeManual(Request $request)
    {
        $request->validate([
            'user_ids' => 'required|array',
            'user_ids.*' => 'exists:users,id',
            'check_in' => 'required|date',
            'check_out' => 'required|date|after:check_in',
            'status' => 'nullable|in:normal,puntual,late',
            'note' => 'nullable|string',
        ]);

        $checkIn = Carbon::parse($request->check_in);
        $checkOut = Carbon::parse($request->check_out);
        $hours = round($checkIn->diffInMinutes($checkOut) / 60, 2);

        DB::transaction(function () use ($request, $checkIn, $checkOut, $hours) {
            foreach ($request->user_ids as $userId) {
                if (! Intern::where('user_id', $userId)->exists()) {
                    throw ValidationException::withMessages([
                        'user_ids' => 'Solo se pueden crear fichajes para becarios.',
                    ]);
                }

                $this->ensureNoOverlap((int) $userId, $checkIn, $checkOut);

                TimeRegistry::create([
                    'user_id' => $userId,
                    'check_in' => $checkIn,
                    'check_out' => $checkOut,
                    'total_hours' => $hours,
                    'type' => 'manual',
                    'status' => $this->normalizeRegistryStatus($request->status),
                    'note' => $request->note,
                ]);

                $this->syncInternCompletedHours((int) $userId);
            }
        });

        return back()->with('success', 'Registros manuales creados correctamente.');
    }

    // Configuración de horarios masiva
    public function bulkSchedule(Request $request)
    {
        $request->validate([
            'user_ids' => 'required|array',
            'user_ids.*' => 'exists:users,id',
            'schedules' => 'required|array', // Array de {day, start, end}
        ]);

        DB::transaction(function () use ($request) {
            foreach ($request->user_ids as $userId) {
                if (! Intern::where('user_id', $userId)->exists()) {
                    throw ValidationException::withMessages([
                        'user_ids' => 'Solo se pueden configurar horarios de becarios.',
                    ]);
                }

                $user = User::findOrFail($userId);

                foreach ($request->schedules as $dayNum => $times) {
                    $dayNum = (int) $dayNum;
                    if ($dayNum < 1 || $dayNum > 7) {
                        continue;
                    }

                    if (! empty($times['start']) && ! empty($times['end'])) {
                        if ($times['end'] <= $times['start']) {
                            throw ValidationException::withMessages([
                                'schedules' => 'La hora de fin debe ser posterior a la hora de inicio.',
                            ]);
                        }

                        $user->schedules()->updateOrCreate(
                            ['day_of_week' => $dayNum],
                            ['start_time' => $times['start'], 'end_time' => $times['end']],
                        );
                    } else {
                        $user->schedules()->where('day_of_week', $dayNum)->delete();
                    }
                }
            }
        });

        return back()->with('success', 'Horarios actualizados correctamente.');
    }

    /**
     * Registrar la entrada (Check-in) con lógica de retraso.
     */
    public function store(Request $request)
    {
        $user = $request->user();

        $user = $this->ensureInternUser($user instanceof User ? $user : null);

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
    public function update(TimeRegistry $timeRegistry)
    {
        /** @var User|null $user */
        $user = Auth::user();
        $this->ensureInternUser($user instanceof User ? $user : null);

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

        $this->syncInternCompletedHours((int) $timeRegistry->user_id);

        return back()->with('success', 'Salida registrada correctamente.');
    }

    public function updateManual(Request $request, TimeRegistry $timeRegistry)
    {
        // Solo admins o tutores pueden editar registros de otros
        /** @var User|null $user */
        $user = Auth::user();
        if (! $user || ! $user->hasAnyRole(['admin', 'tutor'])) {
            abort(403);
        }

        $request->validate([
            'check_in' => 'required|date',
            'check_out' => 'required|date|after:check_in',
            'status' => 'required|in:normal,puntual,late',
            'note' => 'nullable|string',
        ]);

        $checkIn = Carbon::parse($request->check_in);
        $checkOut = Carbon::parse($request->check_out);
        $this->ensureNoOverlap((int) $timeRegistry->user_id, $checkIn, $checkOut, $timeRegistry->id);
        $hours = round($checkIn->diffInMinutes($checkOut) / 60, 2);

        $timeRegistry->update([
            'check_in' => $checkIn,
            'check_out' => $checkOut,
            'total_hours' => $hours,
            'status' => $this->normalizeRegistryStatus($request->status),
            'note' => $request->note,
            'type' => 'manual', // Marcamos como manual si el tutor lo toca
        ]);

        $this->syncInternCompletedHours((int) $timeRegistry->user_id);

        return back()->with('success', 'Fichaje actualizado correctamente.');
    }

    public function exportPdf(Request $request)
    {
        $user = $request->user();

        if (! $user instanceof User) {
            abort(403);
        }

        $validated = $request->validate([
            'period' => 'required|in:weekly,monthly',
            'date' => 'required|date',
            'intern_id' => 'nullable|integer|exists:interns,id',
        ]);

        if ($user->hasRole('intern')) {
            $intern = Intern::query()
                ->with(['center', 'user.schedules'])
                ->where('user_id', $user->id)
                ->firstOrFail();
        } else {
            if (! $user->hasAnyRole(['admin', 'tutor']) || empty($validated['intern_id'])) {
                abort(403);
            }

            $intern = Intern::query()
                ->with(['center', 'user.schedules'])
                ->findOrFail($validated['intern_id']);
        }

        abort_unless($intern->user_id, 404, 'El becario no tiene un usuario asociado.');

        $date = Carbon::parse($validated['date']);
        $startDate = $validated['period'] === 'weekly'
            ? $date->copy()->startOfWeek()
            : $date->copy()->startOfMonth();
        $endDate = $validated['period'] === 'weekly'
            ? $date->copy()->endOfWeek()
            : $date->copy()->endOfMonth();

        $pdfData = $this->buildTimesheetPdfData($intern, $startDate, $endDate, $validated['period']);
        $fileName = sprintf(
            'parte-horas-%s-%s-%s.pdf',
            $this->slugFileName(trim($intern->name.' '.$intern->last_name)),
            $validated['period'] === 'weekly' ? 'semanal' : 'mensual',
            $startDate->format('Y-m-d'),
        );

        return pdf('pdf.timesheet', $pdfData)
            ->driver('dompdf')
            ->format('a4')
            ->landscape()
            ->margins(8, 8, 8, 8)
            ->download($fileName);
    }

    private function buildTimesheetPdfData(Intern $intern, Carbon $startDate, Carbon $endDate, string $period): array
    {
        $userId = (int) $intern->user_id;
        $registries = TimeRegistry::query()
            ->where('user_id', $userId)
            ->whereBetween('check_in', [$startDate->copy()->startOfDay(), $endDate->copy()->endOfDay()])
            ->orderBy('check_in')
            ->get()
            ->groupBy(fn (TimeRegistry $registry) => $registry->check_in->toDateString());

        $absences = Absence::query()
            ->where('user_id', $userId)
            ->whereBetween('date', [$startDate->toDateString(), $endDate->toDateString()])
            ->orderBy('date')
            ->get()
            ->keyBy(fn (Absence $absence) => $absence->date->toDateString());

        $schedules = $intern->user?->schedules?->keyBy('day_of_week') ?? collect();
        $rows = [];
        $expectedHours = 0.0;
        $workedHours = 0.0;
        $absenceCount = 0;
        $lateCount = 0;
        $missedCount = 0;
        $today = Carbon::today();

        for ($day = $startDate->copy(); $day->lte($endDate); $day->addDay()) {
            $dateKey = $day->toDateString();
            $schedule = $schedules->get($day->dayOfWeekIso);
            $dayRegistries = $registries->get($dateKey, collect());
            $absence = $absences->get($dateKey);
            $planned = 'Sin horario';

            if ($schedule) {
                $planned = substr((string) $schedule->start_time, 0, 5).' - '.substr((string) $schedule->end_time, 0, 5);
                $expectedHours += $this->hoursBetweenTimes($day, (string) $schedule->start_time, (string) $schedule->end_time);
            }

            if ($absence) {
                $absenceCount++;
            }

            if ($dayRegistries->isNotEmpty()) {
                foreach ($dayRegistries as $registry) {
                    $hours = (float) $registry->total_hours;
                    $workedHours += $hours;

                    if ($registry->status === 'late') {
                        $lateCount++;
                    }

                    $rows[] = [
                        'date' => $day->copy(),
                        'planned' => $planned,
                        'check_in' => $registry->check_in?->format('H:i') ?? '--',
                        'check_out' => $registry->check_out?->format('H:i') ?? 'En curso',
                        'hours' => $registry->check_out ? $this->formatHoursDuration($hours) : '--',
                        'status' => $registry->status === 'late' ? 'Retraso' : 'Puntual',
                        'note' => $registry->note ?: ($absence ? 'Ausencia '.$this->absenceStatusLabel($absence->status).': '.$absence->reason : ''),
                    ];
                }

                continue;
            }

            $status = 'Sin fichaje';
            $note = '';

            if ($absence) {
                $status = 'Ausencia '.$this->absenceStatusLabel($absence->status);
                $note = $absence->reason;
            } elseif (! $schedule) {
                $status = 'Sin horario';
            } elseif ($day->gt($today)) {
                $status = 'Programado';
            } else {
                $missedCount++;
            }

            $rows[] = [
                'date' => $day->copy(),
                'planned' => $planned,
                'check_in' => '--',
                'check_out' => '--',
                'hours' => '0 min',
                'status' => $status,
                'note' => $note,
            ];
        }

        $targetHours = max((float) $intern->total_hours, 1);

        return [
            'intern' => $intern,
            'center' => $intern->center,
            'period' => $period,
            'periodLabel' => $period === 'weekly' ? 'Semanal' : 'Mensual',
            'startDate' => $startDate->copy(),
            'endDate' => $endDate->copy(),
            'generatedAt' => now(),
            'rows' => $rows,
            'summary' => [
                'worked_hours' => round($workedHours, 2),
                'worked_hours_label' => $this->formatHoursDuration($workedHours),
                'expected_hours' => round($expectedHours, 2),
                'expected_hours_label' => $this->formatHoursDuration($expectedHours),
                'target_hours' => $targetHours,
                'progress' => min(100, round(($workedHours / $targetHours) * 100, 1)),
                'absence_count' => $absenceCount,
                'late_count' => $lateCount,
                'missed_count' => $missedCount,
            ],
        ];
    }

    private function hoursBetweenTimes(Carbon $date, string $startTime, string $endTime): float
    {
        $start = Carbon::parse($date->toDateString().' '.$startTime);
        $end = Carbon::parse($date->toDateString().' '.$endTime);

        return max(0, round($start->diffInMinutes($end) / 60, 2));
    }

    private function formatHoursDuration(float $hours): string
    {
        $totalMinutes = (int) round($hours * 60);
        $wholeHours = intdiv($totalMinutes, 60);
        $minutes = $totalMinutes % 60;

        if ($wholeHours > 0 && $minutes > 0) {
            return "{$wholeHours} h {$minutes} min";
        }

        if ($wholeHours > 0) {
            return "{$wholeHours} h";
        }

        return "{$minutes} min";
    }

    private function absenceStatusLabel(string $status): string
    {
        return match ($status) {
            'approved' => 'aprobada',
            'rejected' => 'rechazada',
            default => 'pendiente',
        };
    }

    private function slugFileName(string $value): string
    {
        $slug = preg_replace('/[^A-Za-z0-9]+/', '-', trim($value));
        $slug = trim((string) $slug, '-');

        return strtolower($slug ?: 'becario');
    }

    public function destroy(TimeRegistry $timeRegistry)
    {
        /** @var User|null $user */
        $user = Auth::user();
        if (! $user || ! $user->hasAnyRole(['admin', 'tutor'])) {
            abort(403);
        }

        $userId = (int) $timeRegistry->user_id;

        $timeRegistry->delete();
        $this->syncInternCompletedHours($userId);

        return back()->with('success', 'Fichaje eliminado.');
    }
}
