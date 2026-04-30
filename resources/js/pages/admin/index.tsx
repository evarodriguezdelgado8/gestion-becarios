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
    const getGroupedPermissions = () => {
        return {
            'Centros Educativos': allPermissions.filter(p => p.name.includes('center')),
            'Becarios': allPermissions.filter(p => p.name.includes('intern')),
            'Gestión de Tareas': allPermissions.filter(p => p.name.includes('task') || p.name.includes('deliverable') || p.name.includes('specification')),
            'Evaluación y Sistema': allPermissions.filter(p => !p.name.includes('center') && !p.name.includes('intern') && !p.name.includes('task') && !p.name.includes('deliverable') && !p.name.includes('specification')),
        };
    };

    const grouped = getGroupedPermissions();

    return (
        <AppLayout>
            <Head title="Matriz de Permisos" />
            
            {/* Fondo con contraste para que la tabla resalte */}
            <div className="w-full min-h-screen bg-slate-100 py-8 px-4 sm:px-6 lg:px-8">
                
                <div className="max-w-[98rem] mx-auto">
                    <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4 px-2">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Matriz de Roles y Permisos</h1>
                            <p className="text-slate-500 text-sm mt-1">Configuración técnica de accesos para los perfiles del sistema.</p>
                        </div>
                        <div className="text-xs font-medium text-slate-400 bg-white px-3 py-1.5 rounded-full shadow-sm border border-slate-200">
                            Sincronización automática activada
                        </div>
                    </div>

                    {/* Tabla con bordes definidos y sombra fuerte */}
                    <div className="bg-white rounded-xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse table-fixed">
                                <thead>
                                    <tr className="bg-slate-800 border-b border-slate-700">
                                        <th className="p-4 text-[11px] font-bold text-slate-300 uppercase tracking-widest w-[35%]">
                                            Capacidad / Acción
                                        </th>
                                        {roles.map((role) => (
                                            <th key={role.id} className="p-4 text-center border-l border-slate-700">
                                                <span className="text-xs font-black text-white uppercase tracking-wider">
                                                    {role.name.toLowerCase() === 'intern' ? 'Becario' : role.name}
                                                </span>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {Object.entries(grouped).map(([sectionTitle, permissions]) => (
                                        permissions.length > 0 && (
                                            <React.Fragment key={sectionTitle}>
                                                {/* Separador de sección con contraste */}
                                                <tr>
                                                    <td colSpan={roles.length + 1} className="bg-slate-200/70 p-2.5 pl-6 font-bold text-slate-600 text-[10px] uppercase tracking-[0.15em] border-y border-slate-200">
                                                        {sectionTitle}
                                                    </td>
                                                </tr>
                                                {permissions.map((permission, index) => (
                                                    <tr 
                                                        key={permission.id} 
                                                        className={`hover:bg-blue-50/50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}
                                                    >
                                                        <td className="p-4 pl-8 border-b border-slate-100">
                                                            <div className="flex flex-col">
                                                                <span className="text-slate-800 font-semibold text-[15px]">
                                                                    {permissionTranslations[permission.name] || permission.name}
                                                                </span>
                                                                <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                                                                    {permission.name}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        {roles.map((role) => (
                                                            <td key={role.id} className="p-4 text-center border-b border-slate-100 border-l border-slate-100">
                                                                <div className="flex justify-center items-center">
                                                                    <PermissionToggle role={role} permission={permission} />
                                                                </div>
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </React.Fragment>
                                        )
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

function PermissionToggle({ role, permission }: { role: Role; permission: Permission }) {
    const hasPermission = role.permissions.some((p) => p.id === permission.id);

    const handleToggle = (checked: boolean) => {
        const currentNames = role.permissions.map(p => p.name);
        const newPermissions = checked 
            ? [...currentNames, permission.name]
            : currentNames.filter(name => name !== permission.name);

        router.post(`/admin/roles/${role.id}`, 
            { permissions: newPermissions },
            {
                preserveScroll: true,
                onSuccess: () => toast.success(`Permiso actualizado`),
                onError: () => toast.error("Error al sincronizar")
            }
        );
    };

    return (
        <Checkbox 
            checked={hasPermission} 
            onCheckedChange={(checked) => handleToggle(!!checked)}
            // Checkbox tamaño estándar profesional
            className="h-5 w-5 rounded border-slate-300 data-[state=checked]:bg-blue-700 data-[state=checked]:border-blue-700 transition-all shadow-sm"
        />
    );
}