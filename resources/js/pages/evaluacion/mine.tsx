import { Head } from '@inertiajs/react';
import { BarChart3, CalendarDays, FileDown, ClipboardCheck, MessageSquare, Star, TrendingUp, UserCheck } from 'lucide-react';
import { useMemo } from 'react';

import { Card } from '@/components/ui/card';
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

export default function Mine({ intern, evaluaciones }: Props) {
    const chronologicalEvaluations = useMemo(
        () =>
            [...evaluaciones].sort(
                (a, b) => new Date(a.created_at ?? '').getTime() - new Date(b.created_at ?? '').getTime(),
            ),
        [evaluaciones],
    );
    const average =
        evaluaciones.length > 0
            ? formatFinalGrade(evaluaciones.reduce((total, evaluation) => total + Number(evaluation.final_grade || 0), 0) / evaluaciones.length)
            : '0 / 10';
    const bestEvaluation = evaluaciones.reduce<Evaluation | null>((best, evaluation) => {
        if (!best) return evaluation;
        return Number(evaluation.final_grade) > Number(best.final_grade) ? evaluation : best;
    }, null);
    const firstEvaluation = chronologicalEvaluations[0];
    const lastEvaluation = chronologicalEvaluations[chronologicalEvaluations.length - 1];
    const trend =
        firstEvaluation && lastEvaluation && firstEvaluation.id !== lastEvaluation.id
            ? gradeOutOf10(lastEvaluation.final_grade) - gradeOutOf10(firstEvaluation.final_grade)
            : 0;
    const displayName = [intern.intern?.name, intern.intern?.last_name].filter(Boolean).join(' ') || intern.name;

    return (
        <AppLayout breadcrumbs={[{ title: 'Mis Evaluaciones', href: '/mis-evaluaciones' }]}>
            <Head title="Mis Evaluaciones" />

            <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Mis evaluaciones</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        {displayName}
                        {intern.intern?.center?.name ? ` · ${intern.intern.center.name}` : ''}
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    <SummaryCard label="Evaluaciones" value={evaluaciones.length} icon={<ClipboardCheck className="h-5 w-5" />} iconClass="bg-blue-50 text-blue-600" />
                    <SummaryCard label="Media" value={average} icon={<BarChart3 className="h-5 w-5" />} iconClass="bg-emerald-50 text-emerald-600" />
                    <SummaryCard
                        label="Mejor nota"
                        value={bestEvaluation ? formatFinalGrade(bestEvaluation.final_grade) : '0 / 10'}
                        icon={<Star className="h-5 w-5" />}
                        iconClass="bg-amber-50 text-amber-600"
                    />
                    <SummaryCard
                        label="Evolución"
                        value={`${trend >= 0 ? '+' : ''}${formatGradeNumber(trend)}`}
                        icon={<TrendingUp className="h-5 w-5" />}
                        iconClass={trend >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}
                    />
                </div>

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
                    <div className="space-y-4">
                        {evaluaciones.length === 0 ? (
                            <Card className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center shadow-sm">
                                <UserCheck className="mx-auto mb-3 h-7 w-7 text-slate-300" />
                                <p className="font-black text-slate-800">Todavía no tienes evaluaciones</p>
                                <p className="mt-1 text-sm text-slate-500">Cuando tu tutor registre una evaluación, aparecerá aquí.</p>
                            </Card>
                        ) : (
                            evaluaciones.map((evaluation) => (
                                <Card key={evaluation.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                                    <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-start">
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h2 className="text-lg font-black text-slate-900">{typeLabels[evaluation.type] ?? evaluation.type}</h2>
                                                {evaluation.period_name && (
                                                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                                                        {evaluation.period_name}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                                                <span className="inline-flex items-center gap-1.5">
                                                    <CalendarDays className="h-4 w-4" />
                                                    {formatDate(evaluation.created_at)}
                                                </span>
                                                <span>Tutor: {evaluation.tutor?.name ?? 'Sin tutor'}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <div className={`rounded-2xl px-4 py-3 text-2xl font-black ${getFinalGradeClass(evaluation.final_grade)}`}>
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
                                        </div>
                                    </div>

                                    {evaluation.comments && (
                                        <div className="mb-5 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                                            <p className="mb-2 flex items-center gap-2 text-sm font-black text-slate-800">
                                                <MessageSquare className="h-4 w-4 text-slate-400" />
                                                Comentario general
                                            </p>
                                            <p className="text-sm leading-relaxed text-slate-600">{evaluation.comments}</p>
                                        </div>
                                    )}

                                    <div className="space-y-3">
                                        {evaluation.results.map((result) => (
                                            <div key={result.id} className="rounded-2xl border border-slate-200 p-4">
                                                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                                    <div className="min-w-0">
                                                        <p className="font-black text-slate-900">{result.criterion?.name ?? 'Criterio'}</p>
                                                        <p className="mt-1 text-xs font-bold uppercase text-slate-400">
                                                            {result.criterion?.category?.name ?? 'Sin categoría'}
                                                            {result.criterion?.weight ? ` · Peso ${result.criterion.weight}%` : ''}
                                                        </p>
                                                    </div>
                                                    <div className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-black text-slate-700">{result.score}/5</div>
                                                </div>
                                                {result.feedback && <p className="mt-3 text-sm leading-relaxed text-slate-600">{result.feedback}</p>}
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            ))
                        )}
                    </div>

                    <div className="space-y-4">
                        <Card className="rounded-3xl border border-slate-200 bg-slate-50/60 p-5 shadow-sm">
                            <div className="mb-4 flex items-center justify-between">
                                <div>
                                    <h3 className="font-black text-slate-900">Evolución</h3>
                                    <p className="text-sm text-slate-500">Tus últimas notas en orden cronológico.</p>
                                </div>
                                <TrendingUp className="h-5 w-5 text-slate-400" />
                            </div>
                            <EvolutionChart evaluations={chronologicalEvaluations} />
                        </Card>

                        <Card className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                            <p className="text-[11px] font-black uppercase text-slate-400">Mejor evaluación</p>
                            {bestEvaluation ? (
                                <div className="mt-3">
                                    <p className="font-black text-slate-900">{typeLabels[bestEvaluation.type] ?? bestEvaluation.type}</p>
                                    <p className="mt-1 text-sm text-slate-500">
                                        {bestEvaluation.period_name ? `${bestEvaluation.period_name} · ` : ''}
                                        {formatDate(bestEvaluation.created_at)}
                                    </p>
                                    <p className={`mt-3 text-3xl font-black ${gradeOutOf10(bestEvaluation.final_grade) < 5 ? 'text-red-700' : 'text-blue-700'}`}>{formatFinalGrade(bestEvaluation.final_grade)}</p>
                                </div>
                            ) : (
                                <p className="mt-3 text-sm font-semibold text-slate-500">Sin datos.</p>
                            )}
                        </Card>
                    </div>
                </div>
            </div>
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
    const visibleEvaluations = evaluations.slice(-12);

    if (visibleEvaluations.length === 0) {
        return (
            <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm font-semibold text-slate-500">
                Sin datos para mostrar evolución.
            </div>
        );
    }

    return (
        <div className="flex h-56 items-end gap-2 rounded-2xl border border-slate-200 bg-white p-4">
            {visibleEvaluations.map((evaluation) => {
                const grade = gradeOutOf10(evaluation.final_grade);
                const height = Math.max(8, Math.min(100, (grade / 10) * 100));

                return (
                    <div key={evaluation.id} className="flex h-full min-w-0 flex-1 flex-col justify-end gap-2">
                        <div className="flex flex-1 items-end">
                            <div
                                className="w-full rounded-t-xl bg-blue-500 transition-all"
                                style={{ height: `${height}%` }}
                                title={`${typeLabels[evaluation.type] ?? evaluation.type} · ${formatGradeNumber(grade)} / 10`}
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
    );
}
