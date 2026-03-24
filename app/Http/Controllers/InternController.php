<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\Intern;
use App\Models\Center;
use Illuminate\Http\Request;
use App\Http\Requests\InternRequest;
use Illuminate\Support\Facades\DB;

use App\Exports\InternsExport;
use Maatwebsite\Excel\Facades\Excel;

class InternController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        return Inertia::render('becarios/index', [
            'interns' => Intern::query()
                ->with('center:id,name')
                ->when($request->input('search'), function ($query, $search) {
                    $query->where('name', 'ilike', "%{$search}%")
                        ->orWhere('last_name', 'ilike', "%{$search}%")
                        ->orWhere('dni', 'ilike', "%{$search}%")
                        ->orWhere('email', 'ilike', "%{$search}%");
                })
                ->when($request->input('center_id'), function ($query, $centerId) {
                    $query->where('center_id', $centerId);
                })
                ->when($request->input('status'), function ($query, $status) {
                    $query->where('status', $status);
                })
                ->when($request->input('from'), fn($q, $from) => $q->whereDate('start_date', '>=', $from))
                ->when($request->input('to'), fn($q, $to) => $q->whereDate('end_date', '<=', $to))

                ->latest()
                ->paginate(10)
                ->withQueryString(),
            'filters' => $request->only(['search']),
            'centers' => Center::all(['id', 'name']),
        ]);
}

    public function export(Request $request)
    {
        $filters = $request->only(['search', 'center_id', 'status', 'from', 'to']);
        $fileName = 'becarios_periodo_' . now()->format('d-m-Y_Hi') . '.xlsx';

        return Excel::download(new InternsExport($filters), $fileName);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return inertia('becarios/create', [
            'centers' => Center::all(['id', 'name'])
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(InternRequest $request)
    {
        $validated = $request->validated();

        DB::transaction(function () use ($validated, $request) {
            $intern = Intern::create($validated);

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
        return Inertia::render('becarios/show', [
            'intern' => $intern->load('center'),
            'documents' => [
                'dni' => $intern->getFirstMediaUrl('dni_scan'),
                'convenio' => $intern->getFirstMediaUrl('convenio'),
                'seguro' => $intern->getFirstMediaUrl('seguro'),
            ]
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
            'current_documents' => [
                'dni' => $intern->getFirstMediaUrl('dni_scan'),
                'convenio' => $intern->getFirstMediaUrl('convenio'),
            ]
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(InternRequest $request, Intern $intern)
    {
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
    public function destroy(Intern $intern)
    {
        $intern->delete();

        return redirect()->route('becarios.index')
            ->with('success', 'Becario eliminado correctamente.');
    }
}
