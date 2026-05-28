import { Head, Link, router, usePage } from '@inertiajs/react';
import { Search, UserCheck, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';

type Tutor = {
    id: number;
    name: string;
    email: string;
    assigned_interns_count: number;
};

type InternRow = {
    id: number;
    name: string;
    dni: string;
    email: string;
    status: string;
    academic_cycle: string | null;
    center: { id: number; name: string } | null;
    tutor: { id: number; name: string; email: string } | null;
};

type Pagination<T> = {
    data: T[];
    from: number | null;
    to: number | null;
    total: number;
    current_page: number;
    last_page: number;
    next_page_url: string | null;
    prev_page_url: string | null;
};

type Props = {
    tutors: Tutor[];
    interns: Pagination<InternRow>;
    filters: {
        search?: string;
        tutor_id?: string;
    };
    unassignedCount: number;
};

const statusLabels: Record<string, string> = {
    active: 'Activo',
    finished: 'Finalizado',
    abandoned: 'Abandonado',
};

const statusClasses: Record<string, string> = {
    active: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    finished: 'border-blue-100 bg-blue-50 text-blue-700',
    abandoned: 'border-rose-100 bg-rose-50 text-rose-700',
};

export default function TutorAssignments({
    tutors,
    interns,
    filters,
    unassignedCount,
}: Props) {
    const { flash } = usePage().props as {
        flash?: { success?: string; error?: string };
    };
    const [search, setSearch] = useState(filters.search ?? '');
    const [tutorFilter, setTutorFilter] = useState(filters.tutor_id || 'all');

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    useEffect(() => {
        const normalizedSearch = search.trim();
        const normalizedTutor = tutorFilter === 'all' ? '' : tutorFilter;

        if (
            normalizedSearch === (filters.search ?? '') &&
            normalizedTutor === (filters.tutor_id ?? '')
        ) {
            return;
        }

        const timeout = window.setTimeout(() => {
            router.get(
                '/admin/asignaciones-tutores',
                {
                    search: normalizedSearch || undefined,
                    tutor_id: tutorFilter === 'all' ? undefined : tutorFilter,
                },
                {
                    preserveState: true,
                    replace: true,
                    preserveScroll: true,
                    only: ['interns', 'filters', 'tutors', 'unassignedCount'],
                },
            );
        }, 250);

        return () => window.clearTimeout(timeout);
    }, [search, tutorFilter, filters.search, filters.tutor_id]);

    const resetFilters = () => {
        setSearch('');
        setTutorFilter('all');
        router.get('/admin/asignaciones-tutores', {}, { preserveState: true, replace: true });
    };

    const updateTutor = (intern: InternRow, value: string) => {
        router.patch(
            `/admin/becarios/${intern.id}/tutor`,
            { tutor_id: value === 'unassigned' ? null : Number(value) },
            {
                preserveScroll: true,
                onSuccess: () => toast.success('Tutor actualizado'),
                onError: () => toast.error('No se pudo actualizar el tutor'),
            },
        );
    };

    return (
        <AppLayout>
            <Head title="Asignacion de tutores" />

            <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-8">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                            Asignacion de tutores
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Revisa que becarios tiene cada tutor y reasignalos
                            desde una vista unica.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button asChild variant="outline" className="rounded-xl">
                            <Link href="/admin/usuarios">Usuarios y roles</Link>
                        </Button>
                        <Button className="rounded-xl bg-slate-900 hover:bg-slate-800">
                            Asignacion de tutores
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <Card className="rounded-2xl border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                                    Sin tutor
                                </p>
                                <p className="mt-2 text-3xl font-black text-rose-700">
                                    {unassignedCount}
                                </p>
                            </div>
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 ring-1 ring-rose-100">
                                <Users className="h-5 w-5" />
                            </div>
                        </div>
                    </Card>

                    {tutors.slice(0, 7).map((tutor) => (
                        <Card key={tutor.id} className="rounded-2xl border-slate-200 bg-white p-5 shadow-sm">
                            <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-bold text-slate-900">
                                        {tutor.name}
                                    </p>
                                    <p className="truncate text-xs text-slate-500">
                                        {tutor.email}
                                    </p>
                                    <p className="mt-2 text-2xl font-black text-slate-900">
                                        {tutor.assigned_interns_count}
                                    </p>
                                </div>
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                                    <UserCheck className="h-5 w-5" />
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>

                <Card className="overflow-hidden rounded-3xl border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 p-5">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                            <div>
                                <h2 className="font-black text-slate-900">
                                    Becarios y tutor asignado
                                </h2>
                                <p className="text-sm text-slate-500">
                                    Mostrando {interns.from ?? 0}-{interns.to ?? 0} de{' '}
                                    {interns.total}
                                </p>
                            </div>
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(220px,1fr)_220px_auto]">
                                <div className="relative">
                                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <Input
                                        value={search}
                                        onChange={(event) => setSearch(event.target.value)}
                                        placeholder="Buscar becario, DNI o email"
                                        className="h-10 rounded-xl pl-9"
                                    />
                                </div>
                                <Select value={tutorFilter} onValueChange={setTutorFilter}>
                                    <SelectTrigger className="h-10 w-full rounded-xl">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos</SelectItem>
                                        <SelectItem value="unassigned">Sin tutor</SelectItem>
                                        {tutors.map((tutor) => (
                                            <SelectItem key={tutor.id} value={String(tutor.id)}>
                                                {tutor.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
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
                        <table className="w-full min-w-[860px] text-left text-sm">
                            <thead className="border-b border-slate-100 bg-slate-50 text-[11px] font-black uppercase tracking-widest text-slate-400">
                                <tr>
                                    <th className="px-5 py-3">Becario</th>
                                    <th className="px-5 py-3">Centro y ciclo</th>
                                    <th className="px-5 py-3">Estado</th>
                                    <th className="px-5 py-3">Tutor asignado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {interns.data.map((intern) => (
                                    <tr key={intern.id} className="border-b border-slate-100 last:border-0">
                                        <td className="px-5 py-4">
                                            <p className="font-bold text-slate-900">{intern.name}</p>
                                            <p className="text-sm text-slate-500">{intern.email}</p>
                                            <p className="text-xs text-slate-400">DNI {intern.dni}</p>
                                        </td>
                                        <td className="px-5 py-4">
                                            <p className="font-semibold text-slate-700">
                                                {intern.center?.name ?? 'Sin centro'}
                                            </p>
                                            <p className="text-sm text-slate-500">
                                                {intern.academic_cycle ?? 'Sin ciclo'}
                                            </p>
                                        </td>
                                        <td className="px-5 py-4">
                                            <Badge
                                                variant="outline"
                                                className={
                                                    statusClasses[intern.status] ??
                                                    'border-slate-100 bg-slate-50 text-slate-600'
                                                }
                                            >
                                                {statusLabels[intern.status] ?? intern.status}
                                            </Badge>
                                        </td>
                                        <td className="px-5 py-4">
                                            <Select
                                                value={intern.tutor ? String(intern.tutor.id) : 'unassigned'}
                                                onValueChange={(value) => updateTutor(intern, value)}
                                            >
                                                <SelectTrigger className="h-10 w-[220px] rounded-xl">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="unassigned">Sin tutor</SelectItem>
                                                    {tutors.map((tutor) => (
                                                        <SelectItem key={tutor.id} value={String(tutor.id)}>
                                                            {tutor.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {interns.last_page > 1 && (
                        <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-100 bg-slate-50/70 px-5 py-4 text-sm md:flex-row">
                            <p className="rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-slate-500 shadow-sm ring-1 ring-slate-100">
                                Pagina {interns.current_page} de {interns.last_page}
                            </p>
                            <div className="inline-flex overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                                {interns.prev_page_url ? (
                                    <Link
                                        href={interns.prev_page_url}
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
                                {interns.next_page_url ? (
                                    <Link
                                        href={interns.next_page_url}
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
        </AppLayout>
    );
}
