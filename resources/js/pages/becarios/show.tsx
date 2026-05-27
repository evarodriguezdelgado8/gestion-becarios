import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    User,
    BookOpen,
    Calendar,
    ArrowLeft,
    Download,
    FileText,
    Clock,
    MapPin,
    Mail,
    Phone,
    Building2,
    ShieldCheck,
    Info,
    Copy,
    ClipboardList,
    Send,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import AppLayout from '@/layouts/app-layout';
import type { Intern, BreadcrumbItem } from '@/types';

interface Props {
    intern: Intern;
    schedules: Schedule[];
    documents: {
        dni: string | null;
        convenio: string | null;
        seguro: string | null;
    };
}

interface Schedule {
    id: number;
    day_of_week: number;
    start_time: string;
    end_time: string;
}

const WEEK_DAYS: Record<number, string> = {
    1: 'Lunes',
    2: 'Martes',
    3: 'Miércoles',
    4: 'Jueves',
    5: 'Viernes',
    6: 'Sábado',
    7: 'Domingo',
};

export default function Show({ intern, schedules, documents }: Props) {
    const { auth, flash } = usePage().props as any;
    const isAdmin = auth.user?.roles?.some((role: any) => {
        const roleName = typeof role === 'object' ? role.name : role;

        return roleName?.toLowerCase().includes('admin');
    });
    const isTutor = auth.user?.roles?.some((role: any) => {
        const roleName = typeof role === 'object' ? role.name : role;

        return roleName?.toLowerCase().includes('tutor');
    });
    const canManageSchedule = isAdmin || isTutor;
    const canInvite = isAdmin || isTutor;
    const [isSendingInvitation, setIsSendingInvitation] = useState(false);

    const formatDate = (dateString: string | null) => {
        if (!dateString) return null;
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('es-ES').format(date);
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Becarios', href: '/becarios' },
        { title: `${intern.name} ${intern.last_name}`, href: '#' },
    ];

    const copyToClipboard = (email: string) => {
        navigator.clipboard.writeText(email);
        toast.info('Copiado al portapapeles', {
            className: 'bg-blue-50 text-blue-700 border-blue-200',
            icon: <Copy className="h-4 w-4 text-blue-600" />,
        });
    };

    const sendInvitation = () => {
        setIsSendingInvitation(true);

        router.post(
            `/becarios/${intern.id}/invitar`,
            {},
            {
                preserveScroll: true,
                onFinish: () => setIsSendingInvitation(false),
            },
        );
    };

    const progress = Math.min(
        100,
        Math.round(
            (intern.completed_hours / (intern.total_hours || 400)) * 100,
        ),
    );

    const statusConfig = {
        active: {
            label: 'Activo',
            styles: 'bg-green-100 text-green-700 border-green-200',
        },
        finished: {
            label: 'Finalizado',
            styles: 'bg-blue-100 text-blue-700 border-blue-200',
        },
        abandoned: {
            label: 'Abandonado',
            styles: 'bg-red-100 text-red-700 border-red-200',
        },
    };

    const currentStatus =
        statusConfig[intern.status as keyof typeof statusConfig] ||
        statusConfig.abandoned;
    const hasSchedules = schedules.length > 0;

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Perfil - ${intern.name}`} />

            <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
                <div className="flex justify-start">
                    <button
                        onClick={() => window.history.back()}
                        className="mb-4 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-600 transition-colors hover:text-blue-800"
                    >
                        <ArrowLeft className="h-4 w-4" /> Volver al listado
                    </button>
                </div>

                <div className="flex flex-row items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="flex min-w-0 items-center gap-4">
                        <div className="flex hidden h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 sm:flex">
                            <User className="h-8 w-8" />
                        </div>

                        <div className="min-w-0">
                            <div className="flex flex-nowrap items-center gap-3">
                                <h2 className="truncate text-2xl font-bold text-gray-900">
                                    {intern.name} {intern.last_name}
                                </h2>
                                <span
                                    className={`flex-shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-bold whitespace-nowrap uppercase ${currentStatus.styles}`}
                                >
                                    {currentStatus.label}
                                </span>
                            </div>
                            <p className="mt-1 truncate font-mono text-sm text-gray-500">
                                DNI: {intern.dni}
                            </p>
                        </div>
                    </div>

                    {canManageSchedule && (
                        <div className="flex flex-shrink-0 flex-wrap justify-end gap-2">
                            {canInvite && (
                                <button
                                    type="button"
                                    onClick={sendInvitation}
                                    disabled={isSendingInvitation}
                                    className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-2.5 text-sm font-bold whitespace-nowrap text-emerald-700 shadow-sm transition-all hover:bg-emerald-100 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <Send className="h-4 w-4" />
                                    Enviar invitacion
                                </button>
                            )}
                            <Link
                                href={`/control-horario?intern_id=${intern.id}&tab=horario#horarios`}
                                className="inline-flex rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold whitespace-nowrap text-white shadow-sm transition-all hover:bg-slate-800 active:scale-95"
                            >
                                {hasSchedules
                                    ? 'Editar horario'
                                    : 'Añadir horario'}
                            </Link>
                            {isAdmin && (
                                <Link
                                    href={`/becarios/${intern.id}/edit`}
                                    className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold whitespace-nowrap text-white shadow-sm transition-all hover:bg-blue-700 active:scale-95"
                                >
                                    Editar Perfil
                                </Link>
                            )}
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <div className="space-y-6 md:col-span-2">
                        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                            <h3 className="mb-4 flex items-center gap-2 font-bold text-gray-900 uppercase">
                                <Info className="h-4 w-4 text-gray-900" />{' '}
                                Información de contacto
                            </h3>
                            <div className="flex flex-col gap-y-4">
                                <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
                                    <div className="group flex min-w-fit items-center gap-3 text-gray-700">
                                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50">
                                            <Mail className="h-4 w-4 text-blue-500" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase">
                                                Email
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <a
                                                    href={`mailto:${intern.email}`}
                                                    className="text-sm font-medium break-all transition-colors hover:text-blue-600"
                                                >
                                                    {intern.email}
                                                </a>
                                                <button
                                                    onClick={() =>
                                                        copyToClipboard(
                                                            intern.email,
                                                        )
                                                    }
                                                    className="cursor-pointer rounded p-1 text-gray-400 transition-all hover:bg-gray-100 hover:text-blue-500 active:scale-90"
                                                    title="Copiar email"
                                                >
                                                    <Copy className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex min-w-fit items-center gap-3 text-gray-700">
                                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-green-50">
                                            <Phone className="h-4 w-4 text-green-600" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase">
                                                Teléfono
                                            </span>
                                            <span className="text-sm font-medium">
                                                {intern.phone || 'No aportado'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 border-t border-gray-50 pt-2 text-gray-700">
                                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-red-50">
                                        <MapPin className="h-4 w-4 text-red-500" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase">
                                            Ubicación
                                        </span>
                                        {intern.address ? (
                                            <a
                                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(intern.address)}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sm font-medium transition-colors hover:text-blue-600 hover:underline"
                                            >
                                                {intern.address}
                                            </a>
                                        ) : (
                                            <span className="text-sm text-gray-400">
                                                Sin dirección
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                            <h3 className="mb-4 flex items-center gap-2 font-bold text-gray-900 uppercase">
                                <ClipboardList className="h-4 w-4 text-gray-900" />{' '}
                                Detalles del Centro y Tutoría
                            </h3>

                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                <div className="flex items-start gap-3">
                                    <Building2 className="mt-1 h-5 w-5 text-gray-400" />
                                    <div>
                                        {intern.center ? (
                                            <Link
                                                href={`/centros/${intern.center.id}`}
                                                className="font-bold text-gray-900 transition-colors hover:text-blue-600"
                                            >
                                                {intern.center.name}
                                            </Link>
                                        ) : (
                                            <p className="font-bold text-gray-900">
                                                Sin centro asignado
                                            </p>
                                        )}
                                        <p className="text-[10px] font-bold text-gray-400 uppercase">
                                            Centro de formación
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <User className="mt-1 h-5 w-5 text-gray-400" />
                                    <div>
                                        <p className="font-bold text-gray-900">
                                            {intern.tutor?.name ||
                                                'No asignado'}
                                        </p>
                                        {intern.tutor?.email && (
                                            <p className="text-xs font-medium text-gray-500">
                                                {intern.tutor.email}
                                            </p>
                                        )}
                                        <p className="text-[10px] font-bold text-gray-400 uppercase">
                                            Tutor asignado
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <User className="mt-1 h-5 w-5 text-gray-400" />
                                    <div>
                                        <p className="font-bold text-gray-900">
                                            {intern.academic_tutor ||
                                                'No asignado'}
                                        </p>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase">
                                            Tutor académico
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <BookOpen className="mt-1 h-5 w-5 text-gray-400" />
                                    <div>
                                        <p className="font-bold text-gray-900">
                                            {intern.academic_cycle ||
                                                'No especificado'}
                                        </p>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase">
                                            Ciclo Formativo
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Calendar className="mt-1 h-5 w-5 text-gray-400" />
                                    <div>
                                        <p className="font-bold text-gray-900">
                                            {formatDate(intern.start_date)} -{' '}
                                            {formatDate(intern.end_date) ||
                                                'Fin indefinido'}
                                        </p>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase">
                                            Periodo de Prácticas
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                            <h3 className="mb-4 flex items-center gap-2 font-bold text-gray-900 uppercase">
                                <Clock className="h-4 w-4 text-gray-900" />{' '}
                                Progreso de Horas
                            </h3>
                            <div className="mb-1 text-3xl font-black text-blue-600">
                                {intern.completed_hours}{' '}
                                <span className="text-sm font-normal text-gray-400">
                                    / {intern.total_hours}h totales
                                </span>
                            </div>
                            <div className="mt-4 h-3 w-full overflow-hidden rounded-full border border-gray-50 bg-gray-100">
                                <div
                                    className="h-full rounded-full bg-blue-600 transition-all duration-700 ease-out"
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>
                            <p className="mt-2 text-right text-[11px] font-bold text-blue-600">
                                {progress}% COMPLETADO
                            </p>
                        </div>

                        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                            <h3 className="mb-4 flex items-center gap-2 font-bold text-gray-900 uppercase">
                                <Calendar className="h-4 w-4 text-gray-900" />{' '}
                                Horario asignado
                            </h3>
                            {hasSchedules ? (
                                <div className="space-y-2">
                                    {schedules.map((schedule) => (
                                        <div
                                            key={schedule.id}
                                            className="flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50/60 px-3 py-2"
                                        >
                                            <span className="text-sm font-bold text-slate-800">
                                                {
                                                    WEEK_DAYS[
                                                        schedule.day_of_week
                                                    ]
                                                }
                                            </span>
                                            <span className="font-mono text-xs font-bold text-blue-700">
                                                {schedule.start_time} -{' '}
                                                {schedule.end_time}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm font-medium text-gray-400">
                                    No tiene horario asignado.
                                </div>
                            )}
                        </div>

                        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                            <h3 className="mb-4 flex items-center gap-2 font-bold text-gray-900 uppercase">
                                <ShieldCheck className="h-4 w-4 text-gray-900" />{' '}
                                Documentación
                            </h3>
                            <div className="space-y-3">
                                <DocItem
                                    label="DNI Escaneado"
                                    url={documents.dni}
                                    color="text-red-500"
                                />
                                <DocItem
                                    label="Convenio de Prácticas"
                                    url={documents.convenio}
                                    color="text-blue-500"
                                />
                                <DocItem
                                    label="Seguro"
                                    url={documents.seguro}
                                    color="text-green-600"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

function DocItem({
    label,
    url,
    color,
}: {
    label: string;
    url: string | null;
    color: string;
}) {
    if (!url)
        return (
            <div className="flex flex-col items-center gap-1 rounded-xl border border-dashed bg-gray-50/50 p-3 text-[11px] text-gray-400">
                <span>{label} pendiente</span>
            </div>
        );

    const fileName = url.split('/').pop() || `${label.replace(/\s+/g, '_')}`;

    return (
        <a
            href={url}
            download={fileName}
            className="group flex cursor-pointer items-center justify-between rounded-xl border border-gray-200 bg-white p-3 transition-all hover:border-blue-300"
            title={`Descargar ${label}`}
        >
            <span className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                <FileText className={`h-4 w-4 ${color}`} /> {label}
            </span>
            <div className="rounded-md p-1 transition-colors group-hover:bg-blue-50">
                <Download className="h-4 w-4 text-gray-300 transition-colors group-hover:text-blue-500" />
            </div>
        </a>
    );
}
