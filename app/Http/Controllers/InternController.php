<?php

namespace App\Http\Controllers;

use App\Exports\InternsExport;
use App\Http\Requests\InternRequest;
use App\Models\Center;
use App\Models\Intern;
use App\Models\User;
use App\Notifications\InternRegistrationInvitation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

class InternController extends Controller
{
    private function commaFilter(?string $value): array
    {
        if (! $value) {
            return [];
        }

        return array_values(array_filter(explode(',', $value), fn ($item) => $item !== ''));
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        $centerIds = $this->commaFilter($request->input('center_id'));
        $statuses = $this->commaFilter($request->input('status'));

        return Inertia::render('becarios/index', [
            'interns' => $this->scopedInternsQuery($user)
                ->with(['center:id,name', 'tutor:id,name,email', 'user:id,name,email,email_verified_at', 'user.media'])
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
            'centers' => $this->scopedCentersQuery($user)->get(['id', 'name']),
        ]);
    }

    public function export(Request $request)
    {
        $user = Auth::user();
        $filters = $request->only(['search', 'center_id', 'status', 'start_from', 'start_to', 'end_from', 'end_to']);
        $fileName = 'becarios_periodo_'.now()->format('d-m-Y_Hi').'.xlsx';

        return Excel::download(new InternsExport($filters, $user), $fileName);
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
                'password' => Hash::make(Str::random(48)),
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
        $this->authorizeInternAccess($intern);

        $intern->load(['center', 'tutor:id,name,email', 'user:id,name,email,email_verified_at', 'user.schedules']);

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
        $this->authorizeInternAccess($intern);

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
        $this->authorizeInternAccess($intern);
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
        $this->authorizeInternAccess($intern);

        $intern->delete();

        return redirect()->route('becarios.index')
            ->with('success', 'Becario eliminado correctamente.');
    }

    public function sendInvitation(Intern $intern)
    {
        $this->authorizeInternAccess($intern);

        $this->sendInvitationToIntern($intern);

        return back()->with('success', 'Invitacion enviada a '.$intern->email.'.');
    }

    public function sendBulkInvitations(Request $request)
    {
        $user = Auth::user();
        abort_unless($user instanceof User, 403);

        $validated = $request->validate([
            'mode' => ['required', 'in:selected,filtered'],
            'intern_ids' => ['array'],
            'intern_ids.*' => ['integer', 'distinct', 'exists:interns,id'],
            'filters' => ['array'],
        ]);

        $query = $this->scopedInternsQuery($user);

        if ($validated['mode'] === 'selected') {
            $ids = $validated['intern_ids'] ?? [];
            abort_if($ids === [], 422, 'Selecciona al menos un becario.');

            $interns = $query->whereIn('id', $ids)->get();
            abort_unless($interns->count() === count($ids), 403);
        } else {
            $interns = $this->applyInternFilters($query, $validated['filters'] ?? [])->get();
        }

        if ($interns->isEmpty()) {
            return back()->with('error', 'No hay becarios a los que enviar invitacion.');
        }

        $interns->each(fn (Intern $intern) => $this->sendInvitationToIntern($intern));

        return back()->with('success', 'Se han enviado '.$interns->count().' invitaciones.');
    }

    private function scopedInternsQuery(?User $user)
    {
        abort_unless($user instanceof User, 403);

        return Intern::query()
            ->when($user->hasRole('tutor') && ! $user->hasRole('admin'), fn ($query) => $query->where('tutor_id', $user->id));
    }

    private function scopedCentersQuery(?User $user)
    {
        abort_unless($user instanceof User, 403);

        if ($user->hasRole('admin')) {
            return Center::query()->orderBy('name');
        }

        return Center::query()
            ->whereHas('interns', fn ($query) => $query->whereIn('id', $this->scopedInternsQuery($user)->pluck('id')))
            ->orderBy('name');
    }

    private function authorizeInternAccess(Intern $intern): void
    {
        $user = Auth::user();
        abort_unless($user instanceof User, 403);

        if ($user->hasRole('admin')) {
            return;
        }

        if ($user->hasRole('tutor')) {
            abort_unless((int) $intern->tutor_id === (int) $user->id, 403);

            return;
        }

        abort(403);
    }

    private function applyInternFilters($query, array $filters)
    {
        $centerIds = $this->commaFilter($this->stringFilter($filters['center_id'] ?? null));
        $statuses = $this->commaFilter($this->stringFilter($filters['status'] ?? null));

        return $query
            ->when($this->stringFilter($filters['search'] ?? null), function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'ilike', "%{$search}%")
                        ->orWhere('last_name', 'ilike', "%{$search}%")
                        ->orWhere('dni', 'ilike', "%{$search}%")
                        ->orWhere('email', 'ilike', "%{$search}%");
                });
            })
            ->when($centerIds, fn ($query) => $query->whereIn('center_id', $centerIds))
            ->when($statuses, fn ($query) => $query->whereIn('status', $statuses))
            ->when($this->stringFilter($filters['start_from'] ?? null), fn ($query, $date) => $query->whereDate('start_date', '>=', $date))
            ->when($this->stringFilter($filters['start_to'] ?? null), fn ($query, $date) => $query->whereDate('start_date', '<=', $date))
            ->when($this->stringFilter($filters['end_from'] ?? null), fn ($query, $date) => $query->whereDate('end_date', '>=', $date))
            ->when($this->stringFilter($filters['end_to'] ?? null), fn ($query, $date) => $query->whereDate('end_date', '<=', $date));
    }

    private function stringFilter(mixed $value): ?string
    {
        return is_string($value) && $value !== '' ? $value : null;
    }

    private function sendInvitationToIntern(Intern $intern): void
    {
        $user = $this->ensureInvitationUser($intern);
        $token = Password::broker()->createToken($user);
        $url = route('password.reset', [
            'token' => $token,
            'email' => $user->email,
        ]);

        $user->notify(new InternRegistrationInvitation($intern, $url));
    }

    private function ensureInvitationUser(Intern $intern): User
    {
        $name = trim($intern->name.' '.$intern->last_name);

        if ($intern->user_id) {
            $user = User::findOrFail($intern->user_id);

            if ($user->email !== $intern->email) {
                $user->forceFill(['email' => $intern->email])->save();
            }

            if (! $user->hasRole('intern')) {
                $user->assignRole('intern');
            }

            return $user;
        }

        $user = User::query()->where('email', $intern->email)->first();

        if ($user && $user->intern()->whereKeyNot($intern->id)->exists()) {
            throw ValidationException::withMessages([
                'email' => 'Este correo ya esta vinculado a otro becario.',
            ]);
        }

        if (! $user) {
            $user = User::create([
                'name' => $name,
                'email' => $intern->email,
                'password' => Hash::make(Str::random(48)),
            ]);
        }

        if (! $user->hasRole('intern')) {
            $user->assignRole('intern');
        }

        $intern->forceFill(['user_id' => $user->id])->save();

        return $user;
    }
}
