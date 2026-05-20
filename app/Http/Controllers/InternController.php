<?php

namespace App\Http\Controllers;

use App\Exports\InternsExport;
use App\Http\Requests\InternRequest;
use App\Models\Center;
use App\Models\Intern;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

class InternController extends Controller
{
    private function commaFilter(?string $value): array
    {
        if (!$value) {
            return [];
        }

        return array_values(array_filter(explode(',', $value), fn ($item) => $item !== ''));
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $centerIds = $this->commaFilter($request->input('center_id'));
        $statuses = $this->commaFilter($request->input('status'));

        return Inertia::render('becarios/index', [
            'interns' => Intern::query()
                ->with(['center:id,name', 'tutor:id,name,email'])
                ->when($request->input('search'), function ($query, $search) {
                    $query->where(function ($q) use ($search) {
                        $q->where('name', 'ilike', "%{$search}%")
                            ->orWhere('last_name', 'ilike', "%{$search}%")
                            ->orWhere('dni', 'ilike', "%{$search}%")
                            ->orWhere('email', 'ilike', "%{$search}%");
                    });
                })
                ->when($centerIds, fn ($q) => $q->whereIn('center_id', $centerIds))
                ->when($statuses, fn ($q) => $q->whereIn('status', $statuses))

                ->when($request->input('start_from'), fn ($q, $date) => $q->whereDate('start_date', '>=', $date))
                ->when($request->input('start_to'), fn ($q, $date) => $q->whereDate('start_date', '<=', $date))

                ->when($request->input('end_from'), fn ($q, $date) => $q->whereDate('end_date', '>=', $date))
                ->when($request->input('end_to'), fn ($q, $date) => $q->whereDate('end_date', '<=', $date))

                ->latest()
                ->paginate(10)
                ->withQueryString(),

            'filters' => $request->only(['search', 'status', 'center_id', 'start_from', 'start_to', 'end_from', 'end_to']),
            'centers' => Center::all(['id', 'name']),
        ]);
    }

    public function export(Request $request)
    {
        $filters = $request->only(['search', 'center_id', 'status', 'start_from', 'start_to', 'end_from', 'end_to']);
        $fileName = 'becarios_periodo_'.now()->format('d-m-Y_Hi').'.xlsx';

        return Excel::download(new InternsExport($filters), $fileName);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return inertia('becarios/create', [
            'centers' => Center::all(['id', 'name']),
            'tutors' => User::role('tutor')->orderBy('name')->get(['id', 'name', 'email']),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(InternRequest $request)
    {
        $validated = $request->validated();

        // Ejecutamos la transacción
        DB::transaction(function () use ($validated, $request) {
            $user = User::create([
                'name' => $validated['name'].' '.($validated['last_name'] ?? ''),
                'email' => $validated['email'],
                'password' => Hash::make($validated['dni']),
            ]);
            $user->assignRole('intern');

            $intern = Intern::create(array_merge($validated, [
                'user_id' => $user->id,
            ]));

            if ($request->hasFile('document_dni')) {
                $intern->addMediaFromRequest('document_dni')->toMediaCollection('dni_scan');
            }
            if ($request->hasFile('document_convenio')) {
                $intern->addMediaFromRequest('document_convenio')->toMediaCollection('convenio');
            }
            if ($request->hasFile('document_seguro')) {
                $intern->addMediaFromRequest('document_seguro')->toMediaCollection('seguro');
            }
        });

        return redirect()->route('becarios.index')
            ->with('success', 'Becario registrado correctamente.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Intern $intern)
    {
        $intern->load(['center', 'tutor:id,name,email', 'user.schedules']);

        return Inertia::render('becarios/show', [
            'intern' => $intern,
            'schedules' => $intern->user?->schedules
                ?->sortBy('day_of_week')
                ->values()
                ->map(fn ($schedule) => [
                    'id' => $schedule->id,
                    'day_of_week' => $schedule->day_of_week,
                    'start_time' => substr((string) $schedule->start_time, 0, 5),
                    'end_time' => substr((string) $schedule->end_time, 0, 5),
                ]) ?? [],
            'documents' => [
                'dni' => $intern->getFirstMediaUrl('dni_scan'),
                'convenio' => $intern->getFirstMediaUrl('convenio'),
                'seguro' => $intern->getFirstMediaUrl('seguro'),
            ],
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Intern $intern)
    {
        return Inertia::render('becarios/edit', [
            'intern' => $intern,
            'centers' => Center::all(['id', 'name']),
            'tutors' => User::role('tutor')->orderBy('name')->get(['id', 'name', 'email']),
            'current_documents' => [
                'dni' => $intern->getFirstMediaUrl('dni_scan'),
                'convenio' => $intern->getFirstMediaUrl('convenio'),
            ],
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(InternRequest $request, $id)
    {
        $intern = Intern::findOrFail($id);
        $validated = $request->validated();

        DB::transaction(function () use ($validated, $request, $intern) {
            $intern->update($validated);

            if ($request->hasFile('document_dni')) {
                $intern->addMediaFromRequest('document_dni')->toMediaCollection('dni_scan');
            }
            if ($request->hasFile('document_convenio')) {
                $intern->addMediaFromRequest('document_convenio')->toMediaCollection('convenio');
            }
            if ($request->hasFile('document_seguro')) {
                $intern->addMediaFromRequest('document_seguro')->toMediaCollection('seguro');
            }
        });

        return redirect()->route('becarios.index')
            ->with('success', 'Información del becario actualizada.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $intern = Intern::findOrFail($id);

        if ($intern->user_id) {
            User::where('id', $intern->user_id)->delete();
        }

        $intern->delete();

        return redirect()->route('becarios.index')
            ->with('success', 'Becario eliminado correctamente.');
    }
}
