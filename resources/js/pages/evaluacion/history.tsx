import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, BarChart3, FileDown, History, TrendingUp, ClipboardCheck, Edit, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import ClearFiltersButton from '@/components/common/ClearFiltersButton';
import DeleteConfirmModal from '@/components/common/DeleteConfirmModal';
import { Card } from '@/components/ui/card';
import { MultiSelect } from '@/components/ui/multi-select';
import AppLayout from '@/layouts/app-layout';

interface Intern {
    id: number;
    user_id: number | null;
    name?: string;
    last_name?: string;
    user?: { name: string; email: string } | null;
}

interface Evaluation {
    id: number;
    intern_id: number;
    type: 'weekly' | 'monthly' | 'final' | string;
    period_name?: string;
    final_grade: number | string;
    comments?: string | null;
    intern?: { name?: string; intern?: { name?: string; last_name?: string; center?: { name: string } | null } | null } | null;
    tutor?: { name: string } | null;
    created_at?: string;
}

interface Props {
    becarios: Intern[];
    evaluaciones: Evaluation[];
}

const typeLabels: Record<string, string> = {
    weekly: 'Semanal',
    monthly: 'Mensual',
    final: 'Final',
};

const typeOptions = [
    { label: 'Semanal', value: 'weekly' },
    { label: 'Mensual', value: 'monthly' },
    { label: 'Final', value: 'final' },
];

const EVALUATIONS_PER_PAGE = 6;

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

const gradeOutOf10 = (grade: number | string) => Number(grade || 0) * 2;
const formatGradeNumber = (grade: number) => (Number.isInteger(grade) ? String(grade) : grade.toFixed(1));
const formatFinalGrade = (grade: number | string) => `${formatGradeNumber(gradeOutOf10(grade))} / 10`;
const getFinalGradeClass = (grade: number | string) => (gradeOutOf10(grade) < 5 ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700');

export default function HistoryPage({ becarios, evaluaciones }: Props) {
    const [selectedInterns, setSelectedInterns] = useState<string[]>([]);
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
    const [period, setPeriod] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [deleteTarget, setDeleteTarget] = useState<Evaluation | null>(null);

    const internOptions = useMemo(
        () =>
            becarios
                .filter((becario) => Boolean(becario.user_id))
                .map((becario) => ({
                    label: getInternName(becario),
                    value: String(becario.user_id),
                })),
        [becarios],
    );

    const activeFilters = selectedInterns.length > 0 || selectedTypes.length > 0 || period.trim().length > 0;

    const filteredEvaluations = useMemo(() => {
        const normalizedPeriod = period.trim().toLowerCase();

        return evaluaciones.filter((evaluation) => {
            const matchesIntern = selectedInterns.length === 0 || selectedInterns.includes(String(evaluation.intern_id));
            const matchesType = selectedTypes.length === 0 || selectedTypes.includes(evaluation.type);
            const matchesPeriod = !normalizedPeriod || (evaluation.period_name ?? '').toLowerCase().includes(normalizedPeriod);

            return matchesIntern && matchesType && matchesPeriod;
        });
    }, [evaluaciones, period, selectedInterns, selectedTypes]);

    const chronologicalEvaluations = useMemo(
        () =>
            [...filteredEvaluations].sort(
                (a, b) => new Date(a.created_at ?? '').getTime() - new Date(b.created_at ?? '').getTime(),
            ),
        [filteredEvaluations],
    );
    const totalPages = Math.max(1, Math.ceil(filteredEvaluations.length / EVALUATIONS_PER_PAGE));
    const currentSafePage = Math.min(currentPage, totalPages);
    const paginatedEvaluations = useMemo(() => {
        const startIndex = (currentSafePage - 1) * EVALUATIONS_PER_PAGE;

        return filteredEvaluations.slice(startIndex, startIndex + EVALUATIONS_PER_PAGE);
    }, [currentSafePage, filteredEvaluations]);

    const shouldShowEvolution = selectedInterns.length === 1;
    const average =
        filteredEvaluations.length > 0
            ? formatFinalGrade(filteredEvaluations.reduce((total, evaluation) => total + Number(evaluation.final_grade || 0), 0) / filteredEvaluations.length)
            : '0 / 10';
    const bestEvaluation = filteredEvaluations.reduce<Evaluation | null>((best, evaluation) => {
        if (!best) return evaluation;
        return Number(evaluation.final_grade) > Number(best.final_grade) ? evaluation : best;
    }, null);
    const firstEvolution = chronologicalEvaluations[0];
    const lastEvolution = chronologicalEvaluations[chronologicalEvaluations.length - 1];
    const trend =
        shouldShowEvolution && firstEvolution && lastEvolution && firstEvolution.id !== lastEvolution.id
            ? gradeOutOf10(lastEvolution.final_grade) - gradeOutOf10(firstEvolution.final_grade)
            : 0;

    const resetFilters = () => {
        setSelectedInterns([]);
        setSelectedTypes([]);
        setPeriod('');
        setCurrentPage(1);
    };

    const confirmDelete = () => {
        if (!deleteTarget) return;

        router.delete(`/evaluaciones/${deleteTarget.id}`, {
            preserveScroll: true,
            onSuccess: () => setDeleteTarget(null),
        });
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Evaluación y Notas', href: '/evaluaciones' }, { title: 'Histórico', href: '/evaluaciones/historico' }]}>
            <Head title="Histórico de Evaluaciones" />

            <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-8">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div>
                        <Link href="/evaluaciones" className="mb-2 inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-slate-900">
                            <ArrowLeft className="h-4 w-4" />
                            Volver al panel
                        </Link>
                        <h1 className="text-2xl font-bold text-slate-900">Histórico de evaluaciones</h1>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <SummaryCard
                        label="Evaluaciones"
                        value={filteredEvaluations.length}
                        icon={<ClipboardCheck className="h-5 w-5" />}
                        iconClass="bg-blue-50 text-blue-600"
                    />
                    <SummaryCard
                        label="Media filtrada"
                        value={average}
                        icon={<BarChart3 className="h-5 w-5" />}
                        iconClass="bg-emerald-50 text-emerald-600"
                    />
                    <SummaryCard
                        label="Evolución"
                        value={shouldShowEvolution ? `${trend >= 0 ? '+' : ''}${formatGradeNumber(trend)}` : 'Sin datos'}
                        icon={<TrendingUp className="h-5 w-5" />}
                        iconClass={shouldShowEvolution && trend < 0 ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}
                    />
                </div>

                <Card className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/50">
                    <div className="grid grid-cols-1 items-end gap-4 lg:grid-cols-4">
                        <div className="space-y-1.5">
                            <label className="ml-1 text-[11px] font-bold uppercase text-slate-400">Becario</label>
                            <MultiSelect
                                options={internOptions}
                                selected={selectedInterns}
                                onChange={(value) => {
                                    setSelectedInterns(value);
                                    setCurrentPage(1);
                                }}
                                placeholder="Todos los becarios"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="ml-1 text-[11px] font-bold uppercase text-slate-400">Tipo</label>
                            <MultiSelect
                                options={typeOptions}
                                selected={selectedTypes}
                                onChange={(value) => {
                                    setSelectedTypes(value);
                                    setCurrentPage(1);
                                }}
                                placeholder="Todos los tipos"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="ml-1 text-[11px] font-bold uppercase text-slate-400">Periodo</label>
                            <input
                                value={period}
                                onChange={(event) => {
                                    setPeriod(event.target.value);
                                    setCurrentPage(1);
                                }}
                                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                                placeholder="Semana 20, Mayo 2026..."
                            />
                        </div>

                        <ClearFiltersButton onClick={resetFilters} disabled={!activeFilters} className="h-10 w-full" />
                    </div>
                </Card>

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
                    <Card className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="mb-5 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-black text-slate-900">Evaluaciones</h2>
                                <p className="text-sm text-slate-500">{filteredEvaluations.length} resultado(s)</p>
                            </div>
                            <History className="h-5 w-5 text-slate-400" />
                        </div>

                        {filteredEvaluations.length === 0 ? (
                            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/70 p-8 text-center">
                                <History className="mx-auto mb-3 h-6 w-6 text-slate-300" />
                                <p className="text-sm font-bold text-slate-600">No hay evaluaciones con estos filtros.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {paginatedEvaluations.map((evaluation) => (
                                    <div key={evaluation.id} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-[minmax(0,1fr)_auto]">
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="font-black text-slate-900">{getEvaluationInternName(evaluation)}</p>
                                                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-black uppercase text-blue-700">
                                                    {typeLabels[evaluation.type] ?? evaluation.type}
                                                </span>
                                                {evaluation.period_name && (
                                                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
                                                        {evaluation.period_name}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                                                <span>{formatDate(evaluation.created_at)}</span>
                                                <span>Tutor: {evaluation.tutor?.name ?? 'Sin tutor'}</span>
                                            </div>
                                            {evaluation.intern?.intern?.center?.name && (
                                                <p className="mt-1 text-sm text-slate-500">Centro: {evaluation.intern.intern.center.name}</p>
                                            )}
                                            {evaluation.comments && <p className="mt-2 line-clamp-2 text-sm text-slate-600">{evaluation.comments}</p>}
                                        </div>
                                        <div className="flex items-center justify-start md:justify-end">
                                            <div className="flex items-center gap-2">
                                                <div className={`rounded-2xl px-3 py-2 text-sm font-black ${getFinalGradeClass(evaluation.final_grade)}`}>
                                                    {formatFinalGrade(evaluation.final_grade)}
                                                </div>
                                                <a
                                                    href={`/evaluaciones/${evaluation.id}/pdf`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="rounded-xl bg-slate-900 p-2 text-white shadow-sm transition hover:bg-slate-800"
                                                    title="Descargar PDF"
                                                >
                                                    <FileDown className="h-4 w-4" />
                                                </a>
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
                                {totalPages > 1 && (
                                    <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-100 bg-slate-50/70 px-4 py-4 text-sm md:flex-row">
                                        <p className="rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-slate-500 shadow-sm ring-1 ring-slate-100">
                                            Pagina {currentSafePage} de {totalPages}
                                        </p>
                                        <div className="inline-flex overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                                            <button
                                                type="button"
                                                disabled={currentSafePage === 1}
                                                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                                                className="cursor-pointer border-r border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                                            >
                                                Anterior
                                            </button>
                                            <button
                                                type="button"
                                                disabled={currentSafePage === totalPages}
                                                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
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

                    <div className="space-y-4">
                        <Card className="rounded-3xl border border-slate-200 bg-slate-50/60 p-5 shadow-sm">
                            <div className="mb-4 flex items-center justify-between">
                                <div>
                                    <h3 className="font-black text-slate-900">Evolución</h3>
                                    <p className="text-sm text-slate-500">Disponible para un único becario.</p>
                                </div>
                                <TrendingUp className="h-5 w-5 text-slate-400" />
                            </div>
                            {shouldShowEvolution ? (
                                <EvolutionChart evaluations={chronologicalEvaluations} />
                            ) : (
                                <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm font-semibold text-slate-500">
                                    Selecciona un solo becario para ver su evolución.
                                </div>
                            )}
                        </Card>

                        <Card className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="mb-3 flex items-center justify-between">
                                <p className="text-[11px] font-black uppercase text-slate-400">Mejor evaluación filtrada</p>
                                <BarChart3 className="h-4 w-4 text-slate-400" />
                            </div>
                            {bestEvaluation ? (
                                <div>
                                    <p className="font-black text-slate-900">{getEvaluationInternName(bestEvaluation)}</p>
                                    <p className="mt-1 text-sm text-slate-500">
                                        {typeLabels[bestEvaluation.type] ?? bestEvaluation.type}
                                        {bestEvaluation.period_name ? ` · ${bestEvaluation.period_name}` : ''}
                                    </p>
                                    <p className={`mt-3 text-3xl font-black ${gradeOutOf10(bestEvaluation.final_grade) < 5 ? 'text-red-700' : 'text-blue-700'}`}>{formatFinalGrade(bestEvaluation.final_grade)}</p>
                                </div>
                            ) : (
                                <p className="text-sm font-semibold text-slate-500">Sin datos.</p>
                            )}
                        </Card>
                    </div>
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

function EvolutionChart({ evaluations }: { evaluations: Evaluation[] }) {
    const chartScrollRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const chartScroll = chartScrollRef.current;

        if (!chartScroll) return;

        chartScroll.scrollLeft = chartScroll.scrollWidth;
    }, [evaluations]);

    if (evaluations.length === 0) {
        return (
            <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white text-center text-sm font-semibold text-slate-500">
                Sin datos para mostrar evolución.
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div ref={chartScrollRef} className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                <div className="flex h-56 items-end gap-2 p-4" style={{ width: `${Math.max(evaluations.length, 5) * 68}px` }}>
                {evaluations.map((evaluation) => {
                    const grade = gradeOutOf10(evaluation.final_grade);
                    const height = Math.max(8, Math.min(100, (grade / 10) * 100));

                    return (
                        <div key={evaluation.id} className="flex h-full min-w-0 flex-1 flex-col justify-end gap-2">
                            <div className="flex flex-1 items-end">
                                <div
                                    className="w-full rounded-t-xl bg-blue-500 transition-all"
                                    style={{ height: `${height}%` }}
                                    title={`${getEvaluationInternName(evaluation)} · ${formatGradeNumber(grade)} / 10`}
                                />
                            </div>
                            <div className="text-center">
                                <p className="text-xs font-black text-slate-800">{formatGradeNumber(grade)}</p>
                                <p className="truncate text-[10px] font-semibold text-slate-400">{formatDate(evaluation.created_at)}</p>
                            </div>
                        </div>
                    );
                })}
                </div>
            </div>
        </div>
    );
}
