import { Head, router } from '@inertiajs/react';
import React from 'react';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import AppLayout from '@/layouts/app-layout';

const permissionTranslations: Record<string, string> = {
    'view centers': 'Visualizar centros educativos',
    'manage centers': 'Administrar centros (crear, editar, borrar)',
    'view interns': 'Consultar listado de becarios',
    'manage interns': 'Gestión completa de becarios y exportación',
    'view own tasks': 'Acceso al panel de tareas personales',
    'create tasks': 'Creación y asignación de nuevas tareas',
    'edit any task': 'Edición global de tareas del sistema',
    'delete tasks': 'Eliminar registros de tareas',
    'update task status': 'Cambiar estados (Pendiente, Progreso, Hecho)',
    'evaluate progress': 'Acceso al módulo de evaluación de desempeño',
    'assign tasks': 'Asignar tareas específicas a becarios',
    'attach specifications': 'Adjuntar documentación técnica',
    'upload deliverables': 'Gestión de archivos entregables',
};

interface Permission {
    id: number;
    name: string;
}

interface Role {
    id: number;
    name: string;
    permissions: Permission[];
}

interface Props {
    roles: Role[];
    allPermissions: Permission[];
}

export default function RolesIndex({ roles, allPermissions }: Props) {
    const translatedPermissions = allPermissions.filter(
        (permission) => permissionTranslations[permission.name],
    );
    const getGroupedPermissions = () => {
        return {
            'Centros Educativos': translatedPermissions.filter((p) =>
                p.name.includes('center'),
            ),
            Becarios: translatedPermissions.filter((p) =>
                p.name.includes('intern'),
            ),
            'Gestión de Tareas': allPermissions.filter(
                (p) =>
                    p.name.includes('task') ||
                    p.name.includes('deliverable') ||
                    p.name.includes('specification'),
            ),
            'Evaluación y Sistema': allPermissions.filter(
                (p) =>
                    !p.name.includes('center') &&
                    !p.name.includes('intern') &&
                    !p.name.includes('task') &&
                    !p.name.includes('deliverable') &&
                    !p.name.includes('specification'),
            ),
        };
    };

    const grouped = getGroupedPermissions();

    return (
        <AppLayout>
            <Head title="Permisos" />

            <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-8">
                <div className="space-y-6">
                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-slate-800">
                                Permisos
                            </h1>
                        </div>
                        <div className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-400 shadow-sm">
                            Sincronización automática activada
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xl">
                        <div className="border-b border-slate-100 px-5 py-4">
                            <h2 className="text-lg font-black text-slate-900">
                                Permisos por rol
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Activa o desactiva capacidades de forma
                                individual.
                            </p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[900px] table-fixed border-collapse text-left">
                                <thead>
                                    <tr className="border-b border-slate-700 bg-slate-800">
                                        <th className="w-[35%] p-4 text-[11px] font-bold tracking-widest text-slate-300 uppercase">
                                            Capacidad / Acción
                                        </th>
                                        {roles.map((role) => (
                                            <th
                                                key={role.id}
                                                className="border-l border-slate-700 p-4 text-center"
                                            >
                                                <span className="text-xs font-black tracking-wider text-white uppercase">
                                                    {role.name.toLowerCase() ===
                                                    'intern'
                                                        ? 'Becario'
                                                        : role.name}
                                                </span>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {Object.entries(grouped).map(
                                        ([sectionTitle, permissions]) =>
                                            permissions.length > 0 && (
                                                <React.Fragment
                                                    key={sectionTitle}
                                                >
                                                    {/* Separador de sección con contraste */}
                                                    <tr>
                                                        <td
                                                            colSpan={
                                                                roles.length + 1
                                                            }
                                                            className="border-y border-slate-200 bg-slate-200/70 p-2.5 pl-6 text-[10px] font-bold tracking-[0.15em] text-slate-600 uppercase"
                                                        >
                                                            {sectionTitle}
                                                        </td>
                                                    </tr>
                                                    {permissions.map(
                                                        (permission, index) => (
                                                            <tr
                                                                key={
                                                                    permission.id
                                                                }
                                                                className={`transition-colors hover:bg-blue-50/50 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}
                                                            >
                                                                <td className="border-b border-slate-100 p-4 pl-8">
                                                                    <div className="flex flex-col">
                                                                        <span className="text-[15px] font-semibold text-slate-800">
                                                                            {
                                                                                permissionTranslations[
                                                                                    permission
                                                                                        .name
                                                                                ]
                                                                            }
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                                {roles.map(
                                                                    (role) => (
                                                                        <td
                                                                            key={
                                                                                role.id
                                                                            }
                                                                            className="border-b border-l border-slate-100 p-4 text-center"
                                                                        >
                                                                            <div className="flex items-center justify-center">
                                                                                <PermissionToggle
                                                                                    role={
                                                                                        role
                                                                                    }
                                                                                    permission={
                                                                                        permission
                                                                                    }
                                                                                />
                                                                            </div>
                                                                        </td>
                                                                    ),
                                                                )}
                                                            </tr>
                                                        ),
                                                    )}
                                                </React.Fragment>
                                            ),
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

function PermissionToggle({
    role,
    permission,
}: {
    role: Role;
    permission: Permission;
}) {
    const hasPermission = role.permissions.some((p) => p.id === permission.id);

    const handleToggle = (checked: boolean) => {
        const currentNames = role.permissions.map((p) => p.name);
        const newPermissions = checked
            ? [...currentNames, permission.name]
            : currentNames.filter((name) => name !== permission.name);

        router.post(
            `/admin/roles/${role.id}`,
            { permissions: newPermissions },
            {
                preserveScroll: true,
                onSuccess: () => toast.success(`Permiso actualizado`),
                onError: () => toast.error('Error al sincronizar'),
            },
        );
    };

    return (
        <Checkbox
            checked={hasPermission}
            onCheckedChange={(checked) => handleToggle(!!checked)}
            // Checkbox tamaño estándar profesional
            className="h-5 w-5 rounded border-slate-300 shadow-sm transition-all data-[state=checked]:border-blue-700 data-[state=checked]:bg-blue-700"
        />
    );
}
