import { useMemo, useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import {
    AlertTriangle,
    BarChart3,
    CalendarClock,
    CheckCircle2,
    ClipboardList,
    GraduationCap,
    Hourglass,
    ListChecks,
    TrendingUp,
    Users,
} from 'lucide-react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

import { Card } from '@/components/ui/card';
import { MultiSelect } from '@/components/ui/multi-select';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
    },
];

const progressItemsPerPage = 4;

interface Kpi {
    key: string;
    label: string;
    value: number | string;
    detail: string;
}

interface CenterDistribution {
    center: string;
    total: number;
}

interface TaskStatus {
    status: string;
    label: string;
    total: number;
}

interface AttendanceStats {
    completedDaysRate: number;
    lateRate: number;
    absenceRate: number;
    averageDelayMinutes: number;
}

interface InternProgress {
    id: number;
    name: string;
    centerId?: number | null;
    center: string;
    academicCycle?: string | null;
    hoursProgress: number;
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    taskCompletionRate: number;
    statusDistribution: TaskStatus[];
    nextTasks: TaskSummary[];
}

interface TaskSummary {
    id: number;
    title: string;
    status: string;
    priority: string;
    dueDate?: string | null;
}

interface DashboardAlert {
    type: string;
    label: string;
    title: string;
    detail?: string;
    date?: string;
    href: string;
}

interface Props {
    role: 'admin' | 'tutor' | 'intern';
    kpis: Kpi[];
    internsByCenter: CenterDistribution[];
    taskStatusDistribution: TaskStatus[];
    attendanceStats: AttendanceStats;
    internProgress: InternProgress[];
    alerts: DashboardAlert[];
}

const kpiIcons: Record<string, React.ReactNode> = {
    active_interns: <Users className="h-5 w-5" />,
    pending_tasks: <ClipboardList className="h-5 w-5" />,
    pending_evaluations: <GraduationCap className="h-5 w-5" />,
    hours_progress: <Hourglass className="h-5 w-5" />,
    upcoming_endings: <CalendarClock className="h-5 w-5" />,
    active_alerts: <AlertTriangle className="h-5 w-5" />,
};

const chartColors = [
    '#2563eb',
    '#059669',
    '#d97706',
    '#dc2626',
    '#7c3aed',
    '#0891b2',
    '#4f46e5',
];

const roleLabels: Record<Props['role'], string> = {
    admin: 'Vista global',
    tutor: 'Vista de tutor',
    intern: 'Mi progreso',
};

const formatDate = (date?: string) => {
    if (!date) return 'Sin fecha';

    return new Date(date).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
    });
};

const progressCenterValue = (intern: InternProgress) => {
    if (intern.centerId === null) return 'without-center';
    if (intern.centerId === undefined) return `center-name:${intern.center}`;

    return String(intern.centerId);
};

const progressCycleValue = (intern: InternProgress) =>
    intern.academicCycle || 'Sin ciclo';

const statusTone: Record<string, string> = {
    pending: 'bg-slate-500',
    in_progress: 'bg-blue-600',
    in_review: 'bg-purple-600',
    completed: 'bg-green-600',
    rejected: 'bg-red-600',
};

const statusBadgeTone: Record<string, string> = {
    pending: 'border-slate-200 bg-slate-100 text-slate-700',
    in_progress: 'border-blue-200 bg-blue-100 text-blue-700',
    in_review: 'border-purple-200 bg-purple-100 text-purple-700',
    completed: 'border-green-200 bg-green-100 text-green-700',
    rejected: 'border-red-200 bg-red-100 text-red-700',
};

const priorityLabels: Record<string, string> = {
    low: 'Baja',
    medium: 'Media',
    high: 'Alta',
    urgent: 'Urgente',
};

const alertTone: Record<string, { card: string; badge: string; date: string }> =
    {
        task: {
            card: 'hover:border-red-200 hover:bg-red-50/40',
            badge: 'bg-red-50 text-red-700',
            date: 'text-red-400',
        },
        absence: {
            card: 'hover:border-amber-200 hover:bg-amber-50/40',
            badge: 'bg-amber-50 text-amber-700',
            date: 'text-amber-500',
        },
        ending: {
            card: 'hover:border-blue-200 hover:bg-blue-50/40',
            badge: 'bg-blue-50 text-blue-700',
            date: 'text-blue-400',
        },
    };

export default function Dashboard({
    role,
    kpis,
    internsByCenter,
    taskStatusDistribution,
    attendanceStats,
    internProgress,
    alerts,
}: Props) {
    const totalTasks = taskStatusDistribution.reduce(
        (total, status) => total + status.total,
        0,
    );
    const quickLinks =
        role === 'intern'
            ? [
                  { href: '/tareas', label: 'Mis tareas' },
                  { href: '/control-horario', label: 'Mi control horario' },
                  { href: '/mis-evaluaciones', label: 'Mis evaluaciones' },
              ]
            : [
                  { href: '/becarios', label: 'Becarios' },
                  { href: '/tareas', label: 'Tareas' },
                  { href: '/control-horario', label: 'Control horario' },
                  { href: '/reportes', label: 'Reportes' },
              ];
    const visibleKpis =
        role === 'intern'
            ? kpis.filter(
                  (kpi) =>
                      ![
                          'active_interns',
                          'upcoming_endings',
                          'active_alerts',
                      ].includes(kpi.key),
              )
            : kpis;
    const showCenterDistribution = role !== 'intern';
    const showInternProgress = role !== 'intern';
    const internNextTasks =
        role === 'intern' ? (internProgress[0]?.nextTasks ?? []) : [];

    const [selectedProgressInterns, setSelectedProgressInterns] = useState<
        string[]
    >([]);
    const [selectedProgressCenters, setSelectedProgressCenters] = useState<
        string[]
    >([]);
    const [selectedProgressCycles, setSelectedProgressCycles] = useState<
        string[]
    >([]);
    const [progressPage, setProgressPage] = useState(1);
    const [expandedProgressCards, setExpandedProgressCards] = useState<
        string[]
    >(
        role === 'intern'
            ? internProgress.map((intern) => String(intern.id))
            : [],
    );

    const progressInternOptions = useMemo(
        () =>
            internProgress.map((intern) => ({
                label: intern.name,
                value: String(intern.id),
            })),
        [internProgress],
    );

    const progressCenterOptions = useMemo(() => {
        const centers = new Map<string, string>();

        internProgress.forEach((intern) => {
            const value = progressCenterValue(intern);

            if (!centers.has(value)) {
                centers.set(value, intern.center);
            }
        });

        return Array.from(centers, ([value, label]) => ({ label, value })).sort(
            (a, b) => a.label.localeCompare(b.label),
        );
    }, [internProgress]);

    const progressCycleOptions = useMemo(() => {
        const cycles = Array.from(
            new Set(
                internProgress
                    .map((intern) => progressCycleValue(intern))
                    .filter(Boolean),
            ),
        );

        return cycles
            .map((cycle) => ({ label: cycle, value: cycle }))
            .sort((a, b) => a.label.localeCompare(b.label));
    }, [internProgress]);

    const filteredInternProgress = useMemo(
        () =>
            internProgress.filter((intern) => {
                const centerValue = progressCenterValue(intern);
                const cycleValue = progressCycleValue(intern);

                const matchesIntern =
                    selectedProgressInterns.length === 0 ||
                    selectedProgressInterns.includes(String(intern.id));
                const matchesCenter =
                    selectedProgressCenters.length === 0 ||
                    selectedProgressCenters.includes(centerValue);
                const matchesCycle =
                    selectedProgressCycles.length === 0 ||
                    selectedProgressCycles.includes(cycleValue);

                return matchesIntern && matchesCenter && matchesCycle;
            }),
        [
            internProgress,
            selectedProgressCenters,
            selectedProgressCycles,
            selectedProgressInterns,
        ],
    );

    const totalProgressPages = Math.max(
        1,
        Math.ceil(filteredInternProgress.length / progressItemsPerPage),
    );
    const currentProgressPage = Math.min(progressPage, totalProgressPages);
    const paginatedInternProgress = filteredInternProgress.slice(
        (currentProgressPage - 1) * progressItemsPerPage,
        currentProgressPage * progressItemsPerPage,
    );
    const progressRangeStart =
        filteredInternProgress.length > 0
            ? (currentProgressPage - 1) * progressItemsPerPage + 1
            : 0;
    const progressRangeEnd = Math.min(
        currentProgressPage * progressItemsPerPage,
        filteredInternProgress.length,
    );
    const hasProgressFilters =
        selectedProgressInterns.length > 0 ||
        selectedProgressCenters.length > 0 ||
        selectedProgressCycles.length > 0;
    const canFilterProgress = role !== 'intern';

    const resetProgressPage =
        (callback: (value: string[]) => void) => (value: string[]) => {
            callback(value);
            setProgressPage(1);
        };

    const clearProgressFilters = () => {
        setSelectedProgressInterns([]);
        setSelectedProgressCenters([]);
        setSelectedProgressCycles([]);
        setProgressPage(1);
    };

    const toggleProgressCard = (internId: number) => {
        const value = String(internId);

        setExpandedProgressCards((current) =>
            current.includes(value)
                ? current.filter((item) => item !== value)
                : [...current, value],
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />

            <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-8">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                    <div>
                        <p className="text-sm font-bold text-blue-600 uppercase">
                            {roleLabels[role]}
                        </p>
                        <h1 className="mt-1 text-2xl font-bold text-slate-900">
                            Dashboard
                        </h1>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {quickLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-600 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {visibleKpis.map((kpi, index) => (
                        <KpiCard
                            key={kpi.key}
                            kpi={kpi}
                            icon={
                                kpiIcons[kpi.key] ?? (
                                    <BarChart3 className="h-5 w-5" />
                                )
                            }
                            color={chartColors[index % chartColors.length]}
                        />
                    ))}
                </div>

                {showCenterDistribution && (
                    <Card className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="mb-5 flex items-center justify-between gap-3">
                            <div>
                                <h2 className="text-lg font-black text-slate-900">
                                    Becarios por centro
                                </h2>
                                <p className="text-sm text-slate-500">
                                    Distribucion actual por centro educativo.
                                </p>
                            </div>
                            <BarChart3 className="h-5 w-5 text-slate-400" />
                        </div>

                        {internsByCenter.length === 0 ? (
                            <EmptyState text="No hay becarios para mostrar." />
                        ) : (
                            <div className="h-96">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={internsByCenter}
                                        margin={{
                                            top: 10,
                                            right: 8,
                                            left: -18,
                                            bottom: 36,
                                        }}
                                    >
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            vertical={false}
                                        />
                                        <XAxis
                                            dataKey="center"
                                            tickLine={false}
                                            axisLine={false}
                                            tick={{ fontSize: 11 }}
                                            interval={0}
                                            angle={-18}
                                            textAnchor="end"
                                            height={62}
                                        />
                                        <YAxis
                                            allowDecimals={false}
                                            tickLine={false}
                                            axisLine={false}
                                            tick={{ fontSize: 12 }}
                                        />
                                        <Tooltip cursor={false} />
                                        <Bar
                                            dataKey="total"
                                            radius={[8, 8, 0, 0]}
                                            activeBar={false}
                                        >
                                            {internsByCenter.map(
                                                (entry, index) => (
                                                    <Cell
                                                        key={entry.center}
                                                        fill={
                                                            chartColors[
                                                                index %
                                                                    chartColors.length
                                                            ]
                                                        }
                                                    />
                                                ),
                                            )}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </Card>
                )}

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                    <Card className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="mb-5 flex items-center justify-between gap-3">
                            <div>
                                <h2 className="text-lg font-black text-slate-900">
                                    Cumplimiento horario
                                </h2>
                                <p className="text-sm text-slate-500">
                                    Resumen de los ultimos 30 dias.
                                </p>
                            </div>
                            <CheckCircle2 className="h-5 w-5 text-slate-400" />
                        </div>

                        <div className="space-y-4">
                            <MetricBar
                                label="Asistencia completa"
                                value={attendanceStats.completedDaysRate}
                                tone="bg-emerald-600"
                                compact
                            />
                            <MetricBar
                                label="Retrasos"
                                value={attendanceStats.lateRate}
                                tone="bg-amber-500"
                                compact
                            />
                            <MetricBar
                                label="Ausencias"
                                value={attendanceStats.absenceRate}
                                tone="bg-red-500"
                                compact
                            />
                            <div className="rounded-2xl bg-slate-50 p-4">
                                <p className="text-[11px] font-black text-slate-400 uppercase">
                                    Retraso medio
                                </p>
                                <p className="mt-2 text-3xl font-black text-slate-900">
                                    {attendanceStats.averageDelayMinutes} min
                                </p>
                            </div>
                        </div>
                    </Card>

                    <Card className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="mb-5 flex items-center justify-between gap-3">
                            <div>
                                <h2 className="text-lg font-black text-slate-900">
                                    Tareas por estado
                                </h2>
                                <p className="text-sm text-slate-500">
                                    {totalTasks} tarea(s) en el alcance actual.
                                </p>
                            </div>
                            <ListChecks className="h-5 w-5 text-slate-400" />
                        </div>

                        <div className="space-y-3">
                            {taskStatusDistribution.map((item) => {
                                const percent =
                                    totalTasks > 0
                                        ? Math.round(
                                              (item.total / totalTasks) * 100,
                                          )
                                        : 0;

                                return (
                                    <div
                                        key={item.status}
                                        className="space-y-2"
                                    >
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="font-bold text-slate-700">
                                                {item.label}
                                            </span>
                                            <span className="font-black text-slate-900">
                                                {item.total}
                                            </span>
                                        </div>
                                        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                                            <div
                                                className={`h-full rounded-full ${statusTone[item.status] ?? 'bg-blue-600'}`}
                                                style={{ width: `${percent}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>
                </div>

                {role === 'intern' && (
                    <Card className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="mb-5 flex items-center justify-between gap-3">
                            <div>
                                <h2 className="text-lg font-black text-slate-900">
                                    Mis proximas tareas
                                </h2>
                                <p className="text-sm text-slate-500">
                                    Tareas pendientes mas cercanas a la entrega.
                                </p>
                            </div>
                            <ClipboardList className="h-5 w-5 text-slate-400" />
                        </div>

                        {internNextTasks.length === 0 ? (
                            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 text-center text-sm font-bold text-emerald-700">
                                No tienes tareas pendientes proximas.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                {internNextTasks.slice(0, 4).map((task) => {
                                    const statusLabel =
                                        taskStatusDistribution.find(
                                            (item) =>
                                                item.status === task.status,
                                        )?.label ?? task.status;

                                    return (
                                        <Link
                                            key={task.id}
                                            href={`/tareas/${task.id}`}
                                            className="rounded-2xl border border-slate-200 p-4 transition hover:border-blue-200 hover:bg-blue-50/40"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <p className="truncate font-black text-slate-900">
                                                        {task.title}
                                                    </p>
                                                    <p className="mt-1 text-sm font-semibold text-slate-500">
                                                        {formatDate(
                                                            task.dueDate ??
                                                                undefined,
                                                        )}{' '}
                                                        ·{' '}
                                                        {priorityLabels[
                                                            task.priority
                                                        ] ?? task.priority}
                                                    </p>
                                                </div>
                                                <span
                                                    className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase ${statusBadgeTone[task.status] ?? statusBadgeTone.pending}`}
                                                >
                                                    {statusLabel}
                                                </span>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </Card>
                )}

                {showInternProgress && (
                    <Card className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="mb-5 flex items-center justify-between gap-3">
                            <div>
                                <h2 className="text-lg font-black text-slate-900">
                                    Progreso por becario
                                </h2>
                                <p className="text-sm text-slate-500">
                                    Avance de horas, tareas completadas y
                                    proximas tareas.
                                </p>
                            </div>
                            <TrendingUp className="h-5 w-5 text-slate-400" />
                        </div>

                        {internProgress.length === 0 ? (
                            <EmptyState text="No hay progreso disponible." />
                        ) : (
                            <div className="space-y-4">
                                {canFilterProgress && (
                                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-[1fr_1fr_1fr_auto] xl:items-end">
                                        <FilterField label="Becario">
                                            <MultiSelect
                                                options={progressInternOptions}
                                                selected={
                                                    selectedProgressInterns
                                                }
                                                onChange={resetProgressPage(
                                                    setSelectedProgressInterns,
                                                )}
                                                placeholder="Cualquier becario"
                                            />
                                        </FilterField>
                                        <FilterField label="Centro">
                                            <MultiSelect
                                                options={progressCenterOptions}
                                                selected={
                                                    selectedProgressCenters
                                                }
                                                onChange={resetProgressPage(
                                                    setSelectedProgressCenters,
                                                )}
                                                placeholder="Cualquier centro"
                                            />
                                        </FilterField>
                                        <FilterField label="Ciclo">
                                            <MultiSelect
                                                options={progressCycleOptions}
                                                selected={
                                                    selectedProgressCycles
                                                }
                                                onChange={resetProgressPage(
                                                    setSelectedProgressCycles,
                                                )}
                                                placeholder="Cualquier ciclo"
                                            />
                                        </FilterField>
                                        {hasProgressFilters && (
                                            <button
                                                type="button"
                                                onClick={clearProgressFilters}
                                                className="h-[38px] rounded-lg border border-slate-200 px-3 text-sm font-bold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                                            >
                                                Limpiar
                                            </button>
                                        )}
                                    </div>
                                )}

                                {filteredInternProgress.length === 0 ? (
                                    <EmptyState text="No hay becarios con esos filtros." />
                                ) : (
                                    <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
                                        {paginatedInternProgress.map(
                                            (intern) => {
                                                const expanded =
                                                    expandedProgressCards.includes(
                                                        String(intern.id),
                                                    );

                                                return (
                                                    <div
                                                        key={intern.id}
                                                        className="rounded-2xl border border-slate-200 p-3.5"
                                                    >
                                                        <div className="mb-2.5 flex flex-col justify-between gap-2 md:flex-row md:items-start">
                                                            <div className="min-w-0">
                                                                <p className="truncate text-sm font-black text-slate-900">
                                                                    {
                                                                        intern.name
                                                                    }
                                                                </p>
                                                                <p className="mt-0.5 truncate text-xs font-semibold text-slate-500">
                                                                    {
                                                                        intern.center
                                                                    }{' '}
                                                                    ·{' '}
                                                                    {progressCycleValue(
                                                                        intern,
                                                                    )}
                                                                </p>
                                                            </div>
                                                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black text-slate-600">
                                                                {
                                                                    intern.pendingTasks
                                                                }{' '}
                                                                pendiente(s)
                                                            </span>
                                                        </div>
                                                        <div className="space-y-2.5">
                                                            <MetricBar
                                                                label="Horas"
                                                                value={
                                                                    intern.hoursProgress
                                                                }
                                                                tone="bg-blue-600"
                                                                compact
                                                            />
                                                            <MetricBar
                                                                label="Tareas completadas"
                                                                value={
                                                                    intern.taskCompletionRate
                                                                }
                                                                tone="bg-emerald-600"
                                                                compact
                                                            />
                                                        </div>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                toggleProgressCard(
                                                                    intern.id,
                                                                )
                                                            }
                                                            className="mt-3 text-xs font-black text-blue-600 transition hover:text-blue-800"
                                                        >
                                                            {expanded
                                                                ? 'Ocultar detalle'
                                                                : 'Ver detalle'}
                                                        </button>

                                                        {expanded && (
                                                            <div className="mt-3 space-y-3 border-t border-slate-100 pt-3">
                                                                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                                                    <SmallStat
                                                                        label="Total"
                                                                        value={
                                                                            intern.totalTasks
                                                                        }
                                                                    />
                                                                    <SmallStat
                                                                        label="Completadas"
                                                                        value={
                                                                            intern.completedTasks
                                                                        }
                                                                    />
                                                                    <SmallStat
                                                                        label="Pendientes"
                                                                        value={
                                                                            intern.pendingTasks
                                                                        }
                                                                    />
                                                                    <SmallStat
                                                                        label="Avance"
                                                                        value={`${intern.taskCompletionRate}%`}
                                                                    />
                                                                </div>
                                                                <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                                                                    <div>
                                                                        <p className="mb-2 text-[11px] font-black text-slate-400 uppercase">
                                                                            Estados
                                                                        </p>
                                                                        <div className="space-y-1.5">
                                                                            {intern.statusDistribution.map(
                                                                                (
                                                                                    item,
                                                                                ) => (
                                                                                    <div
                                                                                        key={
                                                                                            item.status
                                                                                        }
                                                                                        className="flex items-center justify-between gap-3 text-xs"
                                                                                    >
                                                                                        <span className="font-bold text-slate-600">
                                                                                            {
                                                                                                item.label
                                                                                            }
                                                                                        </span>
                                                                                        <span className="font-black text-slate-900">
                                                                                            {
                                                                                                item.total
                                                                                            }
                                                                                        </span>
                                                                                    </div>
                                                                                ),
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    <div>
                                                                        <p className="mb-2 text-[11px] font-black text-slate-400 uppercase">
                                                                            Proximas
                                                                            tareas
                                                                        </p>
                                                                        {intern
                                                                            .nextTasks
                                                                            .length ===
                                                                        0 ? (
                                                                            <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-3 text-center text-xs font-bold text-emerald-700">
                                                                                Sin
                                                                                tareas
                                                                                pendientes.
                                                                            </div>
                                                                        ) : (
                                                                            <div className="space-y-1.5">
                                                                                {intern.nextTasks
                                                                                    .slice(
                                                                                        0,
                                                                                        2,
                                                                                    )
                                                                                    .map(
                                                                                        (
                                                                                            task,
                                                                                        ) => {
                                                                                            const statusLabel =
                                                                                                intern.statusDistribution.find(
                                                                                                    (
                                                                                                        item,
                                                                                                    ) =>
                                                                                                        item.status ===
                                                                                                        task.status,
                                                                                                )
                                                                                                    ?.label ??
                                                                                                task.status;

                                                                                            return (
                                                                                                <Link
                                                                                                    key={
                                                                                                        task.id
                                                                                                    }
                                                                                                    href={`/tareas/${task.id}`}
                                                                                                    className="block rounded-xl border border-slate-200 p-2.5 transition hover:border-blue-200 hover:bg-blue-50/50"
                                                                                                >
                                                                                                    <div className="flex items-start justify-between gap-3">
                                                                                                        <div className="min-w-0">
                                                                                                            <p className="truncate text-xs font-bold text-slate-900">
                                                                                                                {
                                                                                                                    task.title
                                                                                                                }
                                                                                                            </p>
                                                                                                            <p className="mt-1 text-xs font-semibold text-slate-400">
                                                                                                                {formatDate(
                                                                                                                    task.dueDate ??
                                                                                                                        undefined,
                                                                                                                )}{' '}
                                                                                                                ·{' '}
                                                                                                                {priorityLabels[
                                                                                                                    task
                                                                                                                        .priority
                                                                                                                ] ??
                                                                                                                    task.priority}
                                                                                                            </p>
                                                                                                        </div>
                                                                                                        <span
                                                                                                            className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-black uppercase ${statusBadgeTone[task.status] ?? statusBadgeTone.pending}`}
                                                                                                        >
                                                                                                            {
                                                                                                                statusLabel
                                                                                                            }
                                                                                                        </span>
                                                                                                    </div>
                                                                                                </Link>
                                                                                            );
                                                                                        },
                                                                                    )}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            },
                                        )}
                                    </div>
                                )}

                                {filteredInternProgress.length > 0 && (
                                    <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-100 bg-slate-50/70 px-4 py-4 text-sm font-bold text-slate-500 md:flex-row">
                                        <p className="rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-slate-500 shadow-sm ring-1 ring-slate-100">
                                            Mostrando{' '}
                                            <span className="font-black text-slate-900">
                                                {progressRangeStart}-
                                                {progressRangeEnd}
                                            </span>{' '}
                                            de{' '}
                                            <span className="font-black text-slate-900">
                                                {filteredInternProgress.length}
                                            </span>{' '}
                                            becarios · Pagina{' '}
                                            <span className="font-black text-slate-900">
                                                {currentProgressPage}
                                            </span>{' '}
                                            de{' '}
                                            <span className="font-black text-slate-900">
                                                {totalProgressPages}
                                            </span>
                                        </p>
                                        <div className="inline-flex overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setProgressPage((page) =>
                                                        Math.max(1, page - 1),
                                                    )
                                                }
                                                disabled={
                                                    currentProgressPage === 1
                                                }
                                                className="cursor-pointer border-r border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                                            >
                                                Anterior
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setProgressPage((page) =>
                                                        Math.min(
                                                            totalProgressPages,
                                                            page + 1,
                                                        ),
                                                    )
                                                }
                                                disabled={
                                                    currentProgressPage ===
                                                    totalProgressPages
                                                }
                                                className="cursor-pointer px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                                            >
                                                Siguiente
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </Card>
                )}

                <Card className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-5 flex items-center justify-between gap-3">
                        <div>
                            <h2 className="text-lg font-black text-slate-900">
                                Alertas y proximos hitos
                            </h2>
                            <p className="text-sm text-slate-500">
                                Resumen de las 6 alertas mas relevantes.
                            </p>
                        </div>
                        <AlertTriangle className="h-5 w-5 text-slate-400" />
                    </div>

                    {alerts.length === 0 ? (
                        <EmptyState text="No hay alertas activas." />
                    ) : (
                        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
                            {alerts.map((alert, index) => {
                                const tone =
                                    alertTone[alert.type] ?? alertTone.ending;

                                return (
                                    <Link
                                        key={`${alert.type}-${index}`}
                                        href={alert.href}
                                        className={`rounded-2xl border border-slate-200 p-3 transition ${tone.card}`}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <span
                                                    className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${tone.badge}`}
                                                >
                                                    {alert.label}
                                                </span>
                                                <p className="mt-2 truncate text-sm font-black text-slate-900">
                                                    {alert.title}
                                                </p>
                                                {alert.detail && (
                                                    <p className="mt-0.5 truncate text-xs font-semibold text-slate-500">
                                                        {alert.detail}
                                                    </p>
                                                )}
                                            </div>
                                            <span
                                                className={`shrink-0 text-[11px] font-black ${tone.date}`}
                                            >
                                                {formatDate(alert.date)}
                                            </span>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </Card>
            </div>
        </AppLayout>
    );
}

function KpiCard({
    kpi,
    icon,
    color,
}: {
    kpi: Kpi;
    icon: React.ReactNode;
    color: string;
}) {
    return (
        <Card className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <p className="truncate text-[11px] font-black text-slate-400 uppercase">
                        {kpi.label}
                    </p>
                    <p className="mt-2 text-3xl font-black text-slate-900">
                        {kpi.value}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                        {kpi.detail}
                    </p>
                </div>
                <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white"
                    style={{ backgroundColor: color }}
                >
                    {icon}
                </div>
            </div>
        </Card>
    );
}

function MetricBar({
    label,
    value,
    tone,
    compact = false,
}: {
    label: string;
    value: number;
    tone: string;
    compact?: boolean;
}) {
    const normalizedValue = Math.max(0, Math.min(100, Number(value || 0)));

    return (
        <div>
            <div className="mb-2 flex items-center justify-between text-sm">
                <span
                    className={
                        compact
                            ? 'font-bold text-slate-600'
                            : 'font-black text-slate-800'
                    }
                >
                    {label}
                </span>
                <span className="font-black text-slate-900">
                    {normalizedValue}%
                </span>
            </div>
            <div
                className={
                    compact
                        ? 'h-2 overflow-hidden rounded-full bg-slate-100'
                        : 'h-3 overflow-hidden rounded-full bg-slate-100'
                }
            >
                <div
                    className={`h-full rounded-full ${tone}`}
                    style={{ width: `${normalizedValue}%` }}
                />
            </div>
        </div>
    );
}

function SmallStat({
    label,
    value,
}: {
    label: string;
    value: number | string;
}) {
    return (
        <div className="rounded-xl bg-slate-50 p-2.5">
            <p className="text-[10px] font-black text-slate-400 uppercase">
                {label}
            </p>
            <p className="mt-0.5 text-base font-black text-slate-900">
                {value}
            </p>
        </div>
    );
}

function FilterField({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div>
            <label className="mb-1.5 block text-[11px] font-black text-slate-400 uppercase">
                {label}
            </label>
            {children}
        </div>
    );
}

function EmptyState({ text }: { text: string }) {
    return (
        <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-center text-sm font-semibold text-slate-500">
            {text}
        </div>
    );
}
