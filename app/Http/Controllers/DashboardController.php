<?php

namespace App\Http\Controllers;

use App\Models\Absence;
use App\Models\Evaluation;
use App\Models\Intern;
use App\Models\Schedule;
use App\Models\Task;
use App\Models\TimeRegistry;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        abort_unless($user instanceof User, 403);

        $role = $this->dashboardRole($user);
        $cacheVersion = Cache::get('dashboard.version', 1);
        $cacheKey = "dashboard.{$cacheVersion}.{$role}.{$user->id}";

        return Inertia::render('dashboard', Cache::remember($cacheKey, now()->addMinute(), fn () => $this->dashboardData($user, $role)));
    }

    private function dashboardData(User $user, string $role): array
    {
        $interns = $this->internsQuery($user, $role)
            ->with('center:id,name')
            ->get();

        $internIds = $interns->pluck('id')->all();
        $internUserIds = $interns->pluck('user_id')->filter()->values()->all();

        $taskBaseQuery = Task::query()->whereIn('intern_id', $internIds);
        $today = Carbon::today();
        $nextMonth = $today->copy()->addDays(30);

        return [
            'role' => $role,
            'kpis' => $this->kpis($interns, $internUserIds, clone $taskBaseQuery, $today, $nextMonth, $role),
            'internsByCenter' => $this->internsByCenter($interns),
            'taskStatusDistribution' => $this->taskStatusDistribution(clone $taskBaseQuery),
            'attendanceStats' => $this->attendanceStats($internUserIds),
            'internProgress' => $this->internProgress($interns, clone $taskBaseQuery),
            'alerts' => $this->alerts($interns, $internUserIds, clone $taskBaseQuery, $today, $nextMonth),
        ];
    }

    private function kpis($interns, array $internUserIds, Builder $taskQuery, Carbon $today, Carbon $nextMonth, string $role): array
    {
        $activeInterns = $interns->where('status', 'active')->count();
        $pendingTasks = (clone $taskQuery)
            ->whereNotIn('status', ['completed'])
            ->count();
        $upcomingEndings = $interns
            ->filter(fn (Intern $intern) => $intern->end_date && Carbon::parse($intern->end_date)->betweenIncluded($today, $nextMonth))
            ->count();
        $averageProgress = $interns->isEmpty()
            ? 0
            : round($interns->avg(fn (Intern $intern) => $this->hoursProgress($intern)), 1);

        $evaluatedThisMonth = Evaluation::query()
            ->whereIn('intern_id', $internUserIds)
            ->where('created_at', '>=', $today->copy()->startOfMonth())
            ->distinct('intern_id')
            ->count('intern_id');
        $pendingEvaluations = max(0, count($internUserIds) - $evaluatedThisMonth);
        $activeAlerts = $this->activeAlertsCount($internUserIds, clone $taskQuery, $today);
        $hoursProgressDetail = $role === 'intern' ? 'De tus horas requeridas' : 'Media del grupo';

        return [
            ['key' => 'active_interns', 'label' => 'Becarios activos', 'value' => $activeInterns, 'detail' => 'En practicas actualmente'],
            ['key' => 'pending_tasks', 'label' => 'Tareas pendientes', 'value' => $pendingTasks, 'detail' => 'Sin completar'],
            ['key' => 'pending_evaluations', 'label' => 'Evaluaciones por realizar', 'value' => $pendingEvaluations, 'detail' => 'Sin evaluacion este mes'],
            ['key' => 'hours_progress', 'label' => 'Horas completadas', 'value' => "{$averageProgress}%", 'detail' => $hoursProgressDetail],
            ['key' => 'upcoming_endings', 'label' => 'Proximas finalizaciones', 'value' => $upcomingEndings, 'detail' => 'En los proximos 30 dias'],
            ['key' => 'active_alerts', 'label' => 'Alertas activas', 'value' => $activeAlerts, 'detail' => 'Ausencias, retrasos y vencidas'],
        ];
    }

    private function internsByCenter($interns): array
    {
        return $interns
            ->groupBy(fn (Intern $intern) => $intern->center?->name ?? 'Sin centro')
            ->map(fn ($group, $center) => ['center' => $center, 'total' => $group->count()])
            ->values()
            ->all();
    }

    private function taskStatusDistribution(Builder $taskQuery): array
    {
        $labels = $this->taskStatusLabels();

        $counts = $taskQuery
            ->select('status', DB::raw('COUNT(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status');

        return collect($labels)
            ->map(fn ($label, $status) => ['status' => $status, 'label' => $label, 'total' => (int) ($counts[$status] ?? 0)])
            ->values()
            ->all();
    }

    private function attendanceStats(array $internUserIds): array
    {
        if (empty($internUserIds)) {
            return [
                'completedDaysRate' => 0,
                'lateRate' => 0,
                'absenceRate' => 0,
                'averageDelayMinutes' => 0,
            ];
        }

        $since = Carbon::today()->subDays(30);
        $registries = TimeRegistry::query()
            ->whereIn('user_id', $internUserIds)
            ->where('check_in', '>=', $since)
            ->get();
        $registryCount = max(1, $registries->count());
        $lateCount = $registries->where('status', 'late')->count();
        $completedCount = $registries->whereNotNull('check_out')->count();
        $absenceCount = Absence::query()
            ->whereIn('user_id', $internUserIds)
            ->where('date', '>=', $since->toDateString())
            ->count();

        return [
            'completedDaysRate' => round(($completedCount / $registryCount) * 100, 1),
            'lateRate' => round(($lateCount / $registryCount) * 100, 1),
            'absenceRate' => round(($absenceCount / max(1, count($internUserIds) * 30)) * 100, 1),
            'averageDelayMinutes' => $this->averageDelayMinutes($registries, $internUserIds),
        ];
    }

    private function internProgress($interns, Builder $taskQuery): array
    {
        $today = Carbon::today();
        $tasksByIntern = $taskQuery
            ->get(['id', 'intern_id', 'title', 'status', 'priority', 'due_date'])
            ->groupBy('intern_id');
        $statusLabels = $this->taskStatusLabels();

        return $interns
            ->sortByDesc(fn (Intern $intern) => $this->hoursProgress($intern))
            ->map(function (Intern $intern) use ($tasksByIntern, $statusLabels, $today) {
                $tasks = $tasksByIntern->get($intern->id, collect());
                $taskTotal = $tasks->count();
                $taskCompleted = $tasks->where('status', 'completed')->count();

                return [
                    'id' => $intern->id,
                    'name' => trim($intern->name.' '.$intern->last_name),
                    'centerId' => $intern->center_id,
                    'center' => $intern->center?->name ?? 'Sin centro',
                    'academicCycle' => $intern->academic_cycle ?? 'Sin ciclo',
                    'hoursProgress' => $this->hoursProgress($intern),
                    'totalTasks' => $taskTotal,
                    'completedTasks' => $taskCompleted,
                    'pendingTasks' => max(0, $taskTotal - $taskCompleted),
                    'taskCompletionRate' => $taskTotal > 0 ? round(($taskCompleted / $taskTotal) * 100, 1) : 0,
                    'statusDistribution' => collect($statusLabels)
                        ->map(fn (string $label, string $status) => [
                            'status' => $status,
                            'label' => $label,
                            'total' => $tasks->where('status', $status)->count(),
                        ])
                        ->values()
                        ->all(),
                    'nextTasks' => $tasks
                        ->where('status', '!=', 'completed')
                        ->filter(fn (Task $task) => $task->due_date && $task->due_date->greaterThanOrEqualTo($today))
                        ->sortBy(fn (Task $task) => $task->due_date?->timestamp ?? PHP_INT_MAX)
                        ->take(4)
                        ->map(fn (Task $task) => [
                            'id' => $task->id,
                            'title' => $task->title,
                            'status' => $task->status,
                            'priority' => $task->priority,
                            'dueDate' => $task->due_date?->toDateString(),
                        ])
                        ->values()
                        ->all(),
                ];
            })
            ->values()
            ->all();
    }

    private function alerts($interns, array $internUserIds, Builder $taskQuery, Carbon $today, Carbon $nextMonth): array
    {
        $internsById = $interns->keyBy('id');
        $internsByUserId = $interns->whereNotNull('user_id')->keyBy('user_id');
        $alerts = collect();

        (clone $taskQuery)
            ->whereNotIn('status', ['completed'])
            ->whereDate('due_date', '<', $today)
            ->orderBy('due_date')
            ->limit(3)
            ->get(['id', 'intern_id', 'title', 'due_date'])
            ->each(function (Task $task) use ($alerts, $internsById) {
                $intern = $internsById->get($task->intern_id);
                $alerts->push([
                    'type' => 'task',
                    'label' => 'Tarea vencida',
                    'title' => $task->title,
                    'detail' => trim(($intern?->name ?? '').' '.($intern?->last_name ?? '')),
                    'date' => $task->due_date?->toDateString(),
                    'href' => "/tareas/{$task->id}",
                ]);
            });

        Absence::query()
            ->whereIn('user_id', $internUserIds)
            ->where('status', 'pending')
            ->orderByDesc('date')
            ->limit(3)
            ->get(['id', 'user_id', 'reason', 'date'])
            ->each(function (Absence $absence) use ($alerts, $internsByUserId) {
                $intern = $internsByUserId->get($absence->user_id);
                $alerts->push([
                    'type' => 'absence',
                    'label' => 'Ausencia pendiente',
                    'title' => $absence->reason,
                    'detail' => trim(($intern?->name ?? '').' '.($intern?->last_name ?? '')),
                    'date' => $absence->date?->toDateString(),
                    'href' => '/control-horario',
                ]);
            });

        $interns
            ->filter(fn (Intern $intern) => $intern->end_date && Carbon::parse($intern->end_date)->betweenIncluded($today, $nextMonth))
            ->sortBy('end_date')
            ->take(3)
            ->each(function (Intern $intern) use ($alerts) {
                $alerts->push([
                    'type' => 'ending',
                    'label' => 'Finalizacion proxima',
                    'title' => trim($intern->name.' '.$intern->last_name),
                    'detail' => $intern->center?->name ?? 'Sin centro',
                    'date' => Carbon::parse($intern->end_date)->toDateString(),
                    'href' => "/becarios/{$intern->id}",
                ]);
            });

        return $alerts->take(6)->values()->all();
    }

    private function activeAlertsCount(array $internUserIds, Builder $taskQuery, Carbon $today): int
    {
        $overdueTasks = (clone $taskQuery)
            ->whereNotIn('status', ['completed'])
            ->whereDate('due_date', '<', $today)
            ->count();
        $pendingAbsences = Absence::query()
            ->whereIn('user_id', $internUserIds)
            ->where('status', 'pending')
            ->count();
        $recentLates = TimeRegistry::query()
            ->whereIn('user_id', $internUserIds)
            ->where('status', 'late')
            ->where('check_in', '>=', $today->copy()->subDays(7))
            ->count();

        return $overdueTasks + $pendingAbsences + $recentLates;
    }

    private function averageDelayMinutes($registries, array $internUserIds): int
    {
        $schedules = Schedule::query()
            ->whereIn('user_id', $internUserIds)
            ->get()
            ->keyBy(fn (Schedule $schedule) => $schedule->user_id.'-'.$schedule->day_of_week);

        $delays = $registries
            ->map(function (TimeRegistry $registry) use ($schedules) {
                if (! $registry->check_in) {
                    return 0;
                }

                $schedule = $schedules->get($registry->user_id.'-'.$registry->check_in->dayOfWeekIso);

                if (! $schedule) {
                    return $registry->status === 'late' ? 15 : 0;
                }

                $plannedStart = Carbon::parse($registry->check_in->toDateString().' '.$schedule->start_time);

                return max(0, $plannedStart->diffInMinutes($registry->check_in, false));
            })
            ->filter(fn (int $minutes) => $minutes > 0);

        return $delays->isEmpty() ? 0 : (int) round($delays->avg());
    }

    private function hoursProgress(Intern $intern): float
    {
        return (float) min(100, round(((float) $intern->completed_hours / max(1, (float) $intern->total_hours)) * 100, 1));
    }

    private function taskStatusLabels(): array
    {
        return [
            'pending' => 'Pendiente',
            'in_progress' => 'En progreso',
            'in_review' => 'En revision',
            'completed' => 'Completada',
            'rejected' => 'Rechazada',
        ];
    }

    private function internsQuery(User $user, string $role): Builder
    {
        return Intern::query()
            ->when($role === 'tutor', fn (Builder $query) => $query->where('tutor_id', $user->id))
            ->when($role === 'intern', fn (Builder $query) => $query->where('user_id', $user->id));
    }

    private function dashboardRole(User $user): string
    {
        if ($user->hasRole('admin')) {
            return 'admin';
        }

        if ($user->hasRole('tutor')) {
            return 'tutor';
        }

        return 'intern';
    }
}
