<?php

namespace App\Http\Controllers;

use App\Models\Intern;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class TutorAssignmentController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->string('search')->toString();
        $tutorFilter = $request->string('tutor_id')->toString();

        $tutors = User::role('tutor')
            ->withCount('assignedInterns')
            ->orderBy('name')
            ->get(['id', 'name', 'email']);

        $interns = Intern::query()
            ->with(['center:id,name', 'tutor:id,name,email'])
            ->when($search, function ($query, string $search) {
                $query->where(function ($query) use ($search) {
                    $query->where('name', 'ilike', "%{$search}%")
                        ->orWhere('last_name', 'ilike', "%{$search}%")
                        ->orWhere('dni', 'ilike', "%{$search}%")
                        ->orWhere('email', 'ilike', "%{$search}%");
                });
            })
            ->when($tutorFilter === 'unassigned', fn ($query) => $query->whereNull('tutor_id'))
            ->when(is_numeric($tutorFilter), fn ($query) => $query->where('tutor_id', (int) $tutorFilter))
            ->orderBy('last_name')
            ->orderBy('name')
            ->paginate(10)
            ->withQueryString()
            ->through(fn (Intern $intern) => [
                'id' => $intern->id,
                'name' => trim($intern->name.' '.$intern->last_name),
                'dni' => $intern->dni,
                'email' => $intern->email,
                'status' => $intern->status,
                'academic_cycle' => $intern->academic_cycle,
                'center' => $intern->center ? [
                    'id' => $intern->center->id,
                    'name' => $intern->center->name,
                ] : null,
                'tutor' => $intern->tutor ? [
                    'id' => $intern->tutor->id,
                    'name' => $intern->tutor->name,
                    'email' => $intern->tutor->email,
                ] : null,
            ]);

        return Inertia::render('admin/tutor-assignments', [
            'tutors' => $tutors->map(fn (User $tutor) => [
                'id' => $tutor->id,
                'name' => $tutor->name,
                'email' => $tutor->email,
                'assigned_interns_count' => $tutor->assigned_interns_count,
            ]),
            'interns' => $interns,
            'filters' => [
                'search' => $search,
                'tutor_id' => $tutorFilter,
            ],
            'unassignedCount' => Intern::query()->whereNull('tutor_id')->count(),
        ]);
    }

    public function update(Request $request, Intern $intern): RedirectResponse
    {
        $validated = $request->validate([
            'tutor_id' => ['nullable', 'integer', 'exists:users,id'],
        ]);

        $tutorId = $validated['tutor_id'] ?? null;

        if ($tutorId && ! User::role('tutor')->whereKey($tutorId)->exists()) {
            throw ValidationException::withMessages([
                'tutor_id' => 'El usuario seleccionado no tiene rol de tutor.',
            ]);
        }

        $intern->update(['tutor_id' => $tutorId]);

        return back()->with('success', 'Tutor asignado correctamente.');
    }
}
