<?php

namespace App\Http\Controllers;

use App\Models\Intern;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Throwable;

class RoleController extends Controller
{
    private const MANAGEABLE_ROLES = ['admin', 'tutor', 'intern'];

    public function index(): Response
    {
        return Inertia::render('admin/index', [
            'roles' => Role::with('permissions')->get(),
            'allPermissions' => Permission::all(),
        ]);
    }

    public function users(Request $request): Response
    {
        $roleFilters = collect(explode(',', $request->string('role')->toString()))
            ->filter(fn (string $role) => in_array($role, self::MANAGEABLE_ROLES, true))
            ->values()
            ->all();
        $search = $request->string('search')->toString();
        $adminCount = User::role('admin')->count();

        $users = User::query()
            ->with(['roles:id,name', 'intern:id,user_id,name,last_name,dni'])
            ->withCount('assignedInterns')
            ->when($search, function ($query, string $search) {
                $query->where(function ($query) use ($search) {
                    $query->where('name', 'ilike', "%{$search}%")
                        ->orWhere('email', 'ilike', "%{$search}%");
                });
            })
            ->when($roleFilters, fn ($query) => $query->role($roleFilters))
            ->orderBy('name')
            ->paginate(10)
            ->withQueryString()
            ->through(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'email_verified_at' => $user->email_verified_at,
                'role' => $this->primaryRole($user),
                'roles' => $user->roles->pluck('name')->values(),
                'intern' => $user->intern ? [
                    'id' => $user->intern->id,
                    'name' => trim($user->intern->name.' '.$user->intern->last_name),
                    'dni' => $user->intern->dni,
                ] : null,
                'assigned_interns_count' => $user->assigned_interns_count,
                'can_change_role' => ! $user->is($request->user()) && ! ($user->hasRole('admin') && $adminCount <= 1),
            ]);

        return Inertia::render('admin/users', [
            'users' => $users,
            'filters' => [
                'search' => $search,
                'role' => implode(',', $roleFilters),
            ],
            'roleOptions' => self::MANAGEABLE_ROLES,
            'creationRoleOptions' => ['admin', 'tutor'],
            'roleCounts' => Role::query()
                ->whereIn('name', self::MANAGEABLE_ROLES)
                ->select('id', 'name')
                ->withCount('users')
                ->get()
                ->mapWithKeys(fn (Role $role) => [$role->name => $role->users_count]),
        ]);
    }

    public function update(Request $request, Role $role): RedirectResponse
    {
        $request->validate([
            'permissions' => 'array',
        ]);

        $role->syncPermissions($request->permissions);

        return back()->with('success', 'Permisos actualizados correctamente para '.$role->name);
    }

    public function storeUser(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'role' => ['required', Rule::in(['admin', 'tutor'])],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make(Str::random(48)),
        ]);
        $user->forceFill(['email_verified_at' => now()])->save();
        $user->assignRole($validated['role']);

        try {
            $status = Password::sendResetLink(['email' => $user->email]);
        } catch (Throwable $exception) {
            report($exception);

            return back()->with('error', 'Usuario creado, pero no se pudo enviar el correo de acceso.');
        }

        if ($status !== Password::RESET_LINK_SENT) {
            return back()->with('error', 'Usuario creado, pero no se pudo enviar el correo de acceso.');
        }

        return back()->with('success', 'Usuario creado y correo de acceso enviado.');
    }

    public function updateUserRole(Request $request, User $user): RedirectResponse
    {
        if ($user->is($request->user())) {
            throw ValidationException::withMessages([
                'role' => 'No puedes cambiar tu propio rol.',
            ]);
        }

        $validated = $request->validate([
            'role' => ['required', Rule::in(self::MANAGEABLE_ROLES)],
        ]);

        if ($user->hasRole('admin') && $validated['role'] !== 'admin' && User::role('admin')->whereKeyNot($user->id)->count() === 0) {
            throw ValidationException::withMessages([
                'role' => 'No puedes quitar el rol al ultimo administrador.',
            ]);
        }

        if ($user->hasRole('tutor') && $validated['role'] !== 'tutor') {
            Intern::query()
                ->where('tutor_id', $user->id)
                ->update(['tutor_id' => null]);
        }

        $user->syncRoles([$validated['role']]);

        return back()->with('success', 'Rol actualizado correctamente.');
    }

    private function primaryRole(User $user): ?string
    {
        foreach (self::MANAGEABLE_ROLES as $role) {
            if ($user->hasRole($role)) {
                return $role;
            }
        }

        return $user->roles->first()?->name;
    }
}
