import { Head, Link, router } from '@inertiajs/react';
import { ArrowRight, BarChart3, Building2, ClipboardCheck, Edit, History, Mail, Search, Settings, Star, Trash2, UserCheck } from 'lucide-react';
import { useMemo, useState } from 'react';

import ClearFiltersButton from '@/components/common/ClearFiltersButton';
import DeleteConfirmModal from '@/components/common/DeleteConfirmModal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MultiSelect } from '@/components/ui/multi-select';
import AppLayout from '@/layouts/app-layout';

interface Intern {
    id: number;
    user_id: number | null;
    name?: string;
    last_name?: string;
    email?: string;
    academic_cycle?: string | null;
    center?: { id?: number; name: string } | null;
    user?: { name: string; email: string } | null;
}

interface Evaluation {
    id: number;
    type: 'weekly' | 'monthly' | 'final' | string;
    period_name?: string;
    final_grade: number | string;
    intern?: { name?: string; intern?: { name?: string; last_name?: string } | null } | null;
    created_at?: string;
}

interface Props {
    becarios: Intern[];
    evaluacionesRecientes: Evaluation[];
    evaluacionesCount: number;
    evaluacionesMedia: number;
    canConfigureCriteria?: boolean;
}

const typeLabels: Record<string, string> = {
    weekly: 'Semanal',
    monthly: 'Mensual',
    final: 'Final',
};

const getInternName = (intern: Intern) =>
    [intern.name, intern.last_name].filter(Boolean).join(' ') || intern.user?.name || 'Becario sin nombre';

const getEvaluationInternName = (evaluation: Evaluation) => {
    const internProfile = evaluation.intern?.intern;

    return [internProfile?.name, internProfile?.last_name].filter(Boolean).join(' ') || evaluation.intern?.name || 'Becario';
};

const formatDate = (date?: string) => {
    if (!date) return 'Sin fecha';

    return new Date(date).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
};

const formatGradeNumber = (grade: number) => (Number.isInteger(grade) ? String(grade) : grade.toFixed(1));
const formatFinalGrade = (grade: number | string) => `${formatGradeNumber(Number(grade || 0) * 2)} / 10`;
const getFinalGradeClass = (grade: number | string) => (Number(grade || 0) * 2 < 5 ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700');

export default function Index({ becarios, evaluacionesRecientes, evaluacionesCount, evaluacionesMedia, canConfigureCriteria = false }: Props) {
    const [selectedInterns, setSelectedInterns] = useState<string[]>([]);
    const [selectedCenters, setSelectedCenters] = useState<string[]>([]);
    const [selectedCycles, setSelectedCycles] = useState<string[]>([]);
    const [deleteTarget, setDeleteTarget] = useState<Evaluation | null>(null);

    const internOptions = useMemo(
        () =>
            becarios.map((becario) => ({
                label: getInternName(becario),
                value: String(becario.id),
            })),
        [becarios],
    );

    const centerOptions = useMemo(() => {
        const uniqueCenters = new Map<string, string>();

        becarios.forEach((becario) => {
            if (becario.center?.name) {
                uniqueCenters.set(String(becario.center.id ?? becario.center.name), becario.center.name);
            }
        });

        return Array.from(uniqueCenters.entries()).map(([id, name]) => ({ id, name }));
    }, [becarios]);

    const cycleOptions = useMemo(() => {
        const uniqueCycles = new Set<string>();

        becarios.forEach((becario) => {
            if (becario.academic_cycle) {
                uniqueCycles.add(becario.academic_cycle);
            }
        });

        return Array.from(uniqueCycles)
            .sort((a, b) => a.localeCompare(b, 'es'))
            .map((cycle) => ({ label: cycle, value: cycle }));
    }, [becarios]);

    const activeFilters = selectedInterns.length > 0 || selectedCenters.length > 0 || selectedCycles.length > 0;

    const filteredInterns = useMemo(() => {
        if (!activeFilters) return [];

        return becarios.filter((becario) => {
            const matchesIntern = selectedInterns.length === 0 || selectedInterns.includes(String(becario.id));
            const centerKey = becario.center ? String(becario.center.id ?? becario.center.name) : '';
            const matchesCenter = selectedCenters.length === 0 || selectedCenters.includes(centerKey);
            const matchesCycle = selectedCycles.length === 0 || (becario.academic_cycle ? selectedCycles.includes(becario.academic_cycle) : false);

            return matchesIntern && matchesCenter && matchesCycle;
        });
    }, [activeFilters, becarios, selectedCenters, selectedCycles, selectedInterns]);

    const evaluableInterns = becarios.filter((becario) => Boolean(becario.user_id)).length;

    const resetFilters = () => {
        setSelectedInterns([]);
        setSelectedCenters([]);
        setSelectedCycles([]);
    };

    const confirmDelete = () => {
        if (!deleteTarget) return;

        router.delete(`/evaluaciones/${deleteTarget.id}`, {
            preserveScroll: true,
            onSuccess: () => setDeleteTarget(null),
        });
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Evaluación y Notas', href: '/evaluaciones' }]}>
            <Head title="Evaluación y Notas" />

            <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-8">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Evaluación y notas</h1>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <Link href="/evaluaciones/historico">
                            <Button variant="outline" className="h-10 rounded-xl border-slate-200 font-bold">
                                <History className="h-4 w-4" />
                                Ver histórico
                            </Button>
                        </Link>
                        {canConfigureCriteria && (
                            <Link href="/evaluaciones/configuracion">
                                <Button variant="outline" className="h-10 rounded-xl border-slate-200 font-bold">
                                    <Settings className="h-4 w-4" />
                                    Configurar criterios
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <SummaryCard label="Becarios evaluables" value={evaluableInterns} icon={<UserCheck className="h-5 w-5" />} iconClass="bg-blue-50 text-blue-600" />
                    <SummaryCard label="Evaluaciones registradas" value={evaluacionesCount} icon={<ClipboardCheck className="h-5 w-5" />} iconClass="bg-emerald-50 text-emerald-600" />
                    <SummaryCard label="Media global" value={formatFinalGrade(evaluacionesMedia)} icon={<BarChart3 className="h-5 w-5" />} iconClass="bg-amber-50 text-amber-600" />
                </div>

                <Card className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/50">
                    <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-4">
                        <div className="space-y-1.5">
                            <label className="ml-1 text-[11px] font-bold uppercase text-slate-400">Becario</label>
                            <MultiSelect options={internOptions} selected={selectedInterns} onChange={setSelectedInterns} placeholder="Buscar becarios..." />
                        </div>

                        <div className="space-y-1.5">
                            <label className="ml-1 text-[11px] font-bold uppercase text-slate-400">Centro</label>
                            <MultiSelect
                                options={centerOptions.map((center) => ({ label: center.name, value: center.id }))}
                                selected={selectedCenters}
                                onChange={setSelectedCenters}
                                placeholder="Todos los centros"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="ml-1 text-[11px] font-bold uppercase text-slate-400">Ciclo</label>
                            <MultiSelect options={cycleOptions} selected={selectedCycles} onChange={setSelectedCycles} placeholder="Cualquier ciclo" />
                        </div>

                        <ClearFiltersButton onClick={resetFilters} disabled={!activeFilters} className="h-10 w-full" />
                    </div>
                </Card>

                <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(360px,0.8fr)]">
                    <Card className="min-h-[360px] rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="mb-5 flex items-center justify-between gap-3">
                            <div>
                                <h2 className="text-lg font-black text-slate-900">Seleccionar becario</h2>
                                <p className="text-sm text-slate-500">
                                    {activeFilters ? `${filteredInterns.length} resultado(s)` : 'Usa los filtros para mostrar resultados'}
                                </p>
                            </div>
                        </div>

                        {!activeFilters ? (
                            <EmptyState icon={<Search className="h-6 w-6" />} title="Busca antes de evaluar" />
                        ) : filteredInterns.length === 0 ? (
                            <EmptyState title="Sin resultados" detail="Prueba con otro becario, centro o ciclo." />
                        ) : (
                            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                                {filteredInterns.map((becario) => (
                                    <div key={becario.id} className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-blue-200 hover:bg-blue-50/30">
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="min-w-0">
                                                <p className="truncate text-base font-black text-slate-900">{getInternName(becario)}</p>
                                                <div className="mt-2 space-y-1 text-sm text-slate-500">
                                                    <p className="flex items-center gap-2">
                                                        <Mail className="h-3.5 w-3.5 text-slate-400" />
                                                        <span className="truncate">{becario.user?.email ?? becario.email ?? 'Sin usuario vinculado'}</span>
                                                    </p>
                                                    <p className="flex items-center gap-2">
                                                        <Building2 className="h-3.5 w-3.5 text-slate-400" />
                                                        <span className="truncate">{becario.center?.name ?? 'Sin centro asignado'}</span>
                                                    </p>
                                                </div>
                                            </div>

                                            {becario.user_id ? (
                                                <Link href={`/evaluaciones/crear/${becario.user_id}`}>
                                                    <Button className="h-9 rounded-xl bg-blue-600 px-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700" title="Evaluar">
                                                        Evaluar
                                                        <ArrowRight className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                            ) : (
                                                <Button className="h-9 rounded-xl px-3 text-sm font-bold" disabled title="Sin usuario vinculado">
                                                    Evaluar
                                                    <ArrowRight className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>

                    <Card className="self-start rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="mb-5 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-black text-slate-900">Últimas evaluaciones</h2>
                                <p className="text-sm text-slate-500">Actividad reciente del módulo</p>
                            </div>
                            <Link href="/evaluaciones/historico" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700">
                                Ver todas
                            </Link>
                        </div>

                        {evaluacionesRecientes.length === 0 ? (
                            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/70 p-8 text-center">
                                <Star className="mx-auto mb-3 h-6 w-6 text-slate-300" />
                                <p className="text-sm font-bold text-slate-600">Todavía no hay evaluaciones registradas.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {evaluacionesRecientes.map((evaluation) => (
                                    <div key={evaluation.id} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="truncate font-black text-slate-900">{getEvaluationInternName(evaluation)}</p>
                                                <p className="mt-1 text-xs font-bold uppercase text-slate-400">
                                                    {typeLabels[evaluation.type] ?? evaluation.type}
                                                    {evaluation.period_name ? ` · ${evaluation.period_name}` : ''}
                                                </p>
                                                <p className="mt-2 text-xs text-slate-500">{formatDate(evaluation.created_at)}</p>
                                            </div>
                                            <div className="flex shrink-0 items-center gap-2">
                                                <div className={`rounded-2xl px-3 py-2 text-sm font-black ${getFinalGradeClass(evaluation.final_grade)}`}>
                                                    {formatFinalGrade(evaluation.final_grade)}
                                                </div>
                                                <Link
                                                    href={`/evaluaciones/${evaluation.id}/editar`}
                                                    className="rounded-xl bg-blue-600 p-2 text-white shadow-sm transition hover:bg-blue-700"
                                                    title="Editar evaluación"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Link>
                                                <button
                                                    type="button"
                                                    onClick={() => setDeleteTarget(evaluation)}
                                                    className="rounded-xl bg-red-600 p-2 text-white shadow-sm transition hover:bg-red-700"
                                                    title="Eliminar evaluación"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </div>
            </div>

            <DeleteConfirmModal
                isOpen={Boolean(deleteTarget)}
                onClose={() => setDeleteTarget(null)}
                onConfirm={confirmDelete}
                title="¿Eliminar evaluación?"
                itemName={deleteTarget ? `${typeLabels[deleteTarget.type] ?? deleteTarget.type}${deleteTarget.period_name ? ` · ${deleteTarget.period_name}` : ''}` : undefined}
            />
        </AppLayout>
    );
}

function SummaryCard({ label, value, icon, iconClass }: { label: string; value: number | string; icon: React.ReactNode; iconClass: string }) {
    return (
        <Card className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-[11px] font-black uppercase text-slate-400">{label}</p>
                    <p className="mt-2 text-3xl font-black text-slate-900">{value}</p>
                </div>
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${iconClass}`}>{icon}</div>
            </div>
        </Card>
    );
}

function EmptyState({ icon, title, detail }: { icon?: React.ReactNode; title: string; detail?: string }) {
    return (
        <div className="flex min-h-[230px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50/70 p-8 text-center">
            {icon && <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm">{icon}</div>}
            <p className="text-base font-black text-slate-800">{title}</p>
            {detail && <p className="mt-1 text-sm text-slate-500">{detail}</p>}
        </div>
    );
}
