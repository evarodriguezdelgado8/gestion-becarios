<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            'manage centers',
            'view centers',

            'manage interns',            
            'view interns',
            
            'create tasks',
            'assign tasks',
            'edit any task',
            'delete tasks',
            'attach specifications',
            'evaluate progress',
            
            'view own tasks',
            'upload deliverables',
            'update task status',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        $admin = Role::firstOrCreate(['name' => 'admin']);
        $tutor = Role::firstOrCreate(['name' => 'tutor']);
        $intern = Role::firstOrCreate(['name' => 'intern']);

        $admin->syncPermissions(Permission::all());

        $tutor->syncPermissions([
            'view centers',
            'view interns',
            'create tasks',
            'assign tasks',
            'edit any task',
            'delete tasks',
            'attach specifications',
            'evaluate progress',
            'update task status',
            'view own tasks',
        ]);

        $intern->syncPermissions([
            'view own tasks',
            'upload deliverables',
            'update task status',
        ]);
    }
}