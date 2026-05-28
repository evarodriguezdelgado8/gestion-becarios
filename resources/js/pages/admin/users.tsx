import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    Mail,
    Search,
    ShieldCheck,
    UserCog,
    UserPlus,
    Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { MultiSelect } from '@/components/ui/multi-select';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';

type RoleName = 'admin' | 'tutor' | 'intern';

type ManagedUser = {
    id: number;
    name: string;
    email: string;
    email_verified_at: string | null;
    role: RoleName | string | null;
    roles: string[];
    intern: { id: number; name: string; dni: string } | null;
    assigned_interns_count: number;
    can_change_role: boolean;
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type Pagination<T> = {
    data: T[];
    links: PaginationLink[];
    from: number | null;
    to: number | null;
    total: number;
    current_page: number;
    last_page: number;
    next_page_url: string | null;
    prev_page_url: string | null;
};

type Props = {
    users: Pagination<ManagedUser>;
    filters: {
        search?: string;
        role?: string;
    };
    roleOptions: RoleName[];
    creationRoleOptions: Exclude<RoleName, 'intern'>[];
    roleCounts: Record<string, number>;
};

const roleLabels: Record<string, string> = {
    admin: 'Admin',
    tutor: 'Tutor',
    intern: 'Becario',
};

const roleBadgeClasses: Record<string, string> = {
    admin: 'border-blue-100 bg-blue-50 text-blue-700',
    tutor: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    intern: 'border-amber-100 bg-amber-50 text-amber-700',
};

const splitRoleFilter = (roleFilter?: string) =>
    roleFilter ? roleFilter.split(',').filter(Boolean) : [];

export default function AdminUsers({
    users,
    filters,
    roleOptions,
    creationRoleOptions,
    roleCounts,
}: Props) {
    const { flash } = usePage().props as {
        flash?: { success?: string; error?: string };
    };
    const [search, setSearch] = useState(filters.search ?? '');
    const [roleFilters, setRoleFilters] = useState<string[]>(
        splitRoleFilter(filters.role),
    );
    const roleFilterOptions = roleOptions.map((role) => ({
        label: roleLabels[role],
        value: role,
    }));
    const createForm = useForm({
        name: '',
        email: '',
        role: '',
    });

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    useEffect(() => {
        const normalizedSearch = search.trim();
        const normalizedRoles = roleFilters.join(',');

        if (
            normalizedSearch === (filters.search ?? '') &&
            normalizedRoles === (filters.role ?? '')
        ) {
            return;
        }

        const timeout = window.setTimeout(() => {
            router.get(
                '/admin/usuarios',
                {
                    search: normalizedSearch || undefined,
                    role:
                        roleFilters.length > 0
                            ? normalizedRoles
                            : undefined,
                },
                {
                    preserveState: true,
                    replace: true,
                    preserveScroll: true,
                    only: ['users', 'filters', 'roleCounts'],
                },
            );
        }, 250);

        return () => window.clearTimeout(timeout);
    }, [search, roleFilters, filters.search, filters.role]);

    const resetFilters = () => {
        setSearch('');
        setRoleFilters([]);
        router.get('/admin/usuarios', {}, { preserveState: true, replace: true });
    };

    const submitCreateUser = (event: FormEvent) => {
        event.preventDefault();

        createForm.post('/admin/usuarios', {
            preserveScroll: true,
            onSuccess: () => createForm.reset(),
            onError: () => toast.error('Revisa los datos del usuario.'),
        });
    };

    const updateRole = (user: ManagedUser, role: string) => {
        router.patch(
            `/admin/usuarios/${user.id}/rol`,
            { role },
            {
                preserveScroll: true,
                onSuccess: () => toast.success('Rol actualizado'),
                onError: () => toast.error('No se pudo actualizar el rol'),
            },
        );
    };

    return (
        <AppLayout>
            <Head title="Usuarios y roles" />

            <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-8">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                            Usuarios y roles
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Crea admins y tutores, y ajusta el rol de cualquier
                            usuario del sistema.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button className="rounded-xl bg-slate-900 hover:bg-slate-800">
                            Usuarios y roles
                        </Button>
                        <Button asChild variant="outline" className="rounded-xl">
                            <Link href="/admin/asignaciones-tutores">
                                Asignacion de tutores
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {roleOptions.map((role) => (
                        <Card key={role} className="rounded-2xl border-slate-200 bg-white p-5 shadow-sm">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                                        {roleLabels[role]}
                                    </p>
                                    <p className="mt-2 text-3xl font-black text-slate-900">
                                        {roleCounts[role] ?? 0}
                                    </p>
                                </div>
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-50 text-slate-500 ring-1 ring-slate-100">
                                    {role === 'admin' ? (
                                        <ShieldCheck className="h-5 w-5" />
                                    ) : role === 'tutor' ? (
                                        <UserCog className="h-5 w-5" />
                                    ) : (
                                        <Users className="h-5 w-5" />
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
                    <Card className="h-fit rounded-3xl border-slate-200 bg-white p-5 shadow-sm">
                        <div className="mb-5 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                                <UserPlus className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="font-black text-slate-900">
                                    Crear usuario interno
                                </h2>
                                <p className="text-sm text-slate-500">
                                    Para becarios usa el modulo de becarios.
                                </p>
                            </div>
                        </div>

                        <form onSubmit={submitCreateUser} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase text-slate-400">
                                    Nombre
                                </label>
                                <Input
                                    value={createForm.data.name}
                                    onChange={(event) =>
                                        createForm.setData('name', event.target.value)
                                    }
                                    placeholder="Nombre completo"
                                />
                                {createForm.errors.name && (
                                    <p className="text-xs font-semibold text-red-600">
                                        {createForm.errors.name}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase text-slate-400">
                                    Email
                                </label>
                                <Input
                                    type="email"
                                    value={createForm.data.email}
                                    onChange={(event) =>
                                        createForm.setData('email', event.target.value)
                                    }
                                    placeholder="usuario@empresa.com"
                                />
                                {createForm.errors.email && (
                                    <p className="text-xs font-semibold text-red-600">
                                        {createForm.errors.email}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase text-slate-400">
                                    Rol inicial
                                </label>
                                <Select
                                    value={createForm.data.role}
                                    onValueChange={(value) =>
                                        createForm.setData('role', value)
                                    }
                                >
                                    <SelectTrigger className="h-10 w-full rounded-xl">
                                        <SelectValue placeholder="Elegir rol" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {creationRoleOptions.map((role) => (
                                            <SelectItem key={role} value={role}>
                                                {roleLabels[role]}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {createForm.errors.role && (
                                    <p className="text-xs font-semibold text-red-600">
                                        {createForm.errors.role}
                                    </p>
                                )}
                            </div>

                            <Button
                                type="submit"
                                disabled={createForm.processing || !createForm.data.role}
                                className="w-full rounded-xl bg-blue-700 hover:bg-blue-800"
                            >
                                <Mail className="h-4 w-4" />
                                {createForm.processing
                                    ? 'Creando...'
                                    : 'Crear y enviar acceso'}
                            </Button>
                        </form>
                    </Card>

                    <Card className="overflow-hidden rounded-3xl border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-100 p-5">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                                <div>
                                    <h2 className="font-black text-slate-900">
                                        Usuarios registrados
                                    </h2>
                                    <p className="text-sm text-slate-500">
                                        Mostrando {users.from ?? 0}-{users.to ?? 0} de{' '}
                                        {users.total}
                                    </p>
                                </div>
                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(180px,1fr)_190px_auto]">
                                    <div className="relative">
                                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                        <Input
                                            value={search}
                                            onChange={(event) =>
                                                setSearch(event.target.value)
                                            }
                                            placeholder="Buscar nombre o email"
                                            className="h-10 rounded-xl pl-9"
                                        />
                                    </div>
                                    <MultiSelect
                                        options={roleFilterOptions}
                                        selected={roleFilters}
                                        onChange={setRoleFilters}
                                        placeholder="Todos los roles"
                                        className="h-10 min-h-10 overflow-hidden rounded-xl bg-white"
                                        selectedClassName="flex-nowrap overflow-hidden"
                                        badgeClassName="max-w-[70px]"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="rounded-xl"
                                        onClick={resetFilters}
                                    >
                                        Limpiar
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[760px] text-left text-sm">
                                <thead className="border-b border-slate-100 bg-slate-50 text-[11px] font-black uppercase tracking-widest text-slate-400">
                                    <tr>
                                        <th className="px-5 py-3">Usuario</th>
                                        <th className="px-5 py-3">Rol actual</th>
                                        <th className="px-5 py-3">Vinculo</th>
                                        <th className="px-5 py-3">Cambiar rol</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.data.map((user) => (
                                        <tr
                                            key={user.id}
                                            className="border-b border-slate-100 last:border-0"
                                        >
                                            <td className="px-5 py-4">
                                                <p className="font-bold text-slate-900">
                                                    {user.name}
                                                </p>
                                                <p className="text-sm text-slate-500">
                                                    {user.email}
                                                </p>
                                            </td>
                                            <td className="px-5 py-4">
                                                <Badge
                                                    variant="outline"
                                                    className={
                                                        roleBadgeClasses[
                                                            user.role ?? ''
                                                        ] ??
                                                        'border-slate-100 bg-slate-50 text-slate-600'
                                                    }
                                                >
                                                    {roleLabels[user.role ?? ''] ??
                                                        'Sin rol'}
                                                </Badge>
                                            </td>
                                            <td className="px-5 py-4 text-slate-500">
                                                {user.intern ? (
                                                    <div>
                                                        <p className="font-semibold text-slate-700">
                                                            {user.intern.name}
                                                        </p>
                                                        <p className="text-xs">
                                                            DNI {user.intern.dni}
                                                        </p>
                                                    </div>
                                                ) : user.assigned_interns_count > 0 ? (
                                                    <span>
                                                        {user.assigned_interns_count}{' '}
                                                        becarios asignados
                                                    </span>
                                                ) : (
                                                    <span>Sin ficha vinculada</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-4">
                                                <Select
                                                    value={user.role ?? ''}
                                                    disabled={!user.can_change_role}
                                                    onValueChange={(role) =>
                                                        updateRole(user, role)
                                                    }
                                                >
                                                    <SelectTrigger className="h-10 w-[108px] rounded-xl">
                                                        <SelectValue placeholder="Sin rol" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {roleOptions.map((role) => (
                                                            <SelectItem
                                                                key={role}
                                                                value={role}
                                                            >
                                                                {roleLabels[role]}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                {!user.can_change_role && (
                                                    <p className="mt-1 text-xs text-slate-400">
                                                        Protegido por seguridad.
                                                    </p>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {users.last_page > 1 && (
                            <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-100 bg-slate-50/70 px-5 py-4 text-sm md:flex-row">
                                <p className="rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-slate-500 shadow-sm ring-1 ring-slate-100">
                                    Pagina {users.current_page} de {users.last_page}
                                </p>
                                <div className="inline-flex overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                                    {users.prev_page_url ? (
                                        <Link
                                            href={users.prev_page_url}
                                            preserveScroll
                                            className="cursor-pointer border-r border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                                        >
                                            Anterior
                                        </Link>
                                    ) : (
                                        <span className="cursor-not-allowed border-r border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 opacity-40">
                                            Anterior
                                        </span>
                                    )}
                                    {users.next_page_url ? (
                                        <Link
                                            href={users.next_page_url}
                                            preserveScroll
                                            className="cursor-pointer px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                                        >
                                            Siguiente
                                        </Link>
                                    ) : (
                                        <span className="cursor-not-allowed px-4 py-2 text-sm font-bold text-slate-600 opacity-40">
                                            Siguiente
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
