import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';

interface EvaluationType {
    label: string;
    value: string;
}

interface Criterion {
    id: number;
    evaluation_type?: string | null;
    name: string;
    description?: string | null;
    weight: number | string;
    rubric?: Record<string, string> | string[] | null;
}

interface Category {
    id: number;
    name: string;
    description?: string | null;
    criteria: Criterion[];
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

interface ResultForm {
    criterion_id: number;
    score: number | '';
    feedback: string;
}

interface PreviousResult {
    evaluation_criterion_id: number | string;
    score: number | string;
    feedback?: string | null;
}

interface PreviousEvaluation {
    id: number;
    type: string;
    period_name?: string | null;
    comments?: string | null;
    results: PreviousResult[];
}

interface Props {
    intern: InternUser;
    categories: Category[];
    editingEvaluation?: PreviousEvaluation;
    previousEvaluations?: Record<string, PreviousEvaluation>;
    types: EvaluationType[];
}

const scoreOptions = [1, 2, 3, 4, 5];

const getCriterionType = (criterion: Criterion) => criterion.evaluation_type || 'weekly';

const filterCategoriesByType = (categories: Category[], type: string) =>
    categories
        .map((category) => ({
            ...category,
            criteria: category.criteria.filter((criterion) => getCriterionType(criterion) === type),
        }))
        .filter((category) => category.criteria.length > 0);

const flattenCriteria = (categories: Category[], type: string, previousEvaluation?: PreviousEvaluation): ResultForm[] =>
    filterCategoriesByType(categories, type).flatMap((category) =>
        category.criteria.map((criterion) => {
            const previousResult = previousEvaluation?.results.find((result) => Number(result.evaluation_criterion_id) === Number(criterion.id));

            return {
                criterion_id: criterion.id,
                score: previousResult?.score !== undefined ? Number(previousResult.score) : '',
                feedback: previousResult?.feedback ?? '',
            };
        }),
    );

const getRubricText = (rubric: Criterion['rubric'], score: number) => {
    if (!rubric) return '';

    if (Array.isArray(rubric)) {
        return rubric[score] || rubric[score - 1] || '';
    }

    return rubric[String(score)] || '';
};

const getRubricEntries = (rubric: Criterion['rubric']) =>
    scoreOptions
        .map((score) => ({
            score,
            text: getRubricText(rubric, score),
        }))
        .filter((entry) => entry.text);

export default function Create({ intern, categories, editingEvaluation, previousEvaluations = {}, types }: Props) {
    const defaultType = editingEvaluation?.type ?? types[0]?.value ?? 'weekly';
    const isEditing = Boolean(editingEvaluation);
    const getInitialFormData = (type: string) => {
        const previousEvaluation = editingEvaluation?.type === type ? editingEvaluation : undefined;

        return {
            evaluation_id: editingEvaluation?.type === type ? editingEvaluation.id : null,
            type,
            period_name: previousEvaluation?.period_name ?? '',
            comments: previousEvaluation?.comments ?? '',
            results: flattenCriteria(categories, type, previousEvaluation),
        };
    };
    const initialFormData = getInitialFormData(defaultType);
    const { data, setData, post, put, transform, processing, errors } = useForm({
        evaluation_id: initialFormData.evaluation_id,
        intern_id: intern.id,
        type: initialFormData.type,
        period_name: initialFormData.period_name,
        comments: initialFormData.comments,
        results: initialFormData.results,
    });

    const visibleCategories = filterCategoriesByType(categories, data.type);
    const totalWeight = visibleCategories.reduce(
        (total, category) => total + category.criteria.reduce((sum, criterion) => sum + Number(criterion.weight), 0),
        0,
    );
    const displayName = [intern.intern?.name, intern.intern?.last_name].filter(Boolean).join(' ') || intern.name;
    const hasSelectedScores = data.results.some((result) => result.score !== '');

    const handleTypeChange = (type: string) => {
        const initialData = getInitialFormData(type);

        setData((current) => ({
            ...current,
            ...initialData,
        }));
    };

    const updateResult = (criterionId: number, changes: Partial<ResultForm>) => {
        setData(
            'results',
            data.results.map((result) => (result.criterion_id === criterionId ? { ...result, ...changes } : result)),
        );
    };

    const getResult = (criterionId: number) => data.results.find((result) => result.criterion_id === criterionId);
    const getPreviousResult = (criterionId: number) =>
        previousEvaluations[data.type]?.results.find((result) => Number(result.evaluation_criterion_id) === Number(criterionId));

    const submit = (event: React.FormEvent) => {
        event.preventDefault();

        transform((currentData) => ({
            ...currentData,
            results: currentData.results.filter((result) => result.score !== ''),
        }));

        if (data.evaluation_id) {
            put(`/evaluaciones/${data.evaluation_id}`);
            return;
        }

        post('/evaluaciones');
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Evaluacion y Notas', href: '/evaluaciones' }, { title: `${isEditing ? 'Editar evaluacion' : 'Evaluar'} a ${displayName}`, href: '#' }]}>
            <Head title={`${isEditing ? 'Editar evaluacion' : 'Evaluar'} a ${displayName}`} />

            <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <Link href="/evaluaciones" className="mb-2 inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-slate-900">
                            <ArrowLeft className="h-4 w-4" />
                            Volver a evaluaciones
                        </Link>
                        <h1 className="text-2xl font-bold text-slate-900">{isEditing ? 'Editar evaluacion' : 'Nueva evaluacion'}</h1>
                        <p className="mt-1 text-sm text-slate-500">
                            {displayName} - {intern.email}
                            {intern.intern?.center?.name ? ` - ${intern.intern.center.name}` : ''}
                        </p>
                    </div>

                    <div className={`rounded-2xl px-4 py-3 text-sm font-black ${totalWeight === 100 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                        Peso configurado: {totalWeight}%
                    </div>
                </div>

                <form onSubmit={submit} className="space-y-6">
                    <Card className="rounded-3xl border border-slate-200 bg-white shadow-sm">
                        <CardHeader>
                            <CardTitle>Datos de la evaluacion</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 md:grid-cols-3">
                            <div className="space-y-2">
                                <Label htmlFor="type" className="text-[11px] font-black uppercase text-slate-400">
                                    Tipo
                                </Label>
                                <select
                                    id="type"
                                    value={data.type}
                                    onChange={(event) => handleTypeChange(event.target.value)}
                                    disabled={isEditing}
                                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                                >
                                    {types.map((type) => (
                                        <option key={type.value} value={type.value}>
                                            {type.label}
                                        </option>
                                    ))}
                                </select>
                                {errors.type && <p className="text-xs font-semibold text-red-600">{errors.type}</p>}
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="period_name" className="text-[11px] font-black uppercase text-slate-400">
                                    Periodo
                                </Label>
                                <Input
                                    id="period_name"
                                    value={data.period_name}
                                    onChange={(event) => setData('period_name', event.target.value)}
                                    placeholder="Ej: Semana 20, Mayo 2026 o evaluacion final"
                                    className="h-10 rounded-xl border-slate-200"
                                />
                                {errors.period_name && <p className="text-xs font-semibold text-red-600">{errors.period_name}</p>}
                            </div>
                        </CardContent>
                    </Card>

                    {visibleCategories.length === 0 ? (
                        <Card className="rounded-3xl border border-amber-200 bg-amber-50 shadow-sm">
                            <CardContent className="pt-6 text-sm font-semibold text-amber-800">
                                Todavia no hay criterios configurados para este tipo de evaluacion.
                            </CardContent>
                        </Card>
                    ) : (
                        visibleCategories.map((category) => (
                            <Card key={category.id} className="rounded-3xl border border-slate-200 bg-white shadow-sm">
                                <CardHeader>
                                    <CardTitle>{category.name}</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {category.criteria.map((criterion) => {
                                        const result = getResult(criterion.id);
                                        const previousResult = getPreviousResult(criterion.id);
                                        const rubricEntries = getRubricEntries(criterion.rubric);
                                        const storedScore = result?.score ?? '';
                                        const fallbackScore = previousResult?.score !== undefined ? previousResult.score : '';
                                        const displayedScore = storedScore !== '' ? storedScore : fallbackScore;
                                        const selectedScore = displayedScore !== '' ? Number(displayedScore) : null;
                                        const selectedRubric = selectedScore ? getRubricText(criterion.rubric, selectedScore) : '';

                                        return (
                                            <div key={criterion.id} className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
                                                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                                    <div className="min-w-0">
                                                        <p className="font-black text-slate-900">{criterion.name}</p>
                                                        {criterion.description && <p className="mt-1 text-sm text-slate-500">{criterion.description}</p>}
                                                        <p className="mt-1 text-xs font-bold uppercase text-slate-400">Peso: {criterion.weight}%</p>
                                                    </div>

                                                    <div className="w-full space-y-2 lg:w-40">
                                                        <Label htmlFor={`score-${criterion.id}`} className="text-[11px] font-black uppercase text-slate-400">
                                                            Puntuacion
                                                        </Label>
                                                        <select
                                                            id={`score-${criterion.id}`}
                                                            value={displayedScore}
                                                            onChange={(event) =>
                                                                updateResult(criterion.id, {
                                                                    score: event.target.value ? Number(event.target.value) : '',
                                                                })
                                                            }
                                                            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                                                        >
                                                            <option value="">Sin evaluar</option>
                                                            {scoreOptions.map((score) => (
                                                                <option key={score} value={score}>
                                                                    {score} / 5
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>

                                                {rubricEntries.length > 0 && (
                                                    <div className="mt-4 rounded-2xl border border-blue-100 bg-white p-4">
                                                        <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                                            <div>
                                                                <p className="text-[11px] font-black uppercase text-slate-400">Rubrica</p>
                                                                <p className="text-sm font-semibold text-slate-600">Guia de puntuacion para este criterio.</p>
                                                            </div>
                                                            {selectedRubric && (
                                                                <div className="rounded-xl bg-blue-50 px-3 py-2 text-sm font-bold text-blue-700">
                                                                    {selectedScore}/5: {selectedRubric}
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="grid gap-2 md:grid-cols-5">
                                                            {rubricEntries.map((entry) => (
                                                                <div
                                                                    key={entry.score}
                                                                    className={`rounded-xl border p-3 text-xs ${
                                                                        entry.score === selectedScore
                                                                            ? 'border-blue-200 bg-blue-50 text-blue-800'
                                                                            : 'border-slate-100 bg-slate-50 text-slate-600'
                                                                    }`}
                                                                >
                                                                    <p className="mb-1 font-black">{entry.score}/5</p>
                                                                    <p className="leading-relaxed">{entry.text}</p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="mt-4 space-y-2">
                                                    <Label htmlFor={`feedback-${criterion.id}`} className="text-[11px] font-black uppercase text-slate-400">
                                                        Comentario del criterio
                                                    </Label>
                                                    <textarea
                                                        id={`feedback-${criterion.id}`}
                                                        value={result?.feedback ?? ''}
                                                        onChange={(event) =>
                                                            updateResult(criterion.id, {
                                                                feedback: event.target.value,
                                                                score: result?.score !== '' ? result?.score : previousResult?.score !== undefined ? Number(previousResult.score) : '',
                                                            })
                                                        }
                                                        className="min-h-20 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                                                        placeholder="Observaciones concretas sobre este criterio..."
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </CardContent>
                            </Card>
                        ))
                    )}

                    <Card className="rounded-3xl border border-slate-200 bg-white shadow-sm">
                        <CardHeader>
                            <CardTitle>Comentario general</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <textarea
                                value={data.comments}
                                onChange={(event) => setData('comments', event.target.value)}
                                className="min-h-28 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                                placeholder="Resumen cualitativo de la evaluacion..."
                            />

                            {errors.results && <p className="text-sm font-semibold text-red-600">{errors.results}</p>}

                            <div className="flex justify-end">
                                <Button type="submit" disabled={processing || !hasSelectedScores} className="h-10 rounded-xl font-bold">
                                    <Save className="h-4 w-4" />
                                    {isEditing ? 'Actualizar evaluacion' : 'Guardar evaluacion'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </form>
            </div>
        </AppLayout>
    );
}
