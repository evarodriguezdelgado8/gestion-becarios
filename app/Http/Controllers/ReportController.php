<?php

namespace App\Http\Controllers;

use App\Exports\ReportExport;
use App\Models\Center;
use App\Models\Evaluation;
use App\Models\Intern;
use App\Models\ReportTemplate;
use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

use function Spatie\LaravelPdf\Support\pdf;

class ReportController extends Controller
{
    public function index(Request $request)
    {
        $user = $this->reportUser();
        $definitions = $this->definitions();
        $selected = $this->selectedConfig($request, $definitions);

        return Inertia::render('reportes/index', [
            'definitions' => $definitions,
            'selected' => $selected,
            'templates' => ReportTemplate::query()
                ->where('user_id', $user->id)
                ->latest()
                ->get(['id', 'name', 'report_type', 'fields', 'filters', 'group_by']),
            'centers' => $this->scopedCenters($user),
            'interns' => $this->scopedInterns($user)
                ->map(fn (Intern $intern) => [
                    'id' => $intern->id,
                    'user_id' => $intern->user_id,
                    'name' => trim($intern->name.' '.$intern->last_name),
                ])
                ->values(),
            'preview' => $this->reportPayload($user, $selected),
        ]);
    }

    public function storeTemplate(Request $request)
    {
        $user = $this->reportUser();
        $definitions = $this->definitions();
        $validated = $this->validateConfig($request, $definitions, true);

        ReportTemplate::create([
            'user_id' => $user->id,
            'name' => $validated['name'],
            'report_type' => $validated['report_type'],
            'fields' => $validated['fields'],
            'filters' => $validated['filters'] ?? [],
            'group_by' => $validated['group_by'] ?? null,
        ]);

        return back()->with('success', 'Plantilla guardada.');
    }

    public function destroyTemplate(ReportTemplate $template)
    {
        abort_unless($template->user_id === Auth::id(), 403);
        $template->delete();

        return back()->with('success', 'Plantilla eliminada.');
    }

    public function export(Request $request)
    {
        $user = $this->reportUser();
        $definitions = $this->definitions();
        $selected = $this->selectedConfig($request, $definitions);
        $format = $request->validate([
            'format' => 'required|in:xlsx,pdf',
        ])['format'];
        $payload = $this->reportPayload($user, $selected);
        $fileName = 'informe-'.$selected['report_type'].'-'.now()->format('Y-m-d-His');

        if ($format === 'pdf') {
            return pdf('pdf.report', [
                'title' => $definitions[$selected['report_type']]['label'],
                'headings' => $payload['headings'],
                'rows' => $payload['rows'],
                'generatedAt' => now(),
            ])
                ->driver('dompdf')
                ->format('a4')
                ->landscape()
                ->download($fileName.'.pdf');
        }

        return Excel::download(new ReportExport($payload['headings'], $payload['rows']), $fileName.'.xlsx');
    }

    private function reportPayload(User $user, array $selected, ?int $limit = null): array
    {
        $definitions = $this->definitions();
        $definition = $definitions[$selected['report_type']];
        $fields = array_values(array_intersect($selected['fields'], array_keys($definition['fields'])));
        $rows = $this->rows($user, $selected['report_type'], $fields, $selected['filters'], $selected['group_by'], $limit);

        return [
            'headings' => collect($fields)->map(fn (string $field) => $definition['fields'][$field])->all(),
            'rows' => $this->groupRows($rows, $selected['group_by']),
            'total' => count($rows),
            'limited' => $limit !== null && count($rows) === $limit,
        ];
    }

    private function rows(User $user, string $type, array $fields, array $filters, ?string $groupBy, ?int $limit): array
    {
        return match ($type) {
            'tasks' => $this->taskRows($user, $fields, $filters, $groupBy, $limit),
            'evaluations' => $this->evaluationRows($user, $fields, $filters, $groupBy, $limit),
            default => $this->internRows($user, $fields, $filters, $groupBy, $limit),
        };
    }

    private function internRows(User $user, array $fields, array $filters, ?string $groupBy, ?int $limit): array
    {
        $query = $this->scopedInternsQuery($user)
            ->with(['center:id,name', 'tutor:id,name'])
            ->when($filters['status'] ?? null, fn (Builder $query, string $status) => $query->where('status', $status))
            ->when($filters['center_id'] ?? null, fn (Builder $query, string $centerId) => $query->where('center_id', $centerId))
            ->when($filters['intern_id'] ?? null, fn (Builder $query, string $internId) => $query->whereKey($internId));

        $this->applyGroupOrdering($query, $groupBy);

        return $query
            ->latest()
            ->when($limit, fn (Builder $query) => $query->limit($limit))
            ->get()
            ->map(fn (Intern $intern) => $this->onlyFields($fields, [
                'name' => trim($intern->name.' '.$intern->last_name),
                'email' => $intern->email,
                'center' => $intern->center?->name ?? 'Sin centro',
                'status' => $this->statusLabel($intern->status),
                'academic_cycle' => $intern->academic_cycle ?? '',
                'tutor' => $intern->tutor?->name ?? 'Sin tutor',
                'start_date' => $this->dateValue($intern->start_date),
                'end_date' => $this->dateValue($intern->end_date),
                'hours_progress' => $this->hoursProgress($intern).'%',
            ]))
            ->all();
    }

    private function taskRows(User $user, array $fields, array $filters, ?string $groupBy, ?int $limit): array
    {
        $internIds = $this->scopedInterns($user)->pluck('id')->all();
        $query = Task::query()
            ->with(['intern.center:id,name'])
            ->whereIn('intern_id', $internIds)
            ->when($filters['task_status'] ?? null, fn (Builder $query, string $status) => $query->where('status', $status))
            ->when($filters['priority'] ?? null, fn (Builder $query, string $priority) => $query->where('priority', $priority))
            ->when($filters['center_id'] ?? null, fn (Builder $query, string $centerId) => $query->where('center_id', $centerId))
            ->when($filters['intern_id'] ?? null, fn (Builder $query, string $internId) => $query->where('intern_id', $internId));

        $this->applyGroupOrdering($query, $groupBy);

        return $query
            ->latest()
            ->when($limit, fn (Builder $query) => $query->limit($limit))
            ->get()
            ->map(fn (Task $task) => $this->onlyFields($fields, [
                'title' => $task->title,
                'intern' => trim(($task->intern?->name ?? '').' '.($task->intern?->last_name ?? '')),
                'center' => $task->intern?->center?->name ?? 'Sin centro',
                'status' => $this->taskStatusLabel($task->status),
                'priority' => $this->priorityLabel($task->priority),
                'due_date' => $this->dateValue($task->due_date),
                'completed_at' => $this->dateTimeValue($task->completed_at),
            ]))
            ->all();
    }

    private function evaluationRows(User $user, array $fields, array $filters, ?string $groupBy, ?int $limit): array
    {
        $internUserIds = $this->scopedInterns($user)->pluck('user_id')->filter()->all();
        $query = Evaluation::query()
            ->with(['intern.intern.center:id,name', 'tutor:id,name'])
            ->whereIn('intern_id', $internUserIds)
            ->when($filters['evaluation_type'] ?? null, fn (Builder $query, string $type) => $query->where('type', $type))
            ->when($filters['intern_user_id'] ?? null, fn (Builder $query, string $internUserId) => $query->where('intern_id', $internUserId))
            ->when($filters['center_id'] ?? null, fn (Builder $query, string $centerId) => $query->whereHas('intern.intern', fn (Builder $internQuery) => $internQuery->where('center_id', $centerId)));

        $this->applyGroupOrdering($query, $groupBy === 'center' ? null : $groupBy);

        return $query
            ->latest()
            ->when($limit, fn (Builder $query) => $query->limit($limit))
            ->get()
            ->map(fn (Evaluation $evaluation) => $this->onlyFields($fields, [
                'intern' => trim(($evaluation->intern?->intern?->name ?? '').' '.($evaluation->intern?->intern?->last_name ?? '')) ?: ($evaluation->intern?->name ?? ''),
                'center' => $evaluation->intern?->intern?->center?->name ?? 'Sin centro',
                'type' => $this->evaluationTypeLabel($evaluation->type),
                'period_name' => $evaluation->period_name,
                'final_grade' => number_format(((float) $evaluation->final_grade) * 2, 1, ',', '').' / 10',
                'tutor' => $evaluation->tutor?->name ?? 'Sin tutor',
                'created_at' => $this->dateTimeValue($evaluation->created_at),
            ]))
            ->all();
    }

    private function selectedConfig(Request $request, array $definitions): array
    {
        if (! $request->has('report_type')) {
            $defaultType = 'interns';

            return [
                'report_type' => $defaultType,
                'fields' => array_slice(array_keys($definitions[$defaultType]['fields']), 0, 5),
                'filters' => [],
                'group_by' => null,
            ];
        }

        return $this->validateConfig($request, $definitions);
    }

    private function validateConfig(Request $request, array $definitions, bool $saving = false): array
    {
        $validated = $request->validate([
            'name' => [$saving ? 'required' : 'nullable', 'string', 'max:255'],
            'report_type' => 'required|in:interns,tasks,evaluations',
            'fields' => 'required|array|min:1',
            'fields.*' => 'required|string',
            'filters' => 'nullable|array',
            'group_by' => 'nullable|string',
        ]);
        $definition = $definitions[$validated['report_type']];
        $validated['fields'] = array_values(array_intersect($validated['fields'], array_keys($definition['fields'])));

        if (empty($validated['fields'])) {
            $validated['fields'] = array_slice(array_keys($definition['fields']), 0, 4);
        }

        if (! in_array($validated['group_by'] ?? null, array_keys($definition['fields']), true)) {
            $validated['group_by'] = null;
        }

        $validated['filters'] = collect($validated['filters'] ?? [])
            ->filter(fn ($value) => $value !== null && $value !== '')
            ->all();

        return $validated;
    }

    private function definitions(): array
    {
        return [
            'interns' => [
                'label' => 'Becarios',
                'fields' => [
                    'name' => 'Becario',
                    'email' => 'Email',
                    'center' => 'Centro',
                    'status' => 'Estado',
                    'academic_cycle' => 'Ciclo',
                    'tutor' => 'Tutor',
                    'start_date' => 'Inicio',
                    'end_date' => 'Fin',
                    'hours_progress' => 'Progreso horas',
                ],
            ],
            'tasks' => [
                'label' => 'Tareas',
                'fields' => [
                    'title' => 'Tarea',
                    'intern' => 'Becario',
                    'center' => 'Centro',
                    'status' => 'Estado',
                    'priority' => 'Prioridad',
                    'due_date' => 'Entrega',
                    'completed_at' => 'Completada',
                ],
            ],
            'evaluations' => [
                'label' => 'Evaluaciones',
                'fields' => [
                    'intern' => 'Becario',
                    'center' => 'Centro',
                    'type' => 'Tipo',
                    'period_name' => 'Periodo',
                    'final_grade' => 'Nota',
                    'tutor' => 'Tutor',
                    'created_at' => 'Fecha',
                ],
            ],
        ];
    }

    private function scopedInterns(User $user)
    {
        return $this->scopedInternsQuery($user)->with('center:id,name')->get();
    }

    private function scopedInternsQuery(User $user): Builder
    {
        return Intern::query()
            ->when($user->hasRole('tutor') && ! $user->hasRole('admin'), fn (Builder $query) => $query->where('tutor_id', $user->id));
    }

    private function scopedCenters(User $user)
    {
        if ($user->hasRole('admin')) {
            return Center::query()->orderBy('name')->get(['id', 'name']);
        }

        return Center::query()
            ->whereHas('interns', fn (Builder $query) => $query->where('tutor_id', $user->id))
            ->orderBy('name')
            ->get(['id', 'name']);
    }

    private function reportUser(): User
    {
        $user = Auth::user();
        abort_unless($user instanceof User && $user->hasAnyRole(['admin', 'tutor']), 403);

        return $user;
    }

    private function onlyFields(array $fields, array $row): array
    {
        return collect($fields)
            ->mapWithKeys(fn (string $field) => [$field => (string) ($row[$field] ?? '')])
            ->all();
    }

    private function applyGroupOrdering(Builder $query, ?string $groupBy): void
    {
        if (! $groupBy || in_array($groupBy, [
            'center',
            'intern',
            'tutor',
            'hours_progress',
            'final_grade',
        ], true)) {
            return;
        }

        $query->orderBy($groupBy);
    }

    private function groupRows(array $rows, ?string $groupBy): array
    {
        if (! $groupBy || empty($rows)) {
            return $rows;
        }

        return collect($rows)
            ->sortBy(fn (array $row) => mb_strtolower($row[$groupBy] ?? 'Sin agrupar'))
            ->groupBy(fn (array $row) => $row[$groupBy] ?: 'Sin agrupar')
            ->flatMap(function ($group, string $label) {
                return collect([[
                    '__group' => true,
                    '__label' => $label,
                    '__count' => $group->count(),
                ]])->merge($group->values());
            })
            ->values()
            ->all();
    }

    private function hoursProgress(Intern $intern): float
    {
        return (float) min(100, round(((float) $intern->completed_hours / max(1, (float) $intern->total_hours)) * 100, 1));
    }

    private function dateValue($date): string
    {
        return $date ? Carbon::parse($date)->format('d/m/Y') : '';
    }

    private function dateTimeValue($date): string
    {
        return $date ? Carbon::parse($date)->format('d/m/Y H:i') : '';
    }

    private function statusLabel(string $status): string
    {
        return match ($status) {
            'active' => 'Activo',
            'finished' => 'Finalizado',
            'abandoned' => 'Abandonado',
            default => $status,
        };
    }

    private function taskStatusLabel(string $status): string
    {
        return match ($status) {
            'pending' => 'Pendiente',
            'in_progress' => 'En progreso',
            'in_review' => 'En revision',
            'completed' => 'Completada',
            'rejected' => 'Rechazada',
            default => $status,
        };
    }

    private function priorityLabel(?string $priority): string
    {
        return match ($priority) {
            'low' => 'Baja',
            'medium' => 'Media',
            'high' => 'Alta',
            default => (string) $priority,
        };
    }

    private function evaluationTypeLabel(string $type): string
    {
        return match ($type) {
            'weekly' => 'Semanal',
            'monthly' => 'Mensual',
            'final' => 'Final',
            default => $type,
        };
    }
}
