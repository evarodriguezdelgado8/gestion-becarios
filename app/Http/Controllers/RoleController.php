<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Inertia\Inertia;

class RoleController extends Controller
{
    public function index()
    {
        return Inertia::render('admin/index', [
            'roles' => Role::with('permissions')->get(),
            'allPermissions' => Permission::all(),
        ]);
    }

    public function update(Request $request, Role $role) 
    {
        $request->validate([
            'permissions' => 'array'
        ]);

        $role->syncPermissions($request->permissions);

        return back()->with('success', 'Permisos actualizados correctamente para ' . $role->name);
    }
}