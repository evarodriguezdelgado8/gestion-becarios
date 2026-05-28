import { Head } from '@inertiajs/react';
import {
    BarChart3,
    CalendarDays,
    ChevronDown,
    ClipboardCheck,
    FileDown,
    MessageSquare,
    SlidersHorizontal,
    Star,
    TrendingUp,
    UserCheck,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import ClearFiltersButton from '@/components/common/ClearFiltersButton';
import { Card } from '@/components/ui/card';
import { MultiSelect } from '@/components/ui/multi-select';
import AppLayout from '@/layouts/app-layout';

interface Criterion {
    id: number;
    name: string;
    weight: number | string;
    category?: { name: string } | null;
}

interface EvaluationResult {
    id: number;
    score: number;
    feedback?: string | null;
    criterion?: Criterion | null;
}

interface Evaluation {
    id: number;
    type: 'weekly' | 'monthly' | 'final' | string;
    period_name?: string;
    final_grade: number | string;
    comments?: string | null;
    tutor?: { name: string } | null;
    results: EvaluationResult[];
    created_at?: string;
}

interface InternUser {
    id: number;
    name: string;
    email: string;
    intern?: {
        name?: string;
        last_name?: string;
        center?: { name: string } | null;
    } | null;
}

interface Props {
    intern: InternUser;
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

const evaluationsPerPage = 6;

const formatDate = (date?: string) => {
    if (!date) return 'Sin fecha';

    return new Date(date).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
};

const dateTimestamp = (date?: string) => (date ? new Date(date).getTime() : 0);
const gradeOutOf10 = (grade: number | string) => Number(grade || 0) * 2;
const formatGradeNumber = (grade: number) =>
    Number.isInteger(grade) ? String(grade) : grade.toFixed(1);
const formatFinalGrade = (grade: number | string) =>
    `${formatGradeNumber(gradeOutOf10(grade))} / 10`;
const getFinalGradeClass = (grade: number | string) =>
    gradeOutOf10(grade) < 5
        ? 'bg-red-50 text-red-700'
        : 'bg-blue-50 text-blue-700';

export default function Mine({ intern, evaluaciones }: Props) {
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
    const [period, setPeriod] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [expandedEvaluations, setExpandedEvaluations] = useState<string[]>(
        [],
    );

    const filteredEvaluations = useMemo(() => {
        const normalizedPeriod = period.trim().toLowerCase();
        const fromTime = fromDate
            ? new Date(`${fromDate}T00:00:00`).getTime()
            : null;
        const toTime = toDate ? new Date(`${toDate}T23:59:59`).getTime() : null;

        return evaluaciones.filter((evaluation) => {
            const evaluationTime = dateTimestamp(evaluation.created_at);
            const matchesType =
                selectedTypes.length === 0 ||
                selectedTypes.includes(evaluation.type);
            const matchesPeriod =
                !normalizedPeriod ||
                (evaluation.period_name ?? '')
                    .toLowerCase()
                    .includes(normalizedPeriod);
            const matchesFrom = !fromTime || evaluationTime >= fromTime;
            const matchesTo = !toTime || evaluationTime <= toTime;

            return matchesType && matchesPeriod && matchesFrom && matchesTo;
        });
    }, [evaluaciones, fromDate, period, selectedTypes, toDate]);

    const chronologicalEvaluations = useMemo(
        () =>
            [...filteredEvaluations].sort(
                (a, b) =>
                    dateTimestamp(a.created_at) - dateTimestamp(b.created_at),
            ),
        [filteredEvaluations],
    );
    const totalPages = Math.max(
        1,
        Math.ceil(filteredEvaluations.length / evaluationsPerPage),
    );
    const currentSafePage = Math.min(currentPage, totalPages);
    const paginatedEvaluations = filteredEvaluations.slice(
        (currentSafePage - 1) * evaluationsPerPage,
        currentSafePage * evaluationsPerPage,
    );
    const rangeStart =
        filteredEvaluations.length > 0
            ? (currentSafePage - 1) * evaluationsPerPage + 1
            : 0;
    const rangeEnd = Math.min(
        currentSafePage * evaluationsPerPage,
        filteredEvaluations.length,
    );
    const activeFilters =
        selectedTypes.length > 0 ||
        period.trim().length > 0 ||
        fromDate.length > 0 ||
        toDate.length > 0;
    const activeFiltersCount =
        selectedTypes.length +
        (period.trim().length > 0 ? 1 : 0) +
        (fromDate.length > 0 ? 1 : 0) +
        (toDate.length > 0 ? 1 : 0);
    const average =
        filteredEvaluations.length > 0
            ? formatFinalGrade(
                  filteredEvaluations.reduce(
                      (total, evaluation) =>
                          total + Number(evaluation.final_grade || 0),
                      0,
                  ) / filteredEvaluations.length,
              )
            : '0 / 10';
    const bestEvaluation = filteredEvaluations.reduce<Evaluation | null>(
        (best, evaluation) => {
            if (!best) return evaluation;

            return Number(evaluation.final_grade) > Number(best.final_grade)
                ? evaluation
                : best;
        },
        null,
    );
    const firstEvaluation = chronologicalEvaluations[0];
    const lastEvaluation =
        chronologicalEvaluations[chronologicalEvaluations.length - 1];
    const trend =
        firstEvaluation &&
        lastEvaluation &&
        firstEvaluation.id !== lastEvaluation.id
            ? gradeOutOf10(lastEvaluation.final_grade) -
              gradeOutOf10(firstEvaluation.final_grade)
            : 0;
    const displayName =
        [intern.intern?.name, intern.intern?.last_name]
            .filter(Boolean)
            .join(' ') || intern.name;

    const resetFilters = () => {
        setSelectedTypes([]);
        setPeriod('');
        setFromDate('');
        setToDate('');
        setCurrentPage(1);
    };

    const toggleEvaluation = (evaluationId: number) => {
        const value = String(evaluationId);

        setExpandedEvaluations((current) =>
            current.includes(value)
                ? current.filter((item) => item !== value)
                : [...current, value],
        );
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Mis Evaluaciones', href: '/mis-evaluaciones' },
            ]}
        >
            <Head title="Mis Evaluaciones" />

            <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        Mis evaluaciones
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        {displayName}
                        {intern.intern?.center?.name
                            ? ` · ${intern.intern.center.name}`
                            : ''}
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    <SummaryCard
                        label="Evaluaciones"
                        value={filteredEvaluations.length}
                        icon={<ClipboardCheck className="h-5 w-5" />}
                        iconClass="bg-blue-50 text-blue-600"
                    />
                    <SummaryCard
                        label="Media"
                        value={average}
                        icon={<BarChart3 className="h-5 w-5" />}
                        iconClass="bg-emerald-50 text-emerald-600"
                    />
                    <SummaryCard
                        label="Mejor nota"
                        value={
                            bestEvaluation
                                ? formatFinalGrade(bestEvaluation.final_grade)
                                : '0 / 10'
                        }
                        icon={<Star className="h-5 w-5" />}
                        iconClass="bg-amber-50 text-amber-600"
                    />
                    <SummaryCard
                        label="Evolucion"
                        value={`${trend >= 0 ? '+' : ''}${formatGradeNumber(trend)}`}
                        icon={<TrendingUp className="h-5 w-5" />}
                        iconClass={
                            trend >= 0
                                ? 'bg-emerald-50 text-emerald-600'
                                : 'bg-rose-50 text-rose-600'
                        }
                    />
                </div>

                <div className="shrink-0 rounded-3xl border border-slate-200/80 bg-white shadow-xl">
                    <div className="flex flex-col justify-between gap-3 px-5 py-4 md:flex-row md:items-center">
                        <button
                            type="button"
                            onClick={() =>
                                setFiltersOpen((current) => !current)
                            }
                            className="flex items-center gap-3 text-left"
                        >
                            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                                <SlidersHorizontal className="h-5 w-5" />
                            </span>
                            <span>
                                <span className="block text-sm font-black text-slate-900">
                                    Filtros
                                </span>
                                <span className="block text-xs font-semibold text-slate-400">
                                    {activeFiltersCount > 0
                                        ? `${activeFiltersCount} filtro(s) activo(s)`
                                        : 'Pulsa para filtrar tus evaluaciones'}
                                </span>
                            </span>
                        </button>

                        <div className="flex items-center justify-end gap-2">
                            {activeFilters && (
                                <ClearFiltersButton onClick={resetFilters} />
                            )}
                            <button
                                type="button"
                                onClick={() =>
                                    setFiltersOpen((current) => !current)
                                }
                                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50"
                            >
                                <ChevronDown
                                    className={`h-4 w-4 transition-transform ${filtersOpen ? 'rotate-180' : ''}`}
                                />
                            </button>
                        </div>
                    </div>

                    {filtersOpen && (
                        <div className="grid grid-cols-1 items-end gap-4 border-t border-slate-100 px-5 pt-4 pb-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_160px_160px]">
                            <FilterField label="Tipo">
                                <MultiSelect
                                    options={typeOptions}
                                    selected={selectedTypes}
                                    onChange={(value) => {
                                        setSelectedTypes(value);
                                        setCurrentPage(1);
                                    }}
                                    placeholder="Todos los tipos"
                                />
                            </FilterField>

                            <FilterField label="Periodo">
                                <input
                                    value={period}
                                    onChange={(event) => {
                                        setPeriod(event.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm transition outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                                    placeholder="Semana 20, mayo..."
                                />
                            </FilterField>

                            <FilterField label="Desde">
                                <input
                                    type="date"
                                    value={fromDate}
                                    onChange={(event) => {
                                        setFromDate(event.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm transition outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                                />
                            </FilterField>

                            <FilterField label="Hasta">
                                <input
                                    type="date"
                                    value={toDate}
                                    onChange={(event) => {
                                        setToDate(event.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm transition outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                                />
                            </FilterField>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
                    <Card className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex items-center justify-between gap-4 border-b border-slate-100 p-5">
                            <div>
                                <h2 className="text-lg font-black text-slate-900">
                                    Evaluaciones
                                </h2>
                                <p className="text-sm text-slate-500">
                                    {filteredEvaluations.length} resultado(s)
                                </p>
                            </div>
                            <ClipboardCheck className="h-5 w-5 text-slate-400" />
                        </div>

                        {filteredEvaluations.length === 0 ? (
                            <div className="p-5">
                                <EmptyEvaluations
                                    activeFilters={activeFilters}
                                />
                            </div>
                        ) : (
                            <>
                                <div className="space-y-3 p-5">
                                    {paginatedEvaluations.map((evaluation) => {
                                        const isExpanded =
                                            expandedEvaluations.includes(
                                                String(evaluation.id),
                                            );

                                        return (
                                            <div
                                                key={evaluation.id}
                                                className="rounded-2xl border border-slate-200 bg-white p-4"
                                            >
                                                <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
                                                    <div className="min-w-0">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <p className="font-black text-slate-900">
                                                                {typeLabels[
                                                                    evaluation
                                                                        .type
                                                                ] ??
                                                                    evaluation.type}
                                                            </p>
                                                            {evaluation.period_name && (
                                                                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
                                                                    {
                                                                        evaluation.period_name
                                                                    }
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                                                            <span className="inline-flex items-center gap-1.5">
                                                                <CalendarDays className="h-4 w-4" />
                                                                {formatDate(
                                                                    evaluation.created_at,
                                                                )}
                                                            </span>
                                                            <span>
                                                                Tutor:{' '}
                                                                {evaluation
                                                                    .tutor
                                                                    ?.name ??
                                                                    'Sin tutor'}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2 md:justify-end">
                                                        <div
                                                            className={`rounded-2xl px-3 py-2 text-sm font-black ${getFinalGradeClass(evaluation.final_grade)}`}
                                                        >
                                                            {formatFinalGrade(
                                                                evaluation.final_grade,
                                                            )}
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
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                toggleEvaluation(
                                                                    evaluation.id,
                                                                )
                                                            }
                                                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                                                        >
                                                            Detalle
                                                            <ChevronDown
                                                                className={`h-4 w-4 transition ${isExpanded ? 'rotate-180' : ''}`}
                                                            />
                                                        </button>
                                                    </div>
                                                </div>

                                                {isExpanded && (
                                                    <EvaluationDetail
                                                        evaluation={evaluation}
                                                    />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-100 bg-slate-50/70 px-5 py-4 text-sm md:flex-row">
                                    <p className="rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-slate-500 shadow-sm ring-1 ring-slate-100">
                                        Mostrando{' '}
                                        <span className="font-black text-slate-900">
                                            {rangeStart}-{rangeEnd}
                                        </span>{' '}
                                        de{' '}
                                        <span className="font-black text-slate-900">
                                            {filteredEvaluations.length}
                                        </span>{' '}
                                        evaluaciones · Pagina{' '}
                                        <span className="font-black text-slate-900">
                                            {currentSafePage}
                                        </span>{' '}
                                        de{' '}
                                        <span className="font-black text-slate-900">
                                            {totalPages}
                                        </span>
                                    </p>
                                    <div className="inline-flex overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                                        <button
                                            type="button"
                                            disabled={currentSafePage === 1}
                                            onClick={() =>
                                                setCurrentPage((page) =>
                                                    Math.max(1, page - 1),
                                                )
                                            }
                                            className="cursor-pointer border-r border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                                        >
                                            Anterior
                                        </button>
                                        <button
                                            type="button"
                                            disabled={
                                                currentSafePage === totalPages
                                            }
                                            onClick={() =>
                                                setCurrentPage((page) =>
                                                    Math.min(
                                                        totalPages,
                                                        page + 1,
                                                    ),
                                                )
                                            }
                                            className="cursor-pointer px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                                        >
                                            Siguiente
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </Card>

                    <div className="space-y-4">
                        <Card className="rounded-3xl border border-slate-200 bg-slate-50/60 p-5 shadow-sm">
                            <div className="mb-4 flex items-center justify-between">
                                <div>
                                    <h3 className="font-black text-slate-900">
                                        Evolucion
                                    </h3>
                                    <p className="text-sm text-slate-500">
                                        Tus notas en orden cronologico.
                                    </p>
                                </div>
                                <TrendingUp className="h-5 w-5 text-slate-400" />
                            </div>
                            <EvolutionChart
                                evaluations={chronologicalEvaluations}
                            />
                        </Card>

                        <Card className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                            <p className="text-[11px] font-black text-slate-400 uppercase">
                                Mejor evaluacion
                            </p>
                            {bestEvaluation ? (
                                <div className="mt-3">
                                    <p className="font-black text-slate-900">
                                        {typeLabels[bestEvaluation.type] ??
                                            bestEvaluation.type}
                                    </p>
                                    <p className="mt-1 text-sm text-slate-500">
                                        {bestEvaluation.period_name
                                            ? `${bestEvaluation.period_name} · `
                                            : ''}
                                        {formatDate(bestEvaluation.created_at)}
                                    </p>
                                    <p
                                        className={`mt-3 text-3xl font-black ${
                                            gradeOutOf10(
                                                bestEvaluation.final_grade,
                                            ) < 5
                                                ? 'text-red-700'
                                                : 'text-blue-700'
                                        }`}
                                    >
                                        {formatFinalGrade(
                                            bestEvaluation.final_grade,
                                        )}
                                    </p>
                                </div>
                            ) : (
                                <p className="mt-3 text-sm font-semibold text-slate-500">
                                    Sin datos.
                                </p>
                            )}
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

function EvaluationDetail({ evaluation }: { evaluation: Evaluation }) {
    const hasDetail =
        Boolean(evaluation.comments) || evaluation.results.length > 0;

    if (!hasDetail) {
        return (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-500">
                Esta evaluacion no tiene comentario ni desglose de criterios.
            </div>
        );
    }

    return (
        <div className="mt-4 space-y-4 border-t border-slate-100 pt-4">
            {evaluation.comments && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                    <p className="mb-2 flex items-center gap-2 text-sm font-black text-slate-800">
                        <MessageSquare className="h-4 w-4 text-slate-400" />
                        Comentario general
                    </p>
                    <p className="text-sm leading-relaxed text-slate-600">
                        {evaluation.comments}
                    </p>
                </div>
            )}

            {evaluation.results.length > 0 && (
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                    {evaluation.results.map((result) => (
                        <div
                            key={result.id}
                            className="rounded-2xl border border-slate-200 p-4"
                        >
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div className="min-w-0">
                                    <p className="font-black text-slate-900">
                                        {result.criterion?.name ?? 'Criterio'}
                                    </p>
                                    <p className="mt-1 text-xs font-bold text-slate-400 uppercase">
                                        {result.criterion?.category?.name ??
                                            'Sin categoria'}
                                        {result.criterion?.weight
                                            ? ` · Peso ${result.criterion.weight}%`
                                            : ''}
                                    </p>
                                </div>
                                <div className="shrink-0 rounded-xl bg-slate-100 px-3 py-2 text-sm font-black text-slate-700">
                                    {result.score}/5
                                </div>
                            </div>
                            {result.feedback && (
                                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                                    {result.feedback}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function SummaryCard({
    label,
    value,
    icon,
    iconClass,
}: {
    label: string;
    value: number | string;
    icon: ReactNode;
    iconClass: string;
}) {
    return (
        <Card className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-[11px] font-black text-slate-400 uppercase">
                        {label}
                    </p>
                    <p className="mt-2 text-3xl font-black text-slate-900">
                        {value}
                    </p>
                </div>
                <div
                    className={`flex h-11 w-11 items-center justify-center rounded-2xl ${iconClass}`}
                >
                    {icon}
                </div>
            </div>
        </Card>
    );
}

function FilterField({
    label,
    children,
}: {
    label: string;
    children: ReactNode;
}) {
    return (
        <div className="space-y-1.5">
            <label className="ml-1 text-[11px] font-bold text-slate-400 uppercase">
                {label}
            </label>
            {children}
        </div>
    );
}

function EmptyEvaluations({ activeFilters }: { activeFilters: boolean }) {
    return (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/70 p-8 text-center">
            <UserCheck className="mx-auto mb-3 h-7 w-7 text-slate-300" />
            <p className="font-black text-slate-800">
                {activeFilters
                    ? 'No hay evaluaciones con estos filtros'
                    : 'Todavia no tienes evaluaciones'}
            </p>
            <p className="mt-1 text-sm text-slate-500">
                {activeFilters
                    ? 'Prueba a cambiar el tipo, periodo o rango de fechas.'
                    : 'Cuando tu tutor registre una evaluacion, aparecera aqui.'}
            </p>
        </div>
    );
}

function EvolutionChart({ evaluations }: { evaluations: Evaluation[] }) {
    const visibleEvaluations = evaluations.slice(-12);

    if (visibleEvaluations.length === 0) {
        return (
            <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm font-semibold text-slate-500">
                Sin datos para mostrar evolucion.
            </div>
        );
    }

    return (
        <div className="flex h-56 items-end gap-2 rounded-2xl border border-slate-200 bg-white p-4">
            {visibleEvaluations.map((evaluation) => {
                const grade = gradeOutOf10(evaluation.final_grade);
                const height = Math.max(8, Math.min(100, (grade / 10) * 100));

                return (
                    <div
                        key={evaluation.id}
                        className="flex h-full min-w-0 flex-1 flex-col justify-end gap-2"
                    >
                        <div className="flex flex-1 items-end">
                            <div
                                className="w-full rounded-t-xl bg-blue-500 transition-all"
                                style={{ height: `${height}%` }}
                                title={`${typeLabels[evaluation.type] ?? evaluation.type} · ${formatGradeNumber(grade)} / 10`}
                            />
                        </div>
                        <div className="text-center">
                            <p className="text-xs font-black text-slate-800">
                                {formatGradeNumber(grade)}
                            </p>
                            <p className="truncate text-[10px] font-semibold text-slate-400">
                                {formatDate(evaluation.created_at)}
                            </p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
