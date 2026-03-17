<?php

namespace App\Http\Controllers;

use App\Models\Center;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Redirect;
use App\Http\Requests\CenterRequest;
use Illuminate\Support\Facades\Auth;

class CenterController extends Controller
{


    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        return Inertia::render('centros/index', [
            'centers' => Center::query()
                ->withCount(['interns as active_interns_count' => function ($query) {
                    $query->where('status', 'active');
                }])

                ->when($request->input('search'), function ($query, $search) {
                    $query->where('name', 'ilike', "%{$search}%")
                          ->orWhere('nif', 'ilike', "%{$search}%")
                          ->orWhere('email', 'ilike', "%{$search}%")                          
                          ->orWhere('phone', 'ilike', "%{$search}%")
                          ->orWhere('address', 'ilike', "%{$search}%")
                          ->orWhere('contact_name', 'ilike', "%{$search}%")
                          ->orWhere('contact_email', 'ilike', "%{$search}%");;
                })
                ->latest()
                ->paginate(10)
                ->withQueryString(),
            'filters' => $request->only(['search']),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {

        
        return Inertia::render('centros/form');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(CenterRequest $request)
    {
        
        Center::create($request->validated());
        return Redirect::route('centros.index')->with('success', 'Centro creado.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Center $center)
    {

        return Inertia::render('centros/show', [
            'center' => $center,

            'interns' => $center->interns()
                ->select('id', 'name', 'last_name', 'email', 'status', 'start_date')
                ->latest()
                ->get(),

            'stats' => [
                'total' => $center->interns()->count(),
                'activos' => $center->interns()->where('status', 'active')->count(),
                'finalizados' => $center->interns()->where('status', 'finished')->count(),
            ]
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Center $center)
    {
        return Inertia::render('centros/form', [
            'center' => $center
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(CenterRequest $request, Center $center)
    {
        $center->update($request->validated());

        return Redirect::route('centros.index')->with('success', 'Centro actualizado.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Center $center)
    {
        if ($center->interns()->where('status', 'active')->exists()) {
            return redirect()->back()->with('error', 'No se puede eliminar: el centro tiene becarios activos.');
        }
    
        $center->delete();
        return redirect()->route('centros.index')->with('success', 'Centro eliminado correctamente.');
    }
}
