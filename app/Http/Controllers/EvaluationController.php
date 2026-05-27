<?php

namespace App\Http\Controllers;

use App\Models\Evaluation;
use App\Models\EvaluationCategory;
use App\Models\EvaluationCriterion;
use App\Models\Intern;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

use function Spatie\LaravelPdf\Support\pdf;

class EvaluationController extends Controller
{
    public function index()
    {
        $evaluationsQuery = $this->authorizedEvaluationsQuery();

        return Inertia::render('evaluacion/index', [
            'becarios' => $this->authorizedInternsQuery()
                ->with(['user', 'center', 'tutor:id,name,email'])
                ->get(),
            'evaluacionesRecientes' => (clone $evaluationsQuery)
                ->with(['intern.intern', 'tutor'])
                ->latest()
                ->take(5)
                ->get(),
            'evaluacionesCount' => (clone $evaluationsQuery)->count(),
            'evaluacionesMedia' => round((float) (clone $evaluationsQuery)->avg('final_grade'), 1),
            'canConfigureCriteria' => Auth::user()?->hasRole('admin') ?? false,
        ]);
    }

    public function history()
    {
        return Inertia::render('evaluacion/history', [
            'becarios' => $this->authorizedInternsQuery()
                ->with(['user', 'center', 'tutor:id,name,email'])
                ->get(),
            'evaluaciones' => $this->authorizedEvaluationsQuery()
                ->with(['intern.intern.center', 'tutor'])
                ->latest()
                ->get(),
        ]);
    }

    public function myEvaluations()
    {
        return Inertia::render('evaluacion/mine', [
            'intern' => Auth::user()->load('intern.center'),
            'evaluaciones' => Evaluation::with(['tutor', 'results.criterion.category'])
                ->where('intern_id', Auth::id())
                ->latest()
                ->get(),
        ]);
    }

    public function config()
    {
        return Inertia::render('evaluacion/config', [
            'categories' => EvaluationCategory::with('criteria')->get(),
        ]);
    }

    public function create(User $intern)
    {
        $this->authorizeInternUser($intern);

        return Inertia::render('evaluacion/create', [
            'intern' => $intern->load('intern.center'),
            'categories' => EvaluationCategory::with('criteria')->get(),
            'previousEvaluations' => $this->previousEvaluationsForIntern($intern),
            'types' => $this->evaluationTypes(),
        ]);
    }

    public function edit(Evaluation $evaluation)
    {
        $evaluation->load(['intern.intern.center', 'results']);
        $this->authorizeEvaluation($evaluation);

        return Inertia::render('evaluacion/create', [
            'intern' => $evaluation->intern,
            'categories' => EvaluationCategory::with('criteria')->get(),
            'editingEvaluation' => $this->serializeEvaluationForForm($evaluation),
            'previousEvaluations' => $this->previousEvaluationsForIntern($evaluation->intern),
            'types' => $this->evaluationTypes(),
        ]);
    }

    public function store(Request $request)
    {
        $this->saveEvaluation($request);

        return redirect()->route('evaluaciones.index')->with('success', 'Evaluación guardada con éxito.');
    }

    public function update(Request $request, Evaluation $evaluation)
    {
        $this->authorizeEvaluation($evaluation);
        $this->saveEvaluation($request, $evaluation);

        return redirect()->route('evaluaciones.history')->with('success', 'Evaluación actualizada con éxito.');
    }

    public function destroy(Evaluation $evaluation)
    {
        $this->authorizeEvaluation($evaluation);
        $evaluation->delete();

        return back()->with('success', 'Evaluación eliminada.');
    }

    private function saveEvaluation(Request $request, ?Evaluation $evaluation = null): Evaluation
    {
        $validated = $request->validate([
            'evaluation_id' => 'nullable|exists:evaluations,id',
            'intern_id' => 'required|exists:users,id',
            'type' => 'required|in:weekly,monthly,final',
            'period_name' => 'required|string',
            'comments' => 'nullable|string',
            'results' => 'required|array|min:1',
            'results.*.criterion_id' => 'required|exists:evaluation_criteria,id',
            'results.*.score' => 'nullable|integer|min:1|max:5',
            'results.*.feedback' => 'nullable|string',
        ]);

        $validated['results'] = collect($validated['results'])
            ->filter(fn ($result) => isset($result['score']) && $result['score'] !== '')
            ->values()
            ->all();

        if (empty($validated['results'])) {
            throw ValidationException::withMessages([
                'results' => 'Selecciona al menos una puntuaciÃ³n para guardar la evaluaciÃ³n.',
            ]);
        }

        $criterionIds = collect($validated['results'])->pluck('criterion_id')->all();
        $hasCriteriaFromAnotherType = EvaluationCriterion::whereIn('id', $criterionIds)
            ->where('evaluation_type', '!=', $validated['type'])
            ->exists();

        if ($hasCriteriaFromAnotherType) {
            throw ValidationException::withMessages([
                'results' => 'Los criterios seleccionados no corresponden al tipo de evaluación elegido.',
            ]);
        }

        if (! $evaluation && ! empty($validated['evaluation_id'])) {
            $evaluation = Evaluation::findOrFail($validated['evaluation_id']);
        }

        $this->authorizeInternUser(User::findOrFail($validated['intern_id']));

        if ($evaluation) {
            abort_unless((int) $evaluation->intern_id === (int) $validated['intern_id'], 403);
            $this->authorizeEvaluation($evaluation);
        } else {
            $evaluation = Evaluation::firstOrNew([
                'intern_id' => $validated['intern_id'],
                'type' => $validated['type'],
                'period_name' => $validated['period_name'],
            ]);
        }

        $evaluation->fill([
            'tutor_id' => Auth::id(),
            'type' => $validated['type'],
            'period_name' => $validated['period_name'],
            'comments' => $validated['comments'] ?? null,
        ]);
        $evaluation->save();

        foreach ($validated['results'] as $result) {
            $evaluation->results()->updateOrCreate(
                ['evaluation_criterion_id' => $result['criterion_id']],
                [
                    'score' => $result['score'],
                    'feedback' => $result['feedback'] ?? null,
                ],
            );
        }

        $evaluation->results()
            ->whereNotIn('evaluation_criterion_id', collect($validated['results'])->pluck('criterion_id'))
            ->delete();

        $evaluation->calculateGrade();

        return $evaluation;
    }

    public function exportPdf(Evaluation $evaluation)
    {
        $user = Auth::user();

        if (! $user instanceof User) {
            abort(403);
        }

        if ($user->hasRole('intern') && $evaluation->intern_id !== $user->id) {
            abort(403);
        }

        if (! $user->hasRole('intern') && ! $user->hasAnyRole(['admin', 'tutor'])) {
            abort(403);
        }

        if ($user->hasRole('tutor') && ! $user->hasRole('admin')) {
            $this->authorizeEvaluation($evaluation);
        }

        $evaluation->load(['intern.intern.center', 'tutor', 'results.criterion.category']);
        $internProfile = $evaluation->intern?->intern;
        $internName = trim(($internProfile?->name ?? $evaluation->intern?->name ?? '').' '.($internProfile?->last_name ?? ''));
        $typeLabel = $this->evaluationTypeLabel($evaluation->type);
        $fileName = sprintf(
            'evaluacion-%s-%s-%s.pdf',
            $this->slugFileName($internName ?: 'becario'),
            strtolower($typeLabel),
            $evaluation->created_at?->format('Y-m-d') ?? now()->format('Y-m-d'),
        );

        return pdf('pdf.evaluation', [
            'evaluation' => $evaluation,
            'intern' => $evaluation->intern,
            'internProfile' => $internProfile,
            'center' => $internProfile?->center,
            'typeLabel' => $typeLabel,
            'generatedAt' => now(),
        ])
            ->driver('dompdf')
            ->format('a4')
            ->margins(10, 10, 10, 10)
            ->download($fileName);
    }

    public function storeCategory(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'description' => 'nullable|string',
            'evaluation_type' => 'required|in:weekly,monthly,final',
        ]);
        EvaluationCategory::create($validated);

        return back()->with('success', 'Categoría creada.');
    }

    public function updateCategory(Request $request, EvaluationCategory $category)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'description' => 'nullable|string',
            'evaluation_type' => 'required|in:weekly,monthly,final',
        ]);
        $category->update($validated);
        $category->criteria()->update(['evaluation_type' => $validated['evaluation_type']]);

        return back()->with('success', 'Categoría actualizada.');
    }

    public function destroyCategory(EvaluationCategory $category)
    {
        $category->delete();

        return back()->with('success', 'Categoría eliminada.');
    }

    public function storeCriterion(Request $request)
    {
        $validated = $this->validateCriterion($request);
        EvaluationCriterion::create($validated);

        return back()->with('success', 'Criterio creado.');
    }

    public function updateCriterion(Request $request, EvaluationCriterion $criterion)
    {
        $validated = $this->validateCriterion($request, $criterion);
        $criterion->update($validated);

        return back()->with('success', 'Criterio actualizado.');
    }

    public function destroyCriterion(EvaluationCriterion $criterion)
    {
        $criterion->delete();

        return back()->with('success', 'Criterio eliminado.');
    }

    private function validateCriterion(Request $request, ?EvaluationCriterion $criterion = null): array
    {
        $validated = $request->validate([
            'evaluation_category_id' => 'required|exists:evaluation_categories,id',
            'evaluation_type' => 'required|in:weekly,monthly,final',
            'name' => 'required|string',
            'description' => 'nullable|string',
            'weight' => 'required|numeric|min:0|max:100',
            'rubric' => 'nullable|array',
            'rubric.*' => 'nullable|string',
        ]);

        $category = EvaluationCategory::findOrFail($validated['evaluation_category_id']);

        if ($category->evaluation_type !== $validated['evaluation_type']) {
            throw ValidationException::withMessages([
                'evaluation_category_id' => 'La categorÃ­a seleccionada no corresponde al tipo de evaluaciÃ³n elegido.',
            ]);
        }

        $usedWeight = EvaluationCriterion::query()
            ->where('evaluation_category_id', $category->id)
            ->when($criterion, fn ($query) => $query->whereKeyNot($criterion->id))
            ->sum('weight');

        if (((float) $usedWeight + (float) $validated['weight']) > 100) {
            throw ValidationException::withMessages([
                'weight' => 'El peso total de los criterios de esta categorÃ­a no puede superar el 100%.',
            ]);
        }

        $validated['rubric'] = collect($validated['rubric'] ?? [])
            ->map(fn ($value) => trim((string) $value))
            ->filter(fn ($value) => $value !== '')
            ->all() ?: null;

        return $validated;
    }

    private function authorizedInternsQuery()
    {
        $user = Auth::user();

        $query = Intern::query();

        if ($user instanceof User && $user->hasRole('tutor') && ! $user->hasRole('admin')) {
            $query->where('tutor_id', $user->id);
        }

        return $query;
    }

    private function authorizedEvaluationsQuery()
    {
        $user = Auth::user();

        $query = Evaluation::query();

        if ($user instanceof User && $user->hasRole('tutor') && ! $user->hasRole('admin')) {
            $query->whereHas('intern.intern', fn ($internQuery) => $internQuery->where('tutor_id', $user->id));
        }

        return $query;
    }

    private function authorizeInternUser(User $intern): void
    {
        $user = Auth::user();
        abort_unless($user instanceof User && $user->hasAnyRole(['admin', 'tutor']), 403);

        $intern->loadMissing('intern');
        abort_unless($intern->intern, 404);

        if ($user->hasRole('tutor') && ! $user->hasRole('admin')) {
            abort_unless((int) $intern->intern->tutor_id === (int) $user->id, 403);
        }
    }

    private function authorizeEvaluation(Evaluation $evaluation): void
    {
        $user = Auth::user();
        abort_unless($user instanceof User && $user->hasAnyRole(['admin', 'tutor']), 403);

        if ($user->hasRole('tutor') && ! $user->hasRole('admin')) {
            $evaluation->loadMissing('intern.intern');
            abort_unless((int) $evaluation->intern?->intern?->tutor_id === (int) $user->id, 403);
        }
    }

    private function previousEvaluationsForIntern(User $intern)
    {
        return Evaluation::with('results')
            ->where('intern_id', $intern->id)
            ->latest()
            ->get()
            ->groupBy('type')
            ->map(function ($evaluations) {
                $latestEvaluation = $evaluations->first();
                $latestResultsByCriterion = $evaluations
                    ->flatMap(fn (Evaluation $evaluation) => $evaluation->results)
                    ->unique('evaluation_criterion_id')
                    ->values();

                return [
                    'id' => $latestEvaluation->id,
                    'type' => $latestEvaluation->type,
                    'period_name' => $latestEvaluation->period_name,
                    'comments' => $latestEvaluation->comments,
                    'results' => $latestResultsByCriterion->map(fn ($result) => [
                        'evaluation_criterion_id' => $result->evaluation_criterion_id,
                        'score' => $result->score,
                        'feedback' => $result->feedback,
                    ])->values(),
                ];
            });
    }

    private function serializeEvaluationForForm(Evaluation $evaluation): array
    {
        $evaluation->loadMissing('results');

        return [
            'id' => $evaluation->id,
            'type' => $evaluation->type,
            'period_name' => $evaluation->period_name,
            'comments' => $evaluation->comments,
            'results' => $evaluation->results->map(fn ($result) => [
                'evaluation_criterion_id' => $result->evaluation_criterion_id,
                'score' => $result->score,
                'feedback' => $result->feedback,
            ])->values(),
        ];
    }

    private function evaluationTypes(): array
    {
        return [
            ['label' => 'Semanal', 'value' => 'weekly'],
            ['label' => 'Mensual', 'value' => 'monthly'],
            ['label' => 'Final', 'value' => 'final'],
        ];
    }

    private function evaluationTypeLabel(string $type): string
    {
        return match ($type) {
            'weekly' => 'Semanal',
            'monthly' => 'Mensual',
            'final' => 'Final',
            default => ucfirst($type),
        };
    }

    private function slugFileName(string $value): string
    {
        $slug = preg_replace('/[^A-Za-z0-9]+/', '-', trim($value));
        $slug = trim((string) $slug, '-');

        return strtolower($slug ?: 'becario');
    }
}
